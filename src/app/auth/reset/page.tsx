'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT, RADIUS } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'
import Button from '@/app/components/Button'
import { requestPasswordReset } from '@/app/lib/auth'

export default function ResetRequestPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteHeader />
      <div style={{ maxWidth: 420, margin: '0 auto', padding: `clamp(32px, 6vw, 56px) ${isMobile ? 16 : 24}px 80px` }}>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Password reset</p>
        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 28 : 34, fontWeight: 700, color: C.text, margin: '0 0 8px', letterSpacing: -0.5 }}>Forgot your password?</h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: '0 0 24px', lineHeight: 1.5 }}>
          Enter the email you signed up with. We&apos;ll send you a link to choose a new password.
        </p>

        {sent ? (
          <div style={{ padding: 24, borderRadius: RADIUS.lg, background: C.greenBg, border: `1px solid ${C.green}` }}>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Sent</p>
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, lineHeight: 1.55, margin: 0 }}>
              If an account exists for <strong style={{ color: C.text }}>{email}</strong>, you&apos;ll get a reset link in a minute or two. Check spam if it doesn&apos;t arrive.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text2, letterSpacing: 0.2 }}>Email</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 12px', fontSize: 16, fontFamily: SANS, color: C.text,
                  background: C.bg, border: `1px solid ${C.rule}`, borderRadius: RADIUS.md, outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: RADIUS.md, background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, fontSize: 13, fontFamily: SANS }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={submitting || !email} fullWidth>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>

            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, textAlign: 'center', margin: '8px 0 0' }}>
              Remembered it? <Link href="/auth/signin" style={{ color: C.accent, fontWeight: 600 }}>Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
