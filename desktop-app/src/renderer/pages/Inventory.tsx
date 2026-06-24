// FILE: apps/desktop/src/renderer/pages/Inventory.tsx
// Paper & toner tracking. Paper auto-decrements as jobs print (main process);
// here the vendor restocks, sets the low-paper alert, and updates toner estimate.

import { useState } from 'react'
import type { AppConfig } from '../types'

export default function Inventory({ config, onConfig }: { config: AppConfig | null; onConfig: (c: Partial<AppConfig>) => void }) {
  const inv = config?.inventory || {}
  const sheets = inv.paperSheets ?? 0
  const threshold = inv.lowPaperThreshold ?? 500
  const toner = inv.tonerPercent ?? 100
  const lowPaper = sheets <= threshold
  const lowToner = toner <= 20

  const [add, setAdd] = useState('')
  const [thr, setThr] = useState(String(threshold))

  const patchInv = (p: Partial<typeof inv>) => onConfig({ inventory: { ...inv, ...p } })

  return (
    <div className="space-y-6 max-w-3xl">
      {(lowPaper || lowToner) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span className="text-xs font-black text-amber-700">
            {lowPaper && `Paper low — only ${sheets} sheets left. `}
            {lowToner && `Toner low — ${toner}%. `}
            Restock soon.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Paper */}
        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">📄 Paper stock</h3>
            {lowPaper && <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5">LOW</span>}
          </div>
          <div className={`text-5xl font-black tracking-tight ${lowPaper ? 'text-red-600' : 'text-zinc-900'}`}>{sheets.toLocaleString()}</div>
          <p className="text-xs text-zinc-400 font-bold mt-1">sheets remaining · auto-counts as you print</p>

          <div className="mt-6 flex gap-2">
            <input value={add} onChange={(e) => setAdd(e.target.value)} inputMode="numeric" placeholder="e.g. 2000"
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-zinc-500" />
            <button onClick={() => { const n = Number(add); if (n > 0) { patchInv({ paperSheets: sheets + n }); setAdd('') } }}
              className="btn-primary whitespace-nowrap">+ Add stock</button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Low alert below</label>
            <input value={thr} onChange={(e) => setThr(e.target.value)} onBlur={() => patchInv({ lowPaperThreshold: Number(thr) || 0 })}
              inputMode="numeric" className="w-20 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold outline-none" />
            <span className="text-[10px] font-bold text-zinc-400">sheets</span>
          </div>
        </div>

        {/* Toner */}
        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">🩸 Toner / ink</h3>
            {lowToner && <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5">LOW</span>}
          </div>
          <div className={`text-5xl font-black tracking-tight ${lowToner ? 'text-red-600' : 'text-zinc-900'}`}>{toner}%</div>
          <div className="mt-4 h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${lowToner ? 'bg-red-500' : 'bg-zinc-800'}`} style={{ width: `${toner}%` }} />
          </div>
          <input type="range" min={0} max={100} value={toner} onChange={(e) => patchInv({ tonerPercent: Number(e.target.value) })}
            className="w-full mt-5 accent-zinc-800" />
          <div className="flex gap-2 mt-3">
            <button onClick={() => patchInv({ tonerPercent: 100 })} className="text-[11px] font-black bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-100">New cartridge (100%)</button>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold mt-3">Manual estimate — drag to update after refills.</p>
        </div>
      </div>
    </div>
  )
}
