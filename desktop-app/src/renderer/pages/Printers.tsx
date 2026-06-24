// FILE: apps/desktop/src/renderer/pages/Printers.tsx
// Live printer health — the headline vendor feature. Shows each printer's
// status (out of paper / low toner / jam / offline), queued jobs, lets the
// vendor set B&W / Colour defaults and fire a test page.

import { useEffect, useState, useCallback } from 'react'
import type { PrinterHealth, PrinterHealthStatus, AppConfig } from '../types'

const STATUS_UI: Record<PrinterHealthStatus, { label: string; dot: string; tone: string; icon: string }> = {
  ready:     { label: 'Ready',          dot: 'bg-green-500',  tone: 'text-green-700 bg-green-50 border-green-200',   icon: '✅' },
  printing:  { label: 'Printing',       dot: 'bg-blue-500',   tone: 'text-blue-700 bg-blue-50 border-blue-200',     icon: '🖨️' },
  paper_low: { label: 'Paper low',      dot: 'bg-amber-500',  tone: 'text-amber-700 bg-amber-50 border-amber-200',  icon: '⚠️' },
  toner_low: { label: 'Toner low',      dot: 'bg-amber-500',  tone: 'text-amber-700 bg-amber-50 border-amber-200',  icon: '⚠️' },
  paper_out: { label: 'Out of paper',   dot: 'bg-red-500',    tone: 'text-red-700 bg-red-50 border-red-200',        icon: '📄' },
  toner_out: { label: 'Out of toner',   dot: 'bg-red-500',    tone: 'text-red-700 bg-red-50 border-red-200',        icon: '🩸' },
  jammed:    { label: 'Paper jam',      dot: 'bg-red-500',    tone: 'text-red-700 bg-red-50 border-red-200',        icon: '🚫' },
  door_open: { label: 'Door open',      dot: 'bg-red-500',    tone: 'text-red-700 bg-red-50 border-red-200',        icon: '🚪' },
  bin_full:  { label: 'Tray full',      dot: 'bg-amber-500',  tone: 'text-amber-700 bg-amber-50 border-amber-200',  icon: '📥' },
  offline:   { label: 'Offline',        dot: 'bg-zinc-400',   tone: 'text-zinc-600 bg-zinc-100 border-zinc-200',    icon: '🔌' },
  error:     { label: 'Needs service',  dot: 'bg-red-500',    tone: 'text-red-700 bg-red-50 border-red-200',        icon: '🛠️' },
  unknown:   { label: 'Unknown',        dot: 'bg-zinc-300',   tone: 'text-zinc-500 bg-zinc-50 border-zinc-200',     icon: '❔' },
}

export default function Printers({ config, onConfig }: { config: AppConfig | null; onConfig: (c: Partial<AppConfig>) => void }) {
  const [health, setHealth] = useState<PrinterHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const h = await window.api.getPrinterHealth()
      setHealth(h)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 8000) // live poll
    return () => clearInterval(id)
  }, [refresh])

  const setRole = (name: string, role: 'bw' | 'colour') => {
    onConfig(role === 'bw' ? { bwPrinter: name } : { colourPrinter: name })
  }

  const testPage = async (name: string) => {
    setTesting(name)
    const res = await window.api.printTestPage(name)
    setTesting(null)
    if (!res.success) alert(res.error || 'Test page failed')
  }

  const problems = health.filter((p) => !p.ok && p.status !== 'unknown')

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Summary banner */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Printer Health</h2>
          <p className="text-sm text-zinc-500 font-medium">
            {loading ? 'Checking printers…'
              : problems.length === 0
                ? `All ${health.length} printer${health.length !== 1 ? 's' : ''} healthy`
                : `${problems.length} printer${problems.length !== 1 ? 's' : ''} need attention`}
          </p>
        </div>
        <button onClick={refresh} className="text-xs font-black bg-white border border-zinc-200 rounded-xl px-4 py-2 hover:bg-zinc-50">↻ Refresh</button>
      </div>

      {problems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap gap-2">
          {problems.map((p) => (
            <span key={p.name} className="text-[11px] font-black text-red-700 bg-white border border-red-200 rounded-lg px-3 py-1.5">
              {STATUS_UI[p.status].icon} {p.name}: {p.message}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {health.map((p) => {
          const ui = STATUS_UI[p.status]
          const isBw = config?.bwPrinter === p.name
          const isColour = config?.colourPrinter === p.name
          return (
            <div key={p.name} className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ui.dot} ${p.status === 'printing' ? 'animate-pulse' : ''}`} />
                    <h3 className="font-black text-base text-zinc-900 truncate">{p.name}</h3>
                    {p.isDefault && <span className="text-[9px] font-black uppercase bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">System default</span>}
                  </div>
                  <span className={`inline-block mt-2 text-[11px] font-black border rounded-lg px-2.5 py-1 ${ui.tone}`}>{ui.icon} {ui.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-zinc-900">{p.queuedJobs}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">in queue</div>
                </div>
              </div>

              {!p.ok && p.status !== 'unknown' && (
                <p className="mt-3 text-xs font-bold text-red-600">{p.message}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => setRole(p.name, 'bw')}
                  className={`text-[11px] font-black rounded-lg px-3 py-1.5 border ${isBw ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'}`}>
                  🖤 {isBw ? 'B&W default' : 'Set B&W'}
                </button>
                <button onClick={() => setRole(p.name, 'colour')}
                  className={`text-[11px] font-black rounded-lg px-3 py-1.5 border ${isColour ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'}`}>
                  🎨 {isColour ? 'Colour default' : 'Set Colour'}
                </button>
                <button onClick={() => testPage(p.name)} disabled={testing === p.name}
                  className="text-[11px] font-black rounded-lg px-3 py-1.5 border bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 disabled:opacity-50">
                  {testing === p.name ? 'Sending…' : '🧪 Test page'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {!loading && health.length === 0 && (
        <div className="bg-white border border-black/5 rounded-3xl p-12 text-center text-zinc-400 font-bold">
          No printers detected. Connect a printer and click Refresh.
        </div>
      )}
    </div>
  )
}
