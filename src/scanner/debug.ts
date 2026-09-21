export type DebugSnapshot = {
  rawText?: string
  confidence?: number
  parser: string
  lookup?: string
  error?: string
}

export function isDebugMode(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1'
}

export function createDebugGate(enabled: boolean) {
  let paused = false
  return {
    canScan: () => !enabled || !paused,
    pause: () => { if (enabled) paused = true },
    resume: () => { paused = false },
  }
}

export function formatDebugSnapshot(snapshot: DebugSnapshot): string[] {
  const lines: string[] = []
  if (snapshot.rawText !== undefined) lines.push(`OCR: ${snapshot.rawText || '—'}`)
  if (snapshot.confidence !== undefined) lines.push(`اطمینان: ${Math.round(snapshot.confidence)}`)
  lines.push(`تحلیل پلاک: ${snapshot.parser}`)
  if (snapshot.lookup !== undefined) lines.push(`مکان: ${snapshot.lookup}`)
  if (snapshot.error !== undefined) lines.push(`خطا: ${snapshot.error}`)
  return lines
}
