// FILE: services/api/src/order/order.routes.ts
// Order HTTP routes

import { Router, Request, Response } from "express";
import {
  createOrder,
  getOrderById,
  getOrdersByGroup,
  getOrdersByStatus,
  getAllOrders,
  updateOrderStatus,
  confirmCashPayment,
  FileInput,
} from "./order.service";
import type { OrderStatus } from "./order.model";
import { getDraftById } from "../whatsapp/draft.service";
import { getShopByApiKey } from "../shop/shop.service";

export const orderRouter = Router();

// Resolve the calling shop from its apiKey header (desktop app). Returns undefined
// for unauthenticated callers (web/track), which use order-id endpoints instead.
async function shopIdFromKey(req: Request): Promise<string | undefined> {
  const key = req.headers["x-shop-key"];
  if (!key) return undefined;
  const shop = await getShopByApiKey(String(key));
  return shop?.shopId;
}

// ─── POST /orders ─────────────────────────────────────────────────────────────
// Create a new print order (called by Next.js checkout page)
// Body: { files: FileInput[], paymentMode: "online" | "offline" }
orderRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { files, paymentMode, userName, draftId, shopId: bodyShopId } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: "files array is required and must not be empty" });
      return;
    }
    if (files.length > 20) {
      res.status(400).json({ error: "Maximum 20 files per order" });
      return;
    }

    if (!paymentMode) {
      res.status(400).json({ error: "paymentMode is required" });
      return;
    }
    if (paymentMode !== "online" && paymentMode !== "offline") {
      res.status(400).json({ error: "paymentMode must be 'online' or 'offline'" });
      return;
    }

    if (!userName || typeof userName !== "string" || userName.trim().length === 0) {
      res.status(400).json({ error: "userName is required" });
      return;
    }
    if (userName.trim().length > 80) {
      res.status(400).json({ error: "userName must be 80 characters or fewer" });
      return;
    }

    // Validate each file entry
    for (const f of files as FileInput[]) {
      if (!f.fileName || !f.fileUrl || !f.pages || !f.copies) {
        res.status(400).json({ error: "Each file must have fileName, fileUrl, pages, copies" });
        return;
      }
      // fileUrl must be a valid public HTTPS URL (prevents SSRF against internal services)
      try {
        const u = new URL(String(f.fileUrl));
        if (u.protocol !== 'https:') throw new Error('not https');
        const h = u.hostname;
        if (
          h === 'localhost' ||
          h.endsWith('.local') ||
          /^(10|172\.(1[6-9]|2\d|3[01])|192\.168|127)\.\d/.test(h) ||
          h === '::1' ||
          h === '169.254.169.254'
        ) throw new Error('private host');
      } catch {
        res.status(400).json({ error: `fileUrl must be a valid public HTTPS URL` });
        return;
      }
      if (Number(f.pages) < 1 || Number(f.pages) > 10000) {
        res.status(400).json({ error: "pages must be between 1 and 10000" });
        return;
      }
      if (Number(f.copies) < 1 || Number(f.copies) > 50) {
        res.status(400).json({ error: "copies must be between 1 and 50" });
        return;
      }
    }

    // If this order came from a WhatsApp draft, resolve the customer's number
    // (kept server-side) so we can message them when the prints are ready.
    let whatsappFrom: string | undefined;
    let shopId: string | undefined = bodyShopId ? String(bodyShopId).toUpperCase() : undefined;
    if (draftId) {
      const draft = await getDraftById(String(draftId));
      whatsappFrom = draft?.fromNumber;
      if (!shopId && draft?.shopCode) shopId = draft.shopCode.toUpperCase();
    }
    if (!shopId && process.env.DEFAULT_SHOP_ID) shopId = process.env.DEFAULT_SHOP_ID.toUpperCase();

    const result = await createOrder({
      files: (files as FileInput[]).map((f) => ({
        fileName:      f.fileName,
        fileUrl:       f.fileUrl,
        pages:         Number(f.pages),
        copies:        Number(f.copies),
        colour:        Boolean(f.colour),
        duplex:        Boolean(f.duplex),
        orientation:   ['portrait', 'landscape'].includes(String(f.orientation)) ? String(f.orientation) : 'portrait',
        pageRange:     String(f.pageRange || 'all'),
      })),
      paymentMode,
      userName: userName.trim(),
      whatsappFrom,
      shopId,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("POST /orders error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ─── GET /orders/group/:groupId ───────────────────────────────────────────────
// Returns every order in a group (split B&W + colour, or a single order).
// Registered BEFORE /:id so "group" isn't captured as an :id.
orderRouter.get("/group/:groupId", async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.groupId).toUpperCase();
    if (!/^[A-Z0-9]{4,12}(-COLOUR)?$/.test(raw)) {
      res.status(400).json({ error: "Invalid order ID format" });
      return;
    }
    const orders = await getOrdersByGroup(raw);
    if (!orders.length) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(orders);
  } catch (err) {
    console.error("GET /orders/group/:groupId error:", err);
    res.status(500).json({ error: "Failed to fetch order group" });
  }
});

