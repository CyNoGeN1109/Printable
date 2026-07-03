// FILE: services/api/src/shop/shop.model.ts
// A Shop is a tenant: every order belongs to one, and the shop's desktop app only
// ever sees its own orders (authenticated by the shop's apiKey).

import mongoose, { Schema, Document } from "mongoose";

export interface IShopPricing {
  bwPerPage:             number;
  colorPerPage:          number;
  duplexDiscountPercent: number;
  bulkThreshold:         number;   // pages in order above which bulk rates apply
  bulkBwPerPage:         number;
  bulkColorPerPage:      number;
}

export interface IShop extends Document {
  shopId:  string;   // short human code, e.g. "SHP7Q2KP" — goes in the QR + WhatsApp caption
  name:    string;
  apiKey:  string;   // secret the desktop app uses to authenticate & scope its orders
  active:  boolean;
  pricing: IShopPricing;
  contact?: { phone?: string; address?: string };
  createdAt: Date;
  updatedAt: Date;
}

const PricingSchema = new Schema<IShopPricing>(
  {
    bwPerPage:             { type: Number, default: 1 },
    colorPerPage:          { type: Number, default: 5 },
    duplexDiscountPercent: { type: Number, default: 50 },
    bulkThreshold:         { type: Number, default: 100 },
    bulkBwPerPage:         { type: Number, default: 0.9 },
    bulkColorPerPage:      { type: Number, default: 4 },
  },
  { _id: false }
);

const ShopSchema = new Schema<IShop>(
  {
    shopId:  { type: String, required: true, unique: true, uppercase: true, trim: true },
    name:    { type: String, required: true, trim: true },
    apiKey:  { type: String, required: true, unique: true, index: true },
    active:  { type: Boolean, default: true },
    pricing: { type: PricingSchema, default: () => ({}) },
    contact: {
      phone:   { type: String },
      address: { type: String },
    },
  },
  { timestamps: true }
);

export const Shop = mongoose.model<IShop>("Shop", ShopSchema);
