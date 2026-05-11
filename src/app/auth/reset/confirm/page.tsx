'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT, RADIUS } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'
import Button from '@/app/components/Button'
import { updatePassword, useAuth } from '@/app/lib/auth'

// User lands here after clicking the reset email link. Supabase will have
// already exchanged the recovery token for a session by the time we render
// (handled in the client SDK on URL hash). We just need to collect the new
// password and call updateUser.
export default function ResetConfirmPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords don’t match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/'), 1500)
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteHeader />
      <div style={{ maxWidth: 420, margin: '0 auto', padding: `clamp(32px, 6vw, 56px) ${isMobile ? 16 : 24}px 80px` }}>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Reset password</p>
        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 28 : 34, fontWeight: 700, color: C.text, margin: '0 0 24px', letterSpacing: -0.5 }}>Choose a new password</h1>

        {loading ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3 }}>Loading…</p>
        ) : !user ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2 }}>
            This reset link looks expired or invalid. Try requesting a new one from the <a href="/auth/reset" style={{ color: C.accent }}>forgot password</a> page.
          </p>
        ) : done ? (
          <div style={{ padding: 24, borderRadius: RADIUS.lg, background: C.greenBg, border: `1px solid ${C.green}` }}>
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: 0 }}>
              Password updated. Redirecting…
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="New password" htmlFor="password">
              <input
                id="password" type="password" autoComplete="new-password" required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle()}
              />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm">
              <input
                id="confirm" type="password" autoComplete="new-password" required minLength={8}
                value={confirm} onChange={e => setConfirm(e.target.value)}
                style={inputStyle()}
              />
            </Field>

            {error && (
              <div style={{ padding: 12, borderRadius: RADIUS.md, background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, fontSize: 13, fontFamily: SANS }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={submitting || !password || !confirm} fullWidth>
              {submitting ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
        )}
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
    padding: '10px 12px', fontSize: 16, fontFamily: SANS, color: C.text,
    background: C.bg, border: `1px solid ${C.rule}`, borderRadius: RADIUS.md, outline: 'none',
  }
}
