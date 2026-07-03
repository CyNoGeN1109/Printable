import { useState, useEffect } from 'react'
import type { Order } from '../types'

interface Props {
  order: Order
  onConfirm: () => Promise<void>
  onDismiss: () => void
}

export default function ConfirmModal({ order, onConfirm, onDismiss }: Props) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (confirming) return
      if (e.key === 'Escape') onDismiss()
      if (e.key === 'Enter') handleConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming])

  // Legacy fallback: orders created before multi-file support may lack files array
  const files = order.files?.length
    ? order.files
    : [{ fileName: (order as any).fileName || 'Untitled', copies: (order as any).copies || 1, colour: (order as any).colour || false, duplex: (order as any).duplex || false, pages: 0, fileUrl: '', orientation: 'portrait', pageRange: 'all' }]

  const handleConfirm = async () => {
    setConfirming(true)
    await onConfirm()
    setConfirming(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#0C831F] to-[#16A34A]" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
              💵
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">New Cash Order</h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">#{order.orderId}</p>
            </div>
            {order.userName && (
              <div className="ml-auto text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer</p>
                <p className="text-sm font-black text-zinc-800">{order.userName}</p>
              </div>
            )}
          </div>

          {/* Files list */}
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
                <span className="text-base shrink-0 mt-0.5">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-800 truncate">{file.fileName}</p>
                  <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                    {file.copies} cop{file.copies !== 1 ? 'ies' : 'y'} · {file.colour ? 'Colour' : 'B&W'} · {file.duplex ? '2-sided' : '1-sided'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Amount */}
          <div className="bg-[#0C831F]/5 border border-[#0C831F]/20 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-black text-zinc-700">Collect from customer</span>
            <span className="text-2xl font-black text-[#0C831F]">₹{order.totalAmount?.toFixed(0) || '0'}</span>
          </div>

          <p className="text-xs text-zinc-500 font-medium mb-6 text-center">
            Confirm once you have received the cash — this will start printing.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              disabled={confirming}
              className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Confirming…
                </>
              ) : (
                '✓ Cash Received'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
