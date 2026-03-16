'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

// ===== TYPES =====
type TrendingVideo = {
  videoId: string
  title: string
  dishName: string
  channelTitle: string
  channelId: string
  thumbnail: string
  publishedAt: string
  platform: 'youtube' | 'tiktok-via-youtube'
  url: string
  description: string
  viewCount: number
}

type TrendingTopic = {
  title: string
  traffic: string
  url: string
}

// ===== HELPERS =====
function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`
  return `${count} views`
}

function platformLabel(platform: 'youtube' | 'tiktok-via-youtube'): { text: string; color: string; bg: string } {
  if (platform === 'tiktok-via-youtube') {
    return { text: 'TikTok Viral', color: '#fff', bg: 'rgba(0,0,0,0.75)' }
  }
  return { text: 'YouTube', color: '#fff', bg: 'rgba(255,0,0,0.75)' }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function isEnglish(str: string): boolean {
  const latin = str.replace(/[^a-zA-Z]/g, '').length
  return str.length > 0 && latin / str.length > 0.4
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}


// ===== PAGE =====
export default function TrendingPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<TrendingVideo[]>([])
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cookingId, setCookingId] = useState<string | null>(null)
  const [cookProgress, setCookProgress] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchTrending() }, [])

  async function fetchTrending() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/trending?limit=15')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setVideos(data.videos || [])
      setTopics(data.trendingTopics || [])
    } catch {
      setError('Could not load trending recipes. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  function handleImport(video: TrendingVideo) {
    router.push(`/contribute?url=${encodeURIComponent(video.url)}`)
  }

  async function handleCookThis(video: TrendingVideo) {
    setCookingId(video.videoId)
    setCookProgress('Reading transcript…')

    try {
      const res = await fetch('/api/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, dishName: video.dishName }),
      })

      if (!res.ok) throw new Error('Import failed')
      const data = await res.json()

      if (data.error) {
        setCookProgress('')
        setCookingId(null)
        // Low confidence or extraction issue → route to edit flow
        handleImport(video)
        return
      }

      // Medium confidence → saved, but route to recipe page (not cook mode)
      // so user can review before cooking
      if (data.confidence === 'medium') {
        setCookProgress('Opening recipe…')
        router.push(`/recipe/${data.slug}`)
        return
      }

      // High confidence → straight to cook mode
      setCookProgress('Opening cook mode…')
      router.push(`/recipe/${data.slug}/cook`)
    } catch {
      setCookingId(null)
      setCookProgress('')
      handleImport(video)
    }
  }

  const hero = videos[0]
  const rest = videos.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .trend-card { transition: border-color 0.2s, transform 0.2s; }
        .trend-card:hover { border-color: ${C.rule} !important; transform: translateY(-3px); }
        .trend-scroll::-webkit-scrollbar { height: 0; }
        .import-btn { transition: background 0.15s, transform 0.1s; }
        .import-btn:hover { background: #D66A4A !important; transform: scale(1.02); }
        .import-btn:active { transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>An open recipe commons</p>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontFamily: SANS }}>
              <Link href="/browse" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Browse</Link>
              <Link href="/contribute" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Contribute</Link>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600, fontFamily: MONO, letterSpacing: 0.3 }}>Trending</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, margin: 0 }}>
              Trending This Week
            </h1>
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Updated hourly
            </span>
          </div>
          <p style={{ color: C.text2, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            The most popular single-dish recipes going viral right now. One click to import into RecDex.
          </p>
        </div>

        {/* Trending topics pills */}
        {topics.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topics.map((t, i) => (
                <a key={i} href={t.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 20,
                    padding: '5px 14px', fontSize: 13, color: C.text, textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.ruleLight)}
                >
                  <span style={{ fontSize: 11 }}>📈</span>
                  {t.title}
                  {t.traffic && <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>{t.traffic}</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 28, height: 28, border: `2.5px solid ${C.rule}`, borderTopColor: C.accent,
              borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: C.text3, fontSize: 13, fontFamily: MONO }}>Scanning for trending recipes…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: C.text2, fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button onClick={fetchTrending}
              style={{ background: C.warm, color: C.text, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}

        {/* Hero + Grid */}
        {!loading && !error && hero && (
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>

            {/* === HERO CARD === */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0,
              background: C.warm, borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.ruleLight}`, marginBottom: 32,
            }}>
              {/* Hero thumbnail */}
              <a href={hero.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', position: 'relative', overflow: 'hidden' }}>
                <img src={hero.thumbnail} alt={hero.dishName}
                  style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, transparent 50%, rgba(41,37,36,0.4))',
                }} />
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  background: 'rgba(232,123,90,0.9)', backdropFilter: 'blur(4px)',
                  padding: '4px 12px', borderRadius: 6,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: '#fff', fontFamily: MONO,
                }}>
                  🔥 #1 Trending
                </div>
              </a>

              {/* Hero info */}
              <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: C.text3, fontFamily: MONO, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
                }}>
                  {(() => { const p = platformLabel(hero.platform); return (
                    <span style={{ background: p.bg, color: p.color, padding: '2px 7px', borderRadius: 4, fontSize: 9, letterSpacing: '0.04em' }}>{p.text}</span>
                  ) })()}
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{formatViewCount(hero.viewCount)}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{timeAgo(hero.publishedAt)}</span>
                </div>

                <h2 style={{
                  fontFamily: SERIF, fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 10, lineHeight: 1.25,
                }}>
                  {hero.dishName}
                </h2>

                <div style={{ fontSize: 14, color: C.text2, marginBottom: 6 }}>
                  {hero.channelTitle}
                </div>

                {hero.description && isEnglish(hero.description) && (
                  <p style={{
                    fontSize: 13, color: C.text3, margin: 0, marginBottom: 20, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {decodeHtml(hero.description)}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
                  <button className="import-btn"
                    onClick={() => handleCookThis(hero)}
                    disabled={cookingId === hero.videoId}
                    style={{
                      background: C.accent, color: '#fff', border: 'none', borderRadius: 8,
                      padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: cookingId === hero.videoId ? 'wait' : 'pointer', fontFamily: SANS,
                      opacity: cookingId === hero.videoId ? 0.7 : 1,
                    }}>
                    {cookingId === hero.videoId ? cookProgress || 'Extracting…' : 'Cook This →'}
                  </button>
                  <button
                    onClick={() => handleImport(hero)}
                    style={{
                      background: 'transparent', border: `1px solid ${C.rule}`, borderRadius: 8,
                      padding: '10px 16px', color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = C.text3)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.rule)}
                  >
                    Edit first →
                  </button>
                  <a href={hero.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'transparent', border: `1px solid ${C.rule}`, borderRadius: 8,
                      padding: '10px 16px', color: C.text2, textDecoration: 'none', fontSize: 13, fontWeight: 500,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = C.text3)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.rule)}
                  >
                    Watch ↗
                  </a>
                </div>
              </div>
            </div>

            {/* === SECTION LABEL === */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontFamily: MONO, whiteSpace: 'nowrap' }}>
                More trending
              </div>
              <div style={{ flex: 1, height: 1, background: C.ruleLight }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.rule}`, background: C.warm, color: C.text2, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ←
                </button>
                <button onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.rule}`, background: C.warm, color: C.text2, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  →
                </button>
              </div>
            </div>

            {/* === HORIZONTAL SCROLL === */}
            <div ref={scrollRef} className="trend-scroll"
              style={{
                display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8,
                scrollSnapType: 'x mandatory',
              }}>
              {rest.map((video, i) => (
                <div key={video.videoId} className="trend-card"
                  style={{
                    flex: '0 0 260px', scrollSnapAlign: 'start',
                    background: C.warm, borderRadius: 10, overflow: 'hidden',
                    border: `1px solid ${C.ruleLight}`,
                    animation: `fadeUp 0.3s ease-out ${i * 0.04}s both`,
                  }}>
                  {/* Thumb */}
                  <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative' }}>
                    <img src={video.thumbnail} alt={video.dishName}
                      style={{ width: '100%', height: 146, objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                    }} />
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                      padding: '2px 7px', borderRadius: 4,
                      fontSize: 10, fontWeight: 600, color: C.text2, fontFamily: MONO,
                    }}>
                      #{i + 2}
                    </div>
                  </a>

                  {/* Info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <h3 style={{
                      fontFamily: SERIF, fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 5,
                      lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {video.dishName}
                    </h3>
                    <div style={{ fontSize: 11, color: C.text3, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {(() => { const p = platformLabel(video.platform); return (
                        <span style={{ background: p.bg, color: p.color, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600, letterSpacing: '0.03em' }}>{p.text}</span>
                      ) })()}
                      <span>{video.channelTitle}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.text3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO }}>
                      <span>{formatViewCount(video.viewCount)}</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span>{timeAgo(video.publishedAt)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="import-btn"
                        onClick={() => handleCookThis(video)}
                        disabled={cookingId === video.videoId}
                        style={{
                          flex: 1, background: C.accent, color: '#fff', border: 'none',
                          borderRadius: 6, padding: '7px 0', fontSize: 11, fontWeight: 600,
                          cursor: cookingId === video.videoId ? 'wait' : 'pointer',
                          opacity: cookingId === video.videoId ? 0.7 : 1,
                        }}>
                        {cookingId === video.videoId ? cookProgress || 'Extracting…' : 'Cook This →'}
                      </button>
                      <button
                        onClick={() => handleImport(video)}
                        title="Review & edit before publishing"
                        style={{
                          background: 'transparent', border: `1px solid ${C.rule}`, borderRadius: 6,
                          padding: '7px 10px', fontSize: 11, color: C.text3, cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = C.text3)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = C.rule)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: C.text2, fontSize: 14, marginBottom: 16 }}>No trending recipes found right now.</p>
            <button onClick={fetchTrending}
              style={{ background: C.warm, color: C.text, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        )}

        {/* How it works */}
        <div style={{
          marginTop: 48, padding: '20px 24px',
          background: C.warm, borderRadius: 10, border: `1px solid ${C.ruleLight}`,
          display: 'flex', gap: 32, alignItems: 'flex-start',
        }}>
          {[
            { icon: '📡', title: 'We scan', desc: 'YouTube and TikTok-viral content is searched hourly for the most viewed recipe videos from the past 7 days.' },
            { icon: '🤖', title: 'AI extracts', desc: 'Claude reads the video transcript and pulls out ingredients, steps, and cook times.' },
            { icon: '📖', title: 'You cook', desc: 'A clean, structured recipe — with servings adjuster, cook mode, and the original video.' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{s.title}</div>
              <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
