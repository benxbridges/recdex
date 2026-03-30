'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

// ===== TYPES =====
type Platform = 'youtube' | 'tiktok' | 'instagram' | 'web' | 'other'
type Mode = 'video' | 'manual'
type FlowStep = 'url' | 'extracting' | 'review' | 'publishing' | 'success'

type OEmbedResult = {
  title?: string
  author_name?: string
  author_url?: string
  thumbnail_url?: string
}

type Ingredient = { name: string; amount: string; unit: string; notes: string }
type Step = { step: number; text: string; timer_minutes: number | null }

type ExtractedRecipe = {
  title: string
  description: string
  cuisine: string
  difficulty: 'easy' | 'medium' | 'advanced'
  time_total: number | null
  time_active: number | null
  servings: number | null
  ingredients: Ingredient[]
  steps: Step[]
  confidence: 'high' | 'medium' | 'low'
  videoId?: string
  embedUrl?: string
}

// ===== PAYWALL DETECTION =====
const PAYWALL_DOMAINS = ['cooking.nytimes.com', 'nytimes.com', 'wsj.com']

function isPaywalledUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace('www.', '')
    return PAYWALL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch { return false }
}

// ===== HELPERS =====
function detectPlatform(url: string): Platform {
  try {
    const h = new URL(url).hostname.toLowerCase()
    if (h.includes('tiktok.com')) return 'tiktok'
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
    if (h.includes('instagram.com')) return 'instagram'
    // Any other valid URL with a hostname is a web recipe
    if (h.length > 0) return 'web'
  } catch { /* invalid */ }
  return 'other'
}

