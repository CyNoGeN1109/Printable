import { useOrders } from '../lib/useOrders'
import OrderCard from '../components/OrderCard'
import { useEffect, useState, useRef } from 'react'
import type { QueueStatus, PrintStage } from '../types'

interface Props {
  queueStatus: QueueStatus
}

const STAGE_LABEL: Record<PrintStage, string> = {
  idle:        'System Ready',
  fetching:    'Fetching Order Details...',
  downloading: 'Downloading Documents...',
  printing:    'Physical Printing in Progress...',
  completing:  'Finalizing Session...',
  paused:      'Queue Paused',
}

export default function PrintQueue({ queueStatus }: Props) {
  const { orders, isLoading } = useOrders()
  const { progress } = queueStatus
  const [displayPercent, setDisplayPercent] = useState(progress.percent)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    if (progress.stage === 'printing' && progress.stageStartedAt > 0) {
      const FROM = 65
      const TO   = 95
      const durationMs = Math.max(5000, progress.totalPages * 3000)

      function tick() {
        const elapsed = Date.now() - progress.stageStartedAt
        const t = Math.min(elapsed / durationMs, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        const pct = FROM + (TO - FROM) * eased
        setDisplayPercent(Math.round(pct))

        if (t < 1) animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      setDisplayPercent(progress.percent)
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [progress])

  const currentOrder = queueStatus.currentOrderId
    ? orders.find(o => o.orderId === queueStatus.currentOrderId)
    : null

  const queuedOrders = queueStatus.queue
    .map(id => orders.find(o => o.orderId === id))
    .filter(Boolean)

  if (isLoading) return <div className="p-10 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Syncing execution pipeline...</div>

  return (
    <div className="animate-slide-up max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Execution Pipeline</h2>
          <p className="text-sm font-black text-zinc-800 uppercase tracking-widest">Real-time job orchestration</p>
        </div>
        
        <div className="flex gap-4">
          {queueStatus.isPaused ? (
            <button onClick={() => window.api.resumeQueue()} className="btn-secondary text-green-600 border-green-200">▶ Resume</button>
          ) : (
            <button onClick={() => window.api.pauseQueue()} className="btn-secondary text-amber-600 border-amber-200">⏸ Pause</button>
          )}
          {queueStatus.isProcessing && (
            <button onClick={() => window.api.cancelCurrentJob()} className="btn-secondary text-red-600 border-red-200">✕ Stop Job</button>
          )}
        </div>
      </div>

      {!queueStatus.isProcessing && !queueStatus.isPaused && queuedOrders.length === 0 ? (
        <div className="bg-white/50 border border-black/[0.03] rounded-[2rem] p-24 flex flex-col items-center justify-center text-center shadow-inner">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 text-2xl text-zinc-300">📦</div>
          <h3 className="text-xl font-black text-zinc-800">Pipeline Idle</h3>
          <p className="text-sm text-zinc-400 mt-1 font-medium">Waiting for incoming print instructions.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Active Job */}
          {(queueStatus.isProcessing || queueStatus.isPaused) && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Current Operation</h3>
              </div>
              
              <div className="bg-white border border-black/[0.05] rounded-[2rem] p-10 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-100">
                  <div 
                    className="h-full bg-zinc-800 transition-all duration-700 ease-out"
                    style={{ width: `${displayPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-end mb-10 pt-4">
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-black tracking-[0.2em] mb-2">Pipeline State</p>
                    <h4 className="text-xl font-black text-zinc-800 tracking-tight">{STAGE_LABEL[progress.stage]}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-zinc-900 tracking-tighter">{displayPercent}%</p>
                  </div>
                </div>

                {currentOrder ? (
                  <OrderCard order={currentOrder} isQueue />
                ) : (
                  <div className="p-20 text-center text-zinc-300 text-xs font-black uppercase tracking-[0.3em]">
                    Initializing...
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Pending Stack */}
          {queuedOrders.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Pending Stack ({queuedOrders.length})</h3>
              </div>
              
              <div className="space-y-4">
                {queuedOrders.map((order) => (
                  <OrderCard key={order!._id} order={order!} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
