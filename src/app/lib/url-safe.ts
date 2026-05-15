// URL safety helpers — pure functions, safe to import from client components.
// (Server-only helpers like SSRF protection and rate limiting live in security.ts.)

// Returns the URL if it's safe to render in <a href>, otherwise undefined.
// Blocks javascript:, data:, vbscript:, file:, etc. — preserves http(s), mailto, and same-origin paths.
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  return undefined
}

// Returns the URL if it's a safe http(s) image source, otherwise undefined.
export function safeImageSrc(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  return undefined
}

// Escape Postgres LIKE/ILIKE metacharacters so user input can't inject wildcards.
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&')
}
