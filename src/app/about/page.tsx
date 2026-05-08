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
          About Recipe Index
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 40px' }}>
          A cookbook the internet built — and a kit of tools for actually cooking from it.
        </p>

        {/* Ben's note — top of the page, sets the voice */}
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

        {/* What we do differently */}
        <div style={sectionStyle}>
          <h3 style={headingStyle}>What we do differently</h3>
          <p style={bodyStyle}>
            There are a thousand recipe sites. Most of them are written for SEO, padded with five-paragraph essays about somebody&apos;s grandmother, and engineered to keep you scrolling past ads. Recipe Index is built for the moment you&apos;re actually standing at the stove.
          </p>
          <ul style={{ ...bodyStyle, paddingLeft: 18, margin: '4px 0 0' }}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.text }}>Bring your own recipe.</strong> Paste any link — blog, YouTube, TikTok, Instagram. We strip the ads and pull out the recipe.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.text }}>A cook view that respects the kitchen.</strong> Step-by-step, hands-free, screen stays awake. Timers are inside the steps, not buried in a sidebar.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.text }}>The cookbook gets richer over time.</strong> When somebody cooks a recipe, they can pin a note to it — what worked, what they&apos;d change. Future cooks see the stack.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.text }}>Community-built.</strong> Every recipe here got here because somebody cooked it. The library grows when you bring something to it.
            </li>
            <li>
              <strong style={{ color: C.text }}>No ads, no paywalls, no popups.</strong> If we ever monetize, it&apos;ll be in ways that don&apos;t make the cooking experience worse.
            </li>
          </ul>
          <p style={{ ...bodyStyle, marginTop: 14 }}>
            See <Link href="/tools" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>all the tools →</Link>
          </p>
        </div>

        {/* Crowd-sourced framing */}
        <div style={sectionStyle}>
          <h3 style={headingStyle}>A cookbook the internet built</h3>
          <p style={bodyStyle}>
            Recipe Index is collaborative on purpose. The recipes here came from cooks bringing them in — every link pasted, every cookbook page scanned, every recipe written from scratch becomes part of the index. When you cook, your notes get pinned to the recipe so the next person knows what you learned.
          </p>
          <p style={bodyStyle}>
            We credit sources wherever we can find them. We rewrite recipes in plain language so they&apos;re fast to follow at the stove. And we build for the cook, not the algorithm.
          </p>
        </div>

        {/* What we won't do */}
        <div style={sectionStyle}>
          <h3 style={headingStyle}>What we won&apos;t do</h3>
          <p style={bodyStyle}>
            We won&apos;t put display ads between you and a recipe. We won&apos;t require you to make an account to read. We won&apos;t pretend a recipe was written by us when it wasn&apos;t. And we won&apos;t bury the cooking under a story about somebody&apos;s trip to Tuscany.
          </p>
        </div>

        <div style={{ borderTop: `1px solid ${C.ruleLight}`, paddingTop: 24 }}>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
            Built with care. No ads, no paywalls, no nonsense.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <Link href="/browse" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>Browse recipes →</Link>
            <Link href="/tools" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>Tools →</Link>
            <Link href="/contribute" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>Bring a recipe →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
