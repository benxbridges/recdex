'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

type CookLogEntry = {
  id: string
  display_name: string | null
  cooked_at: string
  note: string | null
  with_who: string | null
  rating: number | null
  substitutions: string | null
  photo_url: string | null
}

function formatLogDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

export default function CookLog({ recipeSlug }: { recipeSlug: string }) {
  const [entries, setEntries] = useState<CookLogEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!recipeSlug) return
    supabase
      .from('cook_logs')
      .select('id, display_name, cooked_at, note, with_who, rating, substitutions, photo_url')
      .eq('recipe_slug', recipeSlug)
      .eq('private', false)
      .order('cooked_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          // Filter out empty rows (rating-only with no note text)
          const meaningful = (data as CookLogEntry[]).filter(e => e.note || e.substitutions || e.with_who)
          setEntries(meaningful)
        }
        setLoaded(true)
      })
  }, [recipeSlug])

  if (!loaded || entries.length === 0) return null

  return (
    <section style={{ paddingTop: 28, paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>
          From the cook log
        </h2>
        <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{entries.length}</span>
      </div>
      <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 18px', fontStyle: 'italic', lineHeight: 1.5 }}>
        Notes taped to this recipe by cooks who&apos;ve made it.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 18,
      }}>
        {entries.map((e, i) => {
          // Subtle alternating tilt for the "torn paper" feel
          const tilt = (i % 4 === 0) ? -1.2 : (i % 4 === 1) ? 0.8 : (i % 4 === 2) ? -0.4 : 1.4
          return (
            <article
              key={e.id}
              style={{
                position: 'relative',
                background: '#FCFAF2',
                border: `1px solid ${C.ruleLight}`,
                borderRadius: 3,
                padding: '20px 18px 16px',
                fontFamily: SERIF,
                color: C.text,
                lineHeight: 1.55,
                transform: `rotate(${tilt}deg)`,
                boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)',
                backgroundImage: `repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.04) 23px, rgba(0,0,0,0.04) 24px)`,
                backgroundPosition: '0 14px',
              }}
            >
              {/* Tape strip */}
              <span aria-hidden style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
                width: 60, height: 16,
                background: 'rgba(212, 162, 78, 0.35)',
                borderLeft: '1px dashed rgba(0,0,0,0.05)',
                borderRight: '1px dashed rgba(0,0,0,0.05)',
              }} />

              {/* Date + author */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontFamily: MONO, fontSize: 10, color: C.text3,
                marginBottom: 10, letterSpacing: 0.3,
              }}>
                <span>{formatLogDate(e.cooked_at)}</span>
                {e.display_name && <span style={{ fontStyle: 'italic' }}>— {e.display_name}</span>}
              </div>

              {/* Rating */}
              {e.rating && (
                <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                  {Array.from({ length: 5 }).map((_, n) => (
                    <span key={n} aria-hidden style={{
                      width: 9, height: 11, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                      background: n < (e.rating || 0) ? C.accent : C.ruleLight,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              )}

              {/* The note */}
              {e.note && (
                <p style={{ margin: '0 0 10px', fontSize: 14.5, lineHeight: 1.6 }}>{e.note}</p>
              )}

              {/* With who */}
              {e.with_who && (
                <p style={{ margin: '0 0 6px', fontSize: 12.5, color: C.text2, fontStyle: 'italic' }}>
                  with {e.with_who}
                </p>
              )}

              {/* Substitutions */}
              {e.substitutions && (
                <p style={{
                  margin: '8px 0 0', fontSize: 12, color: C.text2,
                  fontFamily: SANS, paddingTop: 8, borderTop: `1px dashed ${C.ruleLight}`,
                }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, marginRight: 6 }}>Sub</span>
                  {e.substitutions}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
