// FILE: services/api/src/whatsapp/whatsapp.service.ts
// Meta WhatsApp Cloud API helpers:
//   - verifyMetaSignature : validates the X-Hub-Signature-256 webhook signature
//   - downloadMedia       : pulls a received file off Meta's servers (2-step)
//   - sendMessage         : sends a text reply back to the user
//   - parseShopCode       : extracts "#SHP123" from a message/caption
//   - extFromMime         : MIME type -> file extension for naming stored files
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

import crypto from "crypto";

const GRAPH_API_VERSION = "v25.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Verify the webhook actually came from Meta.
 * Meta signs the raw request body with your App Secret (HMAC-SHA256) and sends
 * the result as the "X-Hub-Signature-256: sha256=<hash>" header.
 */
export function verifyMetaSignature(rawBody: Buffer, signature?: string): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) throw new Error("WHATSAPP_APP_SECRET is not set");
  if (!signature) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // timingSafeEqual throws if the buffers differ in length — guard first.
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export interface DownloadedMedia {
  buffer:   Buffer;
  mimeType: string;
}

/**
 * Download a media file the user sent us. Two API calls:
 *   1. GET /{mediaId}   → returns a short-lived download URL + mime type
 *   2. GET <that url>   → returns the raw bytes (needs the same auth header)
 */
export async function downloadMedia(mediaId: string): Promise<DownloadedMedia> {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN is not set");
  const auth = { Authorization: `Bearer ${token}` };

  // 1. Resolve the temporary download URL
  const metaRes = await fetch(`${GRAPH_BASE}/${mediaId}`, { headers: auth });
  if (!metaRes.ok) {
    throw new Error(`[WhatsApp] Media lookup failed (${metaRes.status})`);
  }
  const meta = (await metaRes.json()) as { url: string; mime_type: string };

  // 2. Fetch the actual bytes
  const fileRes = await fetch(meta.url, { headers: auth });
  if (!fileRes.ok) {
    throw new Error(`[WhatsApp] Media download failed (${fileRes.status})`);
  }
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  return { buffer, mimeType: meta.mime_type };
}

/**
 * Send a plain-text WhatsApp message back to the user.
 */
export async function sendMessage(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID is not set");
  }

  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[WhatsApp] sendMessage failed (${res.status}):`, detail);
  }
}

/**
 * Pull a shop code like "#SHP123" out of a message/caption. Returns "" if none.
 */
export function parseShopCode(text?: string): string {
  if (!text) return "";
  const match = text.match(/#([A-Za-z0-9]+)/);
  return match ? match[1].toUpperCase() : "";
}

/**
 * Map a MIME type to a file extension, for naming files we store ourselves.
 */
export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  return map[mime] || "bin";
}
