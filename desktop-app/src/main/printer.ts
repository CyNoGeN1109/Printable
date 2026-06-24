// FILE LOCATION: apps/desktop/src/main/printer.ts
// SumatraPDF-based printing with MuPDF for instant B&W conversion

import { getPrinters, getDefaultPrinter as getDefault } from 'pdf-to-printer'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec, execFile } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

interface PrintOptions {
  copies: number
  colour: boolean
  duplex?: boolean
  orientation?: 'portrait' | 'landscape'
  pageRange?: string    // "all" or "1-3,5" etc.
  printerName?: string
  paperSize?: string    // e.g., "A4"
}

let selectedPrinter: string | null = process.env.PRINTER_NAME || null

export function setSelectedPrinter(name: string | null) {
  selectedPrinter = name
  console.log(`[Printer] Active printer set to: ${name}`)
}

export function getSelectedPrinter(): string | null {
  return selectedPrinter
}

export async function getAvailablePrinters(): Promise<any[]> {
  try {
    return await getPrinters()
  } catch (err) {
    console.error('[Printer] Failed to enumerate printers:', err)
    return []
  }
}

export async function getDefaultPrinter(): Promise<any> {
  try {
    return await getDefault()
  } catch (err) {
    console.error('[Printer] Failed to get default printer:', err)
    return null
  }
}

// ─── Printer health ──────────────────────────────────────────────────────────
// The single most-requested vendor feature: know *at a glance* if a printer is
// out of paper / low on toner / jammed / offline, plus how many jobs are queued
// on it — so the shop never silently fails a print at peak hours.

export type PrinterHealthStatus =
  | 'ready' | 'printing' | 'offline' | 'paper_out' | 'paper_low'
  | 'toner_out' | 'toner_low' | 'jammed' | 'door_open' | 'bin_full' | 'error' | 'unknown'

export interface PrinterHealth {
  name: string
  isDefault: boolean
  status: PrinterHealthStatus
  ok: boolean          // true only when ready/printing
  message: string      // friendly, vendor-facing
  queuedJobs: number
}

// Win32_Printer.DetectedErrorState → our status (problem states take priority)
const ERROR_STATE: Record<number, { status: PrinterHealthStatus; message: string }> = {
  3:  { status: 'paper_low',  message: 'Paper running low' },
  4:  { status: 'paper_out',  message: 'Out of paper — refill tray' },
  5:  { status: 'toner_low',  message: 'Toner / ink low' },
  6:  { status: 'toner_out',  message: 'Out of toner / ink' },
  7:  { status: 'door_open',  message: 'Printer door / cover open' },
  8:  { status: 'jammed',     message: 'Paper jam — clear the printer' },
  9:  { status: 'offline',    message: 'Printer offline' },
  10: { status: 'error',      message: 'Printer needs service' },
  11: { status: 'bin_full',   message: 'Output tray full — remove prints' },
}

export async function getPrinterHealth(): Promise<PrinterHealth[]> {
  // Non-Windows (dev on macOS): enumerate names so the UI renders, status unknown.
  if (process.platform !== 'win32') {
    const list = await getAvailablePrinters()
    return list.map((p: any) => {
      const name = typeof p === 'string' ? p : p.name || p.deviceId || 'Unknown'
      return { name, isDefault: false, status: 'unknown' as PrinterHealthStatus, ok: false, message: 'Status only available on Windows', queuedJobs: 0 }
    })
  }

  const ps = `
$printers = Get-CimInstance Win32_Printer | Select-Object Name,PrinterStatus,DetectedErrorState,WorkOffline,Default
$jobs = @(Get-CimInstance Win32_PrintJob | ForEach-Object { ($_.Name -split ',')[0] })
$out = foreach ($p in $printers) {
  $count = @($jobs | Where-Object { $_ -eq $p.Name }).Count
  [PSCustomObject]@{ Name=$p.Name; PrinterStatus=$p.PrinterStatus; DetectedErrorState=$p.DetectedErrorState; WorkOffline=[bool]$p.WorkOffline; Default=[bool]$p.Default; QueuedJobs=$count }
}
$out | ConvertTo-Json -Compress
`.trim()

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`, { maxBuffer: 1024 * 1024 })
    const raw = JSON.parse(stdout.trim() || '[]')
    const rows = Array.isArray(raw) ? raw : [raw]
    return rows.map((r: any): PrinterHealth => {
      const errState = Number(r.DetectedErrorState)
      const mapped = ERROR_STATE[errState]
      let status: PrinterHealthStatus = 'ready'
      let message = 'Ready'
      if (r.WorkOffline) { status = 'offline'; message = 'Printer offline' }
      if (mapped && errState !== 2) { status = mapped.status; message = mapped.message }
      else if (Number(r.PrinterStatus) === 4) { status = 'printing'; message = 'Printing…' }
      return {
        name: r.Name,
        isDefault: !!r.Default,
        status,
        ok: status === 'ready' || status === 'printing',
        message,
        queuedJobs: Number(r.QueuedJobs) || 0,
      }
    })
  } catch (err) {
    console.error('[Printer] Health query failed:', err)
    // Fall back to a plain list so the UI still works
    const list = await getAvailablePrinters()
    return list.map((p: any) => {
      const name = typeof p === 'string' ? p : p.name || 'Unknown'
      return { name, isDefault: false, status: 'unknown' as PrinterHealthStatus, ok: false, message: 'Could not read status', queuedJobs: 0 }
    })
  }
}

// Send a Windows test page to a printer (vendor "is this printer working?" check)
export async function printTestPage(printerName: string): Promise<void> {
  if (process.platform !== 'win32') throw new Error('Test page only supported on Windows')
  const ps = `$p = Get-CimInstance -Class Win32_Printer -Filter "Name='${printerName.replace(/'/g, "''")}'"; $p.PrintTestPage()`
  await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`)
}

