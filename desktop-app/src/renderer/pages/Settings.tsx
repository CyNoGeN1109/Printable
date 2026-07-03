import { useState, useEffect } from 'react'
import type { AppConfig, StaffMember } from '../types'
import { Card, Field, Toggle, Button, inputCls } from '../components/ui'
import { useAllOrders } from '../lib/useAllOrders'
import { toast } from '../lib/toast'

const FINISHING = [
  { k: 'softBinding',   label: '📕 Soft binding' },
  { k: 'spiralBinding', label: '🌀 Spiral binding' },
  { k: 'lamination',    label: '✨ Lamination' },
  { k: 'stapling',      label: '📎 Stapling' },
] as const

export default function Settings({ config, printers, onConfig }: {
  config: AppConfig | null
  printers: any[]
  onConfig: (c: Partial<AppConfig>) => void
}) {
  const [shopName, setShopName] = useState(config?.shopName || '')
  const [key, setKey]           = useState(config?.apiKey || '')
  const [url, setUrl]           = useState(config?.backendUrl || '')
  const [linked, setLinked]     = useState(false)
  const [urlSaved, setUrlSaved] = useState(false)
  const [livePrinters, setLivePrinters] = useState<any[]>(printers || [])

  // Refresh printer list on mount in case new printers were added since app start
  useEffect(() => {
    window.api.getPrinters().then(setLivePrinters).catch(() => {})
  }, [])

  const soundOn   = config?.soundAlerts !== false
  const startupOn = config?.runOnStartup === true
  const fin       = config?.finishing || {}
  const printerNames: string[] = (livePrinters || []).map(
    (p) => (typeof p === 'string' ? p : p.name || p.deviceId || 'Unknown')
  )

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Shop identity ── */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">This shop</h3>
        <p className="text-xs text-zinc-400 mb-6 font-medium">
          Links this PC to your shop so you only ever see your own orders.
        </p>
        <div className="space-y-5">
          <Field label="Shop name">
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              onBlur={() => onConfig({ shopName })}
              placeholder="Sharma Xerox"
              className={inputCls}
            />
          </Field>
          <Field label="Setup key">
            <div className="flex gap-3">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk_…"
                className={`${inputCls} font-mono`}
              />
              <Button
                variant={linked ? 'accent' : 'primary'}
                onClick={() => {
                  onConfig({ apiKey: key })
                  setLinked(true)
                  setTimeout(() => setLinked(false), 3000)
                }}
              >
                {linked ? '✓ Linked' : 'Link'}
              </Button>
            </div>
          </Field>
        </div>
      </Card>

      {/* ── Preferences ── */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Preferences</h3>
        <Row title="🔔 Sound alert on new order" sub="Play a chime so you never miss an order at the counter.">
          <Toggle on={soundOn} onChange={() => onConfig({ soundAlerts: !soundOn })} />
        </Row>
        <div className="border-t border-zinc-100 my-5" />
        <Row title="🚀 Start automatically with Windows" sub="Launch when the shop PC boots — always running.">
          <Toggle on={startupOn} onChange={() => onConfig({ runOnStartup: !startupOn })} />
        </Row>
      </Card>

      {/* ── Finishing charges ── */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Finishing charges</h3>
        <p className="text-xs text-zinc-400 mb-6 font-medium">Add-on prices (₹) for binding, lamination &amp; stapling.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FINISHING.map(({ k, label }) => (
            <Field key={k} label={label}>
              <input
                defaultValue={(fin as any)[k] ?? 0}
                inputMode="numeric"
                className={inputCls}
                onBlur={(e) => onConfig({ finishing: { ...fin, [k]: Number(e.target.value) || 0 } })}
              />
            </Field>
          ))}
        </div>
      </Card>

      {/* ── Printer routing ── */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Printer routing</h3>
        <p className="text-xs text-zinc-400 mb-6 font-medium">
          Colour jobs go to your colour printer, B&amp;W to your B&amp;W printer.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="🖤 B&W printer">
            <select
              value={config?.bwPrinter || ''}
              onChange={(e) => onConfig({ bwPrinter: e.target.value })}
              className={`${inputCls} font-black cursor-pointer`}
            >
              <option value="">System default</option>
              {printerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="🎨 Colour printer">
            <select
              value={config?.colourPrinter || ''}
              onChange={(e) => onConfig({ colourPrinter: e.target.value })}
              className={`${inputCls} font-black cursor-pointer`}
            >
              <option value="">System default</option>
              {printerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* ── Staff & Shifts ── */}
      <StaffSection config={config} onConfig={onConfig} />

      {/* ── Advanced ── */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Advanced</h3>
        <Field label="Backend endpoint">
          <div className="flex gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://127.0.0.1:4000"
              className={inputCls}
            />
            <Button
              variant={urlSaved ? 'accent' : 'ghost'}
              onClick={() => {
                onConfig({ backendUrl: url })
                setUrlSaved(true)
                setTimeout(() => setUrlSaved(false), 3000)
              }}
            >
              {urlSaved ? '✓ Saved' : 'Save'}
            </Button>
          </div>
        </Field>
      </Card>
    </div>
  )
}

// ── Staff & Shifts section ─────────────────────────────────────────────────

function StaffSection({ config, onConfig }: {
  config: AppConfig | null
  onConfig: (c: Partial<AppConfig>) => void
}) {
  const staff  = config?.staff || []
  const active = staff.find((s) => s.id === config?.activeStaffId) || null
  const { orders } = useAllOrders([active?.id, config?.shiftStartedAt])

  const [name,     setName]     = useState('')
  const [pin,      setPin]      = useState('')
  const [loginId,  setLoginId]  = useState('')
  const [loginPin, setLoginPin] = useState('')

  const addStaff = () => {
    if (!name.trim() || pin.length < 3) return
    const member: StaffMember = { id: 's_' + Date.now().toString(36), name: name.trim(), pin }
    onConfig({ staff: [...staff, member] })
    setName(''); setPin('')
  }

  const removeStaff = (id: string) => onConfig({ staff: staff.filter((s) => s.id !== id) })

  const startShift = () => {
    const member = staff.find((s) => s.id === loginId)
    if (!member) { toast('Select a staff member first', 'error'); return }
    if (member.pin !== loginPin) { toast('Incorrect PIN', 'error'); return }
    onConfig({ activeStaffId: member.id, shiftStartedAt: new Date().toISOString() })
    setLoginId(''); setLoginPin('')
  }

  const since       = config?.shiftStartedAt ? new Date(config.shiftStartedAt).getTime() : 0
  const shiftOrders = orders.filter((o) => {
    const t = new Date(o.completedAt || o.createdAt).getTime()
    return o.status === 'completed' && t >= since
  })
  const shiftRevenue = shiftOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const shiftMins    = since ? Math.max(0, Math.round((Date.now() - since) / 60000)) : 0

  const endShift = () => {
    const ok = confirm(
      `End ${active?.name}'s shift?\n\n${shiftOrders.length} orders · ₹${shiftRevenue.toFixed(0)} collected · ${fmtDur(shiftMins)}`
    )
    if (ok) onConfig({ activeStaffId: undefined, shiftStartedAt: undefined })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">Staff &amp; Shifts</h3>

      {/* Active shift / start shift */}
      {active ? (
        <div className="bg-zinc-900 text-white rounded-3xl p-7 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">On shift</p>
              <h3 className="text-2xl font-black">{active.name}</h3>
              <p className="text-xs text-white/60 font-bold mt-1">
                Started {new Date(config!.shiftStartedAt!).toLocaleTimeString()} · {fmtDur(shiftMins)} ago
              </p>
            </div>
            <button
              onClick={endShift}
              className="bg-white text-zinc-900 text-xs font-black px-5 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              End shift
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-black">{shiftOrders.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50">orders this shift</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-black">₹{shiftRevenue.toFixed(0)}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50">collected this shift</div>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">Start a shift</h4>
          {staff.length === 0 ? (
            <p className="text-sm text-zinc-400 font-bold">Add a staff member below first.</p>
          ) : (
            <div className="flex flex-wrap gap-3 items-end">
              <select
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
              >
                <option value="">Select staff…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input
                type="password"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="PIN"
                className="w-28 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
              />
              <button onClick={startShift} className="btn-primary">Start shift</button>
            </div>
          )}
        </Card>
      )}

      {/* Manage staff */}
      <Card>
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">Staff members</h4>
        <div className="space-y-2 mb-6">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="font-black text-sm text-zinc-800">
                {s.name}
                {s.id === config?.activeStaffId && (
                  <span className="text-[10px] text-green-600 ml-2">● on shift</span>
                )}
              </span>
              <button
                onClick={() => removeStaff(s.id)}
                className="text-[11px] font-black text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          {staff.length === 0 && <p className="text-sm text-zinc-400 font-bold">No staff yet.</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-end border-t border-zinc-100 pt-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Staff name"
            className="flex-1 min-w-[140px] bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
          />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="PIN (4 digits)"
            maxLength={6}
            className="w-32 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
          />
          <button onClick={addStaff} className="btn-primary">+ Add</button>
        </div>
      </Card>
    </div>
  )
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-black text-zinc-800">{title}</p>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">{sub}</p>
      </div>
      {children}
    </div>
  )
}

function fmtDur(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}
