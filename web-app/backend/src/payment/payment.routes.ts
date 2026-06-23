// FILE: services/api/src/payment/payment.routes.ts
// Payment routes — handles Razorpay webhook after successful UPI payment.
// Uses raw body (not JSON parsed) so signature verification works correctly.

import { Router, Request, Response } from "express";
import express from "express";
import { verifyWebhookSignature } from "./razorpay.service";
import { markOnlinePaid } from "../order/order.service";

export const paymentRouter = Router();

// ─── POST /payment/webhook ────────────────────────────────────────────────────
// Razorpay calls this after every successful payment.
// Must respond with 200 quickly — Razorpay retries if it doesn't get a response.
paymentRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }), // raw body needed for HMAC verification
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        res.status(400).json({ error: "Missing signature header" });
        return;
      }

      // Verify the request is genuinely from Razorpay
      const isValid = verifyWebhookSignature(req.body as Buffer, signature);
      if (!isValid) {
        console.warn("⚠️  Invalid Razorpay webhook signature");
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      // Parse the raw body now that it's verified
      const event = JSON.parse((req.body as Buffer).toString());

      // Only handle successful payment events
      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const razorpayOrderId: string = payment.order_id;
        const razorpayPaymentId: string = payment.id;

        const orders = await markOnlinePaid(razorpayOrderId, razorpayPaymentId);

        if (orders.length > 0) {
          console.log(`✅ Payment confirmed for ${orders.map((o) => o.orderId).join(", ")}`);
        } else {
          console.warn(`⚠️  Order not found for razorpayOrderId: ${razorpayOrderId}`);
        }
      }

      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("POST /payment/webhook error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);