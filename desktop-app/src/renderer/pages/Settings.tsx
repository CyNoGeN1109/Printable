// FILE: apps/desktop/src/renderer/pages/Settings.tsx
// Shop identity, preferences, finishing prices, printer routing and backend URL.

import { useState } from 'react'
import type { AppConfig } from '../types'
import { Card, Field, Toggle, Button, inputCls } from '../components/ui'

const FINISHING = [
  { k: 'softBinding', label: '📕 Soft binding' },
  { k: 'spiralBinding', label: '🌀 Spiral binding' },
  { k: 'lamination', label: '✨ Lamination' },
  { k: 'stapling', label: '📎 Stapling' },
] as const

export default function Settings({ config, printers, onConfig }: {
  config: AppConfig | null
  printers: any[]
  onConfig: (c: Partial<AppConfig>) => void
}) {
  const [shopName, setShopName] = useState(config?.shopName || '')
  const [key, setKey] = useState(config?.apiKey || '')
  const [url, setUrl] = useState(config?.backendUrl || '')

  const soundOn = config?.soundAlerts !== false
  const startupOn = config?.runOnStartup === true
  const fin = config?.finishing || {}
  const printerNames: string[] = (printers || []).map((p) => (typeof p === 'string' ? p : p.name || p.deviceId || 'Unknown'))

  return (
    <div className="max-w-2xl space-y-5">
      {/* Shop identity */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">This shop</h3>
        <p className="text-xs text-zinc-400 mb-6 font-medium">Links this PC to your shop so you only ever see your own orders.</p>
        <div className="space-y-5">
          <Field label="Shop name">
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} onBlur={() => onConfig({ shopName })} placeholder="Sharma Xerox" className={inputCls} />
          </Field>
          <Field label="Setup key">
            <div className="flex gap-3">
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk_…" className={`${inputCls} font-mono`} />
              <Button onClick={() => onConfig({ apiKey: key })}>Link</Button>
            </div>
          </Field>
        </div>
      </Card>

      {/* Preferences */}
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

      {/* Finishing charges */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Finishing charges</h3>
        <p className="text-xs text-zinc-400 mb-6 font-medium">Add-on prices (₹) for binding, lamination &amp; stapling.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FINISHING.map(({ k, label }) => (
            <Field key={k} label={label}>
              <input defaultValue={(fin as any)[k] ?? 0} inputMode="numeric" className={inputCls}
                onBlur={(e) => onConfig({ finishing: { ...fin, [k]: Number(e.target.value) || 0 } })} />
            </Field>
          ))}
        </div>
      </Card>

      {/* Printer routing */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Printer routing</h3>
        <p className="text-xs text-zinc-400 mb-6 font-medium">Colour jobs route to your colour printer, B&amp;W to your B&amp;W printer.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="🖤 B&W printer">
            <select value={config?.bwPrinter || ''} onChange={(e) => onConfig({ bwPrinter: e.target.value })} className={`${inputCls} font-black cursor-pointer`}>
              <option value="">System default</option>
              {printerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="🎨 Colour printer">
            <select value={config?.colourPrinter || ''} onChange={(e) => onConfig({ colourPrinter: e.target.value })} className={`${inputCls} font-black cursor-pointer`}>
              <option value="">System default</option>
              {printerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* Backend */}
      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Server</h3>
        <Field label="Backend endpoint">
          <div className="flex gap-3">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://127.0.0.1:4000" className={inputCls} />
            <Button variant="ghost" onClick={() => onConfig({ backendUrl: url })}>Save</Button>
          </div>
        </Field>
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
