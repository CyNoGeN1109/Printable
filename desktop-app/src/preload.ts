// FILE LOCATION: apps/desktop/src/preload.ts

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config: any) => ipcRenderer.invoke('update-config', config),

  confirmCashPayment: (orderId: string) =>
    ipcRenderer.invoke('confirm-cash-payment', orderId),

  queueOnlineOrder: (orderId: string) =>
    ipcRenderer.invoke('queue-online-order', orderId),

  reprintOrder: (orderId: string) =>
    ipcRenderer.invoke('reprint-order', orderId),

  getOrders: () =>
    ipcRenderer.invoke('get-orders'),

  getPrinters: () =>
    ipcRenderer.invoke('get-printers'),

  getQueueStatus: () =>
    ipcRenderer.invoke('get-queue-status'),

  setPrinter: (printerName: string) =>
    ipcRenderer.invoke('set-printer', printerName),

  getSelectedPrinter: () =>
    ipcRenderer.invoke('get-selected-printer'),

  getPrinterHealth: () =>
    ipcRenderer.invoke('get-printer-health'),

  printTestPage: (printerName: string) =>
    ipcRenderer.invoke('print-test-page', printerName),

  pingBackend: () =>
    ipcRenderer.invoke('ping-backend'),

  toggleSystem: (enabled: boolean) =>
    ipcRenderer.invoke('toggle-system', enabled),

  getHistory: () =>
    ipcRenderer.invoke('get-history'),

  clearHistory: () =>
    ipcRenderer.invoke('clear-history'),

  setOrderPrinter: (orderId: string, printerName: string) =>
    ipcRenderer.invoke('set-order-printer', orderId, printerName),

  // ── Queue controls ──────────────────────────────────────────────────────────
  pauseQueue: () =>
    ipcRenderer.invoke('pause-queue'),

  resumeQueue: () =>
    ipcRenderer.invoke('resume-queue'),

  cancelCurrentJob: () =>
    ipcRenderer.invoke('cancel-current-job'),

  retryQueue: () =>
    ipcRenderer.invoke('retry-queue'),

  // ── IPC event listeners ─────────────────────────────────────────────────────
  onNewOrder: (callback: (order: any) => void) => {
    ipcRenderer.on('new-order', (_event, order) => callback(order))
  },

  onQueueUpdate: (callback: (status: any) => void) => {
    ipcRenderer.on('queue-update', (_event, status) => callback(status))
  },

  onPrinterError: (callback: (data: { orderId: string; message: string }) => void) => {
    ipcRenderer.on('printer-error', (_event, data) => callback(data))
  },

  removeNewOrderListener: () => {
    ipcRenderer.removeAllListeners('new-order')
  },

  removeQueueUpdateListener: () => {
    ipcRenderer.removeAllListeners('queue-update')
  },

  removePrinterErrorListener: () => {
    ipcRenderer.removeAllListeners('printer-error')
  },
})