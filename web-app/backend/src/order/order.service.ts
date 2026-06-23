// FILE: services/api/src/order/order.service.ts
// All order business logic — create, find, update status.
// Routes call these functions; no DB logic lives in routes.

import { nanoid } from "nanoid";
import Razorpay from "razorpay";
import { Order, IOrder, IOrderFile, OrderStatus } from "./order.model";
import { deleteFromR2 } from "../file/r2.service";
import { sendMessage } from "../whatsapp/whatsapp.service";
import { getShopByCode } from "../shop/shop.service";
import type { IShopPricing } from "../shop/shop.model";
import storeConfig from "../../store.config.json";

// Global default pricing — used for orders with no shop (legacy / web default).
const GLOBAL_PRICING: IShopPricing = {
  bwPerPage:             storeConfig.pricing.bwPerPage,
  colorPerPage:          storeConfig.pricing.colorPerPage,
  duplexDiscountPercent: storeConfig.pricing.duplexDiscountPercent,
  bulkThreshold:         100,
  bulkBwPerPage:         0.9,
  bulkColorPerPage:      4,
};

function calcFileAmount(
  pages:  number,
  copies: number,
  colour: boolean,
  duplex: boolean,
  isBulk: boolean,
  pricing: IShopPricing
): number {
  const perPage = colour
    ? (isBulk ? pricing.bulkColorPerPage : pricing.colorPerPage)
    : (isBulk ? pricing.bulkBwPerPage : pricing.bwPerPage);

  let total = perPage * pages * copies;
  if (duplex && pages > 1) {
    total = total - (total * (pricing.duplexDiscountPercent / 100));
  }
  return Math.round(total);
}

// Generate a short readable order ID e.g. "ABC123"
function generateOrderId(): string {
  return nanoid(6).toUpperCase();
}

// ─── Create Order ─────────────────────────────────────────────────────────────

export interface FileInput {
  fileName:      string;
  fileUrl: string;
  pages:         number;
  copies:        number;
  colour:        boolean;
  duplex:        boolean;
  orientation:   string;
  pageRange:     string;
}

interface CreateOrderInput {
  files:         FileInput[];   // ≥1 files
  paymentMode:   "online" | "offline";
  userName:      string;
  whatsappFrom?: string;        // set when the order came from a WhatsApp draft
  shopId?:       string;        // owning shop (tenant)
}

interface CreateOrderResult {
  orderId:          string;
  razorpayOrderId?: string;
  amount:           number;   // in paise for Razorpay, in rupees otherwise
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // Price with the owning shop's config (falls back to global defaults).
  const shop = input.shopId ? await getShopByCode(input.shopId) : null;
  const pricing = shop?.pricing ?? GLOBAL_PRICING;

  // Calculate total pages across all files to check the bulk threshold
  const totalPagesInOrder = input.files.reduce((sum, f) => sum + (f.pages * f.copies), 0);
  const isBulk = totalPagesInOrder > pricing.bulkThreshold;

  // Build per-file records with pre-calculated amounts
  const files: IOrderFile[] = input.files.map((f) => ({
    fileName:      f.fileName,
    fileUrl: f.fileUrl,
    pages:         f.pages,
    copies:        f.copies,
    colour:        f.colour,
    duplex:        f.duplex,
    orientation:   f.orientation || 'portrait',
    pageRange:     f.pageRange || 'all',
    amount:        calcFileAmount(f.pages, f.copies, f.colour, f.duplex, isBulk, pricing),
  }));

  const totalAmount = files.reduce((s, f) => s + f.amount, 0);
  const baseId = generateOrderId();

  // One Razorpay order covers the whole job — the customer pays once even when we
  // split the order into separate B&W and colour orders below.
  let razorpayOrderId: string | undefined;
  if (input.paymentMode === "online") {
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const rzpOrder = await razorpay.orders.create({
      amount:   totalAmount * 100, // Razorpay uses paise
      currency: "INR",
      receipt:  baseId,
    });

    razorpayOrderId = rzpOrder.id;
  }

  // Split a MIXED order so B&W files and colour files become separate orders the
  // vendor can route to different printers. Same base id; colour gets a suffix.
  const bwFiles     = files.filter((f) => !f.colour);
  const colourFiles = files.filter((f) => f.colour);

  const shared = {
    userName:     input.userName,
    paymentMode:  input.paymentMode,
    status:       "pending_payment" as OrderStatus,
    groupId:      baseId,
    razorpayOrderId,
    whatsappFrom: input.whatsappFrom,
    shopId:       input.shopId,
  };

