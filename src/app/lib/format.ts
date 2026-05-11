// Centralized display formatters. Import these instead of redefining per page.

// Time display per CLAUDE.md brand voice:
//   25  -> "25 min"
//   60  -> "1 hr"
//   90  -> "1 hr 30 min"
//   180 -> "3 hrs"
export function formatTime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const hLabel = h === 1 ? 'hr' : 'hrs'
  if (m === 0) return `${h} ${hLabel}`
  return `${h} hr ${m} min`
}

// Number display for counts > 999.
//   2847 -> "2,847"
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return ''
  return n.toLocaleString('en-US')
}

// Safe localStorage access — throws in Firefox private mode and when storage
// is disabled by the user. Use these everywhere instead of raw localStorage.
export function safeGetItem(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
  } catch {
    return null
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key)
  } catch {
    // swallow
  }
}

// Fisher-Yates shuffle. The common `arr.sort(() => Math.random() - 0.5)`
// pattern is biased — use this instead.
export function shuffle<T>(arr: T[]): T[] {
  const result = arr.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
