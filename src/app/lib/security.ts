// Server-side security helpers. Imports Node built-ins (net, dns, crypto), so
// this file must never be pulled into a client component bundle. Client code
// should import from `./url-safe` instead.

import 'server-only'
import crypto from 'node:crypto'
import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'
import { NextRequest, NextResponse } from 'next/server'

export { safeHref, safeImageSrc, escapeLike } from './url-safe'

// ─────────────────────────────────────────────────────────────────────────────
// SSRF protection
// ─────────────────────────────────────────────────────────────────────────────

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64.0.0/10
  /^22[4-9]\./, /^23\d\./, /^24\d\./, /^25\d\./, // multicast/reserved
]

const PRIVATE_IPV6 = [
  /^::1$/,
  /^::$/,
  /^::ffff:/i,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
]

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) return PRIVATE_IPV6.some(r => r.test(ip))
  return PRIVATE_IPV4.some(r => r.test(ip))
}

// Returns true if the URL points to localhost, a private IP, or fails DNS.
// Use this before fetching attacker-controlled URLs to block SSRF.
export async function isUnsafeFetchTarget(url: string): Promise<boolean> {
  let parsed: URL
  try { parsed = new URL(url) } catch { return true }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true
  const host = parsed.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (host === 'metadata.google.internal' || host === 'metadata') return true
  if (isIP(host)) return isPrivateIp(host)
  try {
    const records = await lookup(host, { all: true })
    if (records.length === 0) return true
    return records.some(r => isPrivateIp(r.address))
  } catch {
    return true
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting (in-memory, per serverless instance)
// ─────────────────────────────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function pruneBuckets(now: number) {
  if (buckets.size < 10_000) return
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  pruneBuckets(now)
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (bucket.count >= max) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count++
  return { ok: true }
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export function applyRateLimit(req: NextRequest, key: string, max: number, windowMs: number): NextResponse | null {
  const result = rateLimit(`${key}:${clientIp(req)}`, max, windowMs)
  if (result.ok) return null
  return NextResponse.json(
    { error: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin sessions
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_SESSION_COOKIE = 'recdex-admin'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000

function getAdminSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null
}

export function verifyAdminPassword(provided: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || typeof provided !== 'string' || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try { return crypto.timingSafeEqual(a, b) } catch { return false }
}

export function signAdminSession(): string | null {
  const secret = getAdminSecret()
  if (!secret) return null
  const ts = Date.now().toString()
  const mac = crypto.createHmac('sha256', secret).update(ts).digest('hex')
  return `${ts}.${mac}`
}

export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false
  const secret = getAdminSecret()
  if (!secret) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const ts = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  if (!/^\d+$/.test(ts) || !/^[a-f0-9]{64}$/i.test(mac)) return false
  const expected = crypto.createHmac('sha256', secret).update(ts).digest('hex')
  let macBuf: Buffer, expBuf: Buffer
  try {
    macBuf = Buffer.from(mac, 'hex')
    expBuf = Buffer.from(expected, 'hex')
    if (macBuf.length !== expBuf.length) return false
    if (!crypto.timingSafeEqual(macBuf, expBuf)) return false
  } catch { return false }
  const age = Date.now() - parseInt(ts, 10)
  return age >= 0 && age <= SESSION_TTL_MS
}

export function isAdminAuthenticated(req: NextRequest): boolean {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

export function attachAdminSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export function clearAdminSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  if (isAdminAuthenticated(req)) return null
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

// ─────────────────────────────────────────────────────────────────────────────
// Input validation
// ─────────────────────────────────────────────────────────────────────────────

export function clampString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}
