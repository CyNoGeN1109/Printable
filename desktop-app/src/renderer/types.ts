// FILE LOCATION: apps/desktop/src/renderer/types.ts
// Shared Order type + window.api global declaration
// Import this in any file that uses window.api or the Order type

export interface OrderFile {
  fileName: string
  fileUrl: string
  pages: number
  copies: number
  colour: boolean
  duplex: boolean
  orientation: string    // "portrait" | "landscape"
  pageRange: string      // "all" or "1-3,5"
}

export interface Order {
  _id: string
  orderId: string
  customerName?: string
  userName?: string
  selectedPrinter?: string
  files: OrderFile[]
  paymentMode: 'online' | 'offline'
  status: 'pending_payment' | 'paid' | 'printing' | 'completed' | 'cancelled' | 'error'
  totalAmount: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

export type PrintStage = 'idle' | 'fetching' | 'downloading' | 'printing' | 'completing' | 'paused'

export interface PrintProgress {
  stage: PrintStage
  percent: number
  stageStartedAt: number
  totalPages: number
  totalCopies: number
}

export interface QueueStatus {
  pending: number
  isProcessing: boolean
  isPaused: boolean
  currentOrderId?: string | null
  queue: string[]
  progress: PrintProgress
}

export interface AppConfig {
  backendUrl: string
  systemEnabled: boolean
  orderPrinters: Record<string, string>
  bwPrinter?: string
  colourPrinter?: string
  shopId?: string
  apiKey?: string
  history: Order[]
}

declare global {
  interface Window {
    api: {
      getConfig:          () => Promise<AppConfig>
      updateConfig:       (config: Partial<AppConfig>) => Promise<{ success: boolean }>
      confirmCashPayment: (orderId: string) => Promise<{ success: boolean; error?: string }>
      queueOnlineOrder:   (orderId: string) => Promise<{ success: boolean; error?: string }>
      reprintOrder:       (orderId: string) => Promise<{ success: boolean; error?: string }>
      getOrders:          () => Promise<Order[]>
      getPrinters:        () => Promise<any[]>
      getQueueStatus:     () => Promise<QueueStatus>
      setPrinter:         (printerName: string) => Promise<{ success: boolean }>
      getSelectedPrinter: () => Promise<string | null>
      // New methods
      toggleSystem:       (enabled: boolean) => Promise<{ success: boolean }>
      getHistory:         () => Promise<Order[]>
      clearHistory:       () => Promise<{ success: boolean }>
      setOrderPrinter:    (orderId: string, printerName: string) => Promise<{ success: boolean }>
      // Queue controls
      pauseQueue:         () => Promise<{ success: boolean }>
      resumeQueue:        () => Promise<{ success: boolean }>
      cancelCurrentJob:   () => Promise<{ success: boolean }>
      retryQueue:         () => Promise<{ success: boolean }>
      // IPC listeners
      onNewOrder:         (callback: (order: Order) => void) => void
      onQueueUpdate:      (callback: (status: QueueStatus) => void) => void
      onPrinterError:     (callback: (data: { orderId: string; message: string }) => void) => void
      removeNewOrderListener: () => void
      removeQueueUpdateListener: () => void
      removePrinterErrorListener: () => void
    }
  }
}