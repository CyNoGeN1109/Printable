// FILE: apps/desktop/src/renderer/pages/Supplies.tsx
// True supply levels read from the printer itself:
//   • network printers (SNMP) → exact toner / drum / ink / paper-tray percentages
//   • any other printer (WMI)  → OK / Low / Out flags straight from the driver
// Nothing is estimated in software, so the alerts are trustworthy.

import { useEffect, useState, useCallback } from 'react'
import type { PrinterSupplies, Supply, SupplyFlag } from '../types'
import { Card, Button, EmptyState } from '../components/ui'

const LOW = 15 // % at or below which a supply counts as low

const COLOR_BAR: Record<string, string> = {
  black: 'bg-zinc-900', cyan: 'bg-cyan-500', magenta: 'bg-pink-500', yellow: 'bg-yellow-400',
}
function barColor(s: Supply): string {
  if (s.percent !== null && s.percent <= LOW) return 'bg-red-500'
  if (s.color && COLOR_BAR[s.color]) return COLOR_BAR[s.color]
  if (s.kind === 'paper') return 'bg-blue-500'
  if (s.kind === 'drum') return 'bg-violet-500'
  return 'bg-zinc-700'
}
const KIND_ICON: Record<string, string> = { toner: '🩸', ink: '🩸', drum: '🥁', waste: '🗑️', paper: '📄', other: '🔧' }

const FLAG_UI: Record<SupplyFlag, { label: string; cls: string }> = {
  ok:      { label: 'OK',      cls: 'text-green-700 bg-green-50 border-green-200' },
  low:     { label: 'Low',     cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  out:     { label: 'Empty',   cls: 'text-red-700 bg-red-50 border-red-200' },
  unknown: { label: 'Unknown', cls: 'text-zinc-500 bg-zinc-50 border-zinc-200' },
}

export default function Supplies() {
  const [data, setData] = useState<PrinterSupplies[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try { setData(await window.api.getPrinterSupplies()) } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30000) // supplies change slowly
    return () => clearInterval(id)
  }, [refresh])

  const lowItems = data.flatMap((p) =>
    [
      ...p.supplies.filter((s) => s.percent !== null && s.percent <= LOW).map((s) => `${p.printer}: ${s.name} ${s.percent}%`),
      ...(p.source === 'wmi' && p.paperFlag === 'out' ? [`${p.printer}: out of paper`] : []),
      ...(p.source === 'wmi' && p.paperFlag === 'low' ? [`${p.printer}: paper low`] : []),
      ...(p.source === 'wmi' && p.tonerFlag === 'out' ? [`${p.printer}: out of toner`] : []),
      ...(p.source === 'wmi' && p.tonerFlag === 'low' ? [`${p.printer}: toner low`] : []),
    ],
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 font-medium">
          {loading ? 'Reading supply levels…'
            : lowItems.length === 0 ? 'All supplies healthy — read live from your printers'
            : `${lowItems.length} supply alert${lowItems.length !== 1 ? 's' : ''}`}
        </p>
        <Button variant="ghost" onClick={refresh}>↻ Refresh</Button>
      </div>

      {lowItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap gap-2">
          {lowItems.map((t, i) => (
            <span key={i} className="text-[11px] font-black text-red-700 bg-white border border-red-200 rounded-lg px-3 py-1.5">⚠️ {t}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.map((p) => (
          <Card key={p.printer} pad="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-zinc-900 truncate">{p.printer}</h3>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${p.source === 'snmp' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-zinc-100 text-zinc-500'}`}>
                {p.source === 'snmp' ? '● Live levels' : 'Driver flags'}
              </span>
            </div>

            {p.source === 'snmp' && p.supplies.length > 0 ? (
              <div className="space-y-3.5">
                {p.supplies.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-black text-zinc-600 mb-1.5">
                      <span>{KIND_ICON[s.kind]} {s.name}</span>
                      <span className={s.percent !== null && s.percent <= LOW ? 'text-red-600' : ''}>
                        {s.percent !== null ? `${s.percent}%` : 'present'}
                      </span>
                    </div>
                    <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor(s)}`} style={{ width: `${s.percent ?? 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback: coarse driver flags (works on USB / non-SNMP printers)
              <div className="space-y-3">
                <FlagRow icon="📄" label="Paper" flag={p.paperFlag} />
                <FlagRow icon="🩸" label="Toner / ink" flag={p.tonerFlag} />
                <p className="text-[11px] text-zinc-400 font-medium pt-1">
                  {p.host ? 'Exact levels need SNMP enabled on this printer.' : 'Exact levels need a network printer with SNMP. USB printers report OK/Low/Out only.'}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {!loading && data.length === 0 && (
        <Card><EmptyState icon="🩸" title="No printers detected" sub="Connect a printer and refresh. Live levels are read on Windows (network printers via SNMP)." /></Card>
      )}
    </div>
  )
}

function FlagRow({ icon, label, flag }: { icon: string; label: string; flag: SupplyFlag }) {
  const ui = FLAG_UI[flag]
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-black text-zinc-700">{icon} {label}</span>
      <span className={`text-[11px] font-black border rounded-lg px-2.5 py-1 ${ui.cls}`}>{ui.label}</span>
    </div>
  )
}
