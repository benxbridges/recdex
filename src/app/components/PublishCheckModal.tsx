'use client'

import { useEffect, useState } from 'react'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

// Shared "verify and publish" dialog used by:
// - homepage paste-a-link flow (mode='link')
// - /scan cookbook-photo flow (mode='cookbook')
//
// The dialog's job is credit + a sanity check, NOT legalistic attestation.
// Server-side rewriting handles the meaningful-changes piece.

export type PublishCheckMode = 'link' | 'cookbook'

export type PublishCheckSummary = {
  title: string
  cuisine?: string | null
  timeMinutes?: number | null
  ingredientCount?: number
  stepCount?: number
}

export type PublishCheckCredit = {
  // Cookbook scan
  author?: string
  cookbook?: string
  // Link paste
  creatorName?: string
  sourceAttribution?: string
  sourceUrl?: string
}

function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`
  }
  return `${minutes} min`
}

export default function PublishCheckModal({
  open,
  mode,
  summary,
  initialCredit,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean
  mode: PublishCheckMode
  summary: PublishCheckSummary
  initialCredit: PublishCheckCredit
  onCancel: () => void
  onConfirm: (credit: PublishCheckCredit) => void
  busy?: boolean
}) {
  const [credit, setCredit] = useState<PublishCheckCredit>(initialCredit)

  useEffect(() => { setCredit(initialCredit) }, [initialCredit])

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const canConfirm = mode === 'cookbook'
    ? Boolean(credit.author?.trim() && credit.cookbook?.trim())
    : true // link flow doesn't gate on credit fields — they're optional context

  const meta = [
    summary.cuisine,
    summary.timeMinutes ? formatTime(summary.timeMinutes) : null,
    summary.ingredientCount ? `${summary.ingredientCount} ingredients` : null,
    summary.stepCount ? `${summary.stepCount} steps` : null,
  ].filter(Boolean).join(' · ')

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 6,
    border: `1.5px solid ${C.ruleLight}`, background: C.bg,
    fontFamily: SANS, fontSize: 14, color: C.text,
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: MONO, fontSize: 10,
    color: C.text3, textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 5,
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        animation: 'fadeIn 0.18s ease',
        padding: '0',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '92vh', overflow: 'auto',
          background: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.22s ease',
          margin: '8vh 12px 0',
          borderRadius: 16,
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${C.ruleLight}` }}>
          <p style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700,
            color: C.accent, textTransform: 'uppercase', letterSpacing: 1.5,
            margin: '0 0 6px',
          }}>Quick check before publishing</p>
          <h2 style={{
            fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text,
            margin: '0 0 4px', lineHeight: 1.2,
          }}>{summary.title}</h2>
          {meta && (
            <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0 }}>{meta}</p>
          )}
        </div>

        {/* Credit block */}
        <div style={{ padding: '18px 24px 8px' }}>
          {mode === 'cookbook' ? (
            <>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: '0 0 14px', lineHeight: 1.5 }}>
                Credit the source. We&apos;ll show this on the recipe page as
                <em style={{ fontStyle: 'italic' }}> &ldquo;Inspired by …&rdquo;</em>.
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Author</label>
                <input
                  type="text"
                  value={credit.author ?? ''}
                  onChange={e => setCredit(c => ({ ...c, author: e.target.value }))}
                  placeholder="e.g. Samin Nosrat"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Cookbook</label>
                <input
                  type="text"
                  value={credit.cookbook ?? ''}
                  onChange={e => setCredit(c => ({ ...c, cookbook: e.target.value }))}
                  placeholder="e.g. Salt, Fat, Acid, Heat"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: '0 0 14px', lineHeight: 1.5 }}>
                Make sure the credit looks right before this goes on the index. Both fields are optional.
              </p>
              {credit.sourceUrl && (
                <div style={{
                  fontFamily: MONO, fontSize: 11, color: C.text3,
                  background: C.warm, padding: '8px 12px', borderRadius: 6,
                  marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {credit.sourceUrl}
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Creator (author / chef)</label>
                <input
                  type="text"
                  value={credit.creatorName ?? ''}
                  onChange={e => setCredit(c => ({ ...c, creatorName: e.target.value }))}
                  placeholder="e.g. Alison Roman"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Source (publication / site)</label>
                <input
                  type="text"
                  value={credit.sourceAttribution ?? ''}
                  onChange={e => setCredit(c => ({ ...c, sourceAttribution: e.target.value }))}
                  placeholder="e.g. NYT Cooking"
                  style={inputStyle}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '14px 24px 22px',
          borderTop: `1px solid ${C.ruleLight}`,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <button
            onClick={() => onConfirm(credit)}
            disabled={!canConfirm || busy}
            style={{
              padding: '13px 22px', borderRadius: 8, border: 'none',
              background: (!canConfirm || busy) ? C.ruleLight : C.accent,
              color: (!canConfirm || busy) ? C.text3 : '#fff',
              fontFamily: SANS, fontSize: 14, fontWeight: 700,
              cursor: (!canConfirm || busy) ? 'default' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {busy ? 'Publishing…' : 'Looks right — publish & cook'}
            {!busy && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '8px 0', background: 'none', border: 'none',
              color: C.text3, fontFamily: SANS, fontSize: 12,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            Cancel — go back to edit
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
