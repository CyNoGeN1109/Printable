import { useEffect, useState, useCallback } from 'react'
import type { PrinterHealth, PrinterHealthStatus, PrinterSupplies, Supply, SupplyFlag, AppConfig } from '../types'
import { Card, Button, EmptyState } from '../components/ui'
import { toast } from '../lib/toast'

// ── Printer status config ──────────────────────────────────────────────────

const STATUS_UI: Record<PrinterHealthStatus, { label: string; dot: string; tone: string; icon: string }> = {
  ready:     { label: 'Ready',         dot: 'bg-green-500', tone: 'text-green-700 bg-green-50 border-green-200',  icon: '✅' },
  printing:  { label: 'Printing',      dot: 'bg-blue-500',  tone: 'text-blue-700 bg-blue-50 border-blue-200',    icon: '🖨️' },
  paper_low: { label: 'Paper low',     dot: 'bg-amber-500', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: '⚠️' },
  toner_low: { label: 'Toner low',     dot: 'bg-amber-500', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: '⚠️' },
  paper_out: { label: 'Out of paper',  dot: 'bg-red-500',   tone: 'text-red-700 bg-red-50 border-red-200',       icon: '📄' },
  toner_out: { label: 'Out of toner',  dot: 'bg-red-500',   tone: 'text-red-700 bg-red-50 border-red-200',       icon: '🩸' },
  jammed:    { label: 'Paper jam',     dot: 'bg-red-500',   tone: 'text-red-700 bg-red-50 border-red-200',       icon: '🚫' },
  door_open: { label: 'Door open',     dot: 'bg-red-500',   tone: 'text-red-700 bg-red-50 border-red-200',       icon: '🚪' },
  bin_full:  { label: 'Tray full',     dot: 'bg-amber-500', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: '📥' },
  offline:   { label: 'Offline',       dot: 'bg-zinc-400',  tone: 'text-zinc-600 bg-zinc-100 border-zinc-200',   icon: '🔌' },
  error:     { label: 'Needs service', dot: 'bg-red-500',   tone: 'text-red-700 bg-red-50 border-red-200',       icon: '🛠️' },
  unknown:   { label: 'Unknown',       dot: 'bg-zinc-300',  tone: 'text-zinc-500 bg-zinc-50 border-zinc-200',    icon: '❔' },
}

// ── Supply config ──────────────────────────────────────────────────────────

const LOW = 15
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

// ── Main Hardware page ─────────────────────────────────────────────────────

