// FILE: apps/web/app/admin/page.tsx
// Internal onboarding tool: create shops and get their QR + setup key + WhatsApp link.
// Guarded by the backend ADMIN_KEY (enter it below) if one is configured.

"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "15556697224";

interface Shop {
  shopId: string;
  name: string;
  apiKey: string;
  active: boolean;
  pricing: { bwPerPage: number; colorPerPage: number; duplexDiscountPercent: number };
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [bw, setBw] = useState("");
  const [colour, setColour] = useState("");
  const [creating, setCreating] = useState(false);

  const headers = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (adminKey) h["x-admin-key"] = adminKey;
    return h;
  }, [adminKey]);

  const webLink = (s: Shop) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/upload?shop=${s.shopId}`;
  const waLink = (s: Shop) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Print at ${s.name} #${s.shopId}`)}`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/shops`, { headers: headers() });
      if (!res.ok) { setError(res.status === 401 ? "Wrong admin key." : "Failed to load shops."); return; }
      const data: Shop[] = await res.json();
      setShops(data);
      setError("");
      const map: Record<string, string> = {};
      for (const s of data) {
        map[s.shopId] = await QRCode.toDataURL(`${window.location.origin}/upload?shop=${s.shopId}`, { width: 240, margin: 1 });
      }
      setQrs(map);
    } catch {
      setError("Network error — is the backend running?");
    }
  }, [headers]);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) setAdminKey(saved);
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const saveKeyAndLoad = () => { sessionStorage.setItem("adminKey", adminKey); load(); };

  const createShop = async () => {
    if (!name.trim()) return;
    setCreating(true); setError("");
    const pricing: Record<string, number> = {};
    if (bw) pricing.bwPerPage = Number(bw);
    if (colour) pricing.colorPerPage = Number(colour);
    try {
      const res = await fetch(`${API}/shops`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ name: name.trim(), pricing }),
      });
      if (!res.ok) { setError(res.status === 401 ? "Wrong admin key." : "Create failed."); setCreating(false); return; }
      setName(""); setBw(""); setColour("");
      await load();
    } catch { setError("Network error."); }
    setCreating(false);
  };

  const copy = (t: string) => navigator.clipboard?.writeText(t);

  return (
    <main className="min-h-screen bg-[#F2F3F7] text-[#1A1A1A] px-5 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black mb-1">Printable <span className="text-[#0C831F]">Admin</span></h1>
        <p className="text-[#999] text-sm mb-6">Onboard shops, print their QR, configure pricing.</p>

        {/* Admin key */}
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-[#999] uppercase font-black tracking-widest block mb-2">Admin Key (if set)</label>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="leave blank if none"
              className="w-full bg-[#F2F3F7] border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0C831F]" />
          </div>
          <button onClick={saveKeyAndLoad} className="bg-[#1A1A1A] text-white font-bold text-sm px-5 py-2.5 rounded-xl">Load shops</button>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3 mb-6">{error}</div>}

        {/* Create shop */}
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6 mb-8">
          <h2 className="font-black text-sm uppercase tracking-widest text-[#999] mb-4">Create a shop</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-[#999] uppercase font-black tracking-widest block mb-2">Shop name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sharma Xerox"
                className="w-full bg-[#F2F3F7] border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0C831F]" />
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase font-black tracking-widest block mb-2">B&amp;W ₹/page</label>
              <input value={bw} onChange={(e) => setBw(e.target.value)} placeholder="1" inputMode="decimal"
                className="w-full bg-[#F2F3F7] border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0C831F]" />
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase font-black tracking-widest block mb-2">Colour ₹/page</label>
              <input value={colour} onChange={(e) => setColour(e.target.value)} placeholder="5" inputMode="decimal"
                className="w-full bg-[#F2F3F7] border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0C831F]" />
            </div>
          </div>
          <button onClick={createShop} disabled={creating || !name.trim()}
            className="mt-4 bg-[#0C831F] disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-xl">
            {creating ? "Creating…" : "Create shop + QR"}
          </button>
          <p className="text-[10px] text-[#999] mt-2">Pricing optional — blank fields use the defaults (₹1 B&amp;W, ₹5 colour).</p>
        </div>

        {/* Shops */}
        <h2 className="font-black text-sm uppercase tracking-widest text-[#999] mb-4">{shops.length} shop{shops.length !== 1 ? "s" : ""}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {shops.map((s) => (
            <div key={s.shopId} className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
              <div className="flex gap-4">
                {qrs[s.shopId] && <img src={qrs[s.shopId]} alt={`QR for ${s.name}`} className="w-28 h-28 rounded-lg border border-[#E8E8E8] shrink-0" />}
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-base truncate">{s.name}</h3>
                  <p className="text-[#0C831F] font-mono font-bold text-sm">{s.shopId}</p>
                  <p className="text-[11px] text-[#666] mt-1">B&amp;W ₹{s.pricing?.bwPerPage} · Colour ₹{s.pricing?.colorPerPage}</p>
                  <button onClick={() => copy(s.apiKey)} title={s.apiKey}
                    className="mt-2 text-[10px] font-bold bg-[#F2F3F7] border border-[#E8E8E8] rounded-lg px-2.5 py-1 hover:bg-[#E8E8E8]">
                    📋 Copy setup key (for desktop)
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={waLink(s)} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-[#0C831F] bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg px-3 py-1.5">💬 WhatsApp link</a>
                <button onClick={() => copy(webLink(s))} className="text-[11px] font-bold text-[#666] bg-[#F2F3F7] border border-[#E8E8E8] rounded-lg px-3 py-1.5">🔗 Copy web link</button>
                <a href={qrs[s.shopId]} download={`${s.shopId}-qr.png`} className="text-[11px] font-bold text-[#666] bg-[#F2F3F7] border border-[#E8E8E8] rounded-lg px-3 py-1.5">⬇️ Download QR</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