// ─── GET /orders/:id ──────────────────────────────────────────────────────────
orderRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const raw = String(req.params.id).toUpperCase();
    if (!/^[A-Z0-9]{4,12}(-COLOUR)?$/.test(raw)) {
      res.status(400).json({ error: "Invalid order ID format" });
      return;
    }
    // Authenticated shops (desktop app) need the full order incl. file URLs to
    // print; anonymous tracking callers get the public projection.
    const callerShopId = await shopIdFromKey(req);
    const order = await getOrderById(raw, { includePrivate: Boolean(callerShopId) });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error("GET /orders/:id error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ─── GET /orders?status=... ───────────────────────────────────────────────────
orderRouter.get("/", async (req: Request, res: Response) => {
  try {
    // Desktop apps send x-shop-key → they only see their own shop's orders.
    const shopId = await shopIdFromKey(req);
    if (req.query.status) {
      // Accept a single status or comma-separated list e.g. ?status=pending_payment,paid,printing
      const raw = req.query.status as string;
      const statuses = raw.split(',').map(s => s.trim()).filter(Boolean) as OrderStatus[];
      const orders = await getOrdersByStatus(statuses.length === 1 ? statuses[0] : statuses, shopId);
      res.json(orders);
    } else {
      const orders = await getAllOrders(shopId);
      res.json(orders);
    }
  } catch (err) {
    console.error("GET /orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── PATCH /orders/:id/status ─────────────────────────────────────────────────
orderRouter.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id).toUpperCase();
    if (!/^[A-Z0-9]{4,12}(-COLOUR)?$/.test(orderId)) {
      res.status(400).json({ error: "Invalid order ID format" });
      return;
    }
    const { status } = req.body;
    const validStatuses: OrderStatus[] = [
      "pending_payment",
      "paid",
      "printing",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    // A shop (desktop) can only modify its own orders.
    const shopId = await shopIdFromKey(req);
    if (shopId) {
      const existing = await getOrderById(orderId);
      if (existing?.shopId && existing.shopId !== shopId) {
        res.status(403).json({ error: "This order belongs to another shop" });
        return;
      }
    }

    const order = await updateOrderStatus(orderId, status);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error("PATCH /orders/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ─── PATCH /orders/:id/confirm-payment ───────────────────────────────────────
orderRouter.patch(
  "/:id/confirm-payment",
  async (req: Request, res: Response) => {
    try {
      const orderId = String(req.params.id).toUpperCase();
      if (!/^[A-Z0-9]{4,12}(-COLOUR)?$/.test(orderId)) {
        res.status(400).json({ error: "Invalid order ID format" });
        return;
      }
      const shopId = await shopIdFromKey(req);
      if (shopId) {
        const existing = await getOrderById(orderId);
        if (existing?.shopId && existing.shopId !== shopId) {
          res.status(403).json({ error: "This order belongs to another shop" });
          return;
        }
      }
      const order = await confirmCashPayment(orderId);
      if (!order) {
        res.status(404).json({ error: "Order not found or not a cash order" });
        return;
      }
      res.json(order);
    } catch (err) {
      console.error("PATCH /orders/:id/confirm-payment error:", err);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  }
);