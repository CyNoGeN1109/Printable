// src/types/order.ts

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'printing'
  | 'completed'
  | 'cancelled';

export interface OrderFile {
  fileName: string;
  fileUrl: string;
  pages: number;
  copies: number;
  colour: boolean;
  duplex: boolean;
  orientation: string;    // "portrait" | "landscape"
  pageRange: string;      // "all" or "1-3,5"
}

export interface Order {
  _id: string;
  orderId: string;
  customerName?: string; // Fetched from backend later
  userName?: string;
  selectedPrinter?: string; // Per-order printer override
  files: OrderFile[];
  paymentMode: 'online' | 'offline';
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}
