import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config()

const configPath = path.join(app.getPath('userData'), 'config.json')

export interface Config {
  backendUrl: string
  systemEnabled: boolean
  orderPrinters: Record<string, string> // orderId -> printerName (manual override)
  bwPrinter?: string                     // default printer for B&W files
  colourPrinter?: string                 // default printer for colour files
  shopId?: string                        // this shop's code (display only)
  apiKey?: string                        // this shop's secret — scopes orders to this shop
  history: any[]
}

const defaultConfig: Config = {
  backendUrl: process.env.BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:4000',
  systemEnabled: true,
  orderPrinters: {},
  history: []
}

export function getConfig(): Config {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
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
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2))
    console.log('[Store] Config updated:', updated)
  } catch (err) {
    console.error('[Store] Failed to save config:', err)
  }
}
