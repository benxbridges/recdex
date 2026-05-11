'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT, RADIUS } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'
import Button from '@/app/components/Button'
import { signIn, useAuth } from '@/app/lib/auth'

export default function SignInPage() {
  return (
    <Suspense fallback={<main style={{ background: C.bg, minHeight: '100vh' }}><SiteHeader /></main>}>
      <SignInPageInner />
    </Suspense>
  )
}

function SignInPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  useEffect(() => {
    if (!loading && user) router.push(next)
  }, [loading, user, router, next])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn({ email: email.trim(), password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push(next)
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteHeader />
      <div style={{ maxWidth: 420, margin: '0 auto', padding: `clamp(32px, 6vw, 56px) ${isMobile ? 16 : 24}px 80px` }}>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Welcome back</p>
        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 28 : 34, fontWeight: 700, color: C.text, margin: '0 0 24px', letterSpacing: -0.5 }}>Sign in</h1>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Email" htmlFor="email">
            <input
              id="email" type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" style={inputStyle()}
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <input
              id="password" type="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle()}
            />
          </Field>

          {error && (
            <div style={{ padding: 12, borderRadius: RADIUS.md, background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, fontSize: 13, fontFamily: SANS }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting || !email || !password} fullWidth>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: SANS, fontSize: 13, marginTop: 8 }}>
            <Link href="/auth/reset" style={{ color: C.text3 }}>Forgot password?</Link>
            <Link href="/auth/signup" style={{ color: C.accent, fontWeight: 600 }}>Create account</Link>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={htmlFor} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text2, letterSpacing: 0.2 }}>{label}</label>
      {children}
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