  if (bwFiles.length > 0 && colourFiles.length > 0) {
    await Order.create({
      ...shared,
      orderId:     baseId,
      files:       bwFiles,
      totalAmount: bwFiles.reduce((s, f) => s + f.amount, 0),
    });
    await Order.create({
      ...shared,
      orderId:     `${baseId}-COLOUR`,
      files:       colourFiles,
      totalAmount: colourFiles.reduce((s, f) => s + f.amount, 0),
    });
  } else {
    // All one colour type — single order, no split.
    await Order.create({ ...shared, orderId: baseId, files, totalAmount });
  }

  // Customer pays the combined total once and tracks the base id.
  return { orderId: baseId, razorpayOrderId, amount: totalAmount * 100 };
}

// ─── Get Single Order ──────────────────────────────────────────────────────────

export async function getOrderById(orderId: string): Promise<IOrder | null> {
  return Order.findOne({ orderId: orderId.toUpperCase() }).lean<IOrder>();
}

// ─── Get all orders in a group (split B&W + colour, or a single order) ───────────

export async function getOrdersByGroup(idOrGroupId: string): Promise<IOrder[]> {
  const v = idOrGroupId.toUpperCase();
  // Match by groupId (split siblings) or orderId (non-split / older orders).
  return Order.find({ $or: [{ groupId: v }, { orderId: v }] })
    .sort({ orderId: 1 }) // base id sorts before "<base>-COLOUR", so B&W comes first
    .lean<IOrder[]>();
}

// ─── Get All Orders ────────────────────────────────────────────────────────────

export async function getAllOrders(shopId?: string): Promise<IOrder[]> {
  return Order.find(shopId ? { shopId } : {}).sort({ createdAt: -1 }).lean<IOrder[]>();
}

// ─── Get Orders by Status ──────────────────────────────────────────────────────

export async function getOrdersByStatus(status: OrderStatus, shopId?: string): Promise<IOrder[]> {
  return Order.find({ status, ...(shopId ? { shopId } : {}) }).sort({ createdAt: -1 }).lean<IOrder[]>();
}

// ─── Update Order Status ───────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<IOrder | null> {
  const updated = await Order.findOneAndUpdate(
    { orderId: orderId.toUpperCase() },
    { status },
    { new: true }
  );

  if (!updated) return null;

  // If completed or cancelled, delete associated files from Cloudinary to protect privacy/storage
  if (status === "completed" || status === "cancelled") {
    console.log(`[OrderService] Order ${orderId} reached final state '${status}'. Cleaning up Cloudflare R2...`);
    for (const file of updated.files) {
      if (file.fileUrl) {
        // Extract R2 key from the full URL
        const parts = file.fileUrl.split("/");
        const key = parts[parts.length - 1];
        
        deleteFromR2(key).catch((err) => {
          console.error(`[OrderService] Failed to delete file ${file.fileName} from R2:`, err);
        });
      }
    }
  }

  // Notify the WhatsApp customer once the whole job is done.
  if (status === "completed") {
    notifyReadyIfGroupComplete(updated).catch((err) =>
      console.error(`[OrderService] ready-notify failed for ${orderId}:`, err)
    );
  }

  return updated.toObject() as IOrder;
}

// ─── Confirm Cash Payment ──────────────────────────────────────────────────────

export async function confirmCashPayment(
  orderId: string
): Promise<IOrder | null> {
  return Order.findOneAndUpdate(
    { orderId: orderId.toUpperCase(), paymentMode: "offline" },
    { status: "paid" },
    { new: true }
  ).lean<IOrder>();
}

// ─── Mark Online Payment Paid ──────────────────────────────────────────────────

export async function markOnlinePaid(
  razorpayOrderId:  string,
  razorpayPaymentId: string
): Promise<IOrder[]> {
  // One payment can cover a split order (B&W + colour share a razorpayOrderId),
  // so mark every order tied to this payment as paid.
  await Order.updateMany(
    { razorpayOrderId },
    { status: "paid", razorpayPaymentId }
  );
  return Order.find({ razorpayOrderId }).lean<IOrder[]>();
}

// ─── Notify WhatsApp customer when the whole job (group) is complete ─────────────

async function notifyReadyIfGroupComplete(order: IOrder): Promise<void> {
  if (!order.whatsappFrom) return; // only WhatsApp-originated orders carry a number
  const groupId = order.groupId || order.orderId;
  const group = await getOrdersByGroup(groupId);
  // Send once — only when every part (B&W + colour) has finished printing.
  if (group.length === 0 || !group.every((o) => o.status === "completed")) return;
  await sendMessage(
    order.whatsappFrom,
    `✅ Your prints are ready to collect!\nOrder *${groupId}* — ${storeConfig.storeName}`
  );
}