'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

// ===== TYPES =====
type TrendingVideo = {
  videoId: string
  title: string
  channelTitle: string
  channelId: string
  thumbnail: string
  publishedAt: string
  platform: 'youtube'
  url: string
  description: string
}

type TrendingTopic = {
  title: string
  traffic: string
  url: string
}

// ===== HELPERS =====
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
  const [importingId, setImportingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTrending()
  }, [])

  async function fetchTrending() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/trending?limit=12')
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
    // Navigate to /contribute with the URL pre-filled
    const params = new URLSearchParams({ url: video.url })
    router.push(`/contribute?${params}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.ruleLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: C.text, fontFamily: SERIF, fontSize: 20, fontWeight: 700 }}>
          RecDex
        </Link>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/browse" style={{ color: C.text2, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Browse</Link>
          <Link href="/contribute" style={{ color: C.text2, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Contribute</Link>
          <Link href="/trending" style={{ color: C.accent, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Trending</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
        {/* Page heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: SERIF, fontSize: 32, fontWeight: 700, margin: 0, marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 28 }}>🔥</span> Trending Recipes
          </h1>
          <p style={{ color: C.text2, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Popular recipe videos from the past week. Click "Import" to bring any recipe into RecDex.
          </p>
        </div>

        {/* Trending topics pills */}
        {topics.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, marginBottom: 10, fontFamily: MONO }}>
              Trending food topics
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topics.map((t, i) => (
                <a
                  key={i}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 20,
                    padding: '5px 14px', fontSize: 13, color: C.text, textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.ruleLight)}
                >
                  {t.title}
                  {t.traffic && (
                    <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>{t.traffic}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 32, height: 32, border: `3px solid ${C.rule}`, borderTopColor: C.accent,
              borderRadius: '50%', margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: C.text2, fontSize: 14 }}>Finding trending recipes…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: C.accent, fontSize: 14, marginBottom: 12 }}>{error}</p>
            <button
              onClick={fetchTrending}
              style={{
                background: C.accent, color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video grid */}
        {!loading && !error && videos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {videos.map(video => (
              <div
                key={video.videoId}
                style={{
                  background: C.warm, borderRadius: 10, overflow: 'hidden',
                  border: `1px solid ${C.ruleLight}`,
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.rule
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.ruleLight
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Thumbnail */}
                <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative' }}>
                  <img
                    src={video.thumbnail}
                    alt={decodeHtml(video.title)}
                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    color: '#FF6B6B', fontFamily: MONO,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <span style={{ fontSize: 7 }}>▶</span> YouTube
                  </div>
                </a>

                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  <h3 style={{
                    fontFamily: SERIF, fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 6,
                    lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {decodeHtml(video.title)}
                  </h3>

                  <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>
                    {video.channelTitle}
                  </div>

                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 12, fontFamily: MONO }}>
                    {timeAgo(video.publishedAt)}
                  </div>

                  {video.description && (
                    <p style={{
                      fontSize: 12, color: C.text3, margin: 0, marginBottom: 12,
                      lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {decodeHtml(video.description)}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleImport(video)}
                      disabled={importingId === video.videoId}
                      style={{
                        flex: 1, background: C.accent, color: '#fff', border: 'none',
                        borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 600,
                        cursor: importingId === video.videoId ? 'wait' : 'pointer',
                        opacity: importingId === video.videoId ? 0.6 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {importingId === video.videoId ? 'Importing…' : 'Import to RecDex →'}
                    </button>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, background: C.cool, border: `1px solid ${C.ruleLight}`,
                        borderRadius: 6, color: C.text2, textDecoration: 'none', fontSize: 14,
                      }}
                      title="Watch on YouTube"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: C.text2, fontSize: 14, marginBottom: 12 }}>No trending recipes found right now.</p>
            <button
              onClick={fetchTrending}
              style={{
                background: C.accent, color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        )}

        {/* Info footer */}
        <div style={{
          marginTop: 40, padding: '20px 24px',
          background: C.warm, borderRadius: 10, border: `1px solid ${C.ruleLight}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, marginBottom: 8, fontFamily: MONO }}>
            How it works
          </div>
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>
            We scan YouTube for the most popular recipe videos from the past week. Click <strong style={{ color: C.text }}>Import to RecDex</strong> on
            any video — we&apos;ll extract the transcript, pull out ingredients and steps, and create a
            structured recipe you can cook from. The original creator always gets credit.
          </p>
        </div>
      </main>
    </div>
  )
}
