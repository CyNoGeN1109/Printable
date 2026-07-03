// FILE: apps/web/app/checkout/page.tsx
// Checkout page — handles single or multiple print jobs
// Reads `printJobs` (array) from sessionStorage

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaymentToggle from "@/components/PaymentToggle";
import PriceCalc from "@/components/PriceCalc";
import { api } from "@/lib/api";
import { calculatePrice, countPagesInRange } from "@/lib/price";
import type { PrintConfig, PaymentMode } from "@/lib/types";
import storeConfig from "../../store.config.json";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PrintJob {
  fileUrl: string;
  fileName: string;
  config: PrintConfig;
}

function calcPrice(c: PrintConfig, orderTotal: number): number {
  return calculatePrice(c, orderTotal).total;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("offline");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("printJobs");
    const legacy = sessionStorage.getItem("printJob");
    if (stored) {
      setJobs(JSON.parse(stored));
    } else if (legacy) {
      const { fileUrl, fileName, config } = JSON.parse(legacy);
      setJobs([{ fileUrl, fileName, config }]);
    } else {
      router.push("/upload");
    }
    // Restore username if previously entered
    // sessionStorage first (set by WhatsApp draft), then localStorage (returning customer)
    const savedName = sessionStorage.getItem("userName") || localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
  }, [router]);

  const totalPagesInOrder = jobs.reduce((s, j) => s + (countPagesInRange(j.config.pageRange, j.config.totalPages) * j.config.copies), 0);
  const totalAmount = jobs.reduce((s, j) => s + calculatePrice(j.config, totalPagesInOrder).total, 0);

  // Mixed B&W + Colour orders are split into two print jobs by the shop
  const hasMixedColour = jobs.some(j => j.config.colour) && jobs.some(j => !j.config.colour);

  const handlePlaceOrder = async () => {
    if (!jobs.length) return;

    // Validate userName
    if (!userName.trim()) {
      setError("Please enter your name before placing the order.");
      return;
    }

    setLoading(true);
    setError("");

    // Save userName — sessionStorage for this tab, localStorage for future visits
    sessionStorage.setItem("userName", userName.trim());
    localStorage.setItem("userName", userName.trim());

    try {
      const whatsappDraftId = sessionStorage.getItem("whatsappDraftId") || undefined;
      const shopId = sessionStorage.getItem("shopId") || undefined; // from the shop's QR (?shop=)
      const payload = {
        files: jobs.map((job) => ({
          ...job.config,
          fileUrl: job.fileUrl,
          fileName: job.fileName,
          // Send the page count for pricing (backend uses this)
          pages: countPagesInRange(job.config.pageRange, job.config.totalPages),
        })),
        paymentMode,
        userName: userName.trim(),
        ...(whatsappDraftId ? { draftId: whatsappDraftId } : {}),
        ...(shopId ? { shopId } : {}),
      };

      if (paymentMode === "offline") {
        const { orderId } = await api.createOrder(payload);
        sessionStorage.removeItem("printJobs");
        sessionStorage.removeItem("printJob");
        sessionStorage.removeItem("whatsappDraftId");
        router.push(`/track/${orderId}`);
      } else {
        const result = await api.createOrder(payload);
        const { orderId, razorpayOrderId, amount } = result;

        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: "INR",
          order_id: razorpayOrderId,
          name: storeConfig.storeName,
          description:
            jobs.length === 1
              ? `Print order — ${jobs[0].fileName}`
              : `${jobs.length} print orders`,
          handler: () => {
            sessionStorage.removeItem("printJobs");
            sessionStorage.removeItem("printJob");
            sessionStorage.removeItem("whatsappDraftId");
            router.push(`/track/${orderId}`);
          },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
      }
    } catch (err: any) {
      const msg = err?.message?.includes('fetch') || err?.message?.includes('network')
        ? "Can't reach the server. Check your connection and try again."
        : err?.message?.includes('400')
          ? "Order details are incomplete. Go back and check your files."
          : "Something went wrong. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  if (!jobs.length) return null;

  return (
    <main className="min-h-screen bg-[#F2F3F7] text-[#1A1A1A] ">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#F2F3F7]/90 backdrop-blur-xl border-b border-[#E8E8E8]">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} aria-label="Go back" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#E8E8E8] hover:bg-[#F8FDF8] transition-colors shadow-sm">
            <span className="text-lg text-[#1A1A1A]">‹</span>
          </button>
          <h1 className="text-sm font-bold">
            <span className="flex items-center gap-2"><img src={storeConfig.logoPath} alt={`${storeConfig.storeName} logo`} className="w-5 h-5 rounded-md object-cover bg-black" /><span>Print<span className="text-[#0C831F]">able</span></span></span>
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 pb-32">
        <h2 className="text-xl font-bold mb-1">Checkout</h2>
        <p className="text-[#999] text-xs mb-6">
          {jobs.length === 1
            ? "Review and pay"
            : `${jobs.length} files · review and pay`}
        </p>

        {/* Username input */}
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-4 mb-4">
          <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Your Name</label>
          <input
            type="text"
            placeholder="Enter your name (e.g. Anish)"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              if (error.toLowerCase().includes("name")) setError("");
            }}
            className={`w-full bg-[#F2F3F7] border rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#CCC] outline-none transition-colors ${
              error.toLowerCase().includes("name") 
                ? "border-red-500 ring-1 ring-red-500/20" 
                : "border-[#E8E8E8] focus:border-[#0C831F]"
            }`}
            maxLength={50}
          />
          {error.toLowerCase().includes("name") ? (
            <p className="text-[10px] text-red-500 mt-1.5 font-bold animate-shake">⚠️ {error}</p>
          ) : (
            <p className="text-[10px] text-[#999] mt-1.5">This name will appear on your order</p>
          )}
        </div>

        {/* File(s) summary */}
        <div className="space-y-3 mb-6">
          {jobs.map((job, i) => {
            const pc = countPagesInRange(job.config.pageRange, job.config.totalPages);
            return (
              <div
                key={i}
                className="bg-white border border-[#E8E8E8] rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl flex items-center justify-center text-[#0C831F] text-xs font-bold shrink-0">
                    {jobs.length > 1 ? i + 1 : "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{job.fileName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="text-[10px] bg-[#E8E8E8] dark:bg-[#333] text-black dark:text-white px-2 py-0.5 rounded-md font-medium">
                        {pc} page{pc > 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] bg-[#E8E8E8] dark:bg-[#333] text-black dark:text-white px-2 py-0.5 rounded-md font-medium">
                        {job.config.copies} cop{job.config.copies > 1 ? "ies" : "y"}
                      </span>
                      <span className="text-[10px] bg-[#E8E8E8] dark:bg-[#333] text-black dark:text-white px-2 py-0.5 rounded-md font-medium">
                        {job.config.colour ? "🎨 Colour" : "🖤 B&W"}
                      </span>
                      <span className="text-[10px] bg-[#E8E8E8] dark:bg-[#333] text-black dark:text-white px-2 py-0.5 rounded-md font-medium">
                        {job.config.duplex ? "📄 Both" : "📃 Single"}
                      </span>
                      <span className="text-[10px] bg-[#E8E8E8] dark:bg-[#333] text-black dark:text-white px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        {job.config.orientation === "landscape" ? (
                          <svg width="12" height="10" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                            <rect x="1" y="1" width="24" height="18" rx="3" fill="#0C831F" stroke="#0C831F" strokeWidth="2"/>
                          </svg>
                        ) : (
                          <svg width="10" height="12" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                            <rect x="1" y="1" width="18" height="24" rx="3" fill="#0C831F" stroke="#0C831F" strokeWidth="2"/>
                          </svg>
                        )}
                        {job.config.orientation === "landscape" ? "Landscape" : "Portrait"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#0C831F] font-bold text-sm shrink-0">
                    {storeConfig.currencySymbol}{calcPrice(job.config, totalPagesInOrder)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mixed B&W + Colour notice */}
        {hasMixedColour && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-2">
            <span className="text-amber-500 text-base shrink-0">ℹ️</span>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Your order has B&amp;W and Colour files. These will be printed separately and collected together at the counter.
            </p>
          </div>
        )}

        {/* Payment mode toggle */}
        <PaymentToggle mode={paymentMode} onChange={setPaymentMode} />

        {/* Price breakdown for single file */}
        {jobs.length === 1 && <PriceCalc config={jobs[0].config} orderTotalPages={totalPagesInOrder} />}

        {error && !error.toLowerCase().includes("name") && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F2F3F7]/95 backdrop-blur-xl border-t border-[#E8E8E8] z-50">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[#999] text-[10px] uppercase tracking-widest">Total</span>
              <p className="text-[#1A1A1A] text-lg font-black">{storeConfig.currencySymbol}{totalAmount}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="bg-[#0C831F] hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-8 rounded-xl transition-all duration-200 tracking-wide uppercase shadow-lg shadow-[#0C831F]/20 active:scale-95"
            >
              {loading
                ? "Processing…"
                : paymentMode === "online"
                  ? "Pay Online →"
                  : `Place Order →`}
            </button>
          </div>
          {paymentMode === "offline" && (
            <p className="text-[#1A1A1A] text-[10px] text-center mt-2">
              Pay cash when you collect your printout
            </p>
          )}
        </div>
      </div>
    </main>
  );
}