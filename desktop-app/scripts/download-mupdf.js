const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'mupdf');
const targetExe = path.join(targetDir, 'mutool.exe');

if (fs.existsSync(targetExe)) {
  console.log('mupdf/mutool.exe already exists. Skipping download.');
  process.exit(0);
}

console.log('Downloading MuPDF (mutool.exe) for Windows...');

const psScript = `
  $ErrorActionPreference = 'Stop'
  New-Item -ItemType Directory -Force -Path "mupdf" | Out-Null
  Write-Host "Downloading MuPDF 1.24.0..."
  Invoke-WebRequest -Uri "https://casper.mupdf.com/downloads/archive/mupdf-1.24.0-windows.zip" -OutFile "mupdf.zip"
  Write-Host "Extracting..."
  Expand-Archive -Path "mupdf.zip" -DestinationPath "mupdf_extracted" -Force
  Write-Host "Moving mutool.exe..."
  Move-Item -Path "mupdf_extracted\\mupdf-1.24.0-windows\\mutool.exe" -Destination "mupdf\\mutool.exe" -Force
  Write-Host "Cleaning up..."
  Remove-Item -Path "mupdf.zip" -Force
  Remove-Item -Path "mupdf_extracted" -Recurse -Force
`;

try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`, { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  console.log('MuPDF downloaded successfully.');
} catch (error) {
  console.error('Failed to download MuPDF:', error.message);
  process.exit(1);
}