export default function Hardware({ config, onConfig }: {
  config: AppConfig | null
  onConfig: (c: Partial<AppConfig>) => void
}) {
  const [health, setHealth]       = useState<PrinterHealth[]>([])
  const [supplies, setSupplies]   = useState<PrinterSupplies[]>([])
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [loadingSupplies, setLoadingSupplies] = useState(true)
  const [testing, setTesting]     = useState<string | null>(null)

  const refreshHealth = useCallback(async () => {
    try { setHealth(await window.api.getPrinterHealth()) } catch { /* ignore */ }
    setLoadingHealth(false)
  }, [])

  const refreshSupplies = useCallback(async () => {
    try { setSupplies(await window.api.getPrinterSupplies()) } catch { /* ignore */ }
    setLoadingSupplies(false)
  }, [])

  useEffect(() => {
    refreshHealth()
    refreshSupplies()
    const healthTimer   = setInterval(refreshHealth, 8000)
    const suppliesTimer = setInterval(refreshSupplies, 30000)
    return () => {
      clearInterval(healthTimer)
      clearInterval(suppliesTimer)
    }
  }, [refreshHealth, refreshSupplies])

  const setRole = (name: string, role: 'bw' | 'colour') =>
    onConfig(role === 'bw' ? { bwPrinter: name } : { colourPrinter: name })

  const testPage = async (name: string) => {
    setTesting(name)
    const res = await window.api.printTestPage(name)
    setTesting(null)
    if (!res.success) toast(res.error || 'Test page failed', 'error')
    else toast('Test page sent', 'success')
  }

  const problems  = health.filter((p) => !p.ok && p.status !== 'unknown')
  const lowItems  = supplies.flatMap((p) => [
    ...p.supplies.filter((s) => s.percent !== null && s.percent <= LOW).map((s) => `${p.printer}: ${s.name} ${s.percent}%`),
    ...(p.source === 'wmi' && p.paperFlag === 'out' ? [`${p.printer}: out of paper`] : []),
    ...(p.source === 'wmi' && p.paperFlag === 'low' ? [`${p.printer}: paper low`] : []),
    ...(p.source === 'wmi' && p.tonerFlag === 'out' ? [`${p.printer}: out of toner`] : []),
    ...(p.source === 'wmi' && p.tonerFlag === 'low' ? [`${p.printer}: toner low`] : []),
  ])

  return (
    <div className="animate-slide-up space-y-10 max-w-5xl">

      {/* ── Printers ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Printers</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 font-medium">
              {loadingHealth ? 'Checking…'
                : problems.length === 0
                  ? `${health.length} printer${health.length !== 1 ? 's' : ''} ready`
                  : `${problems.length} need${problems.length !== 1 ? '' : 's'} attention`}
            </span>
            <Button variant="ghost" onClick={refreshHealth}>↻ Refresh</Button>
          </div>
        </div>

        {problems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap gap-2 mb-5">
            {problems.map((p) => (
              <span key={p.name} className="text-[11px] font-black text-red-700 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                {STATUS_UI[p.status].icon} {p.name}: {p.message}
              </span>
            ))}
          </div>
        )}

        {!loadingHealth && health.length === 0 ? (
          <Card>
            <EmptyState icon="🖨️" title="No printers detected" sub="Connect a printer and click Refresh. (Status is read on Windows.)" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {health.map((p) => {
              const ui = STATUS_UI[p.status]
              const isBw     = config?.bwPrinter === p.name
              const isColour = config?.colourPrinter === p.name
              return (
                <Card key={p.name} pad="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${ui.dot} ${p.status === 'printing' ? 'animate-pulse' : ''}`} />
                        <h3 className="font-black text-base text-zinc-900 truncate">{p.name}</h3>
                        {p.isDefault && (
                          <span className="text-[9px] font-black uppercase bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <span className={`inline-block mt-2 text-[11px] font-black border rounded-lg px-2.5 py-1 ${ui.tone}`}>
                        {ui.icon} {ui.label}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-zinc-900">{p.queuedJobs}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">in queue</div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <RoleBtn active={isBw} onClick={() => setRole(p.name, 'bw')}>
                      🖤 {isBw ? 'B&W default' : 'Set B&W'}
                    </RoleBtn>
                    <RoleBtn active={isColour} onClick={() => setRole(p.name, 'colour')}>
                      🎨 {isColour ? 'Colour default' : 'Set Colour'}
                    </RoleBtn>
                    <button
                      onClick={() => testPage(p.name)}
                      disabled={testing === p.name}
                      className="text-[11px] font-black rounded-lg px-3 py-1.5 border bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {testing === p.name ? 'Sending…' : '🧪 Test page'}
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-black/[0.04]" />

      {/* ── Supplies ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Supplies</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 font-medium">
              {loadingSupplies ? 'Reading levels…'
                : lowItems.length === 0 ? 'All supplies healthy'
                : `${lowItems.length} alert${lowItems.length !== 1 ? 's' : ''}`}
            </span>
            <Button variant="ghost" onClick={refreshSupplies}>↻ Refresh</Button>
          </div>
        </div>

        {lowItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap gap-2 mb-5">
            {lowItems.map((t, i) => (
              <span key={i} className="text-[11px] font-black text-red-700 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                ⚠️ {t}
              </span>
            ))}
          </div>
        )}

        {!loadingSupplies && supplies.length === 0 ? (
          <Card>
            <EmptyState icon="🩸" title="No supply data" sub="Connect a printer and refresh. Live levels need a network printer with SNMP." />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {supplies.map((p) => (
              <Card key={p.printer} pad="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-base text-zinc-900 truncate">{p.printer}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    p.source === 'snmp'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
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
                          <div
                            className={`h-full rounded-full transition-all ${barColor(s)}`}
                            style={{ width: `${s.percent ?? 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FlagRow icon="📄" label="Paper" flag={p.paperFlag} />
                    <FlagRow icon="🩸" label="Toner / ink" flag={p.tonerFlag} />
                    <p className="text-[11px] text-zinc-400 font-medium pt-1">
                      {p.host
                        ? 'Exact levels need SNMP enabled on this printer.'
                        : 'Exact levels need a network printer with SNMP. USB printers report OK/Low/Out only.'}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function RoleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-black rounded-lg px-3 py-1.5 border ${
        active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
      }`}
    >
      {children}
    </button>
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
