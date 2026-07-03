import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config()

let configPath: string | null = null
function getConfigPath(): string {
  if (!configPath) configPath = path.join(app.getPath('userData'), 'config.json')
  return configPath
}

export interface Config {
  backendUrl: string
  systemEnabled: boolean
  orderPrinters: Record<string, string> // orderId -> printerName (manual override)
  bwPrinter?: string                     // default printer for B&W files
  colourPrinter?: string                 // default printer for colour files
  shopId?: string                        // this shop's code (display only)
  shopName?: string                      // friendly shop name for branding
  apiKey?: string                        // this shop's secret — scopes orders to this shop
  // ── Vendor software settings ──
  soundAlerts?: boolean                  // chime on new order
  runOnStartup?: boolean                 // auto-launch with Windows
  finishing?: FinishingPrices            // add-on charges for binding etc.
  staff?: StaffMember[]                  // counter operators
  activeStaffId?: string                 // who is on shift right now
  shiftStartedAt?: string                // ISO time the current shift began
  history: any[]
}

export interface StaffMember {
  id: string
  name: string
  pin: string
}

export interface FinishingPrices {
  softBinding?: number
  spiralBinding?: number
  lamination?: number
  stapling?: number
}

const defaultConfig: Config = {
  backendUrl: process.env.BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:4000',
  systemEnabled: true,
  orderPrinters: {},
  soundAlerts: true,
  runOnStartup: false,
  finishing: { softBinding: 30, spiralBinding: 40, lamination: 20, stapling: 0 },
  history: []
}

export function getConfig(): Config {
  try {
    if (fs.existsSync(getConfigPath())) {
      const data = fs.readFileSync(getConfigPath(), 'utf-8')
      const parsed = JSON.parse(data)
      // Force environment variable to take precedence over saved config
      if (process.env.BACKEND_URL) {
        parsed.backendUrl = process.env.BACKEND_URL
      }
      return { ...defaultConfig, ...parsed }
    }
  } catch (err) {
    console.error('[Store] Failed to read config:', err)
  }
  return defaultConfig
}

export function setConfig(newConfig: Partial<Config>) {
  try {
    const current = getConfig()
    const updated = { ...current, ...newConfig }
    fs.writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2))
    console.log('[Store] Config updated:', updated)
  } catch (err) {
    console.error('[Store] Failed to save config:', err)
  }
}
