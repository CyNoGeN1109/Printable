// FILE: apps/desktop/src/renderer/pages/Reports.tsx
// Business reporting: pick a period, see revenue / orders / pages / channel split
// / busiest hours, and export to CSV.

import { useMemo, useState, useEffect } from 'react'
import type { Order, AppConfig } from '../types'
import { Card, SectionLabel, Button } from '../components/ui'
import { useAllOrders } from '../lib/useAllOrders'

type Period = 'today' | '7d' | '30d' | 'all'
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' }, { key: 'all', label: 'Since install' },
]

const pagesOf = (o: Order) => (o.files || []).reduce((s, f) => s + (f.pages || 0) * (f.copies || 1), 0)

export default function Reports() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { orders, loading } = useAllOrders([refreshKey])
  const [period, setPeriod] = useState<Period>('today')
  const [shopName, setShopName] = useState('')

  useEffect(() => {
    window.api.getConfig().then((cfg: AppConfig) => setShopName(cfg.shopName || 'printable'))
  }, [])

  const inPeriod = useMemo(() => {
    const now = Date.now()
    const cutoff = period === 'today' ? new Date(new Date().toDateString()).getTime()
      : period === '7d' ? now - 7 * 864e5 : period === '30d' ? now - 30 * 864e5 : 0
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff)
  }, [orders, period])

  const done = inPeriod.filter((o) => o.status === 'completed')
  const revenue = done.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const pages = done.reduce((s, o) => s + pagesOf(o), 0)
  const online = done.filter((o) => o.paymentMode === 'online').length
  const cash = done.filter((o) => o.paymentMode === 'offline').length
  const avg = done.length ? revenue / done.length : 0

  // Print-type breakdown — useful for toner/ink planning
  const colourPages = done.reduce((s, o) => s + (o.files || []).filter(f => f.colour).reduce((p, f) => p + (f.pages || 0) * (f.copies || 1), 0), 0)
  const bwPages = pages - colourPages

  const byHour = useMemo(() => {
    const h = new Array(24).fill(0)
    done.forEach((o) => { h[new Date(o.createdAt).getHours()]++ })
    return h
  }, [done])
  const peakHour = byHour.indexOf(Math.max(...byHour))
  const maxHour = Math.max(1, ...byHour)

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'B&W Pages', 'Colour Pages', 'Total Pages', 'Amount'],
      ...inPeriod.map((o) => {
        const bw = (o.files || []).filter(f => !f.colour).reduce((p, f) => p + (f.pages || 0) * (f.copies || 1), 0)
        const col = (o.files || []).filter(f => f.colour).reduce((p, f) => p + (f.pages || 0) * (f.copies || 1), 0)
        return [o.orderId, o.userName || o.customerName || '', new Date(o.createdAt).toLocaleString(), o.status, o.paymentMode, String(bw), String(col), String(bw + col), String(o.totalAmount || 0)]
      }),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    const slug = shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    a.href = url; a.download = `${slug}-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="flex bg-white border border-zinc-200 rounded-2xl p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${period === p.key ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>↻ Refresh</Button>
        <div className="ml-auto"><Button variant="ghost" onClick={exportCsv} disabled={!inPeriod.length}>⬇️ Export CSV</Button></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Revenue" value={`₹${revenue.toFixed(0)}`} icon="💰" big />
        <Metric label="Completed orders" value={done.length} icon="✅" />
        <Metric label="Pages printed" value={pages} icon="📄" />
        <Metric label="Avg. order" value={`₹${avg.toFixed(0)}`} icon="📈" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <SectionLabel>Payment channels</SectionLabel>
          <Bar label="🌐 Online / UPI" value={online} total={done.length} color="bg-zinc-900" />
          <div className="h-3" />
          <Bar label="💵 Cash at counter" value={cash} total={done.length} color="bg-zinc-400" />
        </Card>

        <Card>
          <SectionLabel>Print type</SectionLabel>
          <Bar label="🖤 B&W pages" value={bwPages} total={pages} color="bg-zinc-800" />
          <div className="h-3" />
          <Bar label="🎨 Colour pages" value={colourPages} total={pages} color="bg-amber-500" />
        </Card>
      </div>

      <Card>
        <SectionLabel right={done.length > 0 ? <span className="text-xs font-black text-zinc-500">Peak: {fmtHour(peakHour)}</span> : undefined}>Busiest hours</SectionLabel>
        <div className="flex items-end gap-1 h-32">
          {byHour.map((c, h) => (
            <div key={h} className="flex-1 flex flex-col items-center justify-end">
              <div className={`w-full rounded-t ${c === maxHour && c > 0 ? 'bg-zinc-900' : 'bg-zinc-200'} hover:bg-zinc-700 transition-all`}
                style={{ height: `${(c / maxHour) * 100}%`, minHeight: c > 0 ? 4 : 0 }} title={`${fmtHour(h)}: ${c}`} />
              {h % 6 === 0 && <span className="text-[8px] text-zinc-400 mt-1 font-bold">{fmtHour(h)}</span>}
            </div>
          ))}
        </div>
      </Card>

      {loading && <p className="text-center text-zinc-400 font-bold text-sm">Loading…</p>}
      {!loading && !inPeriod.length && <p className="text-center text-zinc-400 font-bold text-sm py-8">No orders in this period yet.</p>}
    </div>
  )
}

function Metric({ label, value, icon, big }: { label: string; value: any; icon: string; big?: boolean }) {
  return (
    <Card pad="p-6">
      <div className="text-xl mb-2">{icon}</div>
      <div className={`font-black text-zinc-900 tracking-tight ${big ? 'text-4xl' : 'text-3xl'}`}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{label}</div>
    </Card>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs font-black text-zinc-600 mb-2"><span>{label}</span><span>{value} · {pct}%</span></div>
      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function fmtHour(h: number) {
  const ampm = h < 12 ? 'am' : 'pm'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}${ampm}`
}
