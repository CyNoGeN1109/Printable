import { useOrders } from '../lib/useOrders'
import type { Order } from '../types'

export default function Stats() {
  const { orders, isLoading } = useOrders()

  const today = new Date().toDateString()
  const todayOrders = orders.filter(
    (o: Order) => new Date(o.createdAt).toDateString() === today
  )

  const todayRevenue = todayOrders
    .filter((o: Order) => o.status === 'completed')
    .reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0)

  const onlineCount = todayOrders.filter((o: Order) => o.paymentMode === 'online' && o.status === 'completed').length
  const offlineCount = todayOrders.filter((o: Order) => o.paymentMode === 'offline' && o.status === 'completed').length
  const completedCount = todayOrders.filter((o: Order) => o.status === 'completed').length
  const totalPages = todayOrders
    .filter((o: Order) => o.status === 'completed')
    .reduce((sum: number, o: Order) => sum + o.files.reduce((fSum: number, f: any) => fSum + (f.pages * f.copies), 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up max-w-6xl mx-auto">
      <div className="mb-12">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Performance Analytics</h2>
        <p className="text-sm font-black text-zinc-800 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white/50 border border-black/[0.03] rounded-[2rem] p-12 shadow-inner">
            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-[0.2em] mb-4">Daily Gross Revenue</p>
            <h3 className="text-6xl font-black text-zinc-900 tracking-tighter mb-6">₹{todayRevenue.toFixed(2)}</h3>
            <div className="flex gap-3">
              <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-4 py-1.5 rounded-full border border-green-200">
                Live sync active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MetricCard title="Completed Jobs" value={completedCount} icon="📦" />
            <MetricCard title="Total Volume (Pages)" value={totalPages} icon="📄" />
            <MetricCard title="Digital Channel" value={onlineCount} icon="💳" />
            <MetricCard title="Physical Channel" value={offlineCount} icon="💵" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/50 border border-black/[0.03] rounded-[2rem] p-10 shadow-inner">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-10">Channel Efficiency</h4>
            <div className="space-y-10">
              <ProgressBar label="Gateway Payments" value={onlineCount} total={completedCount} color="bg-zinc-800" />
              <ProgressBar label="Direct Authorization" value={offlineCount} total={completedCount} color="bg-zinc-400" />
              <ProgressBar label="Pipeline Success" value={completedCount} total={todayOrders.length} color="bg-zinc-600" />
            </div>
          </div>
          
          <div className="p-8 rounded-2xl bg-zinc-900 text-white shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">Intelligence Insight</h4>
            <p className="text-[11px] font-medium leading-relaxed opacity-80">
              Session metrics are calculated from local synchronized data. Financial figures represent authorized transactions only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon }: any) {
  return (
    <div className="bg-white/50 border border-black/[0.03] p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
      <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-inner">{icon}</div>
      <h4 className="text-3xl font-black text-zinc-900 mb-1 tracking-tight">{value}</h4>
      <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">{title}</p>
    </div>
  )
}

function ProgressBar({ label, value, total, color }: any) {
  const percent = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-900">{value} units</span>
      </div>
      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}