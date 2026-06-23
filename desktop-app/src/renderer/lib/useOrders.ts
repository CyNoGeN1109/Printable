// FILE LOCATION: apps/desktop/src/renderer/lib/useOrders.ts

import { useState, useEffect } from 'react'
import type { Order } from '../types'

const POLL_INTERVAL = 5000

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await window.api.getOrders()
        setOrders(data)
        setError(null)
      } catch (err: any) {
        setError(err.message)
        console.error('[useOrders] Fetch failed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
    const timer = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return { orders, isLoading, error }
}