async function fetchOembed(url: string): Promise<OEmbedResult | null> {
  const platform = detectPlatform(url)
  if (platform !== 'tiktok' && platform !== 'youtube') return null
  try {
    const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`)
    if (res.ok) return await res.json()
  } catch { /* ignore */ }
  return null
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('?')[0]
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop() || null
    }
  } catch { /* invalid */ }
  return null
}

async function fetchYouTubeTranscript(url: string): Promise<string | null> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return null

  try {
    const res = await fetch('/api/youtube-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.transcript || null
  } catch {
    return null
  }
}

function getDisplayName(): string {
  try { return JSON.parse(localStorage.getItem('recdex-profile') || '{}').displayName || '' }
  catch { return '' }
}

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: '#FF0000', tiktok: '#69C9D0', instagram: '#E1306C', web: C.accent, other: C.text3,
}
const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', web: 'Website', other: 'Link',
}

// ===== PLATFORM ICONS =====
function PlatformIcon({ platform, size = 14 }: { platform: Platform; size?: number }) {
  const color = PLATFORM_COLORS[platform]
  if (platform === 'youtube') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.9-2-.9C16.6 5 12 5 12 5s-4.6 0-7 .1c-.4 0-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.8C6.8 19 12 19 12 19s4.6 0 7-.1c.4 0 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z" />
    </svg>
  )
  if (platform === 'tiktok') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
    </svg>
  )
  if (platform === 'instagram') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill={color} />
    </svg>
  )
  if (platform === 'web') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cfg = {
    high: { label: 'High confidence', color: C.green, bg: C.greenBg },
    medium: { label: 'Medium confidence', color: C.gold, bg: C.goldBg },
    low: { label: 'Low confidence — check carefully', color: C.accent, bg: C.accentBg },
  }[confidence]
  return (
    <span style={{ padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontFamily: MONO, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

const BLANK_INGREDIENT = (): Ingredient => ({ name: '', amount: '', unit: '', notes: '' })

// ===== MAIN COMPONENT =====
export default function ContributePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: C.bg }} />}>
      <ContributeInner />
    </Suspense>
  )
}

function ContributeInner() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('video')
  const [flowStep, setFlowStep] = useState<FlowStep>('url')
  const [displayName, setDisplayName] = useState('')

  // Video mode — URL step
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<Platform>('other')
  const [oembed, setOembed] = useState<OEmbedResult | null>(null)
  const [oembedLoading, setOembedLoading] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const oembedTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const autoExtractPending = useRef(false)

  // Mirror / paywall state
  const [isPaywalled, setIsPaywalled] = useState(false)
  const [mirrorSearching, setMirrorSearching] = useState(false)
  const [mirrorResults, setMirrorResults] = useState<{ url: string; title: string; domain: string }[]>([])

  // Shared review state
  const [extracted, setExtracted] = useState<ExtractedRecipe | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'advanced'>('easy')
  const [timeTotal, setTimeTotal] = useState('')
  const [timeActive, setTimeActive] = useState('')
  const [servings, setServings] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([BLANK_INGREDIENT()])
  const [steps, setSteps] = useState<string[]>([''])
  const [publishError, setPublishError] = useState('')
  const [similarWarning, setSimilarWarning] = useState('')
  const [copyrightCertified, setCopyrightCertified] = useState(false)

  // Image selection
  const [imageOptions, setImageOptions] = useState<{ url: string; thumb: string; credit: string }[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagesLoading, setImagesLoading] = useState(false)

  // Web source author (extracted from page meta)
  const [webAuthor, setWebAuthor] = useState<string | null>(null)

  // Responsive
  const [isMobile, setIsMobile] = useState(false)

  // Success
  const [publishedSlug, setPublishedSlug] = useState('')

  const searchParams = useSearchParams()

  useEffect(() => { setDisplayName(getDisplayName()) }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Pre-fill URL from query params and auto-extract
  useEffect(() => {
    const prefillUrl = searchParams.get('url')
    if (prefillUrl && !url) {
      setUrl(prefillUrl)
      autoExtractPending.current = true
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // oEmbed debounce + auto-extract for URL prefills
  useEffect(() => {
    const trimmed = url.trim()
    if (!trimmed) { setOembed(null); setPlatform('other'); setIsPaywalled(false); setMirrorResults([]); return }
    const p = detectPlatform(trimmed)
    setPlatform(p)
    setOembed(null)

    // Paywall detection — auto-search for mirrors
    const paywalled = isPaywalledUrl(trimmed)
    setIsPaywalled(paywalled)
    if (paywalled) {
      setMirrorResults([])
      setMirrorSearching(true)
      fetch('/api/find-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
        .then(r => r.json())
        .then(data => { setMirrorResults(data.mirrors || []); setMirrorSearching(false) })
        .catch(() => setMirrorSearching(false))
    }

    if (p === 'tiktok' || p === 'youtube') {
      if (oembedTimer.current) clearTimeout(oembedTimer.current)
      oembedTimer.current = setTimeout(async () => {
        setOembedLoading(true)
        const data = await fetchOembed(trimmed)
        setOembed(data)
        setOembedLoading(false)
        // Auto-extract after oembed loads for video URLs
        if (autoExtractPending.current && data) {
          autoExtractPending.current = false
          setTimeout(() => handleExtract(p), 100)
        }
      }, 400)
    } else if ((p === 'web' || p === 'instagram') && autoExtractPending.current) {
      // For web/instagram, no oembed needed — extract immediately
      autoExtractPending.current = false
      setTimeout(() => handleExtract(p), 100)
    }
    return () => { if (oembedTimer.current) clearTimeout(oembedTimer.current) }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  const canExtract = Boolean(url.trim() && platform !== 'other' && !oembedLoading && (oembed || platform === 'instagram' || platform === 'web'))

  const handleExtract = async (overridePlatform?: Platform) => {
    const effectivePlatform = overridePlatform || platform
    setExtractError('')
    setFlowStep('extracting')
    try {
      // For YouTube, try to fetch transcript client-side as fallback
      let transcript: string | null = pastedText.trim() || null
      if (!transcript && effectivePlatform === 'youtube') {
        transcript = await fetchYouTubeTranscript(url.trim())
      }

      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), platform: effectivePlatform, authorName: oembed?.author_name || null, authorUrl: oembed?.author_url || null, oembedTitle: oembed?.title || null, transcript }),
      })
      const data = await res.json()

      if (data.error === 'insufficient_content') {
        setFlowStep('url')
        setExtractError('')
        setShowPasteBox(true)
        return
      }
      if (data.error || !data.recipe) {
        setFlowStep('url')
        setExtractError('Extraction failed — try again, or paste the recipe text below.')
        setShowPasteBox(true)
        return
      }

      const recipe: ExtractedRecipe = data.recipe
      setExtracted(recipe)
      if (data.authorName) setWebAuthor(data.authorName)
      setTitle(recipe.title || '')
      setDescription(recipe.description || '')
      setCuisine(recipe.cuisine || '')
      setDifficulty(recipe.difficulty || 'easy')
      setTimeTotal(recipe.time_total != null ? String(recipe.time_total) : '')
      setTimeActive(recipe.time_active != null ? String(recipe.time_active) : '')
      setServings(recipe.servings != null ? String(recipe.servings) : '')
      setIngredients(recipe.ingredients?.length > 0 ? recipe.ingredients : [BLANK_INGREDIENT()])
      setSteps(recipe.steps?.length > 0 ? recipe.steps.map(s => s.text) : [''])
      setFlowStep('review')

      // Fetch image options from Unsplash
      if (recipe.title) fetchImageOptions(recipe.title)
    } catch {
      setFlowStep('url')
      setExtractError('Something went wrong. Try again.')
    }
  }

  // Fetch image options from Unsplash
  const fetchImageOptions = async (query: string) => {
    setImagesLoading(true)
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(query + ' food recipe')}`)
      if (res.ok) {
        const data = await res.json()
        setImageOptions(data.images || [])
        if (data.images?.length > 0) setSelectedImage(data.images[0].url)
      }
    } catch { /* ignore */ }
    setImagesLoading(false)
  }

  // Switch mode — reset to fresh state
  const switchMode = (m: Mode) => {
    setMode(m)
    setFlowStep(m === 'manual' ? 'review' : 'url')
    setUrl('')
    setPlatform('other')
    setOembed(null)
    setExtracted(null)
    setExtractError('')
    setPublishError('')
    setSimilarWarning('')
    setTitle(''); setDescription(''); setCuisine(''); setDifficulty('easy')
    setTimeTotal(''); setTimeActive(''); setServings('')
    setIngredients([BLANK_INGREDIENT()])
    setSteps([''])
  }

  const checkOriginality = async () => {
    if (!title.trim()) { setSimilarWarning(''); return }
    const { data } = await supabase.from('recipes').select('title').ilike('title', `%${title.trim()}%`).eq('status', 'published').limit(3)
    if (data && data.length > 0) setSimilarWarning(`"${data[0].title}" already exists — is yours a different version?`)
    else setSimilarWarning('')
  }

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    setIngredients(prev => { const a = [...prev]; a[i] = { ...a[i], [field]: value }; return a })
  }

  const handlePublish = async () => {
    const validIngredients = ingredients.filter(i => i.name.trim())
    const validSteps = steps.filter(s => s.trim())
    if (!title.trim()) { setPublishError('Recipe title is required.'); return }
    if (validIngredients.length === 0) { setPublishError('Add at least one ingredient.'); return }
    if (validSteps.length === 0) { setPublishError('Add at least one step.'); return }

    setFlowStep('publishing')
    setPublishError('')

    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

    try {
      const res = await fetch('/api/publish-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: {
            slug,
            title: title.trim(),
            description: description.trim() || null,
            cuisine: cuisine.trim() || null,
            difficulty,
            time_total: timeTotal ? parseInt(timeTotal) : null,
            time_active: timeActive ? parseInt(timeActive) : null,
            servings: servings ? parseInt(servings) : null,
            ingredients: validIngredients.map(i => ({ name: i.name.trim(), amount: i.amount.trim(), unit: i.unit.trim(), notes: i.notes?.trim() || '' })),
            steps: validSteps.map((text, i) => ({ step: i + 1, text: text.trim(), timer_minutes: extracted?.steps?.[i]?.timer_minutes ?? null })),
            video_url: mode === 'video' && platform !== 'web' ? url.trim() : null,
            creator_name: platform === 'web' ? (webAuthor || null) : (oembed?.author_name || null),
            creator_url: mode === 'video' ? (oembed?.author_url || null) : null,
            image_url: selectedImage || (mode === 'video' ? (oembed?.thumbnail_url || null) : null),
            source_url: platform === 'web' ? url.trim() : (mode === 'video' ? url.trim() : null),
            source_attribution: platform === 'web' ? (() => { try { return new URL(url.trim()).hostname.replace('www.', '') } catch { return null } })() : null,
          },
          submission: mode === 'video' ? {
            url: url.trim(), platform,
            title: oembed?.title || title.trim(),
            author_name: oembed?.author_name || null,
            author_url: oembed?.author_url || null,
            thumbnail_url: oembed?.thumbnail_url || null,
            display_name: displayName,
          } : null,
        }),
      })

      if (!res.ok) {
        setFlowStep('review')
        setPublishError('Something went wrong publishing. Try again.')
        return
      }
    } catch {
      setFlowStep('review')
      setPublishError('Something went wrong publishing. Try again.')
      return
    }

    // Go straight to cook mode
    router.push(`/recipe/${slug}/cook`)
  }

  const resetFlow = () => {
    setFlowStep('url')
    setMode('video')
    setUrl(''); setPlatform('other'); setOembed(null); setExtracted(null)
    setExtractError(''); setPublishError(''); setSimilarWarning(''); setShowPasteBox(false); setPastedText('')
    setTitle(''); setDescription(''); setCuisine(''); setDifficulty('easy')
    setTimeTotal(''); setTimeActive(''); setServings('')
    setIngredients([BLANK_INGREDIENT()]); setSteps([''])
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 6,
    border: `1.5px solid ${C.ruleLight}`, background: C.cool,
    fontSize: 14, fontFamily: SANS, color: C.text, outline: 'none',
    boxSizing: 'border-box',
  }
  const lbl = (text: string) => (
    <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
      {text}
    </span>
  )

  const showTabs = flowStep === 'url' || (mode === 'manual' && flowStep === 'review')

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>Be a better cook.</p>
            </Link>
            {!isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontFamily: SANS }}>
                <Link href="/" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Browse</Link>
                <div style={{ width: 1, height: 14, background: C.rule }} />
                <Link href="/pantry" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Kitchen</Link>
                <div style={{ width: 1, height: 14, background: C.rule }} />
                <Link href="/profile" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Profile</Link>
                <ThemeToggle />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(40px,8vw,72px) clamp(16px,4vw,24px)' }}>

        {/* ===== HEADER + TABS ===== */}
        {flowStep !== 'extracting' && flowStep !== 'success' && (
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px,5vw,38px)', fontWeight: 700, color: C.text, margin: '0 0 24px', lineHeight: 1.1, letterSpacing: -0.5 }}>
              Import a Recipe
            </h1>
            {/* Mode tabs — only visible when not deep in video flow */}
            {showTabs && (
              <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.ruleLight}` }}>
                {([
                  { key: 'video', label: 'From a URL', icon: '▶' },
                  { key: 'manual', label: 'Write it in', icon: '✎' },
                ] as { key: Mode; label: string; icon: string }[]).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    style={{
                      padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: SANS, fontSize: 13, fontWeight: mode === key ? 600 : 400,
                      color: mode === key ? C.text : C.text3,
                      borderBottom: mode === key ? `2px solid ${C.accent}` : '2px solid transparent',
                      marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7,
                      transition: 'color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 11 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile gate */}
        {!displayName && flowStep !== 'success' && (
          <div style={{ background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 10, padding: '28px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, fontSize: 17, color: C.text, margin: '0 0 8px', fontWeight: 600 }}>Set up your profile first</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: '0 0 20px', lineHeight: 1.5 }}>You need a display name to contribute recipes to the community.</p>
            <Link href="/profile" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 6, background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SANS, textDecoration: 'none' }}>
              Set up profile →
            </Link>
          </div>
        )}

        {displayName && (
          <>
            {/* ===== VIDEO: URL STEP ===== */}
            {mode === 'video' && flowStep === 'url' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <p style={{ fontFamily: SANS, fontSize: 15, color: C.text2, lineHeight: 1.65, margin: '0 0 24px', maxWidth: 480 }}>
                  Paste any recipe URL — YouTube, TikTok, Instagram, or any cooking blog. We extract the recipe and give you a structured version to review and publish.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* URL input */}
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                      <PlatformIcon platform={platform} size={16} />
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://cooking.nytimes.com/recipes/..."
                      autoFocus
                      style={{ ...inp, paddingLeft: 40, fontSize: 14 }}
                      onKeyDown={e => { if (e.key === 'Enter' && canExtract) handleExtract() }}
                    />
                  </div>

                  {oembedLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}`, marginBottom: 12 }}>
                      <div style={{ width: 14, height: 14, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                      <span style={{ fontFamily: SANS, fontSize: 13, color: C.text3 }}>Looking up video…</span>
                    </div>
                  )}

                  {oembed && !oembedLoading && (
                    <div style={{ display: 'flex', gap: 14, padding: '13px 16px', background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}`, marginBottom: 12, alignItems: 'center' }}>
                      {oembed.thumbnail_url && (
                        <img src={oembed.thumbnail_url} alt="" style={{ width: 76, height: 54, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oembed.title}</p>
                        {oembed.author_name && <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0 }}><PlatformIcon platform={platform} size={10} /> {oembed.author_name}</p>}
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: C.greenBg, color: C.green, fontSize: 11, fontFamily: MONO, fontWeight: 600, flexShrink: 0 }}>✓ found</span>
                    </div>
                  )}

                  {platform === 'instagram' && url.trim() && (
                    <div style={{ padding: '12px 16px', background: C.goldBg, borderRadius: 8, border: `1px solid rgba(212,162,78,0.2)`, marginBottom: 12 }}>
                      <p style={{ fontFamily: SANS, fontSize: 13, color: C.gold, margin: 0, lineHeight: 1.5 }}>Instagram has limited API access — extraction works best when the full recipe is in the caption.</p>
                    </div>
                  )}

                  {extractError && (
                    <div style={{ padding: '12px 16px', background: C.accentBg, borderRadius: 8, border: `1px solid rgba(232,123,90,0.2)`, marginBottom: 12 }}>
                      <p style={{ fontFamily: SANS, fontSize: 13, color: C.accent, margin: 0, lineHeight: 1.5 }}>{extractError}</p>
                    </div>
                  )}

                  {/* ===== PAYWALL / MIRROR SEARCH ===== */}
                  {isPaywalled && (
                    <div style={{ padding: '14px 16px', background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}`, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: mirrorSearching || mirrorResults.length > 0 ? 10 : 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text }}>
                          Paywalled site — {mirrorSearching ? 'searching for a mirror…' : mirrorResults.length > 0 ? 'found mirrors to use instead:' : 'no mirrors found. Paste the recipe text below.'}
                        </span>
                        {mirrorSearching && <div style={{ width: 12, height: 12, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                      </div>
                      {mirrorResults.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {mirrorResults.map((m, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setUrl(m.url)
                                setIsPaywalled(false)
                                setMirrorResults([])
                                setTimeout(() => handleExtract('web'), 100)
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: C.bg, border: `1px solid ${C.ruleLight}`,
                                borderRadius: 6, padding: '9px 12px', cursor: 'pointer',
                                textAlign: 'left', width: '100%',
                              }}
                            >
                              <span style={{ fontFamily: MONO, fontSize: 11, color: C.accent, flexShrink: 0, background: C.accentBg, padding: '2px 7px', borderRadius: 4 }}>{m.domain}</span>
                              <span style={{ fontFamily: SANS, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.title || m.url}</span>
                              <span style={{ fontFamily: SANS, fontSize: 12, color: C.text3, flexShrink: 0 }}>Use →</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {showPasteBox && (
                    <div style={{ padding: '20px', background: C.warm, borderRadius: 10, border: `1px solid ${C.ruleLight}`, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text2} strokeWidth="2" strokeLinecap="round">
                          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text }}>Paste the recipe</span>
                      </div>
                      <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 12px', lineHeight: 1.5 }}>
                        Paste the ingredient list and basic steps from the video description. Claude will extract the factual recipe information and rewrite it in clear, original language.
                      </p>
                      <textarea
                        value={pastedText}
                        onChange={e => setPastedText(e.target.value)}
                        placeholder={"e.g.\n2 cups flour\n1 egg\nSalt to taste\n\nMix flour and egg, knead for 5 min..."}
                        rows={6}
                        autoFocus
                        style={{
                          width: '100%', fontFamily: SANS, fontSize: 14, background: C.cool,
                          color: C.text, border: `1px solid ${C.rule}`, borderRadius: 6,
                          padding: '12px 14px', resize: 'vertical', boxSizing: 'border-box',
                          lineHeight: 1.55,
                        }}
                      />
                      <button
                        onClick={() => handleExtract()}
                        disabled={!pastedText.trim()}
                        style={{
                          marginTop: 10, fontFamily: SANS, fontSize: 14, fontWeight: 700,
                          background: pastedText.trim() ? C.accent : C.rule,
                          color: pastedText.trim() ? '#fff' : C.text3,
                          border: 'none', borderRadius: 6, padding: '11px 24px',
                          cursor: pastedText.trim() ? 'pointer' : 'default',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Import Recipe →
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, marginBottom: 24, marginTop: 4, flexWrap: 'wrap' }}>
                    {(['youtube', 'tiktok', 'instagram', 'web'] as Platform[]).map(p => (
                      <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: SANS, fontSize: 12, color: C.text3 }}>
                        <PlatformIcon platform={p} size={12} />{p === 'web' ? 'Any recipe site' : PLATFORM_LABELS[p]}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleExtract()}
                    disabled={!canExtract}
                    style={{
                      width: '100%', padding: '15px 24px', borderRadius: 8, border: 'none',
                      background: canExtract ? C.accent : C.ruleLight,
                      color: canExtract ? '#fff' : C.text3,
                      fontSize: 15, fontWeight: 700, cursor: canExtract ? 'pointer' : 'default',
                      fontFamily: SANS, transition: 'all 0.15s', letterSpacing: '-0.01em',
                    }}
                  >
                    Import Recipe →
                  </button>
                </div>
              </div>
            )}

            {/* ===== EXTRACTING SPINNER ===== */}
            {flowStep === 'extracting' && (
              <div style={{ textAlign: 'center', paddingTop: 80, animation: 'fadeUp 0.2s ease' }}>
                <div style={{ width: 52, height: 52, border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 28px' }} />
                <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.text, margin: '0 0 10px', fontWeight: 700 }}>
                  {platform === 'web' ? 'Reading recipe page…' : 'Analyzing video…'}
                </h2>
                <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                  {platform === 'youtube'
                    ? 'Fetching transcript and description, then extracting a structured recipe with Claude.'
                    : platform === 'tiktok'
                    ? 'Fetching TikTok transcript and caption, then extracting a structured recipe with Claude.'
                    : platform === 'web'
                    ? 'Scraping the recipe page and extracting ingredients, steps, and cooking tips with Claude.'
                    : 'Reading the Instagram caption and extracting ingredients and steps.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
                  {(platform === 'web'
                    ? ['Fetching page', 'Reading content', 'Extracting recipe']
                    : ['Fetching video data', 'Reading transcript', 'Extracting recipe']
                  ).map((step, i) => (
                    <span key={i} style={{
                      fontFamily: MONO, fontSize: 10, color: C.text3,
                      padding: '4px 10px', borderRadius: 20,
                      background: C.warm, border: `1px solid ${C.ruleLight}`,
                      animation: `fadeUp 0.3s ease ${i * 0.3}s both`,
                    }}>{step}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ===== REVIEW FORM (shared by both modes) ===== */}
            {(flowStep === 'review' || flowStep === 'publishing') && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                {/* Sub-header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                  <div>
                    {mode === 'video' && (
                      <button
                        onClick={() => setFlowStep('url')}
                        style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontFamily: SANS, fontSize: 13, padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                        Back to URL
                      </button>
                    )}
                    <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: 0 }}>
                      {mode === 'video' ? 'Review the recipe — edit anything that looks off.' : 'Fill in your recipe details below.'}
                    </p>
                  </div>
                  {extracted && <ConfidenceBadge confidence={extracted.confidence} />}
                </div>

                {/* Attribution card */}
                {mode === 'video' && (oembed?.author_name || oembed?.thumbnail_url || platform === 'web') && (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '13px 16px', background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}`, marginBottom: 24 }}>
                    {oembed?.thumbnail_url && (
                      <img src={oembed.thumbnail_url} alt="" style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>Source</p>
                      <p style={{ fontFamily: SANS, fontSize: 13, color: C.text, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {platform === 'web'
                          ? (webAuthor || (() => { try { return new URL(url.trim()).hostname.replace('www.', '') } catch { return 'Website' } })())
                          : (oembed?.author_name || 'Original creator')}
                      </p>
                      <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0 }}>
                        {platform === 'web'
                          ? (() => { try { return new URL(url.trim()).hostname.replace('www.', '') } catch { return '' } })()
                          : `Originally on ${PLATFORM_LABELS[platform]}`}
                      </p>
                    </div>
                    <PlatformIcon platform={platform} size={18} />
                  </div>
                )}

                {/* Image picker */}
                {(imageOptions.length > 0 || imagesLoading) && (
                  <div style={{ marginBottom: 24 }}>
                    {lbl('Choose a photo')}
                    {imagesLoading ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, aspectRatio: '16/10', borderRadius: 8, background: C.cool, animation: 'fadeUp 0.3s ease' }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 8 }}>
                        {imageOptions.map((img, i) => (
                          <div key={i} onClick={() => setSelectedImage(img.url)} style={{
                            position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                            border: selectedImage === img.url ? `3px solid ${C.accent}` : `3px solid transparent`,
                            opacity: selectedImage === img.url ? 1 : 0.6,
                            transition: 'all 0.15s',
                          }}>
                            <img src={img.thumb} alt="" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }} />
                            {selectedImage === img.url && (
                              <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <button onClick={() => { setSelectedImage(null); setImageOptions([]) }} style={{
                        background: 'none', border: 'none', fontSize: 11, fontFamily: SANS, color: C.text3, cursor: 'pointer', padding: 0,
                      }}>No photo</button>
                      {selectedImage && imageOptions.find(i => i.url === selectedImage)?.credit && (
                        <span style={{ fontSize: 10, fontFamily: SANS, color: C.text3 }}>
                          Photo by {imageOptions.find(i => i.url === selectedImage)?.credit} · Unsplash
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    {lbl('Title')}
                    <input value={title} onChange={e => setTitle(e.target.value)} onBlur={checkOriginality} style={inp} placeholder="Recipe name" />
                    {similarWarning && <p style={{ fontFamily: SANS, fontSize: 12, color: C.gold, margin: '6px 0 0', lineHeight: 1.4 }}>{similarWarning}</p>}
                  </div>

                  <div>
                    {lbl('Description')}
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.55 }} placeholder="1–2 sentence description of the dish" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      {lbl('Cuisine')}
                      <input value={cuisine} onChange={e => setCuisine(e.target.value)} style={inp} placeholder="e.g. Italian" />
                    </div>
                    <div>
                      {lbl('Difficulty')}
                      <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'easy' | 'medium' | 'advanced')} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      {lbl('Total time (min)')}
                      <input type="number" min="1" value={timeTotal} onChange={e => setTimeTotal(e.target.value)} style={inp} placeholder="45" />
                    </div>
                    <div>
                      {lbl('Active time (min)')}
                      <input type="number" min="1" value={timeActive} onChange={e => setTimeActive(e.target.value)} style={inp} placeholder="20" />
                    </div>
                    <div>
                      {lbl('Serves')}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <button
                          onClick={() => setServings(prev => String(Math.max(1, (parseInt(prev) || 2) - 1)))}
                          style={{
                            width: 36, height: 38, border: `1.5px solid ${C.ruleLight}`, borderRight: 'none',
                            borderRadius: '6px 0 0 6px', background: C.cool, cursor: 'pointer',
                            fontSize: 18, fontWeight: 600, color: C.text2, fontFamily: SANS,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >-</button>
                        <input type="number" min="1" value={servings} onChange={e => setServings(e.target.value)} style={{ ...inp, borderRadius: 0, textAlign: 'center', MozAppearance: 'textfield', WebkitAppearance: 'none' } as React.CSSProperties} placeholder="4" />
                        <button
                          onClick={() => setServings(prev => String((parseInt(prev) || 0) + 1))}
                          style={{
                            width: 36, height: 38, border: `1.5px solid ${C.ruleLight}`, borderLeft: 'none',
                            borderRadius: '0 6px 6px 0', background: C.cool, cursor: 'pointer',
                            fontSize: 18, fontWeight: 600, color: C.text2, fontFamily: SANS,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      {lbl('Ingredients')}
                      <button onClick={() => setIngredients(prev => [...prev, BLANK_INGREDIENT()])} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: 0 }}>+ Add row</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr 1.2fr 24px', gap: 6, marginBottom: 5, padding: '0 2px' }}>
                      {['Ingredient', 'Amount', 'Unit', ''].map(h => (
                        <span key={h} style={{ fontFamily: SANS, fontSize: 10, color: C.text3, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {ingredients.map((ing, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr 1.2fr 24px', gap: 6, alignItems: 'center' }}>
                          <input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} style={{ ...inp, fontSize: 13, padding: '8px 12px' }} placeholder="e.g. flour" />
                          <input value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} style={{ ...inp, fontSize: 13, padding: '8px 12px' }} placeholder="2" />
                          <select value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} style={{ ...inp, fontSize: 13, padding: '8px 10px', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 24 }}>
                            <option value="">—</option>
                            {/* Volume */}
                            <option value="cups">cups</option>
                            <option value="tbsp">tbsp</option>
                            <option value="tsp">tsp</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            {/* Weight */}
                            <option value="oz">oz</option>
                            <option value="lbs">lbs</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            {/* Count / Descriptive */}
                            <option value="whole">whole</option>
                            <option value="large">large</option>
                            <option value="medium">medium</option>
                            <option value="small">small</option>
                            <option value="cloves">cloves</option>
                            <option value="slices">slices</option>
                            <option value="pieces">pieces</option>
                            <option value="heads">heads</option>
                            <option value="stalks">stalks</option>
                            <option value="leaves">leaves</option>
                            <option value="sprigs">sprigs</option>
                            <option value="bunch">bunch</option>
                            <option value="pinch">pinch</option>
                            <option value="dash">dash</option>
                            <option value="can">can</option>
                            <option value="pkg">pkg</option>
                            {/* Allow custom value if Claude returns something not in list */}
                            {ing.unit && !['','cups','tbsp','tsp','ml','L','oz','lbs','g','kg','whole','large','medium','small','cloves','slices','pieces','heads','stalks','leaves','sprigs','bunch','pinch','dash','can','pkg'].includes(ing.unit) && (
                              <option value={ing.unit}>{ing.unit}</option>
                            )}
                          </select>
                          <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1, textAlign: 'center' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      {lbl('Steps')}
                      <button onClick={() => setSteps(prev => [...prev, ''])} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: 0 }}>+ Add step</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {steps.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: MONO, fontSize: 12, color: C.text3, paddingTop: 9, flexShrink: 0, minWidth: 18, textAlign: 'right' }}>{i + 1}</span>
                          <textarea
                            value={s}
                            onChange={e => setSteps(prev => { const a = [...prev]; a[i] = e.target.value; return a })}
                            rows={2}
                            style={{ ...inp, flex: 1, resize: 'vertical', lineHeight: 1.55, fontSize: 13, padding: '8px 12px' }}
                            placeholder={`Step ${i + 1}…`}
                          />
                          <button onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 18, padding: '6px 0', lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Copyright certification */}
                <div style={{
                  marginTop: 24, padding: '16px 18px', background: C.warm,
                  border: `1px solid ${C.ruleLight}`, borderRadius: 10,
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={copyrightCertified}
                      onChange={e => setCopyrightCertified(e.target.checked)}
                      style={{ marginTop: 2, accentColor: C.accent, width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontFamily: SANS, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                      I certify that this recipe contains only factual cooking information (ingredients, quantities, temperatures, times, and techniques) and does not copy creative expression, personal stories, or distinctive language from another source. I have reviewed and accept the{' '}
                      <Link href="/terms" target="_blank" style={{ color: C.accent, textDecoration: 'underline' }}>Terms of Use</Link>.
                    </span>
                  </label>
                </div>

                {publishError && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: C.accentBg, borderRadius: 8, border: `1px solid rgba(232,123,90,0.2)` }}>
                    <p style={{ fontFamily: SANS, fontSize: 13, color: C.accent, margin: 0 }}>{publishError}</p>
                  </div>
                )}

                <button
                  onClick={handlePublish}
                  disabled={flowStep === 'publishing' || !copyrightCertified}
                  style={{
                    width: '100%', padding: '15px 24px', borderRadius: 8, border: 'none',
                    background: (flowStep === 'publishing' || !copyrightCertified) ? C.rule : C.accent,
                    color: (flowStep === 'publishing' || !copyrightCertified) ? C.text3 : '#fff',
                    fontSize: 15, fontWeight: 700, cursor: (flowStep === 'publishing' || !copyrightCertified) ? 'default' : 'pointer',
                    fontFamily: SANS, marginTop: 16, letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  {flowStep === 'publishing' ? (
                    <><div style={{ width: 16, height: 16, border: `2px solid ${C.text3}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Publishing…</>
                  ) : 'Save & Start Cooking →'}
                </button>
              </div>
            )}

            {/* ===== SUCCESS ===== */}
            {flowStep === 'success' && (
              <div style={{ textAlign: 'center', paddingTop: 60, animation: 'fadeUp 0.4s ease' }}>
                <div style={{ fontSize: 52, marginBottom: 20, lineHeight: 1 }}>✓</div>
                <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: C.text, margin: '0 0 12px', letterSpacing: -0.5 }}>Recipe saved!</h2>
                <p style={{ fontFamily: SANS, fontSize: 15, color: C.text2, marginBottom: 36, lineHeight: 1.6 }}>
                  Added to your recipe index — ready to cook with step-by-step guidance.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href={`/recipe/${publishedSlug}/cook`} style={{ padding: '12px 24px', borderRadius: 8, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: SANS, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                    Start cooking →
                  </Link>
                  <Link href={`/recipe/${publishedSlug}`} style={{ padding: '12px 24px', borderRadius: 8, border: `1.5px solid ${C.rule}`, background: 'none', color: C.text2, fontSize: 14, fontWeight: 600, fontFamily: SANS, textDecoration: 'none' }}>
                    View recipe
                  </Link>
                </div>
                <button onClick={resetFlow} style={{ marginTop: 16, padding: '8px 16px', border: 'none', background: 'none', color: C.text3, fontSize: 13, cursor: 'pointer', fontFamily: SANS }}>
                  ← Cook another recipe
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes spin {
          from { transform: rotate(0deg) }
          to { transform: rotate(360deg) }
        }
        input[type="url"]::placeholder, input[type="text"]::placeholder,
        input[type="number"]::placeholder, textarea::placeholder { color: ${C.text3}; opacity: 1; }
        select option { background: ${C.cool}; color: ${C.text}; }
      `}</style>
    </div>
  )
}
