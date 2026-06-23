// FILE: services/api/src/app.ts
// Express app — registers middleware and all route groups

import express from "express";
import cors from "cors";
import { orderRouter } from "./order/order.routes";
import { fileRouter } from "./file/file.routes";
import { paymentRouter } from "./payment/payment.routes";
import { whatsappRouter } from "./whatsapp/whatsapp.routes";
import { shopRouter } from "./shop/shop.routes";

import { connectDB } from "./db";
import { cleanupR2Files } from "./file/r2.service";
import cron from "node-cron";

const app = express();

// Allow requests from Next.js frontend and Electron desktop
app.use(cors());

// Ensure DB is connected for every request (crucial for serverless)
app.use(async (req, res, next) => {
  // The WhatsApp webhook verification handshake (GET) must succeed even when the
  // DB is unavailable — Meta pings it periodically and disables the webhook on failure.
  if (req.method === "GET" && req.path === "/whatsapp/webhook") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Parse JSON bodies — except for webhooks that need the raw body for signature verification
const rawBodyRoutes = ["/payment/webhook", "/whatsapp/webhook"];
app.use((req, res, next) => {
  if (rawBodyRoutes.includes(req.originalUrl)) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Route groups
app.use("/orders", orderRouter);
app.use("/", fileRouter);       // GET /upload-signature
app.use("/payment", paymentRouter); // POST /payment/webhook
app.use("/whatsapp", whatsappRouter); // WhatsApp webhook + draft lookup
app.use("/shops", shopRouter);        // shop create + public lookup

// Cleanup route for Vercel Cron (Optional if using node-cron)
app.get("/cleanup-files", async (req, res) => {
  try {
    await cleanupR2Files();
    res.json({ success: true, message: "R2 Cleanup completed" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Cleanup failed" });
  }
});

// Schedule automatic cleanup every 4 hours for long-running servers (Railway/Render)
cron.schedule("0 */4 * * *", async () => {
  console.log("[Cron] Starting automatic R2 cleanup...");
  await cleanupR2Files();
});

export default app;