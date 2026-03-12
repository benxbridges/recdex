'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

function EggDot({ size = 8 }: { size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
}

export default function TermsPage() {
  const router = useRouter()

  const h2 = {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: 700 as const,
    color: C.text,
    margin: '40px 0 12px',
  }

  const h3 = {
    fontFamily: SANS,
    fontSize: 15,
    fontWeight: 700 as const,
    color: C.text,
    margin: '28px 0 8px',
  }

  const p = {
    fontFamily: SANS,
    fontSize: 14,
    color: C.text2,
    lineHeight: 1.7,
    margin: '0 0 12px',
  }

  const li = {
    fontFamily: SANS,
    fontSize: 14,
    color: C.text2,
    lineHeight: 1.7,
    margin: '0 0 6px',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontFamily: SANS }}>
              <Link href="/" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Home</Link>
              <Link href="/about" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>About</Link>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.3 }}>Terms</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(40px,8vw,72px) clamp(16px,4vw,24px)' }}>

        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px,5vw,38px)', fontWeight: 700, color: C.text, margin: '0 0 8px', lineHeight: 1.1, letterSpacing: -0.5 }}>
          Terms of Use
        </h2>
        <p style={{ fontFamily: MONO, fontSize: 11, color: C.text3, margin: '0 0 40px' }}>
          Last updated: March 2026
        </p>

        {/* RECIPE COPYRIGHT POLICY */}
        <h2 style={h2}>Recipe Content &amp; Copyright</h2>

        <p style={p}>
          RecDex is a recipe index that hosts factual cooking information: ingredient lists, quantities, temperatures, cooking times, and techniques. Under U.S. copyright law, these factual elements of a recipe are not copyrightable.
        </p>

        <h3 style={h3}>What we publish</h3>
        <p style={p}>
          Recipes on RecDex contain only factual cooking information rewritten in neutral, instructional language. We do not copy or republish creative expression — including personal stories, distinctive narrative voice, headnotes, creative descriptions, or photographs — from any source.
        </p>

        <h3 style={h3}>AI-assisted extraction</h3>
        <p style={p}>
          Some recipes are extracted from publicly available cooking videos using AI. When this happens:
        </p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>Only factual recipe data is extracted (ingredients, amounts, techniques, times)</li>
          <li style={li}>All instructions are rewritten in original, neutral language — never copied verbatim</li>
          <li style={li}>The original creator is credited by name with a link to their content</li>
          <li style={li}>The source video is embedded on the recipe page so viewers can watch the original</li>
          <li style={li}>Recipes are clearly labeled as "AI-extracted" with an option to verify or edit</li>
        </ul>

        <h3 style={h3}>Attribution</h3>
        <p style={p}>
          We believe in giving credit. Every recipe sourced from external content includes the creator's name, a link to the original, and (where applicable) an embedded video. We encourage users to visit the original source, subscribe to creators, and buy their cookbooks.
        </p>

        <h3 style={h3}>External recipe links</h3>
        <p style={p}>
          RecDex also links to recipes on other platforms (NYT Cooking, Bon Appétit, Serious Eats, etc.) as a discovery service. We display only the recipe title and source — never the recipe content — and link directly to the original. This is the same model used by recipe search engines and food discovery platforms.
        </p>

        {/* USER CONTRIBUTIONS */}
        <h2 style={h2}>User Contributions</h2>

        <p style={p}>
          When you publish a recipe on RecDex, you certify that:
        </p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>The recipe contains only factual cooking information</li>
          <li style={li}>You have not copied creative expression, personal stories, or distinctive language from another source</li>
          <li style={li}>If the recipe is based on another work, it has been rewritten in your own words and reflects factual cooking information only</li>
        </ul>
        <p style={p}>
          You retain ownership of any original creative expression you contribute (your own descriptions, tips, or commentary). By publishing on RecDex, you grant us a non-exclusive license to display that content on the platform.
        </p>

        {/* DMCA */}
        <h2 style={h2}>DMCA Takedown Policy</h2>

        <p style={p}>
          RecDex respects intellectual property rights. If you believe content on RecDex infringes your copyright, you may submit a DMCA takedown notice.
        </p>

        <h3 style={h3}>To file a notice</h3>
        <p style={p}>
          Send an email to <span style={{ fontFamily: MONO, color: C.text, fontWeight: 600 }}>dmca@recipeindex.org</span> with:
        </p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>Identification of the copyrighted work you claim has been infringed</li>
          <li style={li}>The URL of the infringing content on RecDex</li>
          <li style={li}>Your contact information (name, address, email, phone)</li>
          <li style={li}>A statement that you have a good faith belief the use is not authorized</li>
          <li style={li}>A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
          <li style={li}>Your physical or electronic signature</li>
        </ul>
        <p style={p}>
          We will review all valid notices promptly and remove infringing content. We also maintain a repeat infringer policy and may terminate access for users who repeatedly post infringing content.
        </p>

        <h3 style={h3}>Counter-notification</h3>
        <p style={p}>
          If you believe your content was removed in error, you may submit a counter-notification to the same email address with the information required under 17 U.S.C. Section 512(g).
        </p>

        {/* GENERAL */}
        <h2 style={h2}>General Terms</h2>

        <p style={p}>
          RecDex is provided as-is, without warranties. We reserve the right to remove content, modify features, or suspend accounts at our discretion. By using RecDex, you agree to these terms.
        </p>

        <div style={{ borderTop: `1px solid ${C.ruleLight}`, paddingTop: 24, marginTop: 40 }}>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
            Questions about these terms? Contact us at <span style={{ fontFamily: MONO, color: C.text2 }}>hello@recipeindex.org</span>
          </p>
          <Link href="/" style={{ fontFamily: SANS, fontSize: 12, color: C.accent, textDecoration: 'none' }}>← Back to recipes</Link>
        </div>
      </div>
    </div>
  )
}
