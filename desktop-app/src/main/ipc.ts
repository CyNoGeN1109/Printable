// FILE LOCATION: apps/desktop/src/main/ipc.ts
// Sets up IPC handlers — main ↔ renderer communication
// renderer calls ipcRenderer.invoke('channel', data) → main handles here

import { ipcMain, app } from 'electron'
import { addToQueue, retryQueue, pauseQueue, resumeQueue, cancelCurrentJob, getQueueStatus } from './queue'
import { updateOrderStatus, confirmCashPayment, getOrdersByStatus, getActiveOrders } from './api'
import { getAvailablePrinters, setSelectedPrinter, getSelectedPrinter, getPrinterHealth, printTestPage } from './printer'
import { getPrinterSupplies } from './supplies'

import { getConfig, setConfig } from './store'

export function setupIPC() {
  // ─── Config management ─────────────────────────────────────────────────────
  ipcMain.handle('get-config', async () => {
    return getConfig()
  })

  ipcMain.handle('update-config', async (_event, newConfig: any) => {
    setConfig(newConfig)
    // Apply run-on-startup at the OS level when toggled
    if (typeof newConfig.runOnStartup === 'boolean') {
      try {
        app.setLoginItemSettings({ openAtLogin: newConfig.runOnStartup, openAsHidden: false })
      } catch (e) { console.error('[IPC] setLoginItemSettings failed:', e) }
    }
    return { success: true }
  })

  // ─── Backend reachability ping (offline indicator) ─────────────────────────
  ipcMain.handle('ping-backend', async () => {
    try {
      const res = await fetch(getConfig().backendUrl + '/health', { signal: AbortSignal.timeout(5000) })
      return { online: res.ok }
    } catch {
      return { online: false }
    }
  })

  // ─── Called by renderer when owner confirms CASH payment ───────────────────
  ipcMain.handle('confirm-cash-payment', async (_event, orderId: string) => {
    try {
      await confirmCashPayment(orderId) // PATCH /orders/:id/confirm-payment
      addToQueue(orderId)               // Add to print queue
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ─── Called by renderer when ONLINE order is auto-confirmed ─────────────────
  ipcMain.handle('queue-online-order', async (_event, orderId: string) => {
    try {
      addToQueue(orderId)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ─── Get list of available printers ─────────────────────────────────────────
  ipcMain.handle('get-printers', async () => {
    const printers = await getAvailablePrinters()
    return printers
  })

  ipcMain.handle('set-printer', async (_event, printerName: string) => {
    setSelectedPrinter(printerName)
    retryQueue()
    return { success: true }
  })

  ipcMain.handle('get-selected-printer', async () => {
    return getSelectedPrinter()
  })

  // ─── Printer health (status, errors, queued jobs) ──────────────────────────
  ipcMain.handle('get-printer-health', async () => {
    try {
      return await getPrinterHealth()
    } catch (err: any) {
      console.error('[IPC] get-printer-health failed:', err)
      return []
    }
  })

  ipcMain.handle('print-test-page', async (_event, printerName: string) => {
    try {
      await printTestPage(printerName)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ─── True printer-supply levels (WMI flags + SNMP exact levels) ────────────
  ipcMain.handle('get-printer-supplies', async () => {
    try {
      return await getPrinterSupplies()
    } catch (err: any) {
      console.error('[IPC] get-printer-supplies failed:', err)
      return []
    }
  })

  // ─── Get current queue status ────────────────────────────────────────────────
  ipcMain.handle('get-queue-status', async () => {
    return getQueueStatus()
  })

  // ─── Manual reprint (from ReprintBtn in renderer) ───────────────────────────
  ipcMain.handle('reprint-order', async (_event, orderId: string) => {
    try {
      addToQueue(orderId)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ─── Retry queue after printer reconnect ───────────────────────────────────
  ipcMain.handle('retry-queue', async () => {
    retryQueue()
    return { success: true }
  })

  // ─── Pause the print queue ──────────────────────────────────────────────────
  ipcMain.handle('pause-queue', async () => {
    pauseQueue()
    return { success: true }
  })

  // ─── Resume the print queue ─────────────────────────────────────────────────
  ipcMain.handle('resume-queue', async () => {
    resumeQueue()
    return { success: true }
  })

  // ─── Cancel the currently processing job ───────────────────────────────────
  ipcMain.handle('cancel-current-job', async () => {
    cancelCurrentJob()
    return { success: true }
  })

  // ─── Get all orders from backend ──────────────────────────────────────────
  ipcMain.handle('get-orders', async () => {
    try {
      // Single request — backend accepts comma-separated status filter.
      // Active-only: completed/cancelled orders are already in local history.
      return await getActiveOrders()
    } catch (err: any) {
      console.error('[IPC] get-orders failed:', err)
      return []
    }
  })

  // ─── Global System Toggle ───────────────────────────────────────────────────
  ipcMain.handle('toggle-system', async (_event, enabled: boolean) => {
    setConfig({ systemEnabled: enabled })
    return { success: true }
  })

  // ─── Order History ──────────────────────────────────────────────────────────
  ipcMain.handle('get-history', async () => {
    const config = getConfig()
    return config.history || []
  })

  ipcMain.handle('clear-history', async () => {
    setConfig({ history: [] })
    return { success: true }
  })

  // ─── Per-Order Printer Selection ────────────────────────────────────────────
  ipcMain.handle('set-order-printer', async (_event, orderId: string, printerName: string) => {
    const config = getConfig()
    const orderPrinters = { ...config.orderPrinters, [orderId]: printerName }
    setConfig({ orderPrinters })
    return { success: true }
  })

  console.log('[IPC] All handlers registered')
}

// ─── On startup: recover orders stuck in 'printing' status ───────────────────
// If the app was restarted mid-print those orders are stuck in 'printing'.
// Reset them to 'paid' and re-queue so they print automatically.
export async function recoverStuckOrders() {
  try {
    console.log('[IPC] Checking for stuck printing orders…')
    const stuckOrders = await getOrdersByStatus('printing')
    if (stuckOrders.length === 0) {
      console.log('[IPC] No stuck orders found')
      return
    }

    console.log(`[IPC] Found ${stuckOrders.length} stuck order(s) — recovering…`)
    for (const order of stuckOrders) {
      // Reset to 'paid' first so the queue can re-process them
      await updateOrderStatus(order.orderId, 'paid').catch((e: any) =>
        console.error(`[IPC] Failed to reset ${order.orderId}:`, e)
      )
      // Re-add to in-memory queue
      addToQueue(order.orderId)
      console.log(`[IPC] Re-queued stuck order: ${order.orderId}`)
    }
  } catch (err) {
    console.error('[IPC] recoverStuckOrders failed:', err)
  }
}