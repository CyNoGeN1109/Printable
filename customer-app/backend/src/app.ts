// FILE: services/api/src/app.ts
// Express app — registers middleware and all route groups

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { orderRouter } from "./order/order.routes";
import { fileRouter } from "./file/file.routes";
import { paymentRouter } from "./payment/payment.routes";
import { whatsappRouter } from "./whatsapp/whatsapp.routes";
import { shopRouter } from "./shop/shop.routes";

import { connectDB } from "./db";
import { cleanupR2Files } from "./file/r2.service";
import cron from "node-cron";

const app = express();

// Security headers — sets X-Content-Type-Options, X-Frame-Options, HSTS, etc.
// CSP is relaxed for Razorpay (loads checkout.js from their CDN).
app.use(helmet({
  contentSecurityPolicy: false, // managed by Next.js frontend; backend is API-only
  crossOriginEmbedderPolicy: false,
}));

// Allow requests from Next.js frontend and Electron desktop.
// In production set ALLOWED_ORIGINS=https://your-domain.com,https://other.com
// Requests with no Origin header (Electron, curl, mobile) are always allowed.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : []

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)           // Electron / curl / mobile
    if (allowedOrigins.length === 0) return callback(null, true)  // dev: open
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}));

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

// Rate limiting — scoped to the routes most prone to abuse
const orderCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,                  // 20 new orders per IP per minute (POST only)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment before trying again." },
  skip: (req) => req.method !== "POST" || !!req.headers["x-shop-key"],
});

const orderReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,                 // tracking polls every 15s = 4/min per customer, 120 allows 30 concurrent
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests." },
  skip: (req) => !!req.headers["x-shop-key"], // desktop app is exempt
});

const uploadUrlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many upload requests — please wait." },
});

// Route groups
app.use("/orders", orderCreateLimiter, orderReadLimiter, orderRouter);
app.use("/", uploadUrlLimiter, fileRouter); // GET /upload-url
app.use("/payment", paymentRouter); // POST /payment/webhook
app.use("/whatsapp", whatsappRouter); // WhatsApp webhook + draft lookup
app.use("/shops", shopRouter);        // shop create + public lookup

// Cleanup route for Vercel Cron — guarded by CRON_SECRET if set.
// Vercel injects Authorization: Bearer <CRON_SECRET> automatically.
app.get("/cleanup-files", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }
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