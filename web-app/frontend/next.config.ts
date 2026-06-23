import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the public dev tunnel (cloudflared) to reach the dev server, so the
  // WhatsApp link can be opened on a phone during testing.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
