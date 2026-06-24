// FILE: apps/desktop/src/main/supplies.ts
// True printer-supply levels, layered so every printer type is covered:
//   1. WMI status flags (paper/toner low/out) — works on ANY Windows printer.
//   2. SNMP Printer-MIB (RFC 3805) — exact levels for network printers that
//      support it (standard across HP/Canon/Epson/Brother/Xerox/etc).
// A USB printer falls back to flags; a network printer gets exact percentages.

import { exec } from 'child_process'
import { promisify } from 'util'
import snmp from 'net-snmp'
import { getPrinterHealth, PrinterHealthStatus } from './printer'

const execAsync = promisify(exec)

export type SupplyFlag = 'ok' | 'low' | 'out' | 'unknown'
export type SupplyKind = 'toner' | 'ink' | 'drum' | 'waste' | 'paper' | 'other'

export interface Supply {
  name: string
  kind: SupplyKind
  percent: number | null   // exact level when known; null = present but unquantified
  color?: string           // black / cyan / magenta / yellow (parsed from name)
}

export interface PrinterSupplies {
  printer: string
  host: string | null
  source: 'snmp' | 'wmi'   // snmp = exact levels; wmi = coarse flags only
  reachable: boolean       // SNMP answered
  paperFlag: SupplyFlag    // from WMI (coarse, current detected state)
  tonerFlag: SupplyFlag
  statusMessage: string
  supplies: Supply[]       // exact entries (SNMP only)
}

// ── Printer-MIB OIDs (RFC 3805) ──────────────────────────────────────────────
const OID = {
  supplyDesc:  '1.3.6.1.2.1.43.11.1.1.6',   // prtMarkerSuppliesDescription
  supplyType:  '1.3.6.1.2.1.43.11.1.1.5',   // prtMarkerSuppliesType
  supplyMax:   '1.3.6.1.2.1.43.11.1.1.8',   // prtMarkerSuppliesMaxCapacity
  supplyLevel: '1.3.6.1.2.1.43.11.1.1.9',   // prtMarkerSuppliesLevel
  inputName:   '1.3.6.1.2.1.43.8.2.1.13',   // prtInputName
  inputMax:    '1.3.6.1.2.1.43.8.2.1.9',    // prtInputMaxCapacity
  inputLevel:  '1.3.6.1.2.1.43.8.2.1.10',   // prtInputCurrentLevel
}

const asStr = (v: any) => (Buffer.isBuffer(v) ? v.toString('utf8').trim() : String(v ?? '')).trim()

function kindFromType(type: number, name: string): SupplyKind {
  const n = name.toLowerCase()
  if (/drum|imaging|photoconductor|opc|transfer|fuser/.test(n)) return 'drum'
  if (/waste/.test(n)) return 'waste'
  if (type === 3 || type === 10) return 'toner'
  if (type === 5 || type === 6) return 'ink'
  if (/toner/.test(n)) return 'toner'
  if (/ink/.test(n)) return 'ink'
  return 'other'
}

function colorFromName(name: string): string | undefined {
  const n = name.toLowerCase()
  if (/black|\bbk\b|\bk\b/.test(n)) return 'black'
  if (/cyan|\bc\b/.test(n)) return 'cyan'
  if (/magenta|\bm\b/.test(n)) return 'magenta'
  if (/yellow|\by\b/.test(n)) return 'yellow'
  return undefined
}

// Walk an OID subtree → { index: value }
function walk(session: any, baseOid: string): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    const out: Record<string, any> = {}
    try {
      session.subtree(
        baseOid, 20,
        (varbinds: any[]) => {
          for (const vb of varbinds) {
            if (snmp.isVarbindError(vb)) continue
            out[vb.oid.slice(baseOid.length + 1)] = vb.value
          }
        },
        () => resolve(out),
      )
    } catch {
      resolve(out)
    }
  })
}

