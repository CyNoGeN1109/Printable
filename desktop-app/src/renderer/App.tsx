import { useState, useEffect, useRef, useCallback } from 'react'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Hardware from './pages/Hardware'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import ConfirmModal from './components/ConfirmModal'
import { playChime } from './lib/alerts'
import type { ToastEvent } from './lib/toast'
import type { Order, QueueStatus, AppConfig, PrinterHealth } from './types'

type Page = 'dashboard' | 'orders' | 'hardware' | 'stats' | 'settings'

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Overview',
  orders: 'Orders',
  hardware: 'Hardware',
  stats: 'Reports',
  settings: 'Settings',
}

const SUPPLY_STATUSES = ['paper_out', 'paper_low', 'toner_out', 'toner_low']

const NOW_PRINTING_STAGES: Record<string, string> = {
  idle: 'Ready',
  fetching: 'Fetching order',
  downloading: 'Downloading file',
  printing: 'Sending to printer',
  completing: 'Finishing up',
  paused: 'Paused',
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  // Queue of cash orders awaiting confirmation — handles multiple simultaneous arrivals
  const [confirmQueue, setConfirmQueue] = useState<Order[]>([])
  const pendingConfirmOrder = confirmQueue[0] ?? null
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [printers, setPrinters] = useState<any[]>([])
  const [health, setHealth] = useState<PrinterHealth[]>([])
  const [online, setOnline] = useState(true)
  const [skipOnboard, setSkipOnboard] = useState(false)
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    isProcessing: false,
    isPaused: false,
    queue: [],
    progress: { stage: 'idle', percent: 0, stageStartedAt: 0, totalPages: 0, totalCopies: 0 }
  })
  const [printerError, setPrinterError] = useState<{ orderId: string; message: string } | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; kind: ToastEvent['kind'] }>>([])
  const toastIdRef = useRef(0)

  const addToast = useCallback((message: string, kind: ToastEvent['kind']) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, kind }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, kind } = (e as CustomEvent<ToastEvent>).detail
      addToast(message, kind)
    }
    window.addEventListener('app:toast', handler)
    return () => window.removeEventListener('app:toast', handler)
  }, [addToast])

  const applyConfig = (patch: Partial<AppConfig>) => {
    setConfig((c) => (c ? { ...c, ...patch } : c))
    window.api.updateConfig(patch)
  }

  useEffect(() => {
    let soundOn = true
    window.api.getConfig().then(cfg => {
      setConfig(cfg)
      soundOn = cfg.soundAlerts !== false
    })
    window.api.getPrinters().then(list => setPrinters(list))
    window.api.getQueueStatus().then(status => setQueueStatus(status))

    window.api.onNewOrder((order: Order) => {
      if (soundOn) playChime()
      if (order.paymentMode === 'online' && order.status === 'paid') {
        window.api.queueOnlineOrder(order.orderId)
      } else if (order.paymentMode === 'offline') {
        setConfirmQueue(q => [...q, order])
      }
    })

    let prevProcessing = false
    window.api.onQueueUpdate((status) => {
      // Detect job completion: was processing → now idle
      if (prevProcessing && !status.isProcessing && status.progress.stage === 'idle') {
        addToast('Print job completed ✓', 'success')
      }
      prevProcessing = status.isProcessing
      setQueueStatus(status)
    })
    window.api.onPrinterError((data) => setPrinterError(data))

    const pollHealth = () => window.api.getPrinterHealth().then(setHealth).catch(() => {})
    pollHealth()
    const healthTimer = setInterval(pollHealth, 12000)

    const pollOnline = () => window.api.pingBackend().then((r) => setOnline(r.online)).catch(() => setOnline(false))
    pollOnline()
    const onlineTimer = setInterval(pollOnline, 10000)

    return () => {
      window.api.removeNewOrderListener()
      window.api.removeQueueUpdateListener()
      window.api.removePrinterErrorListener()
      clearInterval(healthTimer)
      clearInterval(onlineTimer)
    }
  }, [])

  const healthProblems = health.filter((p) => !p.ok && p.status !== 'unknown')
  const lowStock = health.some((p) => SUPPLY_STATUSES.includes(p.status))
  const hardwareAlerts = healthProblems.length + (lowStock ? 1 : 0)

  const handleToggleSystem = async () => {
    if (!config) return
    const newEnabled = !config.systemEnabled
    await window.api.toggleSystem(newEnabled)
    setConfig({ ...config, systemEnabled: newEnabled })
  }

  const handleRetry = async () => {
    setPrinterError(null)
    await window.api.retryQueue()
  }

  if (config && !config.apiKey && !skipOnboard) {
    return (
      <Onboarding
        onDone={(name, key) => applyConfig({ shopName: name, apiKey: key })}
        onSkip={() => setSkipOnboard(true)}
      />
    )
  }

  // Only show the bar when a job is actually in progress (or was paused mid-job)
  const isActivePrint = queueStatus.isProcessing || (queueStatus.isPaused && !!queueStatus.currentOrderId)

  return (
    <div className="flex h-screen text-zinc-900 font-sans select-none overflow-hidden relative">
      <div className="app-bg" />

      {/* Sidebar */}
      <aside className="w-72 sidebar flex flex-col relative z-50">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3f3f46] rounded-xl flex items-center justify-center shadow-lg shadow-black/10 overflow-hidden">
              <img src="./logo.jpeg" alt="P" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight tracking-tight text-zinc-900">Printable</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">{config?.shopName || 'Vendor OS'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-6">
          <div>
            <p className="px-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Operations</p>
            <div className="space-y-1">
              <NavItem
                active={currentPage === 'dashboard'}
                icon="🏠"
                label="Overview"
                onClick={() => setCurrentPage('dashboard')}
              />
              <NavItem
                active={currentPage === 'orders'}
                icon="📄"
                label="Orders"
                count={queueStatus.pending + (queueStatus.isProcessing ? 1 : 0)}
                onClick={() => setCurrentPage('orders')}
              />
              <NavItem
                active={currentPage === 'hardware'}
                icon="🖨️"
                label="Hardware"
                count={hardwareAlerts}
                alert={hardwareAlerts > 0}
                onClick={() => setCurrentPage('hardware')}
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Business</p>
            <div className="space-y-1">
              <NavItem active={currentPage === 'stats'} icon="📊" label="Reports" onClick={() => setCurrentPage('stats')} />
              <NavItem active={currentPage === 'settings'} icon="⚙️" label="Settings" onClick={() => setCurrentPage('settings')} />
            </div>
          </div>
        </nav>

        <div className="p-6 mt-auto border-t border-black/5 bg-black/[0.02]">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config?.systemEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs font-bold text-zinc-500">System {config?.systemEnabled ? 'online' : 'offline'}</span>
            </div>
            <div
              onClick={handleToggleSystem}
              className={`w-12 h-6 rounded-full transition-all duration-300 cursor-pointer relative ${config?.systemEnabled ? 'bg-zinc-700' : 'bg-zinc-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${config?.systemEnabled ? 'left-7' : 'left-1'}`} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 z-40 shrink-0">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{PAGE_TITLES[currentPage]}</h2>
          <div
            onClick={() => setCurrentPage('hardware')}
            className="w-10 h-10 rounded-2xl bg-white border border-black/5 flex items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all shadow-sm"
          >
            <span className="relative">
              🔔
              {hardwareAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </span>
          </div>
        </header>

        {/* Offline banner */}
        {!online && (
          <div className="mx-10 mb-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3 shrink-0">
            <span className="text-lg">📡</span>
            <span className="text-xs font-black text-amber-700">
              Offline — can't reach the server. Jobs in queue keep printing; new orders sync when connection returns.
            </span>
          </div>
        )}

        {/* Hardware alert banner */}
        {healthProblems.length > 0 && currentPage !== 'hardware' && (
          <div
            onClick={() => setCurrentPage('hardware')}
            className="mx-10 mb-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-all shrink-0"
          >
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-black text-red-700">
              {healthProblems.map((p) => `${p.name}: ${p.message}`).join('  ·  ')}
            </span>
            <span className="ml-auto text-[10px] font-black uppercase text-red-500 shrink-0">View hardware →</span>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar animate-slide-up">
          {currentPage === 'dashboard' && (
            <Dashboard queueStatus={queueStatus} config={config} health={health} online={online} />
          )}
          {currentPage === 'orders' && <Orders queueStatus={queueStatus} />}
          {currentPage === 'hardware' && <Hardware config={config} onConfig={applyConfig} />}
          {currentPage === 'stats' && <Reports />}
          {currentPage === 'settings' && <Settings config={config} printers={printers} onConfig={applyConfig} />}
        </div>

        {/* Now-Printing bar — always visible when a job is running */}
        {isActivePrint && (
          <NowPrintingBar
            queueStatus={queueStatus}
            onViewOrders={() => setCurrentPage('orders')}
          />
        )}

        {/* Printer error toast */}
        {printerError && (
          <div className="absolute bottom-20 right-10 bg-zinc-900 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-5 border border-white/10 animate-slide-up z-50">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">⚠️</div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-widest mb-0.5">Print Error</h4>
              <p className="text-[11px] font-medium opacity-70">{printerError.message}</p>
            </div>
            <button
              onClick={handleRetry}
              className="bg-white text-black text-[10px] font-black uppercase px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all"
            >
              Resolve
            </button>
          </div>
        )}
      </main>

      {pendingConfirmOrder && (
        <ConfirmModal
          order={pendingConfirmOrder}
          onConfirm={async () => {
            const result = await window.api.confirmCashPayment(pendingConfirmOrder.orderId)
            if (result?.error) {
              addToast(`Payment confirmation failed: ${result.error}`, 'error')
            } else {
              addToast('Cash payment confirmed — order queued for printing', 'success')
            }
            setConfirmQueue(q => q.slice(1))
          }}
          onDismiss={() => setConfirmQueue(q => q.slice(1))}
        />
      )}

      {/* In-app toast stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[200] pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`px-5 py-3 rounded-2xl text-sm font-black shadow-xl border animate-slide-up ${
                t.kind === 'success' ? 'bg-[#0C831F] text-white border-[#0C831F]/20'
                : t.kind === 'error'   ? 'bg-red-600 text-white border-red-700/20'
                : 'bg-zinc-900 text-white border-white/10'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NavItem({ active, icon, label, count, alert, onClick }: {
  active: boolean; icon: string; label: string; count?: number; alert?: boolean; onClick: () => void
}) {
  return (
    <div onClick={onClick} className={`sidebar-item ${active ? 'active' : ''}`}>
      <span className="text-lg opacity-80">{icon}</span>
      <span className="flex-1">{label}</span>
      {(count ?? 0) > 0 && (
        <span className={`${alert ? 'bg-red-500 text-white' : active ? 'bg-white/20' : 'bg-zinc-200'} text-[10px] font-black px-2 py-0.5 rounded-md`}>
          {count}
        </span>
      )}
    </div>
  )
}

function NowPrintingBar({ queueStatus, onViewOrders }: {
  queueStatus: QueueStatus
  onViewOrders: () => void
}) {
  const { isPaused, currentOrderId, progress } = queueStatus

  // Animate 65→95% during the physical printing stage (mirrors Orders/QueueTab logic)
  const [displayPct, setDisplayPct] = useState(progress.percent)
  const animRef = useRef<number | null>(null)
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (progress.stage === 'printing' && progress.stageStartedAt > 0) {
      const FROM = 65, TO = 95
      const dur = Math.max(5000, progress.totalPages * 3000)
      const tick = () => {
        const t = Math.min((Date.now() - progress.stageStartedAt) / dur, 1)
        setDisplayPct(Math.round(FROM + (TO - FROM) * (1 - Math.pow(1 - t, 3))))
        if (t < 1) animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    } else {
      setDisplayPct(progress.percent)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [progress])

  return (
    <div className="h-14 shrink-0 border-t border-black/[0.06] bg-white/90 backdrop-blur-xl flex items-center px-8 gap-5 z-40">
      {/* Left: status label */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isPaused ? 'bg-amber-400' : 'bg-[#0C831F] pulse-dot'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 shrink-0">
          {isPaused ? 'Paused' : 'Now Printing'}
        </span>
        {currentOrderId && (
          <span className="text-[10px] font-mono bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md shrink-0">
            #{currentOrderId}
          </span>
        )}
        <span className="text-xs font-semibold text-zinc-600 truncate">
          {NOW_PRINTING_STAGES[progress.stage] ?? 'Working'}
        </span>
      </div>

      {/* Center: progress */}
      <div className="flex items-center gap-3 w-52 shrink-0">
        <div className="progress-track h-1.5 flex-1">
          <div className="progress-fill" style={{ width: `${Math.max(4, displayPct)}%` }} />
        </div>
        <span className="text-sm font-black text-zinc-800 tabular-nums w-9 text-right shrink-0">
          {displayPct}%
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isPaused ? (
          <button
            onClick={() => window.api.resumeQueue()}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-[#0C831F] text-white hover:opacity-90 transition-opacity"
          >
            ▶ Resume
          </button>
        ) : (
          <button
            onClick={() => window.api.pauseQueue()}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200 transition-colors"
          >
            ⏸ Pause
          </button>
        )}
        <button
          onClick={onViewOrders}
          className="text-[10px] font-black text-zinc-400 hover:text-zinc-700 px-2 transition-colors"
        >
          Details →
        </button>
      </div>
    </div>
  )
}
