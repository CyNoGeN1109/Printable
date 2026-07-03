// FILE: services/api/src/db.ts
// MongoDB Atlas connection using Mongoose
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";

// Use Google public DNS ONLY if running locally (SRV lookups fail on some ISPs/hotspots)
// Vercel environment sets VERCEL=1, so we skip it there to avoid crashes.
if (!process.env.VERCEL) {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

export async function connectDB(): Promise<void> {
  // readyState 1 = connected, 2 = connecting
  if (mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // fail fast on serverless cold starts
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}