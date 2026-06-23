// FILE LOCATION: printx_desktop/src/main/index.ts

import { app, BrowserWindow } from 'electron'
import path from 'path'
import * as dotenv from 'dotenv'
import dns from 'dns'

// Force IPv4 globally to fix connection drops and timeouts on Windows
dns.setDefaultResultOrder('ipv4first')

dotenv.config()
import { startPolling } from './poller'
import { setupIPC, recoverStuckOrders } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Printable',
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0F1115', // Deep Obsidian
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // vite-plugin-electron sets this env variable automatically in dev
  if (process.env['VITE_DEV_SERVER_URL']) {
    mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
    mainWindow.webContents.openDevTools()   // ← auto-opens DevTools so you can see errors
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  // Explicitly log the backend URL being used to help with debugging
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:4000'
  console.log(`[Main] Using Backend URL: ${backendUrl}`)

  createWindow()
  setupIPC()
  startPolling(mainWindow!)

  // Recover any orders that were stuck in 'printing' status from a previous session
  await recoverStuckOrders()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})