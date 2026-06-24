import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Reports from './pages/Reports'
import PrintQueue from './pages/PrintQueue'
import Printers from './pages/Printers'
import Inventory from './pages/Inventory'
import Staff from './pages/Staff'
import Tokens from './pages/Tokens'
import ConfirmModal from './components/ConfirmModal'
import { playChime } from './lib/alerts'
import type { Order, QueueStatus, AppConfig, PrinterHealth } from './types'

type Page = 'dashboard' | 'queue' | 'printers' | 'tokens' | 'history' | 'stats' | 'settings' | 'inventory' | 'staff'

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Overview', queue: 'Print Queue', printers: 'Printers', tokens: 'Walk-in Tokens',
  history: 'History', stats: 'Reports', settings: 'Settings',
  inventory: 'Inventory', staff: 'Staff & Shifts',
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [pendingConfirmOrder, setPendingConfirmOrder] = useState<Order | null>(null)

  const [config, setConfig] = useState<AppConfig | null>(null)
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [health, setHealth] = useState<PrinterHealth[]>([])
  const [online, setOnline] = useState(true)
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    isProcessing: false,
    isPaused: false,
    queue: [],
    progress: { stage: 'idle', percent: 0, stageStartedAt: 0, totalPages: 0, totalCopies: 0 }
  })
  const [printerError, setPrinterError] = useState<{ orderId: string; message: string } | null>(null)

  // persist a config change to the main process and update local state
  const applyConfig = (patch: Partial<AppConfig>) => {
    setConfig((c) => (c ? { ...c, ...patch } : c))
    window.api.updateConfig(patch)
  }

  useEffect(() => {
    // Load initial data
    let soundOn = true
    window.api.getConfig().then(cfg => {
      setConfig(cfg)
      soundOn = cfg.soundAlerts !== false
    })
    window.api.getPrinters().then(list => {
      setPrinters(list)
    })
    window.api.getSelectedPrinter().then(name => {
      if (name) setSelectedPrinter(name)
    })
    window.api.getQueueStatus().then(status => {
      setQueueStatus(status)
    })

    window.api.onNewOrder((order: Order) => {
      console.log('[Renderer] New order received:', order.orderId)
      if (soundOn) playChime()                       // 🔔 audible alert
      if (order.paymentMode === 'online' && order.status === 'paid') {
        window.api.queueOnlineOrder(order.orderId)
      }
    })

    window.api.onQueueUpdate((status) => {
      setQueueStatus(status)
    })

    window.api.onPrinterError((data) => {
      setPrinterError(data)
    })

    // Live printer-health poll for the global problem banner
    const pollHealth = () => window.api.getPrinterHealth().then(setHealth).catch(() => {})
    pollHealth()
    const healthTimer = setInterval(pollHealth, 12000)

    // Backend reachability poll (offline indicator)
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
  const inv = config?.inventory
  const lowStock = !!inv && (
    (typeof inv.paperSheets === 'number' && inv.paperSheets <= (inv.lowPaperThreshold ?? 0)) ||
    (typeof inv.tonerPercent === 'number' && inv.tonerPercent <= 20)
  )

  const handleToggleSystem = async () => {
    if (!config) return
    const newEnabled = !config.systemEnabled
    await window.api.toggleSystem(newEnabled)
    setConfig({ ...config, systemEnabled: newEnabled })
  }

  const handlePrinterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    setSelectedPrinter(name)
    setPrinterError(null)
    await window.api.setPrinter(name)
  }

  const handleRetry = async () => {
    setPrinterError(null)
    await window.api.retryQueue()
  }

  return (
    <div className="flex h-screen text-zinc-900 font-sans select-none overflow-hidden relative">
      {/* Ambient gradient-mesh backdrop */}
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
              <NavItem active={currentPage === 'dashboard'} icon="🏠" label="Overview" onClick={() => setCurrentPage('dashboard')} />
              <NavItem active={currentPage === 'queue'} icon="📄" label="Print queue" count={queueStatus.pending + (queueStatus.isProcessing ? 1 : 0)} onClick={() => setCurrentPage('queue')} />
              <NavItem active={currentPage === 'printers'} icon="🖨️" label="Printers" count={healthProblems.length} alert={healthProblems.length > 0} onClick={() => setCurrentPage('printers')} />
              <NavItem active={currentPage === 'tokens'} icon="🎫" label="Walk-in tokens" onClick={() => setCurrentPage('tokens')} />
              <NavItem active={currentPage === 'history'} icon="🕒" label="History" onClick={() => setCurrentPage('history')} />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Shop</p>
            <div className="space-y-1">
              <NavItem active={currentPage === 'inventory'} icon="📦" label="Inventory" alert={lowStock} count={lowStock ? 1 : 0} onClick={() => setCurrentPage('inventory')} />
              <NavItem active={currentPage === 'staff'} icon="👤" label="Staff & shifts" onClick={() => setCurrentPage('staff')} />
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
        <header className="h-24 flex items-center justify-between px-10 z-40">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{PAGE_TITLES[currentPage]}</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white border border-black/5 rounded-2xl px-5 py-2.5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-none mb-1">Printer</span>
                <select 
                  value={selectedPrinter} 
                  onChange={handlePrinterChange}
                  className="bg-transparent text-xs font-black text-zinc-900 border-none focus:ring-0 cursor-pointer p-0 appearance-none pr-4"
                >
                  <option value="">Default</option>
                  {printers.map((p: any) => {
                    const pName = typeof p === 'string' ? p : p.name || p.deviceId || 'Unknown'
                    return <option key={pName} value={pName}>{pName}</option>
                  })}
                </select>
              </div>
              <span className="text-zinc-400 text-xs">▼</span>
            </div>
            
            <div onClick={() => setCurrentPage('printers')} className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all shadow-sm">
              <span className="relative">
                🔔
                {healthProblems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Offline banner — backend unreachable */}
        {!online && (
          <div className="mx-10 mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <span className="text-lg">📡</span>
            <span className="text-xs font-black text-amber-700">
              Offline — can't reach the server. Jobs already in the queue keep printing; new orders will sync automatically when the connection returns.
            </span>
          </div>
        )}

        {/* Global printer-health banner (shows on every page) */}
        {healthProblems.length > 0 && currentPage !== 'printers' && (
          <div onClick={() => setCurrentPage('printers')}
            className="mx-10 mb-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-all">
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-black text-red-700">
              {healthProblems.map((p) => `${p.name}: ${p.message}`).join('  ·  ')}
            </span>
            <span className="ml-auto text-[10px] font-black uppercase text-red-500">View printers →</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar animate-slide-up">
          {currentPage === 'dashboard' && <Dashboard queueStatus={queueStatus} config={config} health={health} online={online} />}
          {currentPage === 'queue' && <PrintQueue queueStatus={queueStatus} />}
          {currentPage === 'printers' && <Printers config={config} onConfig={applyConfig} />}
          {currentPage === 'tokens' && <Tokens config={config} onConfig={applyConfig} />}
          {currentPage === 'inventory' && <Inventory config={config} onConfig={applyConfig} />}
          {currentPage === 'staff' && <Staff config={config} onConfig={applyConfig} />}
          {currentPage === 'history' && <History />}
          {currentPage === 'stats' && <Reports />}
          {currentPage === 'settings' && <Settings config={config} printers={printers} onConfig={applyConfig} />}
        </div>

        {/* Error Notification */}
        {printerError && (
          <div className="absolute bottom-8 right-10 bg-zinc-900 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-5 border border-white/10 animate-slide-up">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">⚠️</div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-widest mb-0.5">Critical Error</h4>
              <p className="text-[11px] font-medium opacity-70">{printerError.message}</p>
            </div>
            <button onClick={handleRetry} className="bg-white text-black text-[10px] font-black uppercase px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all">Resolve</button>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {pendingConfirmOrder && (
        <ConfirmModal
          order={pendingConfirmOrder}
          onConfirm={async () => {
            await window.api.confirmCashPayment(pendingConfirmOrder.orderId)
            setPendingConfirmOrder(null)
          }}
          onDismiss={() => setPendingConfirmOrder(null)}
        />
      )}
    </div>
  )
}

function NavItem({ active, icon, label, count, alert, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`sidebar-item ${active ? 'active' : ''}`}
    >
      <span className="text-lg opacity-80">{icon}</span>
      <span className="flex-1">{label}</span>
      {count > 0 && (
        <span className={`${alert ? 'bg-red-500 text-white' : active ? 'bg-white/20' : 'bg-zinc-200'} text-[10px] font-black px-2 py-0.5 rounded-md`}>
          {count}
        </span>
      )}
    </div>
  )
}

function Settings({ config, printers, onConfig }: any) {
  const [url, setUrl] = useState(config?.backendUrl || '')
  const [bw, setBw] = useState(config?.bwPrinter || '')
  const [colour, setColour] = useState(config?.colourPrinter || '')
  const [key, setKey] = useState(config?.apiKey || '')
  const [shopName, setShopName] = useState(config?.shopName || '')
  const soundOn = config?.soundAlerts !== false
  const startupOn = config?.runOnStartup === true
  const fin = config?.finishing || {}
  const setFin = (k: string, v: string) => onConfig?.({ finishing: { ...fin, [k]: Number(v) || 0 } })

  const printerNames: string[] = (printers || []).map((p: any) =>
    typeof p === 'string' ? p : p.name || p.deviceId || 'Unknown'
  )

  const selectCls = "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm font-black text-zinc-700 focus:border-zinc-500 outline-none cursor-pointer"

  return (
    <div className="max-w-2xl space-y-6">
      {/* Shop identity */}
      <div className="bg-white border border-black/5 p-10 rounded-3xl shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">This Shop</h3>
        <p className="text-xs text-zinc-400 mb-8 font-medium">
          Paste the setup key from when this shop was created. It links this app to your shop so you only ever see your own orders.
        </p>
        <label className="text-[10px] text-zinc-500 uppercase font-black mb-3 block tracking-widest">Shop Name</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          onBlur={() => onConfig?.({ shopName })}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm text-zinc-900 focus:border-zinc-500 outline-none mb-6"
          placeholder="Sharma Xerox"
        />
        <label className="text-[10px] text-zinc-500 uppercase font-black mb-3 block tracking-widest">Shop Setup Key</label>
        <div className="flex gap-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm text-zinc-900 focus:border-zinc-500 outline-none font-mono"
            placeholder="sk_…"
          />
          <button
            onClick={() => window.api.updateConfig({ apiKey: key }).then(() => alert('Shop linked. Only this shop’s orders will show now.'))}
            className="btn-primary"
          >Link Shop</button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white border border-black/5 p-10 rounded-3xl shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8">Preferences</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-zinc-800">🔔 Sound alert on new order</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Play a chime so you never miss an order at the counter.</p>
          </div>
          <div
            onClick={() => onConfig?.({ soundAlerts: !soundOn })}
            className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${soundOn ? 'bg-zinc-700' : 'bg-zinc-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundOn ? 'left-7' : 'left-1'}`} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100">
          <div>
            <p className="text-sm font-black text-zinc-800">🚀 Start automatically with Windows</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Launch Printable when the shop PC boots — so it's always running.</p>
          </div>
          <div
            onClick={() => onConfig?.({ runOnStartup: !startupOn })}
            className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${startupOn ? 'bg-zinc-700' : 'bg-zinc-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${startupOn ? 'left-7' : 'left-1'}`} />
          </div>
        </div>
      </div>

      {/* Finishing charges */}
      <div className="bg-white border border-black/5 p-10 rounded-3xl shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Finishing charges</h3>
        <p className="text-xs text-zinc-400 mb-8 font-medium">Add-on prices for binding, lamination &amp; stapling (₹). Used when you add finishing to an order.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { k: 'softBinding', label: '📕 Soft binding' },
            { k: 'spiralBinding', label: '🌀 Spiral binding' },
            { k: 'lamination', label: '✨ Lamination' },
            { k: 'stapling', label: '📎 Stapling' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block tracking-widest">{label}</label>
              <input defaultValue={(fin as any)[k] ?? 0} onBlur={(e) => setFin(k, e.target.value)} inputMode="numeric"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-black text-zinc-700 outline-none focus:border-zinc-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Printer routing */}
      <div className="bg-white border border-black/5 p-10 rounded-3xl shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Printer Routing</h3>
        <p className="text-xs text-zinc-400 mb-8 font-medium">
          Colour jobs auto-route to your colour printer, B&amp;W jobs to your B&amp;W printer. (A manual per-order printer still overrides this.)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-black mb-3 block tracking-widest">🖤 B &amp; W Printer</label>
            <select value={bw} onChange={(e) => { setBw(e.target.value); window.api.updateConfig({ bwPrinter: e.target.value }) }} className={selectCls}>
              <option value="">System Default</option>
              {printerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-black mb-3 block tracking-widest">🎨 Colour Printer</label>
            <select value={colour} onChange={(e) => { setColour(e.target.value); window.api.updateConfig({ colourPrinter: e.target.value }) }} className={selectCls}>
              <option value="">System Default</option>
              {printerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Backend endpoint */}
      <div className="bg-white border border-black/5 p-10 rounded-3xl shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8">System Configuration</h3>
        <div className="space-y-8">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-black mb-3 block tracking-widest">Backend server endpoint</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm text-zinc-900 focus:border-zinc-500 transition-all outline-none"
                placeholder="http://127.0.0.1:4000"
              />
              <button
                onClick={() => window.api.updateConfig({ backendUrl: url }).then(() => alert('Configuration updated.'))}
                className="btn-primary"
              >Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}