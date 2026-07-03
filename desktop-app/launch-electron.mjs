import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = '/Users/darshdave/Printable/SourceCode/desktop-app';
const SHOT_DIR = '/private/tmp/claude-501/-Users-darshdave-Printable-SourceCode/6242daed-4591-4b35-94e6-6a1f4d14cde3/scratchpad';

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

console.log('Launching Electron app...');
const app = await electron.launch({
  executablePath: electronBin,
  args: [APP_DIR],
  timeout: 30_000,
});

console.log('Waiting for window...');
await new Promise(r => setTimeout(r, 5000));

const windows = app.windows();
console.log('Windows:', windows.length);
for (const w of windows) console.log(' ', w.url());

const page = windows.find(w => !w.url().startsWith('devtools://')) ?? await app.firstWindow();
console.log('Using page:', page.url());

await page.waitForLoadState('domcontentloaded').catch(() => {});
await new Promise(r => setTimeout(r, 2000));

const shot = path.join(SHOT_DIR, 'desktop-app.png');
await page.screenshot({ path: shot, fullPage: false });
console.log('Screenshot saved:', shot);

await app.close();
process.exit(0);
