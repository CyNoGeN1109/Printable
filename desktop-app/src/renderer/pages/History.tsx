import { useState, useEffect } from 'react'
import OrderCard from '../components/OrderCard'
import type { Order } from '../types'

export default function History() {
  const [history, setHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.api.getHistory().then(h => {
      setHistory(h)
      setIsLoading(false)
    })
  }, [])

  const handleClear = async () => {
    if (confirm('Permanently clear all local history?')) {
      await window.api.clearHistory()
      setHistory([])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Operation Archives</h2>
          <p className="text-sm font-black text-zinc-800 uppercase tracking-widest">Recently synchronized: {history.length} jobs</p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={handleClear}
            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 bg-red-50 border border-red-100 px-5 py-2.5 rounded-xl transition-all"
          >
            Purge records
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white/50 border border-black/[0.03] rounded-[2rem] p-24 text-center shadow-inner">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">📁</div>
          <h3 className="text-xl font-black text-zinc-800">No synchronized jobs</h3>
          <p className="text-sm text-zinc-400 mt-1 font-medium">History is temporarily stored until purged manually.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((order, idx) => (
            <OrderCard key={idx} order={order} isHistory={true} />
          ))}
        </div>
      )}
    </div>
  )
}
