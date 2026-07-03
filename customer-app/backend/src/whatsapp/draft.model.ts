// FILE: services/api/src/whatsapp/draft.model.ts
// Mongoose schema for WhatsApp upload "drafts".
// A draft is a file received over WhatsApp that hasn't become an Order yet — the
// user still has to pick copies/colour and pay on the web config page. Keeping
// drafts separate from Order means we never touch OrderStatus or pollute the
// orders list with half-finished uploads.

import mongoose, { Schema, Document } from "mongoose";

export interface IDraftFile {
  fileName: string;
  fileUrl:  string;   // Cloudflare R2 public URL
}

export interface IDraft extends Document {
  draftId:    string;        // Short id embedded in the web deep-link
  shopCode:   string;        // Destination shop, parsed from "#SHP123" in the message
  files:      IDraftFile[];  // One or more files collected in a single WhatsApp burst
  fromNumber: string;        // Sender's WhatsApp number (for later notifications)
  userName:   string;        // Sender's WhatsApp profile name (pre-fills the order)
  createdAt:  Date;
  updatedAt:  Date;
}

const DraftFileSchema = new Schema<IDraftFile>(
  {
    fileName: { type: String, required: true },
    fileUrl:  { type: String, required: true },
  },
  { _id: false }
);

const DraftSchema = new Schema<IDraft>(
  {
    draftId:    { type: String, required: true, unique: true, trim: true },
    shopCode:   { type: String, default: "", uppercase: true, trim: true },
    files:      { type: [DraftFileSchema], default: [] },
    fromNumber: { type: String, required: true },
    userName:   { type: String, default: "WhatsApp Customer" },
  },
  {
    timestamps: true, // auto-adds createdAt + updatedAt
  }
);

// TTL: auto-delete abandoned drafts. Keep this <= the R2 cleanup window (4h) so a
// draft never points at a file that has already been purged from storage.
DraftSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 4 });

export const Draft = mongoose.model<IDraft>("Draft", DraftSchema);
