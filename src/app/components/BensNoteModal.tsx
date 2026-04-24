'use client'

import { useEffect, useState } from 'react'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import { BENS_NOTE_PARAGRAPHS, BENS_NOTE_STORAGE_KEY } from '@/app/lib/bens-note'

export default function BensNoteModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(BENS_NOTE_STORAGE_KEY)
      if (!seen) {
        // Small delay so the page paints first — the modal lands feeling
        // intentional rather than blocking.
        const t = setTimeout(() => setOpen(true), 400)
        return () => clearTimeout(t)
      }
    } catch { /* storage blocked — skip */ }
  }, [])

  const close = () => {
    setOpen(false)
    try { localStorage.setItem(BENS_NOTE_STORAGE_KEY, '1') } catch { /* */ }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="A note from Ben"
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(20, 15, 10, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 520, width: '100%',
          background: C.warm,
          borderRadius: 14,
          border: `1px solid ${C.ruleLight}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          padding: '36px 32px 28px',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 30, height: 30, borderRadius: 999, border: 'none',
            background: 'transparent', color: C.text3, cursor: 'pointer',
            fontSize: 20, lineHeight: 1,
          }}
        >
          ×
        </button>

        <p style={{
          fontSize: 10, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: 1.5,
          fontFamily: MONO, margin: '0 0 14px',
        }}>
          A note from Ben
        </p>

        {BENS_NOTE_PARAGRAPHS.map((p, i) => (
          <p key={i} style={{
            fontFamily: SERIF, fontSize: 16,
            color: C.text, lineHeight: 1.65,
            margin: i === 0 ? '0 0 12px' : '0 0 12px',
          }}>
            {p}
          </p>
        ))}

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 18, gap: 12,
        }}>
          <span style={{
            fontFamily: MONO, fontSize: 11, color: C.text3, letterSpacing: 0.3,
          }}>
            — Ben
          </span>
          <button
            onClick={close}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: C.accent, color: '#fff',
              fontSize: 13, fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
              letterSpacing: 0.3,
            }}
          >
            Start cooking
          </button>
        </div>
      </div>
    </div>
  )
}
