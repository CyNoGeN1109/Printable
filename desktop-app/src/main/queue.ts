// FILE LOCATION: apps/desktop/src/main/queue.ts
// Processes one print job at a time.
// Tracks fine-grained stages so the renderer can show a live progress bar.
// Supports pause / resume / cancel controls.

import { downloadFile, cleanupFile } from './downloader'
import { printFile, PrinterError } from './printer'
import { updateOrderStatus, getOrder } from './api'
import { BrowserWindow, Notification } from 'electron'

// ── Types ────────────────────────────────────────────────────────────────────

export type PrintStage =
  | 'idle'
  | 'fetching'      // 10% — loading order from backend
  | 'downloading'   // 35% — downloading PDF from Cloudinary
  | 'printing'      // 65% — job sent to OS print spooler (animates to 90%)
  | 'completing'    // 95% — updating backend status
  | 'paused'        // ⏸  — queue is paused by user

const STAGE_PERCENT: Record<PrintStage, number> = {
  idle:        0,
  fetching:    10,
  downloading: 35,
  printing:    65,
  completing:  95,
  paused:      0,
}

const queue: string[] = []     // order IDs waiting to be printed
let isProcessing = false
let isPaused = false           // ⏸ user-requested pause
let isCancelRequested = false  // ✕ cancel the current job
let currentStage: PrintStage = 'idle'
let currentPages = 0
let currentCopies = 0
let stageStartedAt = 0        // epoch ms when current stage began

// ── Broadcast helpers ────────────────────────────────────────────────────────

function getWindows() {
  return BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
}

function broadcastQueueUpdate() {
  const status = getQueueStatus()
  getWindows().forEach((w) => w.webContents.send('queue-update', status))
}

function broadcastPrinterError(orderId: string, message: string) {
  console.error(`[Queue] Printer error for ${orderId}: ${message}`)
  getWindows().forEach((w) =>
    w.webContents.send('printer-error', { orderId, message })
  )
}

function setStage(stage: PrintStage) {
  currentStage = stage
  stageStartedAt = Date.now()
  console.log(`[Queue] Stage: ${stage} (${STAGE_PERCENT[stage]}%)`)
  broadcastQueueUpdate()
}

// ── Queue management ─────────────────────────────────────────────────────────

export function addToQueue(orderId: string) {
  // Prevent duplicates in queue or adding current job again
  if (queue.includes(orderId) || (isProcessing && queue[0] === orderId)) {
    console.log(`[Queue] Order ${orderId} is already in queue or processing, skipping duplicate add.`)
    return
  }
  
  console.log(`[Queue] Adding order ${orderId}`)
  queue.push(orderId)
  broadcastQueueUpdate()
  if (!isProcessing && !isPaused) processNext()
}

// ── Pause / Resume ────────────────────────────────────────────────────────────

/** Pause after the current job finishes (or immediately if idle). */
export function pauseQueue() {
  if (isPaused) return
  isPaused = true
  console.log('[Queue] ⏸  Paused — will stop after current job (if any)')
  // If idle, reflect immediately
  if (!isProcessing) {
    currentStage = 'paused'
    broadcastQueueUpdate()
  }
}

/** Resume processing queued jobs. */
export function resumeQueue() {
  if (!isPaused) return
  isPaused = false
  console.log('[Queue] ▶  Resumed')
  if (!isProcessing && queue.length > 0) {
    processNext()
  } else {
    // still processing — next job will continue automatically
    currentStage = isProcessing ? currentStage : 'idle'
    broadcastQueueUpdate()
  }
}

/** Cancel the currently printing job and skip it. */
export function cancelCurrentJob() {
  if (!isProcessing) return
  isCancelRequested = true
  console.log('[Queue] ✕  Cancel requested for current job')
}

// ── Core processor ───────────────────────────────────────────────────────────
import { getConfig, setConfig } from './store'

