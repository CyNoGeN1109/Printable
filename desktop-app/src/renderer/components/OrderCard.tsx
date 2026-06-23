import { useState, useEffect } from 'react'
import type { Order } from '../types'

interface OrderCardProps {
  order: Order
  onAction?: (order: Order) => void
  isQueue?: boolean
  isHistory?: boolean
}

export default function OrderCard({ order, isQueue, isHistory }: OrderCardProps) {
  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState(order.selectedPrinter || '')

  useEffect(() => {
    window.api.getPrinters().then(list => {
      setPrinters(list.map(p => typeof p === 'string' ? p : p.name || p.deviceId || 'Unknown'))
    })
    window.api.getConfig().then(cfg => {
      if (cfg.orderPrinters[order.orderId]) {
        setSelectedPrinter(cfg.orderPrinters[order.orderId])
      }
    })
  }, [order.orderId])

  const handlePrinterChange = async (name: string) => {
    setSelectedPrinter(name)
    await window.api.setOrderPrinter(order.orderId, name)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.03] p-6 mb-4 shadow-sm hover:shadow-md transition-all animate-slide-up">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-[10px] font-black font-mono text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-md">
              #{order.orderId}
            </span>
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className={`status-badge ${
              order.status === 'printing' ? 'bg-zinc-800 text-white' : 
              order.status === 'paid' ? 'bg-green-100 text-green-700' : 
              'bg-zinc-100 text-zinc-500'
            }`}>
              {order.status.replace('_', ' ')}
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
              {order.userName || 'Standard Order'}
            </h3>
            <span className="text-lg font-bold text-zinc-400">₹{order.totalAmount}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 px-4 bg-zinc-50 rounded-xl border border-black/[0.02]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-lg">📄</span>
                  <p className="text-xs font-bold text-zinc-700 truncate max-w-[150px]" title={file.fileName}>
                    {file.fileName}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <DetailBadge label={`${file.pages}p`} />
                  <DetailBadge label={`${file.copies}x`} />
                  <DetailBadge label={file.colour ? 'CLR' : 'BW'} color={file.colour ? 'text-amber-600' : 'text-zinc-400'} />
                  <DetailBadge label={file.duplex ? '2-SIDED' : '1-SIDED'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-56 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-100 pt-6 lg:pt-0 lg:pl-8">
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-black mb-3 block tracking-widest">Route Pipeline</label>
            <div className="relative">
              <select 
                value={selectedPrinter}
                onChange={(e) => handlePrinterChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-black text-zinc-700 focus:border-zinc-900 outline-none cursor-pointer appearance-none"
              >
                <option value="">System Default</option>
                {printers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-zinc-400">▼</div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {isQueue && (
              <button 
                onClick={() => window.api.cancelCurrentJob()} 
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all"
              >
                Bypass
              </button>
            )}
            {!isQueue && !isHistory && order.status === 'pending_payment' && order.paymentMode === 'offline' && (
              <button 
                onClick={() => window.api.confirmCashPayment(order.orderId)}
                className="flex-1 btn-primary py-3"
              >
                Authorize
              </button>
            )}
            {isHistory && (
              <button 
                onClick={() => window.api.reprintOrder(order.orderId).then(() => alert('Order sent to print queue!'))}
                className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all"
              >
                Reprint
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailBadge({ label, color = 'text-zinc-500' }: any) {
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 bg-white rounded shadow-sm border border-black/[0.03] uppercase ${color}`}>
      {label}
    </span>
  )
}