'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'
import { BENS_NOTE_PARAGRAPHS } from '@/app/lib/bens-note'

function EggDot({ size = 8 }: { size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
}

export default function AboutPage() {
  const router = useRouter()

  const sectionStyle = {
    marginBottom: 40,
  } as const

  const headingStyle = {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: 700 as const,
    color: C.text,
    margin: '0 0 12px',
  }

  const bodyStyle = {
    fontFamily: SANS,
    fontSize: 14,
    color: C.text2,
    lineHeight: 1.7,
    margin: '0 0 12px',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontFamily: SANS }}>
              <Link href="/" style={{ color: C.text2, textDecoration: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Home</Link>
              <Link href="/browse" style={{ color: C.text2, textDecoration: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Browse</Link>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.3 }}>About</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(40px,8vw,72px) clamp(16px,4vw,24px)' }}>

        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px,5vw,38px)', fontWeight: 700, color: C.text, margin: '0 0 8px', lineHeight: 1.1, letterSpacing: -0.5 }}>
          About RecDex
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 40px' }}>
          An open recipe commons
        </p>

        <div style={{
          marginBottom: 40,
          padding: '22px 24px',
          borderRadius: 12,
          background: C.warm,
          border: `1px solid ${C.ruleLight}`,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: 1.5,
            fontFamily: MONO, margin: '0 0 14px',
          }}>
            A note from Ben
          </p>
          {BENS_NOTE_PARAGRAPHS.map((p, i) => (
            <p key={i} style={{
              fontFamily: SERIF, fontSize: 15,
              color: C.text, lineHeight: 1.65,
              margin: i < BENS_NOTE_PARAGRAPHS.length - 1 ? '0 0 10px' : 0,
            }}>
              {p}
            </p>
          ))}
          <p style={{
            fontFamily: MONO, fontSize: 11, color: C.text3,
            margin: '14px 0 0', textAlign: 'right' as const,
            letterSpacing: 0.3,
          }}>
            — Ben
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={headingStyle}>How it works</h3>
          <p style={bodyStyle}>
            Import recipes by link or photo, and Recipe Index will turn them into dedicated cook pages with clear, step-by-step instructions. Browse our curated library, discover recipes from the community, or contribute your own from scratch. When you paste a link, Recipe Index reads and structures the recipe for you, then lets you edit and approve it before publishing. Sources are credited wherever possible.
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={headingStyle}>Community</h3>
          <p style={bodyStyle}>
            Recipe Index has community notes on every recipe: tips, substitutions, and tweaks from people who have actually cooked it. We&apos;d like to become a definitive place for culinary conversation.
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={headingStyle}>Open by design</h3>
          <p style={bodyStyle}>
            RecDex is built as a public benefit project. The goal is to be the most useful, least annoying recipe site on the internet.
          </p>
        </div>

        <div style={{ borderTop: `1px solid ${C.ruleLight}`, paddingTop: 24 }}>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
            Built with care. No ads, no paywalls, no nonsense.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Link href="/" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>Browse recipes →</Link>
            <Link href="/community" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>Join the community →</Link>
            <Link href="/contribute" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>Import a recipe →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
