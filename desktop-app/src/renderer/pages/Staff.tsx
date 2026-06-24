// FILE: apps/desktop/src/renderer/pages/Staff.tsx
// Counter-operator accounts + shifts. The owner adds staff (name + PIN), the
// operator starts a shift, and at close the app shows orders/revenue handled
// during that shift — accountability against the #1 owner fear (cash leakage).

import { useEffect, useState } from 'react'
import type { AppConfig, StaffMember, Order } from '../types'

export default function Staff({ config, onConfig }: { config: AppConfig | null; onConfig: (c: Partial<AppConfig>) => void }) {
  const staff = config?.staff || []
  const active = staff.find((s) => s.id === config?.activeStaffId) || null
  const [orders, setOrders] = useState<Order[]>([])

  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loginId, setLoginId] = useState('')
  const [loginPin, setLoginPin] = useState('')

  useEffect(() => {
    Promise.all([window.api.getOrders().catch(() => []), window.api.getHistory().catch(() => [])])
      .then(([live, hist]) => {
        const map = new Map<string, Order>()
        ;[...(hist as Order[]), ...(live as Order[])].forEach((o) => o?.orderId && map.set(o.orderId, o))
        setOrders([...map.values()])
      })
  }, [active])

  const addStaff = () => {
    if (!name.trim() || pin.length < 3) return
    const member: StaffMember = { id: 's_' + Date.now().toString(36), name: name.trim(), pin }
    onConfig({ staff: [...staff, member] })
    setName(''); setPin('')
  }
  const removeStaff = (id: string) => onConfig({ staff: staff.filter((s) => s.id !== id) })

  const startShift = () => {
    const member = staff.find((s) => s.id === loginId)
    if (!member) { alert('Select a staff member'); return }
    if (member.pin !== loginPin) { alert('Wrong PIN'); return }
    onConfig({ activeStaffId: member.id, shiftStartedAt: new Date().toISOString() })
    setLoginId(''); setLoginPin('')
  }

  // shift totals
  const since = config?.shiftStartedAt ? new Date(config.shiftStartedAt).getTime() : 0
  const shiftOrders = orders.filter((o) => {
    const t = new Date(o.completedAt || o.createdAt).getTime()
    return o.status === 'completed' && t >= since
  })
  const shiftRevenue = shiftOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const shiftMins = since ? Math.max(0, Math.round((Date.now() - since) / 60000)) : 0

  const endShift = () => {
    const ok = confirm(`End ${active?.name}'s shift?\n\n${shiftOrders.length} orders · ₹${shiftRevenue.toFixed(0)} collected · ${fmtDur(shiftMins)}`)
    if (ok) onConfig({ activeStaffId: undefined, shiftStartedAt: undefined })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Current shift */}
      {active ? (
        <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">On shift</p>
              <h3 className="text-2xl font-black">{active.name}</h3>
              <p className="text-xs text-white/60 font-bold mt-1">Started {new Date(config!.shiftStartedAt!).toLocaleTimeString()} · {fmtDur(shiftMins)} ago</p>
            </div>
            <button onClick={endShift} className="bg-white text-zinc-900 text-xs font-black px-5 py-2.5 rounded-xl hover:bg-zinc-200">End shift</button>
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
        <div className="bg-white border border-zinc-200/70 rounded-3xl p-8 shadow-sm">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">Start a shift</h3>
          {staff.length === 0 ? (
            <p className="text-sm text-zinc-400 font-bold">Add a staff member below first.</p>
          ) : (
            <div className="flex flex-wrap gap-3 items-end">
              <select value={loginId} onChange={(e) => setLoginId(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
                <option value="">Select staff…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="password" value={loginPin} onChange={(e) => setLoginPin(e.target.value)} placeholder="PIN"
                className="w-28 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
              <button onClick={startShift} className="btn-primary">Start shift</button>
            </div>
          )}
        </div>
      )}

      {/* Manage staff */}
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-8 shadow-sm">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">Staff members</h3>
        <div className="space-y-2 mb-6">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="font-black text-sm text-zinc-800">{s.name} {s.id === config?.activeStaffId && <span className="text-[10px] text-green-600">● on shift</span>}</span>
              <button onClick={() => removeStaff(s.id)} className="text-[11px] font-black text-red-500 hover:text-red-700">Remove</button>
            </div>
          ))}
          {staff.length === 0 && <p className="text-sm text-zinc-400 font-bold">No staff yet.</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-end border-t border-zinc-100 pt-5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Staff name"
            className="flex-1 min-w-[140px] bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="PIN (4 digits)" maxLength={6}
            className="w-32 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
          <button onClick={addStaff} className="btn-primary">+ Add</button>
        </div>
      </div>
    </div>
  )
}

function fmtDur(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}
