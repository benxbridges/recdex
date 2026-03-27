import Link from 'next/link'
import { C, SERIF, SANS } from '@/app/lib/theme'

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3, letterSpacing: 1 }}>
          404
        </p>
        <h1 style={{ fontFamily: SERIF, fontSize: 32, color: C.text, margin: '0.5rem 0' }}>
          Recipe not found
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 16, color: C.text2, margin: '0.5rem 0 2rem' }}>
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            fontFamily: SANS, fontSize: 15, color: C.accent,
            textDecoration: 'none', borderBottom: `1px solid ${C.accent}`,
            paddingBottom: 2,
          }}
        >
          &larr; Back to recipes
        </Link>
      </div>
    </main>
  )
}