export class PrinterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrinterError'
  }
}

export async function printFile(localPath: string, options: PrintOptions): Promise<void> {
  let currentPath = localPath
  const ext = path.extname(localPath).toLowerCase()

  // ── DOCX/PPTX → PDF Auto-Conversion ───────────────────────────────────
  if (ext === '.docx' || ext === '.doc') {
    const pdfPath = localPath.replace(ext, '.pdf')
    try {
      console.log(`[Printer] Converting Word document to PDF...`)
      const absIn = path.resolve(localPath)
      const absOut = path.resolve(pdfPath)
      const psCmd = `$word = New-Object -ComObject Word.Application; $doc = $word.Documents.Open('${absIn.replace(/'/g, "''")}'); $doc.SaveAs([ref]'${absOut.replace(/'/g, "''")}', [ref]17); $doc.Close(); $word.Quit();`
      await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`)
      currentPath = pdfPath
      console.log(`[Printer] Word → PDF conversion successful`)
    } catch {
      const librePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
      if (fs.existsSync(librePath)) {
        console.log(`[Printer] Using LibreOffice fallback...`)
        await execAsync(`"${librePath}" --headless --convert-to pdf --outdir "${path.dirname(pdfPath)}" "${localPath}"`)
        currentPath = pdfPath
      } else {
        throw new PrinterError('DOCX conversion failed: MS Word or LibreOffice required.')
      }
    }
  } else if (ext === '.pptx' || ext === '.ppt') {
    const pdfPath = localPath.replace(ext, '.pdf')
    try {
      console.log(`[Printer] Converting PowerPoint document to PDF...`)
      const absIn = path.resolve(localPath)
      const absOut = path.resolve(pdfPath)
      // ReadOnly=$true, Untitled=$false, WithWindow=$false
      const psCmd = `$ppt = New-Object -ComObject PowerPoint.Application; $pres = $ppt.Presentations.Open('${absIn.replace(/'/g, "''")}', $true, $false, $false); $pres.SaveAs('${absOut.replace(/'/g, "''")}', 32); $pres.Close(); $ppt.Quit();`
      await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`)
      currentPath = pdfPath
      console.log(`[Printer] PowerPoint → PDF conversion successful`)
    } catch {
      const librePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
      if (fs.existsSync(librePath)) {
        console.log(`[Printer] Using LibreOffice fallback for PowerPoint...`)
        await execAsync(`"${librePath}" --headless --convert-to pdf --outdir "${path.dirname(pdfPath)}" "${localPath}"`)
        currentPath = pdfPath
      } else {
        throw new PrinterError('PPTX conversion failed: MS PowerPoint or LibreOffice required.')
      }
    }
  } else {
    const supported = ['.pdf', '.xps', '.djvu', '.chm', '.cbz', '.cbr', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.tiff', '.pptx', '.ppt']
    if (!supported.includes(ext)) {
      throw new PrinterError(`Unsupported format: ${ext}. Supported: PDF, Images, DOCX, PPTX.`)
    }
  }

  console.log(`[Printer] Printing: ${currentPath}`)
  console.log(`[Printer] Options:`, JSON.stringify(options))

  // ── MuPDF Grayscale Conversion (B&W orders only) ──────────────────────
  // mutool recolor is 10-50x faster than Ghostscript
  // Command: mutool recolor -c gray -o output.pdf input.pdf
  const currentExt = path.extname(currentPath).toLowerCase()
  if (!options.colour && currentExt === '.pdf') {
    console.log(`[Printer] B&W order — converting to grayscale via MuPDF...`)
    const bwPath = currentPath.replace('.pdf', '_bw.pdf')
    try {
      let mutoolPath: string
      if (app.isPackaged) {
        mutoolPath = path.join(process.resourcesPath, 'mupdf', 'mutool.exe')
      } else {
        mutoolPath = path.join(app.getAppPath(), 'mupdf', 'mutool.exe')
      }

      if (!fs.existsSync(mutoolPath)) {
        throw new Error(`mutool.exe not found at: ${mutoolPath}`)
      }

      const startTime = Date.now()
      await execFileAsync(mutoolPath, ['recolor', '-c', 'gray', '-o', bwPath, currentPath])
      const elapsed = Date.now() - startTime

      currentPath = bwPath
      console.log(`[Printer] MuPDF grayscale conversion done in ${elapsed}ms`)
    } catch (e: any) {
      console.error(`[Printer] MuPDF conversion failed:`, e)
      // Non-fatal: fall through and print original (color) with monochrome flag
      console.warn(`[Printer] Falling back to SumatraPDF monochrome flag`)
    }
  }

  // ── Resolve target printer ────────────────────────────────────────────
  const targetPrinterName = options.printerName || selectedPrinter || undefined
  let exactSystemName: string | undefined

  const printers = await getAvailablePrinters()
  if (printers.length === 0) {
    throw new PrinterError('No printers connected. Please connect a printer and try again.')
  }

  if (targetPrinterName) {
    const target = targetPrinterName.toLowerCase()
    const match = printers.find((p: any) => {
      const name = (p.name || p.deviceId || '').toLowerCase()
      return name === target || name.includes(target) || target.includes(name)
    })
    if (match) {
      exactSystemName = match.name || match.deviceId
    } else {
      const list = printers.map((p: any) => p.name || p.deviceId || 'Unknown').join(', ')
      throw new PrinterError(`Printer "${targetPrinterName}" not available. Available: ${list}`)
    }
  }

  // ── Locate SumatraPDF ─────────────────────────────────────────────────
  let sumatraPath: string
  if (app.isPackaged) {
    const asar = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe')
    const raw = path.join(process.resourcesPath, 'app', 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe')
    sumatraPath = fs.existsSync(asar) ? asar : raw
  } else {
    sumatraPath = path.join(app.getAppPath(), 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe')
  }

  // ── Build SumatraPDF -print-settings (official docs) ──────────────────
  const settings: string[] = []

  if (options.pageRange && options.pageRange.toLowerCase() !== 'all') {
    settings.push(options.pageRange.replace(/\s/g, ''))
  }
  if (options.orientation === 'landscape') settings.push('landscape')
  settings.push('fit')
  settings.push(options.colour ? 'color' : 'monochrome')
  settings.push(options.duplex ? 'duplexlong' : 'simplex')
  settings.push(`paper=${options.paperSize || 'A4'}`)
  if (options.copies > 1) settings.push(`${options.copies}x`)

  const settingsStr = settings.join(',')
  console.log(`[Printer] SumatraPDF settings: "${settingsStr}"`)

  // ── Execute SumatraPDF ────────────────────────────────────────────────
  const isVirtual = (exactSystemName || '').toLowerCase().match(/pdf|xps/)
  const args: string[] = exactSystemName
    ? ['-print-to', exactSystemName]
    : ['-print-to-default']

  args.push('-print-settings', settingsStr)
  if (!isVirtual) args.push('-silent')
  args.push(currentPath)

  console.log(`[Printer] Executing: "${sumatraPath}" ${args.join(' ')}`)

  try {
    await execFileAsync(sumatraPath, args)
    console.log(`[Printer] Print job sent successfully`)
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes('SumatraPDF') && !msg.includes('error')) {
      console.log(`[Printer] Completed with warnings: ${msg}`)
      return
    }
    throw new PrinterError(`Print job failed: ${msg}`)
  }
}