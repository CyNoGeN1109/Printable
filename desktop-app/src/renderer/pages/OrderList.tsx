import { useState } from 'react'
import OrderCard from '../components/OrderCard'
import { useOrders } from '../lib/useOrders'

type Filter = 'all' | 'pending_payment' | 'printing' | 'completed' | 'cancelled'

export default function OrderList() {
  const { orders, isLoading } = useOrders()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const tabs: Filter[] = ['all', 'pending_payment', 'printing', 'completed', 'cancelled']

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Database Records</h2>
          <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Browsing {filtered.length} entries</p>
        </div>

        <div className="flex bg-[#11141a] p-1 rounded-lg border border-[#2d3644] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === tab 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#11141a] border border-[#2d3644] rounded-xl p-20 text-center">
          <h3 className="text-sm font-bold text-slate-400">No Records Found</h3>
          <p className="text-[11px] text-slate-600 mt-1 uppercase tracking-widest font-black">Adjust your filters or sync with server.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}