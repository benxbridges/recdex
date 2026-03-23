'use client'

import Link from 'next/link'
import { C, SERIF, SANS } from '@/app/lib/theme'

export default function ErrorPage({ reset }: { reset: () => void }) {
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
        <h1 style={{ fontFamily: SERIF, fontSize: 32, color: C.text, margin: '0 0 0.5rem' }}>
          Something went wrong
        </h1>
        <button
          onClick={reset}
          style={{
            fontFamily: SANS, fontSize: 15, color: C.bg, background: C.accent,
            border: 'none', borderRadius: 6, padding: '0.6rem 1.4rem',
            cursor: 'pointer', marginTop: '1.5rem',
          }}
        >
          Try again
        </button>
        <div style={{ marginTop: '1.25rem' }}>
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
      </div>
    </main>
  )
}
