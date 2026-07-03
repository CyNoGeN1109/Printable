"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import ThemeToggle from "@/components/ThemeToggle";
import config from "../store.config.json";

export default function HomePage() {
  const router = useRouter();
  const [trackId, setTrackId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR code pointing to the upload page.
  // If DEFAULT_SHOP_ID is configured, include ?shop= so orders route to this shop.
  useEffect(() => {
    const shopId = process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = shopId ? `${base}/upload?shop=${shopId}` : `${base}/upload`;
    QRCode.toDataURL(url, {
      width: 260,
      margin: 2,
      color: { dark: "#0C831F", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl).catch(() => {});
  }, []);

  const handleTrack = () => {
    const id = trackId.trim().toUpperCase();
    if (id.length >= 4) router.push(`/track/${id}`);
  };

  return (
    <main className="min-h-screen bg-[#F2F3F7] flex flex-col items-center justify-center px-5 py-6">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-[#E8F5E9] border border-[#C8E6C9] rounded-full px-4 py-1.5 text-[10px] text-[#0C831F] font-semibold mb-4 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#0C831F] animate-pulse inline-block" />
          Shop is open
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2 text-[#1A1A1A] flex flex-col items-center gap-3">
          <img src={config.logoPath} alt={`${config.storeName} Logo`} className="w-16 h-16 rounded-2xl shadow-md object-cover bg-black" />
          <span>Print<span className="text-[#0C831F]">able</span></span>
        </h1>
        <p className="text-[#666] text-xs max-w-[260px] mx-auto leading-relaxed">
          {config.storeTagline}
        </p>
      </div>

      {/* QR code — scan to open the upload page on your phone */}
      <div className="mb-2 text-center w-full max-w-[260px]">
        <div className="card !bg-white p-3 border border-[#E8E8E8] shadow-md">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to place a print order"
              className="w-full h-auto rounded-lg"
            />
          ) : (
            <div className="aspect-square flex items-center justify-center bg-[#F2F3F7] rounded-lg">
              <div className="w-8 h-8 border-2 border-[#0C831F] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-[#999] mt-2 font-medium">Scan with your phone to start an order</p>
      </div>

      {/* CTA */}
      <Link
        href="/upload"
        className="btn-green w-full max-w-[260px] flex items-center justify-center py-3 text-sm font-bold tracking-wide uppercase rounded-xl mb-4 shadow-lg shadow-[#0C831F]/20 mt-3"
      >
        Start New Print Order →
      </Link>

      {/* Track */}
      <p className="text-[#333] text-[11px] mb-2 font-semibold">Track existing order? Enter order ID below</p>
      <div className="flex gap-2 w-full max-w-[260px]">
        <input
          type="text"
          placeholder="Order ID e.g. ABC123"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          maxLength={8}
          className="flex-1 bg-white border-2 border-dashed border-[#B0B0B0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#999] outline-none focus:border-[#0C831F] focus:border-solid transition-all uppercase tracking-widest"
        />
        <button
          onClick={handleTrack}
          disabled={trackId.trim().length < 4}
          aria-label="Track order"
          className="bg-white border border-[#E8E8E8] hover:border-[#0C831F] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-[#333] hover:text-[#0C831F] transition-colors font-semibold"
        >
          Go
        </button>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-[#999] text-[10px]">
        <p>Need help? Call us at <a href={`tel:${config.contact.phone}`} className="font-semibold text-[#0C831F]">{config.contact.phone}</a></p>
      </div>
    </main>
  );
}
