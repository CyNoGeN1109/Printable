import { useState, useEffect, useRef } from 'react'
import { useOrders } from '../lib/useOrders'
import OrderCard from '../components/OrderCard'
import type { QueueStatus, PrintStage, Order } from '../types'

type Tab = 'queue' | 'completed'

interface Props {
  queueStatus: QueueStatus
}

export default function Orders({ queueStatus }: Props) {
  const [tab, setTab] = useState<Tab>('queue')
  const queueCount = queueStatus.pending + (queueStatus.isProcessing ? 1 : 0)

  return (
    <div className="animate-slide-up">
      <div className="flex gap-1 bg-zinc-100/80 rounded-2xl p-1 mb-8 w-fit">
        <TabBtn active={tab === 'queue'} onClick={() => setTab('queue')}>
          Queue{queueCount > 0 ? ` (${queueCount})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'completed'} onClick={() => setTab('completed')}>
          Completed
        </TabBtn>
      </div>

      {tab === 'queue' && <QueueTab queueStatus={queueStatus} />}
      {tab === 'completed' && <CompletedTab />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${
        active ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {children}
    </button>
  )
}

// ── Queue tab ──────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<PrintStage, string> = {
  idle:        'System Ready',
  fetching:    'Fetching Order',
  downloading: 'Downloading Documents',
  printing:    'Physical Printing in Progress',
  completing:  'Finalizing',
  paused:      'Queue Paused',
}

function QueueTab({ queueStatus }: { queueStatus: QueueStatus }) {
  const { orders, isLoading, error } = useOrders()
  const { progress } = queueStatus
  const [displayPercent, setDisplayPercent] = useState(progress.percent)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    if (progress.stage === 'printing' && progress.stageStartedAt > 0) {
      const FROM = 65, TO = 95
      const durationMs = Math.max(5000, progress.totalPages * 3000)
      function tick() {
        const elapsed = Date.now() - progress.stageStartedAt
        const t = Math.min(elapsed / durationMs, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplayPercent(Math.round(FROM + (TO - FROM) * eased))
        if (t < 1) animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      setDisplayPercent(progress.percent)
    }

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [progress])

  const currentOrder = queueStatus.currentOrderId
    ? orders.find(o => o.orderId === queueStatus.currentOrderId)
    : null

  const queuedOrders = queueStatus.queue
    .map(id => orders.find(o => o.orderId === id))
    .filter(Boolean) as Order[]

  if (isLoading) {
    return <div className="text-zinc-400 text-xs font-black uppercase tracking-widest py-10">Syncing pipeline…</div>
  }

  if (error && orders.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 flex items-center gap-4">
        <span className="text-lg">📡</span>
        <div>
          <p className="text-sm font-black text-red-700">Can't reach the server</p>
          <p className="text-xs text-red-500 font-medium mt-0.5">Retrying automatically — jobs already queued will keep printing</p>
        </div>
      </div>
    )
  }

  const isEmpty = !queueStatus.isProcessing && !queueStatus.isPaused && queuedOrders.length === 0

  if (isEmpty) {
    return (
      <div className="bg-white/50 border border-black/[0.03] rounded-[2rem] p-20 flex flex-col items-center justify-center text-center shadow-inner">
        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5 text-2xl text-zinc-300">📦</div>
        <h3 className="text-lg font-black text-zinc-800">Queue is idle</h3>
        <p className="text-sm text-zinc-400 mt-1 font-medium">New orders appear here automatically.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Controls */}
      <div className="flex gap-3 justify-end">
        {queueStatus.isPaused ? (
          <button onClick={() => window.api.resumeQueue()} className="btn-secondary text-green-600 border-green-200">
            ▶ Resume
          </button>
        ) : (
          <button onClick={() => window.api.pauseQueue()} className="btn-secondary text-amber-600 border-amber-200">
            ⏸ Pause
          </button>
        )}
        {queueStatus.isProcessing && (
          <button onClick={() => window.api.cancelCurrentJob()} className="btn-secondary text-red-600 border-red-200">
            ✕ Stop Job
          </button>
        )}
      </div>

      {/* Current job */}
      {(queueStatus.isProcessing || queueStatus.isPaused) && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">Currently printing</p>
          <div className="bg-white border border-black/[0.05] rounded-[2rem] p-8 relative overflow-hidden shadow-lg">
            {/* Green progress strip at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100">
              <div
                className="h-full bg-[#0C831F] transition-all duration-700 ease-out"
                style={{ width: `${displayPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center mb-6 pt-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Stage</p>
                <h4 className="text-lg font-black text-zinc-800">{STAGE_LABEL[progress.stage]}</h4>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-zinc-900 tabular-nums">{displayPercent}%</p>
                {progress.totalPages > 0 && (
                  <p className="text-[10px] text-zinc-400 font-bold mt-1">
                    {progress.totalPages}p · {progress.totalCopies} copies
                  </p>
                )}
              </div>
            </div>

            {currentOrder && <OrderCard order={currentOrder} isQueue />}
          </div>
        </section>
      )}

      {/* Pending stack */}
      {queuedOrders.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">
            Up next · {queuedOrders.length} job{queuedOrders.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {queuedOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Completed tab ──────────────────────────────────────────────────────────

function CompletedTab() {
  const [history, setHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    window.api.getHistory().then(h => {
      setHistory(h)
      setIsLoading(false)
    })
  }, [])

  const handleClear = async () => {
    if (!confirm('Permanently clear all local history?')) return
    setClearing(true)
    await window.api.clearHistory()
    setHistory([])
    setClearing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
      </div>
    )
  }

  const filtered = history.filter(o => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      o.orderId.toLowerCase().includes(q) ||
      (o.userName || '').toLowerCase().includes(q) ||
      o.files.some(f => f.fileName.toLowerCase().includes(q))
    )
  })

  // Group by day
  const groups = filtered.reduce<Record<string, Order[]>>((acc, order) => {
    const d = new Date(order.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    if (!acc[label]) acc[label] = []
    acc[label].push(order)
    return acc
  }, {})

  return (
    <div className="max-w-4xl">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-7">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, order ID, or file…"
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0"
          >
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>

      {/* States */}
      {history.length === 0 ? (
        <div className="bg-white/50 border border-black/[0.03] rounded-[2rem] p-20 text-center shadow-inner">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl">📁</div>
          <h3 className="text-lg font-black text-zinc-800">No history yet</h3>
          <p className="text-sm text-zinc-400 mt-1 font-medium">Completed orders will appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 font-bold text-sm">No results for "{search}"</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([label, orders]) => (
            <section key={label}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
                {label} · {orders.length} job{orders.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {orders.map((order, idx) => (
                  <OrderCard key={idx} order={order} isHistory />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
