// FILE: apps/desktop/src/renderer/components/ui.tsx
// Shared design primitives — one source of truth for cards, labels, inputs,
// toggles and buttons so every page looks like the same product.

import type { ReactNode } from 'react'

export const inputCls =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-500 transition-colors'

export function Card({ children, className = '', pad = 'p-8' }: { children: ReactNode; className?: string; pad?: string }) {
  return <div className={`bg-white border border-zinc-200/70 rounded-3xl shadow-sm ${pad} ${className}`}>{children}</div>
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{children}</h3>
      {right}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block tracking-widest">{label}</label>
      {children}
    </div>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${on ? 'bg-zinc-800' : 'bg-zinc-300'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </div>
  )
}

export function Button({ children, onClick, disabled, variant = 'primary', className = '' }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'accent'; className?: string
}) {
  const styles = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    accent: 'bg-[#0C831F] text-white hover:opacity-90',
    ghost: 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50',
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled}
      className={`text-xs font-black rounded-xl px-5 py-2.5 transition-all disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  )
}

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-black text-zinc-700">{title}</h3>
      {sub && <p className="text-sm text-zinc-400 font-medium mt-1">{sub}</p>}
    </div>
  )
}
