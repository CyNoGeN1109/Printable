// FILE LOCATION: apps/desktop/src/main/api.ts
// All HTTP calls from main process → Express backend
// Used by queue.ts, ipc.ts

import { getConfig } from './store'
import { Order } from '../types/order'
import axios from 'axios'
import dns from 'dns'

// Force Node.js to use IPv4 first. This prevents the exact 10s connection timeout 
// issue when connecting to platforms like Railway/Vercel on Windows.
dns.setDefaultResultOrder('ipv4first')

function getBackendUrl() {
  const config = getConfig()
  return config.backendUrl || process.env.BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:4000'
}

// Create an axios instance with a longer timeout
const apiClient = axios.create({
  timeout: 30000, // 30 seconds
})

// Interceptor: always use the latest backend URL, and authenticate as this shop so
// the backend returns only this shop's orders.
apiClient.interceptors.request.use((config) => {
  config.baseURL = getBackendUrl()
  const apiKey = getConfig().apiKey
  if (apiKey) config.headers['x-shop-key'] = apiKey
  return config
})

// PATCH /orders/:id/status  → used by queue to update printing progress
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  try {
    await apiClient.patch(`/orders/${orderId}/status`, { status })
    console.log(`[API] Order ${orderId} status → ${status}`)
  } catch (err: any) {
    throw new Error(`updateOrderStatus failed: ${err.message}`)
  }
}

// PATCH /orders/:id/confirm-payment  → owner confirms cash payment
export async function confirmCashPayment(orderId: string): Promise<void> {
  try {
    await apiClient.patch(`/orders/${orderId}/confirm-payment`)
    console.log(`[API] Order ${orderId} cash payment confirmed`)
  } catch (err: any) {
    throw new Error(`confirmCashPayment failed: ${err.message}`)
  }
}

// GET /orders/:id  → fetch single order details
export async function getOrder(orderId: string): Promise<Order> {
  try {
    const res = await apiClient.get(`/orders/${orderId}`)
    return res.data
  } catch (err: any) {
    throw new Error(`getOrder failed: ${err.message}`)
  }
}

// GET /orders?status=...  → used by recovery and poller
export async function getOrdersByStatus(status: string): Promise<Order[]> {
  try {
    const res = await apiClient.get(`/orders?status=${status}`)
    return res.data || []
  } catch (err: any) {
    throw new Error(`getOrdersByStatus failed: ${err.message}`)
  }
}

// GET /orders  → fetch all orders for the renderer
export async function getActiveOrders(): Promise<Order[]> {
  try {
    const res = await apiClient.get('/orders?status=pending_payment,paid,printing')
    return res.data || []
  } catch (err: any) {
    throw err
  }
}

// GET /orders?status=pending  → used by poller (legacy alias)
export async function getPendingOrders(): Promise<Order[]> {
  return getOrdersByStatus('pending_payment')
}