'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { C, SERIF, SANS } from '@/app/lib/theme'

type FeedbackType = 'bug' | 'suggestion' | 'other'

export default function FeedbackButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Hide on cook pages
  if (pathname?.includes('/cook')) return null

  useEffect(() => {
    if (sent) {
      const t = setTimeout(() => { setSent(false); setOpen(false) }, 2000)
      return () => clearTimeout(t)
    }
  }, [sent])

  async function submit() {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      let userName: string | undefined
      try { userName = JSON.parse(localStorage.getItem('recdex-profile') || '{}').displayName } catch {}
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          userName,
          timestamp: new Date().toISOString(),
        }),
      })
      setMessage('')
      setType('bug')
      setSent(true)
    } catch { /* silent fail */ }
    setSending(false)
  }

  const types: { value: FeedbackType; label: string }[] = [
    { value: 'bug', label: 'Bug' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Report an issue"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 900,
          width: 40, height: 40, borderRadius: '50%',
          background: C.rule, border: 'none', cursor: 'pointer',
          display: open ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.4, transition: 'opacity .2s',
          color: C.text2, fontSize: 18,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
      >
        {/* Flag icon (SVG) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </button>

      {/* Backdrop + Panel */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 950,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 440,
              background: C.warm, borderRadius: '16px 16px 0 0',
              padding: '24px 20px 28px', fontFamily: SANS,
              animation: 'slideUp .25s ease-out',
            }}
          >
            {sent ? (
              <p style={{ textAlign: 'center', color: C.green, fontFamily: SERIF, fontSize: 18, margin: 0 }}>
                Thanks for the feedback!
              </p>
            ) : (
              <>
                <h3 style={{ margin: '0 0 16px', fontFamily: SERIF, fontSize: 20, color: C.text }}>
                  Report an issue
                </h3>

                {/* Type pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {types.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        fontSize: 13, fontFamily: SANS, fontWeight: 600,
                        background: type === t.value ? C.accent : C.rule,
                        color: type === t.value ? '#fff' : C.text2,
                        transition: 'all .15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What happened?"
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    padding: 12, borderRadius: 10,
                    border: `1px solid ${C.rule}`, background: C.bg,
                    color: C.text, fontFamily: SANS, fontSize: 14,
                    outline: 'none',
                  }}
                />

                {/* Submit */}
                <button
                  onClick={submit}
                  disabled={!message.trim() || sending}
                  style={{
                    marginTop: 14, width: '100%', padding: '12px 0',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: message.trim() ? C.accent : C.rule,
                    color: '#fff', fontFamily: SANS, fontSize: 15, fontWeight: 600,
                    opacity: sending ? 0.6 : 1, transition: 'all .15s',
                  }}
                >
                  {sending ? 'Sending...' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </>
  )
}
