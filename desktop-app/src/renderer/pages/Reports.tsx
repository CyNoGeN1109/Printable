// FILE: apps/desktop/src/renderer/pages/Reports.tsx
// Real business reporting: pick a period, see revenue / orders / pages / channel
// split / busiest hours, and export to CSV for the owner's records.

import { useEffect, useMemo, useState } from 'react'
import type { Order } from '../types'

type Period = 'today' | '7d' | '30d' | 'all'
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
]

function pagesOf(o: Order): number {
  return (o.files || []).reduce((s, f) => s + (f.pages || 0) * (f.copies || 1), 0)
}

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([])
  const [period, setPeriod] = useState<Period>('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([window.api.getOrders().catch(() => []), window.api.getHistory().catch(() => [])])
      .then(([live, hist]) => {
        // merge backend orders + local history, de-duped by orderId
        const map = new Map<string, Order>()
        ;[...(hist as Order[]), ...(live as Order[])].forEach((o) => o?.orderId && map.set(o.orderId, o))
        setOrders([...map.values()])
        setLoading(false)
      })
  }, [])

  const inPeriod = useMemo(() => {
    const now = Date.now()
    const cutoff =
      period === 'today' ? new Date(new Date().toDateString()).getTime()
      : period === '7d' ? now - 7 * 864e5
      : period === '30d' ? now - 30 * 864e5
      : 0
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff)
  }, [orders, period])

  const done = inPeriod.filter((o) => o.status === 'completed')
  const revenue = done.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const pages = done.reduce((s, o) => s + pagesOf(o), 0)
  const online = done.filter((o) => o.paymentMode === 'online').length
  const cash = done.filter((o) => o.paymentMode === 'offline').length
  const avg = done.length ? revenue / done.length : 0

  // busiest hours (completed orders by hour 0–23)
  const byHour = useMemo(() => {
    const h = new Array(24).fill(0)
    done.forEach((o) => { h[new Date(o.createdAt).getHours()]++ })
    return h
  }, [done])
  const peakHour = byHour.indexOf(Math.max(...byHour))
  const maxHour = Math.max(1, ...byHour)

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'Pages', 'Amount'],
      ...inPeriod.map((o) => [
        o.orderId, o.userName || o.customerName || '', new Date(o.createdAt).toLocaleString(),
        o.status, o.paymentMode, String(pagesOf(o)), String(o.totalAmount || 0),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `printable-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Period selector + export */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white border border-zinc-200 rounded-2xl p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${period === p.key ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} disabled={!inPeriod.length}
          className="ml-auto text-xs font-black bg-white border border-zinc-200 rounded-xl px-4 py-2.5 hover:bg-zinc-50 disabled:opacity-40">
          ⬇️ Export CSV
        </button>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Revenue" value={`₹${revenue.toFixed(0)}`} icon="💰" big />
        <Metric label="Completed orders" value={done.length} icon="✅" />
        <Metric label="Pages printed" value={pages} icon="📄" />
        <Metric label="Avg. order" value={`₹${avg.toFixed(0)}`} icon="📈" />
      </div>

      {/* Channel split */}
      <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">Payment channels</h3>
        <Bar label="🌐 Online / UPI" value={online} total={done.length} color="bg-zinc-900" />
        <div className="h-3" />
        <Bar label="💵 Cash at counter" value={cash} total={done.length} color="bg-zinc-400" />
      </div>

      {/* Busiest hours */}
      <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Busiest hours</h3>
          {done.length > 0 && <span className="text-xs font-black text-zinc-500">Peak: {fmtHour(peakHour)}</span>}
        </div>
        <div className="flex items-end gap-1 h-32">
          {byHour.map((c, h) => (
            <div key={h} className="flex-1 flex flex-col items-center justify-end group">
              <div className={`w-full rounded-t ${c === maxHour && c > 0 ? 'bg-zinc-900' : 'bg-zinc-200'} group-hover:bg-zinc-700 transition-all`}
                style={{ height: `${(c / maxHour) * 100}%`, minHeight: c > 0 ? 4 : 0 }} title={`${fmtHour(h)}: ${c}`} />
              {h % 6 === 0 && <span className="text-[8px] text-zinc-400 mt-1 font-bold">{fmtHour(h)}</span>}
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="text-center text-zinc-400 font-bold text-sm">Loading…</p>}
      {!loading && !inPeriod.length && <p className="text-center text-zinc-400 font-bold text-sm py-8">No orders in this period yet.</p>}
    </div>
  )
}

function Metric({ label, value, icon, big }: { label: string; value: any; icon: string; big?: boolean }) {
  return (
    <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm">
      <div className="text-xl mb-2">{icon}</div>
      <div className={`font-black text-zinc-900 tracking-tight ${big ? 'text-4xl' : 'text-3xl'}`}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{label}</div>
    </div>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs font-black text-zinc-600 mb-2">
        <span>{label}</span><span>{value} · {pct}%</span>
      </div>
      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function fmtHour(h: number) {
  const ampm = h < 12 ? 'am' : 'pm'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}${ampm}`
}
