// FILE LOCATION: apps/desktop/src/renderer/components/ReprintBtn.tsx
// Reprint button — shown on completed orders in OrderList
// Calls ipcRenderer.invoke('reprint-order', orderId) via preload bridge

import { useState } from 'react'

interface Props {
  orderId: string
}

export default function ReprintBtn({ orderId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleReprint = async () => {
    setStatus('loading')
    const result = await window.api.reprintOrder(orderId)
    setStatus(result.success ? 'done' : 'error')

    // Reset after 3s
    setTimeout(() => setStatus('idle'), 3000)
  }

  const labels = {
    idle: '🔁 Reprint',
    loading: 'Queuing…',
    done: '✓ Queued',
    error: 'Failed',
  }

  return (
    <button
      className={`reprint-btn reprint-${status}`}
      onClick={handleReprint}
      disabled={status === 'loading'}
    >
      {labels[status]}
    </button>
  )
}