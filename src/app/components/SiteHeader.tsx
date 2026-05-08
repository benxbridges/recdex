'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

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
  { href: '/tools',   label: 'Tools',   matchPrefix: '/tools' },
  { href: '/profile', label: 'Profile', matchPrefix: '/profile' },
  { href: '/about',   label: 'About',   matchPrefix: '/about' },
]

export default function SiteHeader() {
  const pathname = usePathname() || '/'

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
        </nav>
      </div>
    </header>
  )
}
