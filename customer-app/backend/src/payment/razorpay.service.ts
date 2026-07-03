// FILE: services/api/src/payment/razorpay.service.ts
// Razorpay webhook signature verification.
// Razorpay sends a POST to /payment/webhook after every successful UPI payment.

import crypto from "crypto";

/**
 * Verifies that the webhook request actually came from Razorpay.
 * Uses HMAC-SHA256 with your webhook secret.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}