async function processNext() {
  const config = getConfig()

  if (isPaused || !config.systemEnabled) {
    console.log('[Queue] ⏸  Paused or System Disabled — not starting next job')
    currentStage = 'paused'
    broadcastQueueUpdate()
    return
  }

  if (queue.length === 0) {
    isProcessing = false
    currentStage = 'idle'
    currentPages = 0
    currentCopies = 0
    console.log('[Queue] Empty — waiting for next order')
    broadcastQueueUpdate()
    return
  }

  isProcessing = true
  isCancelRequested = false
  const orderId = queue[0]
  console.log(`[Queue] Processing order: ${orderId}`)

  let isPrinterError = false
  let processedOrder: any = null

  try {
    // Stage 1: Fetch order details
    setStage('fetching')
    const order = await getOrder(orderId)
    processedOrder = order
    
    const files = order.files || []

    // Calculate total print units for the UI progress bar estimate
    currentPages = files.reduce((sum: number, f: any) => sum + ((f.pages || 0) * (f.copies || 1)), 0)
    currentCopies = 1

    // Check for cancel between stages
    if (isCancelRequested) throw new Error('Cancelled by user')

    // Determine target printer for THIS order
    const orderPrinter = config.orderPrinters[orderId] || null

    // Stage 2: Mark as printing on backend
    await updateOrderStatus(orderId, 'printing')

    // Stage 3 & 4: Process each file in the order
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileIdentifier = `${orderId}_${i}`

      // Check for cancel before processing each file
      if (isCancelRequested) break

      // Download PDF from Cloudinary
      setStage('downloading')
      console.log(`[Queue] Downloading file ${i + 1}/${files.length}: ${file.fileName}`)
      const localPath = await downloadFile(file.fileUrl, fileIdentifier, file.fileName)

      // Check for cancel before sending to printer
      if (isCancelRequested) {
        cleanupFile(fileIdentifier, file.fileName)
        break
      }

      // Send to physical printer. Auto-route by colour: a manual per-order override
      // wins; otherwise colour files go to the colour printer and B&W to the B&W one.
      const targetPrinter = orderPrinter || (file.colour ? config.colourPrinter : config.bwPrinter) || undefined
      setStage('printing')
      console.log(`[Queue] Printing file ${i + 1}/${files.length}: ${file.fileName} → ${targetPrinter || 'system default'}`)
      await printFile(localPath, {
        copies: file.copies,
        colour: file.colour,
        duplex: file.duplex,
        orientation: file.orientation || 'portrait',
        pageRange: file.pageRange || 'all',
        printerName: targetPrinter
      })

      // Cleanup local file
      cleanupFile(fileIdentifier, file.fileName)
    }

    if (isCancelRequested) {
      await updateOrderStatus(orderId, 'paid').catch(() => {})
      console.log(`[Queue] Order ${orderId} cancelled by user`)
    } else {
      // Stage 5: mark completed
      setStage('completing')
      await updateOrderStatus(orderId, 'completed')
      
      // Save to history
      const currentHistory = getConfig().history || []
      const newHistory = [{
        ...order,
        completedAt: new Date().toISOString(),
        status: 'completed'
      }, ...currentHistory].slice(0, 50) // Keep last 50
      setConfig({ history: newHistory })

      // Decrement paper inventory by sheets actually printed (duplex = 2 pages/sheet)
      const inv = getConfig().inventory
      if (inv && typeof inv.paperSheets === 'number') {
        const sheets = files.reduce((s: number, f: any) => {
          const perCopy = f.duplex ? Math.ceil((f.pages || 1) / 2) : (f.pages || 1)
          return s + perCopy * (f.copies || 1)
        }, 0)
        setConfig({ inventory: { ...inv, paperSheets: Math.max(0, (inv.paperSheets || 0) - sheets) } })
      }

      console.log(`[Queue] Order ${orderId} completed`)
      new Notification({ 
        title: 'Print Successful', 
        body: `Order ${orderId} has been printed.` 
      }).show()
    }

  } catch (err: any) {
    if (err instanceof PrinterError) {
      isPrinterError = true
      await updateOrderStatus(orderId, 'paid').catch(() => {})
      broadcastPrinterError(orderId, err.message)
      new Notification({ 
        title: 'Printer Error', 
        body: `Order ${orderId}: ${err.message}` 
      }).show()
      isProcessing = false
      currentStage = 'idle'
      broadcastQueueUpdate()
      return
    } else {
      console.error(`[Queue] Error processing order ${orderId}:`, err)
      
      // Save failed/cancelled to history too
      if (processedOrder) {
        const currentHistory = getConfig().history || []
        const newHistory = [{
          ...processedOrder,
          completedAt: new Date().toISOString(),
          status: isCancelRequested ? 'cancelled' : 'error',
          errorMessage: err.message
        }, ...currentHistory].slice(0, 50)
        setConfig({ history: newHistory })
      }

      // If cancelled by user, mark as paid so it can be reprinted later
      if (isCancelRequested) {
        await updateOrderStatus(orderId, 'paid').catch(() => {})
      } else {
        await updateOrderStatus(orderId, 'cancelled').catch(() => {})
      }
    }
  } finally {
    if (!isPrinterError) {
      queue.shift()
      isCancelRequested = false
      isProcessing = false
      processNext()
    }
  }
}

export function retryQueue() {
  if (!isProcessing && queue.length > 0) {
    console.log('[Queue] Retrying after printer error...')
    processNext()
  }
}

export function getQueueStatus() {
  return {
    pending:        queue.length > 1 ? queue.length - 1 : 0,
    isProcessing,
    isPaused,
    currentOrderId: isProcessing ? queue[0] : null,
    queue:          isProcessing ? queue.slice(1) : queue,
    // Progress info for the UI progress bar
    progress: {
      stage:        isPaused && !isProcessing ? 'paused' as PrintStage : currentStage,
      percent:      STAGE_PERCENT[currentStage],
      stageStartedAt,
      totalPages:   currentPages,
      totalCopies:  currentCopies,
    },
  }
}