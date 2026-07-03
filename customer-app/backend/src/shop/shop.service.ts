// FILE: services/api/src/shop/shop.service.ts
// Shop business logic — create a shop, look it up by its public code or its secret apiKey.

import { customAlphabet } from "nanoid";
import { Shop, IShop, IShopPricing } from "./shop.model";

// Unambiguous code (no 0/O/1/I) for the shop code the customer types/scans.
const codeGen = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const keyGen  = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 36);

export interface CreateShopInput {
  name:     string;
  phone?:   string;
  address?: string;
  pricing?: Partial<IShopPricing>;
}

export async function createShop(input: CreateShopInput): Promise<IShop> {
  let shopId = "SHP" + codeGen();
  while (await Shop.exists({ shopId })) shopId = "SHP" + codeGen();
  return Shop.create({
    shopId,
    name:    input.name,
    apiKey:  "sk_" + keyGen(),
    pricing: input.pricing,   // omitted fields fall back to schema defaults
    contact: { phone: input.phone, address: input.address },
  });
}

export async function updateShopPricing(
  shopId: string,
  pricing: Partial<IShopPricing>
): Promise<IShop | null> {
  const set: Record<string, number> = {};
  for (const [k, v] of Object.entries(pricing)) {
    if (typeof v === "number" && !Number.isNaN(v)) set[`pricing.${k}`] = v;
  }
  return Shop.findOneAndUpdate(
    { shopId: shopId.toUpperCase() },
    { $set: set },
    { new: true }
  ).lean<IShop>();
}

export async function getShopByCode(shopId: string): Promise<IShop | null> {
  if (!shopId) return null;
  return Shop.findOne({ shopId: shopId.toUpperCase(), active: true }).lean<IShop>();
}

export async function getShopByApiKey(apiKey: string): Promise<IShop | null> {
  if (!apiKey) return null;
  return Shop.findOne({ apiKey, active: true }).lean<IShop>();
}

export async function listShops(): Promise<IShop[]> {
  return Shop.find().sort({ createdAt: -1 }).lean<IShop[]>();
}
