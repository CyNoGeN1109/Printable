// FILE: apps/desktop/src/renderer/pages/Tokens.tsx
// Walk-in token system for physical-counter customers: issue a number, call the
// next one, mark done. Numbers persist (lastToken) so they don't reset on reload.

import type { AppConfig, Token } from '../types'

export default function Tokens({ config, onConfig }: { config: AppConfig | null; onConfig: (c: Partial<AppConfig>) => void }) {
  const tokens = config?.tokens || []
  const lastToken = config?.lastToken || 0
  const serving = tokens.find((t) => t.status === 'serving') || null
  const waiting = tokens.filter((t) => t.status === 'waiting')

  const issue = () => {
    const num = lastToken + 1
    const t: Token = { num, status: 'waiting', at: new Date().toISOString() }
    onConfig({ lastToken: num, tokens: [...tokens, t] })
  }

  const update = (num: number, status: Token['status']) => {
    let next = tokens.map((t) => (t.num === num ? { ...t, status } : t))
    // only one "serving" at a time
    if (status === 'serving') next = next.map((t) => (t.num !== num && t.status === 'serving' ? { ...t, status: 'done' as const } : t))
    onConfig({ tokens: next })
  }

  const callNext = () => {
    const nextWaiting = waiting[0]
    if (nextWaiting) update(nextWaiting.num, 'serving')
  }

  const reset = () => {
    if (confirm('Clear the token queue and reset numbering to 0?')) onConfig({ tokens: [], lastToken: 0 })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Now serving + issue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-zinc-900 text-white rounded-3xl p-8 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Now serving</p>
            <div className="text-7xl font-black tracking-tighter">{serving ? `#${serving.num}` : '—'}</div>
          </div>
          <button onClick={callNext} disabled={!waiting.length}
            className="bg-white text-zinc-900 font-black px-6 py-4 rounded-2xl text-sm hover:bg-zinc-200 disabled:opacity-40">
            Call next →
          </button>
        </div>
        <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center">
          <button onClick={issue} className="w-full bg-[#0C831F] text-white font-black py-5 rounded-2xl text-lg hover:opacity-90">
            + Issue token
          </button>
          <p className="text-xs text-zinc-400 font-bold mt-3">Next: #{lastToken + 1}</p>
        </div>
      </div>

      {/* Waiting list */}
      <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Waiting · {waiting.length}</h3>
          <button onClick={reset} className="text-[11px] font-black text-zinc-400 hover:text-red-500">Reset queue</button>
        </div>
        {waiting.length === 0 ? (
          <p className="text-sm text-zinc-400 font-bold py-4">No one waiting.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {waiting.map((t) => (
              <div key={t.num} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl pl-4 pr-2 py-2">
                <span className="font-black text-zinc-800">#{t.num}</span>
                <span className="text-[10px] text-zinc-400 font-bold">{new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button onClick={() => update(t.num, 'serving')} className="text-[10px] font-black bg-zinc-900 text-white rounded-lg px-2 py-1">Serve</button>
                <button onClick={() => update(t.num, 'done')} className="text-[10px] font-black text-zinc-400 hover:text-red-500 px-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
