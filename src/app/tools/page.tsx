'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

function EggDot({ size = 8 }: { size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
}

// ─── Tool icons ──────────────────────────────────────────────────────────
// Each tool gets a small distinctive SVG. Stroke = accent color so the row
// reads as a single visual rhythm. Sized 36px — readable but not heavy.

const ICON_SIZE = 36
const stroke = { stroke: C.accent, strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const Icons = {
  link: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  camera: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  cookMode: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  timer: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 2h6" />
    </svg>
  ),
  scale: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M14 21v-1a4.5 4.5 0 0 1 7-3.7" />
    </svg>
  ),
  swap: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M7 7h12l-3-3" />
      <path d="M17 17H5l3 3" />
    </svg>
  ),
  bulb: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M9 21h6" />
      <path d="M10 17h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0 0 12 3z" />
    </svg>
  ),
  consensus: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-9" />
      <path d="M22 20V7" />
    </svg>
  ),
  note: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  index: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
}

type Tool = {
  title: string
  blurb: string
  icon: ReactNode
  cta?: { label: string; href: string }
}

const TOOLS: Tool[] = [
  {
    title: 'Paste a link',
    blurb: 'Drop in any recipe URL — blog, YouTube, TikTok, Instagram. We pull out the recipe.',
    icon: Icons.link,
    cta: { label: 'Try it', href: '/' },
  },
  {
    title: 'Scan a cookbook page',
    blurb: 'Snap a photo of a printed recipe and we convert it for cook mode.',
    icon: Icons.camera,
    cta: { label: 'Open scanner', href: '/scan' },
  },
  {
    title: 'Cook mode',
    blurb: 'Step-by-step view that keeps your screen awake and stays out of your way.',
    icon: Icons.cookMode,
  },
  {
    title: 'Built-in timers',
    blurb: 'Timers live inside the steps that need them. Tap to start, get pinged when they fire.',
    icon: Icons.timer,
  },
  {
    title: 'Scale to your servings',
    blurb: 'Resize a recipe to your headcount. Quantities re-render across the whole recipe.',
    icon: Icons.scale,
  },
  {
    title: 'Substitutions',
    blurb: 'Tap an ingredient to see what works as a swap, with the right ratio.',
    icon: Icons.swap,
  },
  {
    title: 'Technique tips',
    blurb: 'Short notes on tricky cooking steps, right inside the step that uses them.',
    icon: Icons.bulb,
  },
  {
    title: 'Kitchen Consensus',
    blurb: 'When recipes for the same dish disagree, see how most cooks actually do it.',
    icon: Icons.consensus,
  },
  {
    title: 'Cook log',
    blurb: 'Pin a note to a recipe after you make it — like a slip of paper in a cookbook.',
    icon: Icons.note,
  },
  {
    title: 'A growing index',
    blurb: 'Every link you paste is saved to the index after a quick review.',
    icon: Icons.index,
  },
]

export default function ToolsPage() {
  const router = useRouter()

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
              <Link href="/" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Home</Link>
              <Link href="/browse" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Browse</Link>
              <Link href="/about" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>About</Link>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.3 }}>Tools</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,7vw,64px) clamp(16px,4vw,24px) 80px' }}>
        <h2 style={{
          fontFamily: SERIF, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700,
          color: C.text, margin: '0 0 8px', lineHeight: 1.1, letterSpacing: -0.5,
        }}>Tools</h2>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: '0 0 36px', lineHeight: 1.6, maxWidth: 540 }}>
          What Recipe Index gives you for actually cooking.
        </p>

        <div style={{
          display: 'grid', gap: 18,
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}>
          {TOOLS.map((t) => (
            <article key={t.title} style={{
              padding: '20px 22px',
              background: C.warm,
              border: `1px solid ${C.ruleLight}`,
              borderRadius: 10,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 14 }}>{t.icon}</div>
              <h3 style={{
                fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.text,
                margin: '0 0 6px', lineHeight: 1.25,
              }}>{t.title}</h3>
              <p style={{
                fontFamily: SANS, fontSize: 14, color: C.text2,
                margin: 0, lineHeight: 1.55,
              }}>{t.blurb}</p>
              {t.cta && (
                <Link href={t.cta.href} style={{
                  marginTop: 14, alignSelf: 'flex-start',
                  fontFamily: MONO, fontSize: 11, color: C.accent,
                  textDecoration: 'none', letterSpacing: 0.5,
                }}>
                  {t.cta.label} →
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
