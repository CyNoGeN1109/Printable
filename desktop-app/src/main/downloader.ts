// FILE LOCATION: apps/desktop/src/main/downloader.ts
// Fetches file from Cloudinary URL and saves to local temp directory
// Returns local file path for printer.ts to use

import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import axios from 'axios'

export async function downloadFile(fileUrl: string, identifier: string, originalFileName: string): Promise<string> {
  console.log(`[Downloader] Fetching file: ${identifier} (${originalFileName})`)
  
  // Extract extension from original filename
  const ext = path.extname(originalFileName) || '.pdf'
  const downloadsDir = path.join(app.getPath('temp'), 'printx_temp')
  
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true })
  }

  const fileName = `file_${identifier}${ext}`
  const localPath = path.join(downloadsDir, fileName)

  // If already downloaded, skip
  if (fs.existsSync(localPath)) {
    return localPath
  }

  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds for files
    })
    
    fs.writeFileSync(localPath, Buffer.from(response.data))
    return localPath
  } catch (err: any) {
    throw new Error(`Download failed: ${err.message}`)
  }
}

export function cleanupFile(identifier: string, originalFileName: string) {
  const ext = path.extname(originalFileName) || '.pdf'
  const downloadsDir = path.join(app.getPath('temp'), 'printx_temp')
  const localPath = path.join(downloadsDir, `file_${identifier}${ext}`)

  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath)
  }
}