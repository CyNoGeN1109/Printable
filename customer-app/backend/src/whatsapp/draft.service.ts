// FILE: services/api/src/whatsapp/draft.service.ts
// Draft business logic — create a draft from a WhatsApp upload, fetch it for the
// web config page. Routes call these; no DB logic lives in routes.

import { nanoid } from "nanoid";
import { Draft, IDraft, IDraftFile } from "./draft.model";

export interface CreateDraftInput {
  shopCode:   string;
  fromNumber: string;
  userName:   string;
  files:      IDraftFile[];
}

// ─── Create Draft ──────────────────────────────────────────────────────────────

export async function createDraft(input: CreateDraftInput): Promise<IDraft> {
  const draftId = nanoid(10);
  return Draft.create({ draftId, ...input });
}

// ─── Append a file to an existing (open) draft ──────────────────────────────────

export async function appendFileToDraft(
  draftId: string,
  file: IDraftFile
): Promise<IDraft | null> {
  return Draft.findOneAndUpdate(
    { draftId },
    { $push: { files: file } },
    { new: true }
  );
}

// ─── Set the draft's destination shop (used by the WhatsApp router) ──────────────

export async function setDraftShop(draftId: string, shopCode: string): Promise<void> {
  await Draft.findOneAndUpdate({ draftId }, { shopCode: shopCode.toUpperCase() });
}

// ─── Get Draft ─────────────────────────────────────────────────────────────────

export async function getDraftById(draftId: string): Promise<IDraft | null> {
  return Draft.findOne({ draftId }).lean<IDraft>();
}