async function suppliesForHost(host: string): Promise<Supply[]> {
  const session = snmp.createSession(host, 'public', { timeout: 2500, retries: 0, version: snmp.Version2c })
  try {
    const result = await Promise.race([
      Promise.all([
        walk(session, OID.supplyDesc), walk(session, OID.supplyType),
        walk(session, OID.supplyMax), walk(session, OID.supplyLevel),
        walk(session, OID.inputName), walk(session, OID.inputMax), walk(session, OID.inputLevel),
      ]),
      new Promise<null>((r) => setTimeout(() => r(null), 4000)),
    ])
    if (!result) return []
    const [desc, type, max, level, iname, imax, ilevel] = result as Record<string, any>[]

    const supplies: Supply[] = []

    // Marker supplies (toner / ink / drum)
    for (const idx of Object.keys(level)) {
      const lv = Number(level[idx]); const mx = Number(max[idx])
      const name = asStr(desc[idx]) || 'Supply'
      const percent = lv >= 0 && mx > 0 ? Math.max(0, Math.min(100, Math.round((lv / mx) * 100))) : null
      supplies.push({ name, kind: kindFromType(Number(type[idx]), name), percent, color: colorFromName(name) })
    }

    // Paper input trays
    for (const idx of Object.keys(ilevel)) {
      const lv = Number(ilevel[idx]); const mx = Number(imax[idx])
      const name = asStr(iname[idx]) || 'Paper tray'
      const percent = lv >= 0 && mx > 0 ? Math.max(0, Math.min(100, Math.round((lv / mx) * 100))) : null
      supplies.push({ name, kind: 'paper', percent })
    }

    return supplies
  } catch {
    return []
  } finally {
    try { session.close() } catch { /* ignore */ }
  }
}

// Map a printer's Standard-TCP/IP port to its host/IP (network printers only)
async function getPrinterHosts(): Promise<Record<string, string>> {
  const ps = `
$ports = @{}
Get-PrinterPort -ErrorAction SilentlyContinue | ForEach-Object { if ($_.PrinterHostAddress) { $ports[$_.Name] = $_.PrinterHostAddress } }
Get-Printer -ErrorAction SilentlyContinue | ForEach-Object { [PSCustomObject]@{ N = $_.Name; H = $ports[$_.PortName] } } | ConvertTo-Json -Compress
`.trim()
  try {
    const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`, { maxBuffer: 1024 * 1024 })
    const raw = JSON.parse(stdout.trim() || '[]')
    const rows = Array.isArray(raw) ? raw : [raw]
    const map: Record<string, string> = {}
    for (const r of rows) if (r?.N && r?.H) map[r.N] = String(r.H)
    return map
  } catch {
    return {}
  }
}

function flagFor(status: PrinterHealthStatus, kind: 'paper' | 'toner'): SupplyFlag {
  const ok = status === 'ready' || status === 'printing'
  if (kind === 'paper') {
    if (status === 'paper_out') return 'out'
    if (status === 'paper_low') return 'low'
  } else {
    if (status === 'toner_out') return 'out'
    if (status === 'toner_low') return 'low'
  }
  return ok ? 'ok' : 'unknown'
}

export async function getPrinterSupplies(): Promise<PrinterSupplies[]> {
  // WMI health is the universal flag layer (every Windows printer); on non-Windows
  // it returns an empty/unknown list, so this degrades cleanly in dev.
  const health = await getPrinterHealth()
  const hosts = process.platform === 'win32' ? await getPrinterHosts() : {}

  return Promise.all(
    health.map(async (h): Promise<PrinterSupplies> => {
      const host = hosts[h.name] || null
      let supplies: Supply[] = []
      if (host) {
        try { supplies = await suppliesForHost(host) } catch { /* ignore */ }
      }
      return {
        printer: h.name,
        host,
        source: supplies.length ? 'snmp' : 'wmi',
        reachable: supplies.length > 0,
        paperFlag: flagFor(h.status, 'paper'),
        tonerFlag: flagFor(h.status, 'toner'),
        statusMessage: h.message,
        supplies,
      }
    }),
  )
}
