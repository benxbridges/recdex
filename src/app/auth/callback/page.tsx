'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'
import { supabase } from '@/app/lib/supabase'

// Where Supabase redirects after the user clicks the email confirmation /
// magic link / password-reset link. Handles both PKCE (?code=…) and the older
// implicit flow (#access_token=…) and then redirects home (or to ?next=…).
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Signing you in…" />}>
      <AuthCallbackInner />
    </Suspense>
  )
}

function AuthCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const code = params.get('code')
      const next = params.get('next') || '/'

      // PKCE flow: exchange ?code= for a session.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (error) { setError(error.message); return }
        router.replace(next)
        return
      }

      // Implicit / hash-based flow: supabase-js auto-parses the URL hash and
      // sets a session. We just wait for it to land then route home.
      // getSession is enough — if the SDK has finished processing, it returns
      // the user; otherwise we wait for the first onAuthStateChange.
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) { router.replace(next); return }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) { router.replace(next) }
        else if (event === 'SIGNED_OUT') { setError('Sign-in link expired or invalid.') }
      })

      // Bail after a few seconds if nothing happens.
      setTimeout(() => {
        if (!cancelled) {
          supabase.auth.getSession().then(({ data }) => {
            if (!data.session) setError('Sign-in link expired or invalid.')
          })
        }
      }, 4000)

      return () => listener.subscription.unsubscribe()
    }
    run()
    return () => { cancelled = true }
  }, [params, router])

  if (error) return <CallbackShell message={error} tone="error" />
  return <CallbackShell message="Signing you in…" />
}

function CallbackShell({ message, tone = 'info' }: { message: string; tone?: 'info' | 'error' }) {
  return (
    <main style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteHeader />
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: tone === 'error' ? C.accent : C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>
          {tone === 'error' ? 'Problem signing in' : 'One moment'}
        </p>
        <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 12px', letterSpacing: -0.3 }}>{message}</h1>
        {tone === 'error' && (
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, lineHeight: 1.55 }}>
            Try <a href="/auth/signin" style={{ color: C.accent, fontWeight: 600 }}>signing in</a> directly, or request a new link from{' '}
            <a href="/auth/reset" style={{ color: C.accent, fontWeight: 600 }}>password reset</a>.
          </p>
        )}
      </div>
    </main>
  )
}
