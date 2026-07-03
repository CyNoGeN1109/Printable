import { useState } from 'react'
import type { Order } from '../types'
import { toast } from '../lib/toast'

const STATUS_LABEL: Record<string, (mode: string) => string> = {
  pending_payment: (mode) => mode === 'offline' ? 'Awaiting Cash' : 'Awaiting Payment',
  paid:            () => 'Ready to Print',
  printing:        () => 'Printing',
  completing:      () => 'Finishing',
  completed:       () => 'Completed',
  cancelled:       () => 'Cancelled',
  error:           () => 'Error',
}

const STATUS_STYLE: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  paid:            'bg-green-50 text-green-700 border-green-200',
  printing:        'bg-zinc-800 text-white border-zinc-800',
  completing:      'bg-zinc-800 text-white border-zinc-800',
  completed:       'bg-zinc-100 text-zinc-500 border-zinc-200',
  cancelled:       'bg-zinc-50 text-zinc-400 border-zinc-100',
  error:           'bg-red-50 text-red-600 border-red-200',
}

interface OrderCardProps {
  order: Order
  isQueue?: boolean
  isHistory?: boolean
}

export default function OrderCard({ order, isQueue, isHistory }: OrderCardProps) {
  const [authorizing, setAuthorizing] = useState(false)
  const [authorized, setAuthorized]   = useState(false)

  const handleAuthorize = async () => {
    setAuthorizing(true)
    await window.api.confirmCashPayment(order.orderId)
    setAuthorized(true) // optimistically hide — useOrders poll will confirm within 5s
  }

  if (authorized) return null

  const statusLabel = (STATUS_LABEL[order.status] ?? (() => order.status))(order.paymentMode)
  const statusStyle = STATUS_STYLE[order.status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'

  const totalPages = order.files.reduce((s, f) => s + f.pages * f.copies, 0)
  const hasColor   = order.files.some((f) => f.colour)
  const hasBW      = order.files.some((f) => !f.colour)
  const hasDuplex  = order.files.some((f) => f.duplex)
  const colorSummary = hasColor && hasBW ? 'Mixed' : hasColor ? 'Colour' : 'B&W'

  const isCashPending = !isQueue && !isHistory
    && order.status === 'pending_payment'
    && order.paymentMode === 'offline'

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] p-5 shadow-sm hover:shadow-md transition-shadow animate-slide-up">

      {/* Row 1 — Customer name + amount */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight truncate">
            {order.userName || 'Walk-in'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-zinc-400">#{order.orderId}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-[10px] text-zinc-400 font-bold">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-zinc-900">₹{order.totalAmount}</p>
          <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
            order.paymentMode === 'online'
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
          }`}>
            {order.paymentMode === 'online' ? '💳 Online' : '💵 Cash'}
          </span>
        </div>
      </div>

      {/* Row 2 — Status + summary chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusStyle}`}>
          {statusLabel}
        </span>
        <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
          {order.files.length} file{order.files.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
          {totalPages}p total
        </span>
        <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
          {colorSummary}
        </span>
        {hasDuplex && (
          <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
            2-sided
          </span>
        )}
      </div>

      {/* Row 3 — File list */}
      <div className={`grid gap-2 mb-4 ${order.files.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {order.files.map((file, idx) => (
          <div key={idx} className="flex items-center gap-2.5 bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-100">
            <span className="text-base shrink-0">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-700 truncate" title={file.fileName}>{file.fileName}</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                {file.pages}p · {file.copies}× · {file.colour ? 'CLR' : 'B&W'} · {file.duplex ? '2-sided' : '1-sided'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 4 — Action button (context-sensitive) */}
      {isQueue && (
        <button
          onClick={() => window.api.cancelCurrentJob()}
          className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Cancel Job
        </button>
      )}
      {isCashPending && (
        <button
          onClick={handleAuthorize}
          disabled={authorizing}
          className="w-full btn-primary py-3 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        >
          {authorizing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Confirming…
            </>
          ) : (
            'Authorize Cash Payment'
          )}
        </button>
      )}
      {isHistory && (
        <button
          onClick={() => window.api.reprintOrder(order.orderId).then(() => toast('Order sent to print queue!', 'success'))}
          className="w-full bg-zinc-800 text-white hover:bg-zinc-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Reprint
        </button>
      )}
    </div>
  )
}
