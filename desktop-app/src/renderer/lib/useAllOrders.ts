// FILE: apps/desktop/src/renderer/lib/useAllOrders.ts
// Backend orders + local completed history, merged and de-duped by orderId.
// Shared by Reports and Staff so the fetch/merge logic lives in one place.

import { useEffect, useState } from 'react'
import type { Order } from '../types'

export function useAllOrders(deps: unknown[] = []) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([window.api.getOrders().catch(() => []), window.api.getHistory().catch(() => [])])
      .then(([live, hist]) => {
        if (!alive) return
        const map = new Map<string, Order>()
        ;[...(hist as Order[]), ...(live as Order[])].forEach((o) => o?.orderId && map.set(o.orderId, o))
        setOrders([...map.values()])
        setLoading(false)
      })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { orders, loading }
}
