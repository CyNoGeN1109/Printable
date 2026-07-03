"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F2F3F7] flex flex-col items-center justify-center px-5 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-2xl font-black text-[#1A1A1A] mb-2">Something went wrong</h1>
      <p className="text-[#999] text-sm mb-8 max-w-xs">
        An unexpected error occurred. Your order data is safe — try again or contact the shop.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-[#0C831F] text-white font-bold text-sm py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <a
          href="/"
          className="bg-white border border-[#E8E8E8] text-[#1A1A1A] font-bold text-sm py-3 px-6 rounded-xl hover:bg-[#F2F3F7] transition-colors"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
