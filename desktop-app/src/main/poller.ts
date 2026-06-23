// FILE LOCATION: apps/desktop/src/main/poller.ts

import { BrowserWindow } from 'electron'
import { getConfig } from './store'

import { getPendingOrders } from './api'

const POLL_INTERVAL = 5000

let previousOrderIds = new Set<string>()
let pollingTimer: NodeJS.Timeout | null = null

export function startPolling(mainWindow: BrowserWindow) {
  console.log('[Poller] Starting — polling every 5s')

  async function poll() {
    try {
      const config = getConfig()
      if (!config.systemEnabled) {
        return
      }
      
      const orders: Order[] = await getPendingOrders()

      const newOrders = orders.filter((o) => !previousOrderIds.has(o.orderId))

      newOrders.forEach((order) => {
        console.log(`[Poller] New order detected: ${order.orderId}`)
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('new-order', order)
        }
      })

      previousOrderIds = new Set(orders.map((o) => o.orderId))
    } catch (err) {
      console.error('[Poller] Failed to fetch orders:', err)
    }
  }

  poll()
  pollingTimer = setInterval(poll, POLL_INTERVAL)
}

export function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
    console.log('[Poller] Stopped')
  }
}

export interface OrderFile {
  fileName: string
  fileUrl: string
  pages: number
  copies: number
  colour: boolean
  duplex: boolean
  orientation: string
  pageRange: string
}

export interface Order {
  _id: string
  orderId: string
  files: OrderFile[]
  paymentMode: 'online' | 'offline'
  status: 'pending_payment' | 'paid' | 'printing' | 'completed' | 'cancelled'
  totalAmount: number
  createdAt: string
}