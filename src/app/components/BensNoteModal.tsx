'use client'

import { useEffect, useState } from 'react'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import { BENS_NOTE_PARAGRAPHS, BENS_NOTE_STORAGE_KEY } from '@/app/lib/bens-note'

export default function BensNoteModal() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 560)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    try {
      const seen = localStorage.getItem(BENS_NOTE_STORAGE_KEY)
      if (!seen) {
        const t = setTimeout(() => setOpen(true), 400)
        return () => clearTimeout(t)
      }
    } catch { /* storage blocked — skip */ }
  }, [])

  // Lock body scroll while the modal is up so users don't scroll the page
  // instead of the modal content.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

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
        padding: isMobile ? 12 : 20, animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 460, width: '100%',
          maxHeight: isMobile ? 'calc(100vh - 24px)' : 'calc(100vh - 40px)',
          display: 'flex', flexDirection: 'column',
          background: C.warm,
          borderRadius: 14,
          border: `1px solid ${C.ruleLight}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          animation: 'slideUp 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            width: 36, height: 36, borderRadius: 999, border: 'none',
            background: 'rgba(0,0,0,0.04)', color: C.text2, cursor: 'pointer',
            fontSize: 22, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Scrollable body */}
        <div style={{
          overflowY: 'auto',
          padding: isMobile ? '22px 20px 16px' : '32px 32px 20px',
          WebkitOverflowScrolling: 'touch',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: C.accent,
            textTransform: 'uppercase', letterSpacing: 1.5,
            fontFamily: MONO, margin: '0 0 14px',
          }}>
            A note from Ben
          </p>

          {BENS_NOTE_PARAGRAPHS.map((p, i) => (
            <p key={i} style={{
              fontFamily: SERIF, fontSize: isMobile ? 14 : 15, fontWeight: 400,
              color: C.text, lineHeight: 1.6,
              margin: i < BENS_NOTE_PARAGRAPHS.length - 1 ? '0 0 10px' : 0,
            }}>
              {p}
            </p>
          ))}
        </div>

        {/* Sticky footer so the CTA is always reachable */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '12px 20px 16px' : '14px 32px 20px',
          borderTop: `1px solid ${C.ruleLight}`,
          background: C.warm,
          gap: 12, flexShrink: 0,
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
