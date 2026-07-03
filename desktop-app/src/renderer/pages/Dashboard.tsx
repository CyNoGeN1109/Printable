import { useState, useEffect, useRef } from 'react'
import OrderCard from '../components/OrderCard'
import { useOrders } from '../lib/useOrders'
import type { QueueStatus, AppConfig, PrinterHealth } from '../types'

const STAGE_LABEL: Record<string, string> = {
  idle: 'Idle',
  fetching: 'Fetching order',
  downloading: 'Downloading file',
  printing: 'Printing',
  completing: 'Finishing up',
  paused: 'Paused',
}

export default function Dashboard({ queueStatus, config, health, online }: {
  queueStatus?: QueueStatus
  config?: AppConfig | null
  health?: PrinterHealth[]
  online?: boolean
}) {
  const { orders, isLoading } = useOrders()
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    window.api.getHistory().then(h => setHistoryCount(h.length))
  }, [])

  const healthList     = health || []
  const healthProblems = healthList.filter((p) => !p.ok && p.status !== 'unknown')
  const okPrinters     = healthList.filter((p) => p.ok).length
  const supplyLow      = healthList.some((p) => ['paper_out', 'paper_low', 'toner_out', 'toner_low'].includes(p.status))
  const activeStaff    = config?.staff?.find((s) => s.id === config?.activeStaffId)

  // Cash orders need manual authorization — primary action on the dashboard
  const cashOrders    = orders.filter((o) => o.status === 'pending_payment' && o.paymentMode === 'offline')
  const printingOrders = orders.filter((o) => o.status === 'printing')
  const todayRevenue   = orders
    .filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalAmount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-9 h-9 rounded-full border-2 border-zinc-200 border-t-[#0C831F] animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-slide-up relative z-10 space-y-8">

      {/* ── Status strip ── */}
      <div className="flex flex-wrap gap-2.5">
        <StatusChip ok={online !== false} label={online === false ? 'Server offline' : 'Server online'} icon={online === false ? '📡' : '🟢'} />
        <StatusChip
          ok={healthProblems.length === 0}
          neutral={healthList.length === 0}
          label={
            healthList.length === 0 ? 'Checking printers…'
            : healthProblems.length > 0 ? `${healthProblems.length} printer issue${healthProblems.length !== 1 ? 's' : ''}`
            : `${okPrinters} printer${okPrinters !== 1 ? 's' : ''} ready`
          }
          icon="🖨️"
        />
        {healthList.length > 0 && (
          <StatusChip ok={!supplyLow} label={supplyLow ? 'Supplies low' : 'Supplies OK'} icon="🩸" />
        )}
        <StatusChip
          ok={!!activeStaff}
          neutral={!activeStaff}
          label={activeStaff ? `${activeStaff.name} on shift` : 'No shift'}
          icon="👤"
        />
      </div>

      {/* ── Cash Orders — primary action ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Cash Orders</h3>
            {cashOrders.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {cashOrders.length} need{cashOrders.length === 1 ? 's' : ''} action
              </span>
            )}
          </div>
        </div>

        {cashOrders.length === 0 ? (
          <div className="glass-card rounded-[1.75rem] p-8 flex items-center gap-5">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-xl float-glow shrink-0">💵</div>
            <div>
              <h3 className="text-base font-black text-zinc-800">No cash orders pending</h3>
              <p className="text-sm text-zinc-400 font-medium mt-0.5">New walk-in orders will appear here for authorization</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {cashOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Active Prints"   value={printingOrders.length} icon="🖨️" tint="tint-emerald" live={printingOrders.length > 0} />
        <StatCard title="Completed"       value={historyCount}          icon="✅" tint="tint-indigo" />
        <StatCard title="Revenue Today"   value={todayRevenue}          icon="₹"  tint="tint-rose"   prefix="₹" />
        <StatCard title="Queue Depth"     value={queueStatus ? queueStatus.pending + (queueStatus.isProcessing ? 1 : 0) : 0} icon="📋" tint="tint-amber" />
      </div>

      {/* ── Live monitoring ── */}
      {printingOrders.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Monitoring</h3>
            <span className="bg-[#0C831F]/10 text-[#0C831F] text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0C831F] pulse-dot" /> Live
            </span>
          </div>
          <div className="glass-card rounded-[1.75rem] overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
                {printingOrders.map(order => {
                  const isCurrent = queueStatus?.currentOrderId === order.orderId
                  const pct       = isCurrent ? Math.max(6, queueStatus!.progress.percent) : 50
                  const stage     = isCurrent ? (STAGE_LABEL[queueStatus!.progress.stage] ?? 'Working') : 'In pipeline'
                  return (
                    <div key={order._id} className="bg-white/80 p-4 rounded-2xl border border-black/[0.04] shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="icon-chip text-lg">🖨️</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
                            #{order.orderId}
                          </p>
                          <p className="text-sm font-black text-zinc-800 truncate">
                            {order.userName || 'Walk-in'}
                          </p>
                        </div>
                        <span className="text-sm font-black text-[#0C831F] tabular-nums shrink-0">{pct}%</span>
                      </div>
                      <div className="progress-track h-1.5">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{stage}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const start = ref.current
    const startTime = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(start + (target - start) * eased)
      setVal(next)
      if (t < 1) raf = requestAnimationFrame(tick)
      else ref.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function StatCard({ title, value, icon, tint, prefix = '', sub, live }: {
  title: string; value: number; icon: string; tint: string; prefix?: string; sub?: string; live?: boolean
}) {
  const count = useCountUp(value)
  return (
    <div className={`stat-card ${tint}`}>
      <div className="flex items-start justify-between w-full relative z-10">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] leading-tight max-w-[7rem]">{title}</span>
        <div className="icon-chip">{icon}</div>
      </div>
      <div className="relative z-10">
        <h3 className="text-[2.6rem] leading-none font-black text-zinc-800 tracking-tight tabular-nums">
          {prefix}{count}
        </h3>
        {sub  && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{sub}</p>}
        {live && <p className="text-[10px] font-bold text-[#0C831F] uppercase tracking-widest mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#0C831F] pulse-dot" /> running now</p>}
      </div>
    </div>
  )
}

function StatusChip({ ok, neutral, label, icon }: { ok: boolean; neutral?: boolean; label: string; icon: string }) {
  const tone = neutral
    ? 'bg-white/70 border-black/[0.05] text-zinc-500'
    : ok
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-red-50 border-red-200 text-red-700'
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-2 text-[11px] font-black ${tone}`}>
      <span className="text-sm leading-none">{icon}</span>
      <span>{label}</span>
    </div>
  )
}
