// FILE: services/api/src/whatsapp/whatsapp.routes.ts
// WhatsApp Cloud API webhook + draft lookup.
//   GET  /whatsapp/webhook      → Meta verification handshake (echo hub.challenge)
//   POST /whatsapp/webhook      → incoming messages (raw body for signature check)
//   GET  /whatsapp/drafts/:id   → web config page fetches the uploaded file

import { Router, Request, Response } from "express";
import express from "express";
import {
  verifyMetaSignature,
  downloadMedia,
  sendMessage,
  parseShopCode,
  extFromMime,
} from "./whatsapp.service";
import { uploadBufferToR2 } from "../file/r2.service";
import { createDraft, appendFileToDraft, getDraftById, setDraftShop } from "./draft.service";
import { getShopByCode } from "../shop/shop.service";
import { rememberShop, getRememberedShop } from "./customer.model";

export const whatsappRouter = Router();

// Base URL of the Next.js web app, used to build the config+pay deep link.
const WEB_APP_URL = process.env.WEB_APP_URL || "http://localhost:3000";

// Files sent over WhatsApp arrive as separate messages. We collect every file from
// one sender into a single draft, then — after a debounce of no new files — send a
// single link. In-memory sessions are fine because the API runs as a long-lived
// server (not serverless).
const DEBOUNCE_MS = 10_000;
type WaSession = { draftId: string; shopId?: string; timer?: NodeJS.Timeout };
const sessions = new Map<string, WaSession>();    // key: sender's WhatsApp number
const awaitingShop = new Map<string, string>();   // sender -> draftId waiting for a shop code

// Idempotency: Meta can re-deliver a webhook (retries / at-least-once). Process
// each message id at most once so a retry never re-downloads or duplicates a file.
const processedMessages = new Map<string, number>(); // messageId -> processed-at (ms)
const MSG_DEDUP_TTL_MS = 10 * 60 * 1000;
function alreadyProcessed(messageId?: string): boolean {
  if (!messageId) return false;
  const now = Date.now();
  if (processedMessages.size > 500) {
    for (const [k, t] of processedMessages) {
      if (now - t > MSG_DEDUP_TTL_MS) processedMessages.delete(k);
    }
  }
  if (processedMessages.has(messageId)) return true;
  processedMessages.set(messageId, now);
  return false;
}

// ─── GET /whatsapp/webhook ─────────────────────────────────────────────────────
// Meta calls this once when you subscribe the webhook. Echo back hub.challenge
// only if the verify token matches the one you configured in the dashboard.
whatsappRouter.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ─── POST /whatsapp/webhook ────────────────────────────────────────────────────
// Incoming messages. Meta retries aggressively if we don't return 200 fast, so we
// acknowledge immediately and keep the per-message work light.
whatsappRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }), // raw body needed for HMAC verification
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-hub-signature-256"] as string | undefined;
      if (!verifyMetaSignature(req.body as Buffer, signature)) {
        console.warn("⚠️  Invalid WhatsApp webhook signature");
        res.sendStatus(403);
        return;
      }

      const event = JSON.parse((req.body as Buffer).toString());

      // Acknowledge first — Meta is strict about webhook timeouts.
      res.sendStatus(200);

      // Status/delivery webhooks have no `messages` array — nothing to do.
      const value = event?.entry?.[0]?.changes?.[0]?.value;
      const messages = value?.messages;
      if (!messages || messages.length === 0) return;

      const profileName =
        value?.contacts?.[0]?.profile?.name || "WhatsApp Customer";

      for (const message of messages) {
        await handleMessage(message, profileName);
      }
    } catch (err) {
      console.error("POST /whatsapp/webhook error:", err);
      // 200 may already be sent; nothing else we can return here.
    }
  }
);

