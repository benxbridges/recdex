'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT, RADIUS } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'
import { signOut, useAuth } from '@/app/lib/auth'

// Single source of truth for the top nav. Every page renders <SiteHeader />
// instead of bespoke markup. Matches against the current pathname so the
// active section is highlighted automatically — no `current` prop needed.

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: h,
        marginLeft: 2,
        background: C.accent,
        borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
        verticalAlign: 'baseline',
        marginBottom: -1,
      }}
    />
  )
}

const NAV: { href: string; label: string; matchPrefix: string }[] = [
  { href: '/browse',  label: 'Browse',  matchPrefix: '/browse' },
  { href: '/lists',   label: 'Lists',   matchPrefix: '/lists' },
  { href: '/profile', label: 'Profile', matchPrefix: '/profile' },
  { href: '/about',   label: 'About',   matchPrefix: '/about' },
]

export default function SiteHeader() {
  const pathname = usePathname() || '/'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  return (
    <header
      style={{
        borderBottom: `1.5px solid ${C.text}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: C.bg,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 'clamp(12px, 2vw, 18px) clamp(16px, 4vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(22px, 4vw, 28px)',
              fontWeight: 700,
              color: C.text,
              margin: 0,
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            Recipe Index<EggDot size={9} />
          </h1>
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: SANS,
          }}
        >
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.matchPrefix + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  color: active ? C.accent : C.text2,
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  fontFamily: active ? MONO : SANS,
                  letterSpacing: active ? 0.3 : undefined,
                }}
              >
                {item.label}
              </Link>
            )
          })}
          <ThemeToggle />
          <AuthChip isMobile={isMobile} />
        </nav>
      </div>
    </header>
  )
}

// Right edge of the nav. Shows "Sign in" when logged out, or a clickable
// "@handle" with a small popover menu when logged in. Keeps the rest of the
// header untouched so existing styling is preserved.
function AuthChip({ isMobile }: { isMobile: boolean }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (loading) {
    return <span aria-hidden style={{ width: 32, height: 16, background: C.warm, borderRadius: RADIUS.sm, display: 'inline-block' }} />
  }

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        style={{
          textDecoration: 'none',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: SANS,
          color: C.accent,
          letterSpacing: 0.2,
        }}
      >
        Sign in
      </Link>
    )
  }

  const handle = profile?.handle ?? '…'
  const initials = (profile?.display_name || handle).slice(0, 2).toUpperCase()

  async function onSignOut() {
    setOpen(false)
    await signOut()
    router.push('/')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for @${handle}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: `1px solid ${C.rule}`,
          borderRadius: RADIUS.pill,
          padding: '4px 10px 4px 4px',
          cursor: 'pointer',
          fontFamily: SANS,
        }}
      >
        <span aria-hidden style={{
          width: 22, height: 22, borderRadius: '50%',
          background: C.accentBg, color: C.accent,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: 0.5,
        }}>{initials}</span>
        {!isMobile && (
          <span style={{ fontSize: 11, fontFamily: MONO, color: C.text2, fontWeight: 600 }}>@{handle}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 180,
            background: C.bg,
            border: `1px solid ${C.rule}`,
            borderRadius: RADIUS.md,
            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            padding: 6,
            zIndex: 60,
          }}
        >
          <div style={{ padding: '8px 10px 6px', borderBottom: `1px solid ${C.ruleLight}`, marginBottom: 4 }}>
            <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
              {profile?.display_name || handle}
            </p>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.text3, margin: '2px 0 0' }}>@{handle}</p>
          </div>
          <MenuLink href={`/u/${handle}`} onClick={() => setOpen(false)}>Your profile</MenuLink>
          <MenuLink href="/profile" onClick={() => setOpen(false)}>Cook log</MenuLink>
          <MenuLink href="/lists" onClick={() => setOpen(false)}>Lists</MenuLink>
          <div style={{ height: 1, background: C.ruleLight, margin: '4px 6px' }} />
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: SANS, fontSize: 13, color: C.text2,
              borderRadius: RADIUS.sm,
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function MenuLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'block',
        padding: '8px 10px',
        fontFamily: SANS, fontSize: 13, color: C.text2,
        textDecoration: 'none',
        borderRadius: RADIUS.sm,
      }}
    >
      {children}
    </Link>
  )
}
