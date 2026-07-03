import "dotenv/config";
import app from "./app";
import { connectDB } from "./db";
import { cleanupR2Files } from "./file/r2.service";

const PORT = process.env.PORT ?? 4000;
const CLEANUP_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in ms

async function start() {
  // Listen first so health checks and the WhatsApp webhook verification succeed even
  // if the DB is slow/unavailable. Routes that need the DB still ensure a connection
  // per-request via the middleware in app.ts.
  app.listen(PORT, () => {
    console.log(`✅ SmartPrint API running on http://localhost:${PORT}`);

    // Run R2 cleanup on startup, then every 4 hours
    cleanupR2Files();
    setInterval(() => cleanupR2Files(), CLEANUP_INTERVAL);
    console.log(`🧹 R2 cleanup scheduled every 4 hours`);
  });

  // Connect to the DB in the background; log but don't crash the server if it fails.
  connectDB().catch((err) =>
    console.error("⚠️  Initial DB connection failed (will retry per-request):", err)
  );
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});