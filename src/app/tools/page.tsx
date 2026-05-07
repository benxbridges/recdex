'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

function EggDot({ size = 8 }: { size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
}

type Tool = {
  title: string
  tag: string
  blurb: string
  detail: string
  cta?: { label: string; href: string }
}

const TOOLS: Tool[] = [
  {
    title: 'Paste a link, get a recipe',
    tag: 'Import',
    blurb: 'Drop any recipe URL — blog, YouTube, TikTok, Instagram — and we pull out the recipe.',
    detail: "No more scrolling past the five-paragraph essay about somebody's grandmother. Paste it, we strip it, you cook.",
    cta: { label: 'Try it', href: '/' },
  },
  {
    title: 'Scan a cookbook page',
    tag: 'Import',
    blurb: 'Snap a photo of a recipe in a real cookbook and we extract it for cook mode.',
    detail: 'Your cookbooks are great. Cooking from a propped-open page next to a sink full of water is not.',
    cta: { label: 'Open scanner', href: '/scan' },
  },
  {
    title: 'Cook mode',
    tag: 'Cooking',
    blurb: "A step-by-step view designed for one hand and a screen that won't fall asleep.",
    detail: 'Big text, clear progression, screen stays awake, hands-free where possible. The whole UI gets out of the way of cooking.',
  },
  {
    title: 'In-line timers',
    tag: 'Cooking',
    blurb: 'When a step says "simmer for 12 minutes," a timer is already there. Tap to start.',
    detail: 'No copy-pasting into Siri, no juggling phone alarms. Timers live inside the step that needs them, and they ping you when they fire.',
  },
  {
    title: 'Amount tabbing',
    tag: 'Cooking',
    blurb: 'Scale a recipe to your headcount in one tap. All the math gets redone for you.',
    detail: 'Cooking for 6 instead of 4? Tap once. Quantities re-render across the whole recipe. No napkin math.',
  },
  {
    title: 'Quick swaps',
    tag: 'Cooking',
    blurb: "Out of buttermilk? Tap the ingredient. We'll tell you what works.",
    detail: "Real substitutions for real cooking — not \"just use yogurt\" with no ratio. We tell you what to use, how much, and what it'll change.",
  },
  {
    title: 'Cooking tips',
    tag: 'Cooking',
    blurb: 'Contextual technique help inside the step that needs it.',
    detail: 'When a step asks you to deglaze a pan or fold egg whites, the tip is right there — not in a separate glossary you have to navigate to.',
  },
  {
    title: 'Kitchen Consensus',
    tag: 'Community',
    blurb: 'When cooks disagree on a recipe, we surface the consensus. When they agree, we just cook.',
    detail: "For canonical recipes, we've compared how different sources do it and rolled up the differences — what most cooks do, where it splits, who's right about what.",
  },
  {
    title: 'Cook log notes',
    tag: 'Community',
    blurb: 'After you cook a recipe, pin a note to it. Like tucking a slip of paper into a cookbook page.',
    detail: "Wrote \"made this on 11.7 with Julia, would sub anchovy paste next time\"? Now the next cook sees that. The cookbook gets warmer the more it's used.",
  },
  {
    title: 'Auto-import as a draft',
    tag: 'Community',
    blurb: 'Every recipe brought to the site gets saved. The index grows from people cooking.',
    detail: 'When you paste a link, we save the recipe as a draft. After admin review, it joins the public index — credited to its source.',
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
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.3 }}>The kit</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,7vw,64px) clamp(16px,4vw,24px) 80px' }}>
        <h2 style={{
          fontFamily: SERIF, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700,
          color: C.text, margin: '0 0 8px', lineHeight: 1.1, letterSpacing: -0.5,
        }}>The kit</h2>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: '0 0 36px', lineHeight: 1.6, maxWidth: 540 }}>
          A short tour of the tools Recipe Index gives you for actually cooking. Most of these are off in a corner of the cook view — they show up when you need them.
        </p>

        <div style={{
          display: 'grid', gap: 18,
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}>
          {TOOLS.map((t) => (
            <article key={t.title} style={{
              padding: '18px 20px',
              background: C.warm,
              border: `1px solid ${C.ruleLight}`,
              borderRadius: 10,
              display: 'flex', flexDirection: 'column',
            }}>
              <span style={{
                alignSelf: 'flex-start',
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                color: C.accent, background: C.accentBg,
                padding: '2px 8px', borderRadius: 3,
                textTransform: 'uppercase', letterSpacing: 1,
                marginBottom: 10,
              }}>{t.tag}</span>
              <h3 style={{
                fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: C.text,
                margin: '0 0 6px', lineHeight: 1.25,
              }}>{t.title}</h3>
              <p style={{
                fontFamily: SANS, fontSize: 13.5, color: C.text2,
                margin: '0 0 8px', lineHeight: 1.55,
              }}>{t.blurb}</p>
              <p style={{
                fontFamily: SANS, fontSize: 12.5, color: C.text3,
                margin: 0, lineHeight: 1.55,
              }}>{t.detail}</p>
              {t.cta && (
                <Link href={t.cta.href} style={{
                  marginTop: 12, alignSelf: 'flex-start',
                  fontFamily: MONO, fontSize: 11, color: C.accent,
                  textDecoration: 'none', letterSpacing: 0.5,
                }}>
                  {t.cta.label} →
                </Link>
              )}
            </article>
          ))}
        </div>

        <div style={{
          marginTop: 48, padding: '22px 24px',
          borderRadius: 12, background: C.warm,
          border: `1px solid ${C.ruleLight}`,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: 1.5,
            fontFamily: MONO, margin: '0 0 12px',
          }}>The short version</p>
          <p style={{ fontFamily: SERIF, fontSize: 16, color: C.text, lineHeight: 1.6, margin: 0 }}>
            Bring a recipe. Cook it. Pin a note for the next cook. That&apos;s the whole loop.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
            <Link href="/" style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 600,
              padding: '10px 18px', borderRadius: 6,
              background: C.accent, color: '#fff', textDecoration: 'none',
            }}>Try it on the homepage →</Link>
            <Link href="/about" style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 600,
              padding: '10px 18px', borderRadius: 6,
              background: 'transparent', color: C.text2,
              border: `1px solid ${C.rule}`, textDecoration: 'none',
            }}>Read the longer version →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