// ─── GET /whatsapp/drafts/:id ──────────────────────────────────────────────────
// The web config page calls this to load the file the user sent over WhatsApp.
whatsappRouter.get("/drafts/:id", async (req: Request, res: Response) => {
  try {
    const draft = await getDraftById(req.params.id as string);
    if (!draft) {
      res.status(404).json({ error: "Draft not found or expired" });
      return;
    }
    res.json({
      draftId:  draft.draftId,
      shopCode: draft.shopCode,
      files:    draft.files,
      userName: draft.userName,
    });
  } catch (err) {
    console.error("GET /whatsapp/drafts/:id error:", err);
    res.status(500).json({ error: "Failed to fetch draft" });
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Resolve the destination shop for a media message: a valid code in the caption
// wins (and is remembered); otherwise fall back to the customer's remembered shop.
async function resolveShop(from: string, caption?: string): Promise<string | undefined> {
  const code = parseShopCode(caption);
  if (code) {
    const shop = await getShopByCode(code);
    if (shop) {
      await rememberShop(from, shop.shopId);
      return shop.shopId;
    }
  }
  const remembered = await getRememberedShop(from);
  return remembered ?? undefined;
}

// Handle one incoming message. Files bundle into the sender's open draft and a 10s
// debounce sends one link; the shop is resolved by code → remembered → ask.
async function handleMessage(message: any, profileName: string): Promise<void> {
  const from: string = message.from;

  // Ignore Meta webhook retries / duplicate deliveries of the same message.
  if (alreadyProcessed(message.id)) {
    console.log(`[WhatsApp] Duplicate message ${message.id} ignored`);
    return;
  }

  const media = message.image || message.document;

  // Plain text — maybe a shop code answering "which shop?", maybe just chatter.
  if (!media) {
    await handleText(from, message.text?.body ?? "");
    return;
  }

  // Tier 1/2: resolve the shop (caption code, else remembered).
  const shopId = await resolveShop(from, media.caption);

  // Download off Meta → store in R2.
  const { buffer, mimeType } = await downloadMedia(media.id);
  const fileName = media.filename || `whatsapp-${Date.now()}.${extFromMime(mimeType)}`;
  const { publicUrl } = await uploadBufferToR2(buffer, fileName, mimeType);
  const file = { fileName, fileUrl: publicUrl };

  // Add to the sender's open draft (or start one).
  let session = sessions.get(from);
  if (session) {
    await appendFileToDraft(session.draftId, file);
    if (shopId && !session.shopId) {
      session.shopId = shopId;
      await setDraftShop(session.draftId, shopId);
    }
  } else {
    const draft = await createDraft({
      shopCode: shopId || "",
      fromNumber: from,
      userName: profileName,
      files: [file],
    });
    session = { draftId: draft.draftId, shopId };
    sessions.set(from, session);
  }

  // (Re)start the debounce.
  if (session.timer) clearTimeout(session.timer);
  session.timer = setTimeout(() => {
    flushSession(from).catch((e) => console.error("[WhatsApp] flush error:", e));
  }, DEBOUNCE_MS);
}

// Debounce fired: send the link if the shop is known, else (tier 3) ask for the code.
async function flushSession(from: string): Promise<void> {
  const session = sessions.get(from);
  if (!session) return;
  sessions.delete(from);

  const draft = await getDraftById(session.draftId);
  if (!draft) return;
  const n = draft.files.length;
  const shopId = session.shopId || draft.shopCode;

  if (shopId) {
    const shop = await getShopByCode(shopId);
    await sendLink(from, session.draftId, n, shop?.name);
  } else {
    awaitingShop.set(from, session.draftId);
    await sendMessage(
      from,
      `📥 Got *${n} file${n > 1 ? "s" : ""}*! Which shop are you printing at?\n\nReply with the *shop code* on the counter QR (e.g. SHP7Q2KP).`
    );
  }
}

// Handle a plain-text message — usually the customer answering "which shop?".
async function handleText(from: string, text: string): Promise<void> {
  const m = text.match(/(SHP[A-Z0-9]+)/i);
  const shop = m ? await getShopByCode(m[1].toUpperCase()) : null;

  const pendingDraftId = awaitingShop.get(from);
  if (pendingDraftId) {
    if (shop) {
      awaitingShop.delete(from);
      await rememberShop(from, shop.shopId);
      await setDraftShop(pendingDraftId, shop.shopId);
      const draft = await getDraftById(pendingDraftId);
      await sendLink(from, pendingDraftId, draft?.files.length ?? 1, shop.name);
    } else {
      await sendMessage(
        from,
        "🤔 I couldn't find a shop with that code. Please check the *code on the counter QR* and reply again (e.g. SHP7Q2KP)."
      );
    }
    return;
  }

  if (shop) {
    // Proactive code with no pending files — remember it for the files to come.
    await rememberShop(from, shop.shopId);
    await sendMessage(from, `👍 Set to *${shop.name}*. Now send me the *file(s)* you want to print.`);
    return;
  }

  await sendMessage(
    from,
    "👋 Send me the *document(s) or photo(s)* you want to print — you can send several and I'll bundle them into one order."
  );
}

// Send the config+pay link (naming the shop when known).
async function sendLink(from: string, draftId: string, n: number, shopName?: string): Promise<void> {
  const where = shopName ? ` for *${shopName}*` : "";
  await sendMessage(
    from,
    `✅ Got *${n} file${n > 1 ? "s" : ""}*${where}!\n\nTap to choose copies, colour & pay:\n${WEB_APP_URL}/print/${draftId}`
  );
}
