// FILE: apps/web/app/track/[id]/page.tsx
// Order tracking — polls the order GROUP so a split order (B&W + colour) shows as
// one job. Combined status = the least-progressed part; a parts breakdown is shown
// when the order was split across two printers.

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import OrderTracker from "@/components/OrderTracker";
import { usePolling } from "@/lib/usePolling";
import type { Order, OrderStatus } from "@/lib/types";
import { clearUploadState } from "../../upload/page";

const RANK: OrderStatus[] = ["pending_payment", "paid", "printing", "completed"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  printing: "Printing",
  completed: "Ready",
  cancelled: "Cancelled",
};

// Merge a group of orders into one view; overall status = the slowest part.
function combine(orders: Order[]): Order {
  const allCancelled = orders.every((o) => o.status === "cancelled");
  let status: OrderStatus;
  if (allCancelled) {
    status = "cancelled";
  } else {
    const minRank = orders.reduce((m, o) => {
      const r = RANK.indexOf(o.status);
      return r >= 0 && r < m ? r : m;
    }, RANK.length - 1);
    status = RANK[minRank];
  }
  return {
    ...orders[0],
    files: orders.flatMap((o) => o.files),
    totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
    status,
  };
}

function PartsBreakdown({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-white border border-[#E8E8E8] rounded-xl p-4 mb-4">
      <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-3">
        Prints in 2 parts (different printers)
      </p>
      <div className="space-y-2.5">
        {orders.map((o) => {
          const colour = o.orderId.toUpperCase().endsWith("-COLOUR");
          const done = o.status === "completed";
          return (
            <div key={o.orderId} className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                {colour ? "🎨 Colour" : "🖤 B & W"}
                <span className="text-[10px] text-[#999] font-mono">#{o.orderId}</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  done
                    ? "bg-[#E8F5E9] text-[#0C831F]"
                    : o.status === "cancelled"
                    ? "bg-red-50 text-red-500"
                    : "bg-[#F2F3F7] text-[#666]"
                }`}
              >
                {STATUS_LABEL[o.status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Sanitise id — only alphanumeric + optional -COLOUR suffix
  const safeId = (id ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);

  const copyId = () => {
    navigator.clipboard.writeText(safeId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const { data: orders, error } = usePolling<Order[]>(
    `/api/orders/group/${safeId}`,
    15000,
    (arr) =>
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.every((o) => o.status === "completed" || o.status === "cancelled")
  );

  const list = Array.isArray(orders) ? orders : [];
  const combined = list.length > 0 ? combine(list) : null;
  const isSplit = list.length > 1;

  return (
    <main className="min-h-screen bg-[#F2F3F7] text-[#1A1A1A] px-5 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => { clearUploadState(); router.push("/"); }}
          className="bg-white border border-[#E8E8E8] text-[#1A1A1A] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#F2F3F7] transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span className="text-base">+</span> New Order
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="bg-white border border-[#0C831F] text-[#0C831F] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#E8F5E9] transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span className="text-base">⚙️</span> New Order (Same File)
        </button>
      </div>

      {/* For cash orders awaiting payment — show the ID large so the customer can show it at the counter */}
      {combined?.status === "pending_payment" && combined?.paymentMode === "offline" ? (
        <div
          onClick={copyId}
          className="mb-8 bg-[#E8F5E9] border-2 border-[#0C831F] rounded-2xl p-5 text-center cursor-pointer active:scale-98 select-none"
        >
          <p className="text-[#0C831F] text-xs font-bold uppercase tracking-widest mb-2">Show this at the counter to pay</p>
          <p className="text-[#1A1A1A] text-4xl font-black tracking-[0.15em] font-mono">{safeId}</p>
          <p className="text-[#0C831F] text-[10px] font-semibold mt-2">{copied ? "✓ Copied!" : "Tap to copy"}</p>
        </div>
      ) : (
        <div className="mb-8">
          <p className="text-[#999] text-xs tracking-widest uppercase mb-1">Order</p>
          <h2 className="text-2xl font-bold">{safeId}</h2>
        </div>
      )}

      {error ? (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 text-red-400 text-sm">
          Could not load order. Check your order ID and try again.
        </div>
      ) : !combined ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-white border border-[#E8E8E8] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {isSplit && <PartsBreakdown orders={list} />}
          <OrderTracker order={combined} />
        </>
      )}
    </main>
  );
}
