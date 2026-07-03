// FILE: services/api/src/whatsapp/customer.model.ts
// Remembers which shop a WhatsApp customer last printed at, so a returning customer
// who just forwards a file (no shop code) still routes to the right shop.

import mongoose, { Schema, Document } from "mongoose";

export interface IWaCustomer extends Document {
  waNumber:  string;
  shopId:    string;
  updatedAt: Date;
}

const WaCustomerSchema = new Schema<IWaCustomer>(
  {
    waNumber: { type: String, required: true, unique: true },
    shopId:   { type: String, required: true },
  },
  { timestamps: true }
);

export const WaCustomer = mongoose.model<IWaCustomer>("WaCustomer", WaCustomerSchema);

export async function rememberShop(waNumber: string, shopId: string): Promise<void> {
  await WaCustomer.findOneAndUpdate({ waNumber }, { shopId }, { upsert: true });
}

export async function getRememberedShop(waNumber: string): Promise<string | null> {
  const c = await WaCustomer.findOne({ waNumber }).lean<IWaCustomer>();
  return c?.shopId ?? null;
}
