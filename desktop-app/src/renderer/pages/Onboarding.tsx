// FILE: apps/desktop/src/renderer/pages/Onboarding.tsx
// First-run welcome: link this PC to a shop with its setup key (from the admin
// page) so the vendor only sees their own orders. Skippable for legacy/test use.

import { useState } from 'react'

export default function Onboarding({ onDone, onSkip }: { onDone: (name: string, key: string) => void; onSkip: () => void }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F4F4F5] relative overflow-hidden">
      <div className="app-bg" />
      <div className="relative z-10 w-full max-w-md bg-white border border-black/5 rounded-[2rem] shadow-xl p-10">
        <div className="w-14 h-14 bg-[#0C831F] rounded-2xl flex items-center justify-center text-white text-2xl mb-6">🖨️</div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Welcome to Printable</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1 mb-8">Link this computer to your shop to start receiving orders.</p>

        <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block tracking-widest">Shop name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sharma Xerox"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-zinc-500 mb-5" />

        <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block tracking-widest">Setup key</label>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk_…" type="password"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm font-mono outline-none focus:border-zinc-500" />
        <p className="text-[11px] text-zinc-400 font-medium mt-2">Get this from the Printable admin page when you created the shop.</p>

        <button onClick={() => key.trim() && onDone(name.trim(), key.trim())} disabled={!key.trim()}
          className="w-full mt-7 bg-[#0C831F] disabled:opacity-40 text-white font-black py-3.5 rounded-xl hover:opacity-90 transition-all">
          Link shop &amp; start
        </button>
        <button onClick={onSkip} className="w-full mt-3 text-zinc-400 text-xs font-black hover:text-zinc-600">
          Skip for now
        </button>
      </div>
    </div>
  )
}
