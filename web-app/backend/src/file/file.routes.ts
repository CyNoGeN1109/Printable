// FILE: services/api/src/file/file.routes.ts
// File-related routes — only one endpoint: GET /upload-url
// Returns a presigned URL so frontend can upload directly to R2

import { Router } from "express";
import { getUploadUrl } from "./r2.service";

export const fileRouter = Router();

/**
 * GET /upload-url?fileName=test.pdf&contentType=application/pdf
 * Returns a presigned URL to upload directly to R2.
 */
fileRouter.get("/upload-url", async (req, res) => {
  try {
    const { fileName, contentType } = req.query;

    if (!fileName || !contentType) {
      res.status(400).json({ error: "fileName and contentType are required" });
      return;
    }

    const data = await getUploadUrl(fileName as string, contentType as string);
    res.json(data);
  } catch (err) {
    console.error("GET /upload-url error:", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});