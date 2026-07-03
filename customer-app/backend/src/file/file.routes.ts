// FILE: services/api/src/file/file.routes.ts
// File-related routes — only one endpoint: GET /upload-url
// Returns a presigned URL so frontend can upload directly to R2

import { Router } from "express";
import { getUploadUrl } from "./r2.service";

export const fileRouter = Router();

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * GET /upload-url?fileName=test.pdf&contentType=application/pdf
 * Returns a presigned R2 PUT URL for the given file.
 */
fileRouter.get("/upload-url", async (req, res) => {
  try {
    const { fileName, contentType } = req.query;

    if (!fileName || !contentType) {
      res.status(400).json({ error: "fileName and contentType are required" });
      return;
    }
    if (!ALLOWED_TYPES.has(String(contentType))) {
      res.status(400).json({ error: `Unsupported file type: ${contentType}` });
      return;
    }
    // Sanitise fileName: strip path traversal, limit length
    const safeName = String(fileName).replace(/[/\\]/g, "_").slice(0, 200);

    const data = await getUploadUrl(safeName, String(contentType));
    res.json(data);
  } catch (err) {
    console.error("GET /upload-url error:", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});