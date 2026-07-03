"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F2F3F7] flex flex-col items-center justify-center px-5 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-black text-[#1A1A1A] mb-2">Page not found</h1>
      <p className="text-[#999] text-sm mb-8 max-w-xs">
        The page you're looking for doesn't exist. Check your link or start a new order.
      </p>
      <Link
        href="/"
        className="bg-[#0C831F] text-white font-bold text-sm py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
      >
        Back to home
      </Link>
    </main>
  );
}
