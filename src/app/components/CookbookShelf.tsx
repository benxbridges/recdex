'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

type Cookbook = {
  id: string
  title: string
  author: string
  cover_url: string | null
  blurb: string | null
  bookshop_url: string | null
  amazon_url: string | null
}

export default function CookbookShelf() {
  const [books, setBooks] = useState<Cookbook[]>([])
  const [loaded, setLoaded] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('cookbooks')
      .select('id, title, author, cover_url, blurb, bookshop_url, amazon_url')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setBooks(data as Cookbook[])
        setLoaded(true)
      })
  }, [])

  if (loaded && books.length === 0) return null

  const buyHref = (b: Cookbook) => b.bookshop_url || b.amazon_url || '#'
  const buyLabel = (b: Cookbook) => b.bookshop_url ? 'Buy on Bookshop' : b.amazon_url ? 'Buy on Amazon' : 'Find a copy'

  const scroll = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <section style={{
      maxWidth: 1100, margin: '0 auto',
      padding: 'clamp(28px, 5vw, 44px) clamp(16px, 4vw, 24px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <h3 style={{
          fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 26px)',
          fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.5,
        }}>On our shelf</h3>
        <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0, fontStyle: 'italic' }}>
          Cookbooks we&apos;d cook from. Affiliate links — buying through us helps.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
          style={{
            position: 'absolute', top: '50%', left: -10, transform: 'translateY(-50%)',
            zIndex: 2, width: 32, height: 32, borderRadius: '50%',
            background: C.bg, border: `1px solid ${C.rule}`, color: C.text2,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: MONO, fontSize: 14,
          }}
        >‹</button>
        <button
          aria-label="Scroll right"
          onClick={() => scroll(1)}
          style={{
            position: 'absolute', top: '50%', right: -10, transform: 'translateY(-50%)',
            zIndex: 2, width: 32, height: 32, borderRadius: '50%',
            background: C.bg, border: `1px solid ${C.rule}`, color: C.text2,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: MONO, fontSize: 14,
          }}
        >›</button>

        <div
          ref={scrollerRef}
          style={{
            display: 'flex', gap: 18, overflowX: 'auto', overflowY: 'hidden',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            paddingBottom: 12, scrollbarWidth: 'none',
          }}
          className="cookbook-scroller"
        >
          {books.map(b => (
            <a
              key={b.id}
              href={buyHref(b)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                flex: '0 0 200px', scrollSnapAlign: 'start',
                textDecoration: 'none', color: C.text,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Cover */}
              <div style={{
                width: '100%', aspectRatio: '2 / 3',
                background: C.cool, borderRadius: 4, overflow: 'hidden',
                boxShadow: '0 6px 16px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
                position: 'relative',
              }}>
                {b.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.cover_url}
                    alt={`${b.title} cover`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: SERIF, fontSize: 13, color: C.text3, padding: 16, textAlign: 'center',
                  }}>{b.title}</div>
                )}
              </div>

              {/* Meta */}
              <div style={{ padding: '10px 2px 0' }}>
                <div style={{
                  fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text,
                  lineHeight: 1.25, marginBottom: 2,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{b.title}</div>
                <div style={{
                  fontFamily: SANS, fontSize: 11, color: C.text3, marginBottom: 6,
                }}>{b.author}</div>
                {b.blurb && (
                  <div style={{
                    fontFamily: SANS, fontSize: 12, color: C.text2, lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: 8,
                  }}>{b.blurb}</div>
                )}
                <span style={{
                  display: 'inline-block', fontFamily: MONO, fontSize: 10,
                  color: C.accent, letterSpacing: 0.5,
                }}>{buyLabel(b)} →</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .cookbook-scroller::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}
