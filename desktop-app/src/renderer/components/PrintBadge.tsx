// FILE LOCATION: apps/desktop/src/renderer/components/PrintBadge.tsx
// Status pill badge — shows pending / printing / completed / cancelled

// interface Props {
//   status: 'pending' | 'printing' | 'completed' | 'cancelled'
// }

// const labels: Record<Props['status'], string> = {
//   pending: '⏳ Pending',
//   printing: '🖨 Printing',
//   completed: '✅ Completed',
//   cancelled: '❌ Cancelled',
// }

// export default function PrintBadge({ status }: Props) {
//   return (
//     <span className={`print-badge badge-${status}`}>
//       {labels[status]}
//     </span>
//   )
// }

import type { Order } from '../types'

interface Props {
  status: Order['status']
}

export default function PrintBadge({ status }: Props) {
  const config = {
    pending_payment: { label: 'Pending',   bg: '#451a03', color: '#fbbf24' },
    paid:      { label: 'Paid',      bg: '#082f49', color: '#38bdf8' },
    printing:  { label: 'Printing',  bg: '#2e1065', color: '#a78bfa' },
    completed: { label: 'Completed', bg: '#052e16', color: '#4ade80' },
    cancelled: { label: 'Cancelled', bg: '#1c1917', color: '#a8a29e' },
    error:     { label: 'Error',     bg: '#450a0a', color: '#f87171' },
  }

  const { label, bg, color } = config[status] ?? config.pending_payment

  return (
    <span style={{
      background: bg,
      color,
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {label}
    </span>
  )
}