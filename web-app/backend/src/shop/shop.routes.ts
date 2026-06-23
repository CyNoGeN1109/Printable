// FILE: services/api/src/shop/shop.routes.ts
//   POST /shops              → create a shop (admin) → returns shopId + apiKey
//   GET  /shops/:code/public → public info for the web order page (no secrets)

import { Router, Request, Response } from "express";
import { createShop, getShopByCode, updateShopPricing, listShops } from "./shop.service";

export const shopRouter = Router();

// ─── POST /shops ────────────────────────────────────────────────────────────────
// Admin-only (guarded by ADMIN_KEY if that env is set). Returns the apiKey ONCE —
// it goes into the shop's desktop app during onboarding.
shopRouter.post("/", async (req: Request, res: Response) => {
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && req.headers["x-admin-key"] !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, phone, address, pricing } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  try {
    const shop = await createShop({ name: name.trim(), phone, address, pricing });
    res.status(201).json({ shopId: shop.shopId, apiKey: shop.apiKey, name: shop.name, pricing: shop.pricing });
  } catch (err) {
    console.error("POST /shops error:", err);
    res.status(500).json({ error: "Failed to create shop" });
  }
});

// ─── GET /shops ──────────────────────────────────────────────────────────────────
// Admin-only — list shops (includes apiKeys, for onboarding desktops).
shopRouter.get("/", async (req: Request, res: Response) => {
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && req.headers["x-admin-key"] !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const shops = await listShops();
    res.json(
      shops.map((s) => ({
        shopId:  s.shopId,
        name:    s.name,
        apiKey:  s.apiKey,
        active:  s.active,
        pricing: s.pricing,
      }))
    );
  } catch (err) {
    console.error("GET /shops error:", err);
    res.status(500).json({ error: "Failed to list shops" });
  }
});

// ─── GET /shops/:code/public ─────────────────────────────────────────────────────
shopRouter.get("/:code/public", async (req: Request, res: Response) => {
  try {
    const shop = await getShopByCode(req.params.code as string);
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json({ shopId: shop.shopId, name: shop.name, pricing: shop.pricing });
  } catch (err) {
    console.error("GET /shops/:code/public error:", err);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
});

// ─── PATCH /shops/:code/pricing ──────────────────────────────────────────────────
// Admin-only — update a shop's pricing. Body: any subset of pricing fields.
shopRouter.patch("/:code/pricing", async (req: Request, res: Response) => {
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && req.headers["x-admin-key"] !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const shop = await updateShopPricing(req.params.code as string, req.body || {});
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json({ shopId: shop.shopId, name: shop.name, pricing: shop.pricing });
  } catch (err) {
    console.error("PATCH /shops/:code/pricing error:", err);
    res.status(500).json({ error: "Failed to update pricing" });
  }
});
