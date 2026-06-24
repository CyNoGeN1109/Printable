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
  queueStatus?: QueueStatus; config?: AppConfig | null; health?: PrinterHealth[]; online?: boolean
}) {
  const { orders, isLoading } = useOrders()
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    window.api.getHistory().then(h => setHistoryCount(h.length))
  }, [])

  // System status chips (command-center view)
  const healthProblems = (health || []).filter((p) => !p.ok && p.status !== 'unknown')
  const okPrinters = (health || []).filter((p) => p.ok).length
  const inv = config?.inventory
  const paper = inv?.paperSheets
  const lowPaper = typeof paper === 'number' && paper <= (inv?.lowPaperThreshold ?? 0)
  const activeStaff = config?.staff?.find((s) => s.id === config?.activeStaffId)

  const pendingOrders = orders.filter((o) => o.status === 'pending_payment')
  const printingOrders = orders.filter((o) => o.status === 'printing')
  const todayRevenue = orders
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
    <div className="animate-slide-up relative z-10">
      {/* System status strip — the whole shop at a glance */}
      <div className="flex flex-wrap gap-2.5 mb-7">
        <StatusChip ok={online !== false} label={online === false ? 'Server offline' : 'Server online'} icon={online === false ? '📡' : '🟢'} />
        <StatusChip
          ok={healthProblems.length === 0}
          label={healthProblems.length === 0 ? `${okPrinters || 'No'} printer${okPrinters !== 1 ? 's' : ''} ready` : `${healthProblems.length} printer issue${healthProblems.length !== 1 ? 's' : ''}`}
          icon="🖨️"
        />
        {typeof paper === 'number' && (
          <StatusChip ok={!lowPaper} label={`${paper.toLocaleString()} sheets`} icon="📄" />
        )}
        <StatusChip ok={!!activeStaff} neutral={!activeStaff} label={activeStaff ? `${activeStaff.name} on shift` : 'No shift'} icon="👤" />
      </div>

      {/* Bento stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-9 stagger">
        <StatCard title="Active Prints"   value={printingOrders.length} icon="🖨️" tint="tint-emerald" live={printingOrders.length > 0} />
        <StatCard title="Payment Pending" value={pendingOrders.length}  icon="💳" tint="tint-amber"   sub={pendingOrders.length ? 'needs action' : 'all clear'} />
        <StatCard title="Completed"       value={historyCount}          icon="✅" tint="tint-indigo" />
        <StatCard title="Revenue Today"   value={todayRevenue}          icon="₹"  tint="tint-rose"   prefix="₹" />
      </div>

      <div className="space-y-9">
        {/* Priority queue */}
        <section>
          <SectionHead label="Priority Queue" rightLabel={`${pendingOrders.length} waiting`} />
          <div className="glass-card rounded-[1.75rem] p-8 min-h-[280px] flex flex-col">
            {pendingOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="icon-chip w-16 h-16 text-2xl mb-5 float-glow">📋</div>
                <h3 className="text-xl font-black text-zinc-800">Queue is clear</h3>
                <p className="text-sm text-zinc-400 mt-1 font-medium">New orders appear here automatically</p>
              </div>
            ) : (
              <div className="w-full space-y-3 stagger">
                {pendingOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Live monitoring */}
        <section>
          <SectionHead label="Live Monitoring" live />
          <div className="glass-card rounded-[1.75rem] overflow-hidden">
            <div className="px-7 py-4 border-b border-black/[0.04] flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#0C831F] rounded-full pulse-dot" />
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Active jobs feed</span>
              {queueStatus?.isPaused && (
                <span className="ml-auto status-badge bg-amber-100 text-amber-700">Paused</span>
              )}
            </div>

            <div className="p-7">
              {printingOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
                  {printingOrders.map(order => {
                    const isCurrent = queueStatus?.currentOrderId === order.orderId
                    const pct = isCurrent ? Math.max(6, queueStatus!.progress.percent) : 50
                    const stage = isCurrent ? (STAGE_LABEL[queueStatus!.progress.stage] ?? 'Working') : 'In pipeline'
                    return (
                      <div key={order._id} className="bg-white/80 p-5 rounded-2xl border border-black/[0.04] shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="icon-chip text-xl">🖨️</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">#{order.orderId}</p>
                            <p className="text-sm font-black text-zinc-800 truncate">{order.files[0]?.fileName}</p>
                          </div>
                          <span className="text-sm font-black text-[#0C831F] tabular-nums">{pct}%</span>
                        </div>
                        <div className="progress-track h-2 mt-4">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{stage}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-300">No active jobs</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ── Animated count-up number ─────────────────────────────────────────── */
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

function StatCard({ title, value, icon, tint, prefix = '', sub, live }: any) {
  const count = useCountUp(typeof value === 'number' ? value : 0)
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
        {sub && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{sub}</p>}
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

function SectionHead({ label, rightLabel, live }: { label: string; rightLabel?: string; live?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</h3>
      {rightLabel && (
        <span className="bg-white/70 border border-black/[0.04] text-zinc-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">{rightLabel}</span>
      )}
      {live && (
        <span className="bg-[#0C831F]/10 text-[#0C831F] text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0C831F] pulse-dot" /> Live
        </span>
      )}
    </div>
  )
}
