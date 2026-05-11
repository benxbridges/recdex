'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT, RADIUS } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'
import Button from '@/app/components/Button'
import { signUp, validateHandle, isHandleAvailable, useAuth } from '@/app/lib/auth'

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function SignupPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle')
  const [handleError, setHandleError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  // Redirect signed-in users away from signup.
  useEffect(() => {
    if (!loading && user) router.push('/')
  }, [loading, user, router])

  // Debounced handle availability check.
  const debounceRef = useRef<number | null>(null)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const trimmed = handle.trim().toLowerCase()
    if (!trimmed) { setHandleStatus('idle'); setHandleError(null); return }
    const validationError = validateHandle(trimmed)
    if (validationError) {
      setHandleStatus('invalid')
      setHandleError(validationError)
      return
    }
    setHandleStatus('checking')
    setHandleError(null)
    debounceRef.current = window.setTimeout(async () => {
      const available = await isHandleAvailable(trimmed)
      setHandleStatus(available ? 'available' : 'taken')
      if (!available) setHandleError('That handle is taken — try another.')
    }, 350)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [handle])

  const canSubmit =
    !submitting &&
    email.includes('@') &&
    password.length >= 8 &&
    handleStatus === 'available'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitError(null)
    setSubmitting(true)
    const { error } = await signUp({
      email: email.trim(),
      password,
      handle: handle.trim().toLowerCase(),
      displayName: displayName.trim() || undefined,
    })
    setSubmitting(false)
    if (error) {
      setSubmitError(error.message)
      return
    }
    setDone(true)
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteHeader />
      <div style={{ maxWidth: 440, margin: '0 auto', padding: `clamp(32px, 6vw, 56px) ${isMobile ? 16 : 24}px 80px` }}>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Join</p>
        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 28 : 34, fontWeight: 700, color: C.text, margin: '0 0 8px', letterSpacing: -0.5 }}>Create your account</h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: '0 0 28px', lineHeight: 1.5 }}>
          Save recipes, build your cookbooks, share what you cook. Pick a handle — it&apos;s how friends find you on RecDex.
        </p>

        {done ? (
          <SuccessPanel email={email} />
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle()}
              />
            </Field>

            <Field
              label="Handle"
              htmlFor="handle"
              hint="3–20 chars, lowercase letters/numbers/underscore. This becomes your /u/ URL."
              status={handleStatusLabel(handleStatus, handleError)}
            >
              <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${C.rule}`, borderRadius: RADIUS.md, background: C.bg, overflow: 'hidden' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: C.warm, color: C.text3, fontSize: 13, fontFamily: MONO, borderRight: `1px solid ${C.rule}` }}>recipeindex.org/u/</span>
                <input
                  id="handle"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={handle}
                  onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ben_cooks"
                  style={{ ...inputStyle(), border: 'none', borderRadius: 0, flex: 1, minWidth: 0 }}
                />
              </div>
            </Field>

            <Field label="Display name" htmlFor="display-name" hint="Optional. Shown on comments and your profile. Defaults to your handle.">
              <input
                id="display-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={handle || 'Ben'}
                style={inputStyle()}
              />
            </Field>

            <Field label="Password" htmlFor="password" hint="At least 8 characters.">
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle()}
              />
            </Field>

            {submitError && (
              <div style={{ padding: 12, borderRadius: RADIUS.md, background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, fontSize: 13, fontFamily: SANS }}>
                {submitError}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} fullWidth>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>

            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, textAlign: 'center', margin: '8px 0 0' }}>
              Already have an account? <Link href="/auth/signin" style={{ color: C.accent, fontWeight: 600 }}>Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}

function SuccessPanel({ email }: { email: string }) {
  return (
    <div style={{ padding: 24, borderRadius: RADIUS.lg, background: C.greenBg, border: `1px solid ${C.green}` }}>
      <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Check your email</p>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>One more step.</h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, lineHeight: 1.55, margin: 0 }}>
        We just sent a confirmation link to <strong style={{ color: C.text }}>{email}</strong>. Click it and you&apos;ll be signed in.
        Didn&apos;t get it? Check spam, or wait a minute and try signing up again with the same email.
      </p>
    </div>
  )
}

function Field({ label, htmlFor, hint, status, children }: {
  label: string
  htmlFor: string
  hint?: string
  status?: { color: string; text: string } | null
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <label htmlFor={htmlFor} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text2, letterSpacing: 0.2 }}>{label}</label>
        {status && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: status.color, fontWeight: 600 }}>{status.text}</span>
        )}
      </div>
      {children}
      {hint && <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: 0, lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: 16, fontFamily: SANS, color: C.text,
    background: C.bg, border: `1px solid ${C.rule}`, borderRadius: RADIUS.md,
    outline: 'none',
  }
}

function handleStatusLabel(status: HandleStatus, error: string | null) {
  if (status === 'checking') return { color: C.text3, text: 'checking…' }
  if (status === 'available') return { color: C.green, text: 'available' }
  if (status === 'taken' || status === 'invalid') return { color: C.accent, text: error ?? 'unavailable' }
  return null
}
