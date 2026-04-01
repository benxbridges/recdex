'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'
import OnboardingFlow, { type OnboardingProfile } from '@/app/components/OnboardingFlow'

// ===== TYPES =====
type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; category_id: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  time_passive: number | null; time_passive_label: string | null
  image_url: string | null; servings: number | null; servings_label: string | null
  tags: string[] | null
  ingredients: unknown[]; steps: { step: number; text: string; timer_minutes: number | null }[]
  submitted_by?: string | null; source?: string | null
}

type Category = { id: string; name: string; recipe_count: number }

type ExtractedRecipe = {
  title: string; description?: string; cuisine?: string; difficulty?: string
  time_total?: number | null; servings?: number | null
  ingredients: { name: string; amount: string; unit: string; notes?: string }[]
  steps: { step: number; text: string; timer_minutes: number | null; phase?: string }[]
}

type ExtractState = 'idle' | 'extracting' | 'preview' | 'error'

// ===== HELPERS =====
function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
}

function isUrl(text: string): boolean {
  const t = text.trim()
  if (/^https?:\/\//i.test(t)) return true
  if (/^(www\.)?[a-z0-9-]+\.[a-z]{2,}/i.test(t)) return true
  return false
}

function detectPlatform(url: string): string {
  try {
    const h = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase()
    if (h.includes('tiktok.com')) return 'tiktok'
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
    if (h.includes('instagram.com')) return 'instagram'
  } catch { /* ignore */ }
  return 'web'
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch { return 'the web' }
}

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: C.green, bg: C.greenBg },
  simple: { label: 'Easy', color: C.green, bg: C.greenBg },
  beginner: { label: 'Easy', color: C.green, bg: C.greenBg },
  medium: { label: 'Medium', color: C.gold, bg: C.goldBg },
  moderate: { label: 'Medium', color: C.gold, bg: C.goldBg },
  intermediate: { label: 'Medium', color: C.gold, bg: C.goldBg },
  hard: { label: 'Advanced', color: C.accent, bg: C.accentBg },
  difficult: { label: 'Advanced', color: C.accent, bg: C.accentBg },
  advanced: { label: 'Advanced', color: C.accent, bg: C.accentBg },
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = DIFFICULTY_MAP[difficulty?.toLowerCase()] || DIFFICULTY_MAP.easy
  return <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: d.color, background: d.bg, padding: '2px 7px', borderRadius: 1, fontFamily: MONO }}>{d.label}</span>
}

function BrokenEggCard() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.warm }}>
      <svg width="48" height="36" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.4 }}>
        <ellipse cx="100" cy="115" rx="55" ry="18" fill={C.ruleLight} />
        <g transform="translate(42, 30) rotate(-8)"><path d="M0 50 C0 22, 12 0, 28 0 C44 0, 56 22, 56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill={C.cool} stroke={C.rule} strokeWidth="2.5" /></g>
        <g transform="translate(102, 35) rotate(12)"><path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22, 36 0, 20 0 C4 0, -8 22, 0 48Z" fill={C.cool} stroke={C.rule} strokeWidth="2.5" /></g>
        <ellipse cx="100" cy="108" rx="16" ry="12" fill="#E8A44A" opacity="0.2" />
        <ellipse cx="100" cy="106" rx="13" ry="10" fill="#E8A44A" opacity="0.35" />
      </svg>
    </div>
  )
}

function BrokenEggSmall() {
  return (
    <svg width="32" height="24" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
      <ellipse cx="100" cy="115" rx="55" ry="18" fill={C.ruleLight} />
      <g transform="translate(42, 30) rotate(-8)"><path d="M0 50 C0 22, 12 0, 28 0 C44 0, 56 22, 56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill={C.warm} stroke={C.rule} strokeWidth="3" /></g>
      <g transform="translate(102, 35) rotate(12)"><path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22, 36 0, 20 0 C4 0, -8 22, 0 48Z" fill={C.warm} stroke={C.rule} strokeWidth="3" /></g>
      <ellipse cx="100" cy="108" rx="16" ry="12" fill="#E8A44A" opacity="0.25" />
      <ellipse cx="100" cy="106" rx="13" ry="10" fill="#E8A44A" opacity="0.35" />
    </svg>
  )
}

function getRotdIndex(total: number): number {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000)
  return ((daysSinceEpoch * 2654435761) >>> 0) % total
}

// Animated placeholder hints
const PLACEHOLDERS = [
  'Paste a recipe URL...',
  'any recipe blog or site...',
  'YouTube or TikTok link...',
  'any blog or video link...',
]

// ===== INGREDIENT MATCHING HELPERS =====
type IngredientItem = { name: string; amount: string; unit: string; notes?: string }

function getIngredientItems(ingredients: unknown): IngredientItem[] {
  if (!ingredients) return []
  if (Array.isArray(ingredients)) {
    if (ingredients.length > 0 && typeof ingredients[0] === 'object' && 'group' in (ingredients[0] as Record<string, unknown>)) {
      return (ingredients as Array<{ items: IngredientItem[] }>).flatMap(g => g.items || [])
    }
    return ingredients as IngredientItem[]
  }
  return []
}

function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const u = userIngredient.toLowerCase().trim()
  const r = recipeIngredient.toLowerCase().trim()
  if (!u || !r) return false
  if (r === u || r.includes(u) || u.includes(r)) return true
  const uWords = u.split(/\s+/)
  const rWords = r.split(/\s+/)
  for (const uw of uWords) {
    if (uw.length < 3) continue
    for (const rw of rWords) {
      if (rw.length < 3) continue
      if (rw.startsWith(uw) || uw.startsWith(rw)) return true
    }
  }
  return false
}

// ===== MAIN PAGE =====
export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const [tonightsPick, setTonightsPick] = useState<Recipe | null>(null)
  const [shuffledRecipes, setShuffledRecipes] = useState<Recipe[]>([])
  const allRecipesRef = useRef<Recipe[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // "What Can I Cook?" state
  const [kitchenInput, setKitchenInput] = useState('')
  const [kitchenTags, setKitchenTags] = useState<string[]>([])

  // Extraction state
  const [extractState, setExtractState] = useState<ExtractState>('idle')
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null)
  const [extractDomain, setExtractDomain] = useState('')
  const [extractError, setExtractError] = useState('')
  const [pasteText, setPasteText] = useState('')
  const extractingUrlRef = useRef('')

  // Responsive
  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])

  // Animated placeholder
  useEffect(() => {
    if (inputFocused || input) return
    const timer = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(timer)
  }, [inputFocused, input])

  // Onboarding
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
      if (!profile.onboardingComplete) setShowOnboarding(true)
    } catch { setShowOnboarding(true) }
  }, [])

  // Fetch homepage data
  useEffect(() => { supabase.from('categories').select('*').order('sort_order').then(({ data }) => { if (data) setCategories(data) }) }, [])
  useEffect(() => { supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'published').then(({ count }) => { if (count) setTotalCount(count) }) }, [])

  const shuffleRecipes = useCallback((all: Recipe[], excludeId?: string) => {
    const pool = excludeId ? all.filter(r => r.id !== excludeId) : all
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setShuffledRecipes(shuffled.slice(0, 8))
  }, [])

  useEffect(() => {
    async function fetchHomepage() {
      const { data: allRecipes } = await supabase
        .from('recipes').select('*').eq('status', 'published')
        .order('created_at', { ascending: false })
      if (!allRecipes || allRecipes.length === 0) return
      allRecipesRef.current = allRecipes
      // Use featured recipe as Tonight's Pick if one is set, otherwise fall back to date rotation
      const featured = allRecipes.find(r => r.featured)
      const pick = featured ?? allRecipes[getRotdIndex(allRecipes.length)]
      setTonightsPick(pick)
      shuffleRecipes(allRecipes, pick?.id)
    }
    fetchHomepage()
  }, [shuffleRecipes])

  // Extract recipe from URL
  const extractRecipe = useCallback(async (url: string) => {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    extractingUrlRef.current = normalized
    setExtractState('extracting')
    setExtractDomain(getDomain(url))
    setExtractedRecipe(null)
    setExtractError('')

    try {
      const platform = detectPlatform(url)
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, platform }),
      })
      // Check if this is still the current extraction
      if (extractingUrlRef.current !== normalized) return

      const data = await res.json()
      if (data.error) {
        setExtractState('error')
        setExtractError(data.error === 'insufficient_content'
          ? 'Not enough recipe content found.'
          : 'Could not extract recipe.')
        return
      }
      if (data.recipe) {
        setExtractedRecipe(data.recipe)
        setExtractState('preview')
      }
    } catch {
      if (extractingUrlRef.current === normalized) {
        setExtractState('error')
        setExtractError('Something went wrong. Try pasting the recipe text instead.')
      }
    }
  }, [])

  // Handle input changes — detect URL paste
  const handleInputChange = (value: string) => {
    setInput(value)
    if (extractState !== 'idle') {
      // Reset if user clears input
      if (!value.trim()) {
        setExtractState('idle')
        setExtractedRecipe(null)
      }
    }
  }

  // Handle submit (Enter key or button)
  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (isUrl(trimmed)) {
      extractRecipe(trimmed)
    } else {
      router.push(`/browse?q=${encodeURIComponent(trimmed)}`)
    }
  }

  // Handle paste event — auto-extract URLs
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (isUrl(pasted)) {
      // Let the onChange update first, then extract
      setTimeout(() => extractRecipe(pasted), 100)
    }
  }

  // Start cooking with extracted recipe
  // "What Can I Cook?" ingredient matching
  const kitchenMatches = useMemo(() => {
    if (kitchenTags.length === 0) return []
    const userIngs = kitchenTags.map(t => t.toLowerCase())
    return allRecipesRef.current
      .map(r => {
        const items = getIngredientItems(r.ingredients)
        const matched = items.filter(i => userIngs.some(u => ingredientMatches(u, i.name)))
        return { recipe: r, matched: matched.length, total: items.length, fraction: items.length > 0 ? matched.length / items.length : 0 }
      })
      .filter(m => m.matched > 0)
      .sort((a, b) => b.fraction - a.fraction || a.total - b.total)
      .slice(0, 5)
  }, [kitchenTags])

  const handleKitchenKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = kitchenInput.trim().replace(/,$/, '')
      if (val && !kitchenTags.includes(val.toLowerCase())) {
        setKitchenTags(prev => [...prev, val.toLowerCase()])
      }
      setKitchenInput('')
    }
  }

  const startCooking = () => {
    if (!extractedRecipe) return
    const tempRecipe = {
      id: 'temp-scan',
      slug: 'temp-scan',
      title: extractedRecipe.title,
      description: extractedRecipe.description || null,
      cuisine: extractedRecipe.cuisine || null,
      difficulty: extractedRecipe.difficulty || 'medium',
      time_total: extractedRecipe.time_total || null,
      servings: extractedRecipe.servings || null,
      ingredients: extractedRecipe.ingredients,
      steps: extractedRecipe.steps,
    }
    sessionStorage.setItem('recdex-temp-recipe', JSON.stringify(tempRecipe))
    window.location.href = '/recipe/temp-scan/cook'
  }

  // Onboarding fullscreen
  if (showOnboarding) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          *{box-sizing:border-box}body{margin:0;background:${C.bg}}
        `}</style>
        <OnboardingFlow onComplete={(profile: OnboardingProfile) => { setShowOnboarding(false) }} />
      </div>
    )
  }

  const ingCount = extractedRecipe?.ingredients?.length || 0
  const stepCount = extractedRecipe?.steps?.length || 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}input::placeholder{color:${C.text3}}textarea::placeholder{color:${C.text3}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* ===== HEADER ===== */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '12px 16px 10px' : '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setInput(''); setExtractState('idle'); setExtractedRecipe(null) }}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
              {!isMobile && <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>The world's cookbook.</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, fontFamily: SANS }}>
              <Link href="/browse" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Browse</Link>
              <Link href="/profile" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Profile</Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO: SMART INPUT ===== */}
      <div style={{
        background: C.warm, borderBottom: `1px solid ${C.rule}`,
        padding: isMobile ? '28px 16px 24px' : '44px clamp(16px,4vw,24px) 36px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: SERIF,
            fontSize: isMobile ? 22 : 30,
            fontWeight: 700, color: C.text, margin: '0 0 6px',
            letterSpacing: -0.5, lineHeight: 1.15,
          }}>
            Cook everything.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, marginBottom: 18 }}>
            The best recipes from the best cooks — all in one place.
          </p>

          {/* Smart input */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            {/* Link icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={extractState === 'extracting' ? C.accent : inputFocused ? C.accent : C.text3}
              strokeWidth="2" strokeLinecap="round"
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.15s' }}
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <input
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              onPaste={handlePaste}
              disabled={extractState === 'extracting'}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              style={{
                width: '100%',
                padding: isMobile ? '14px 14px 14px 44px' : '16px 18px 16px 48px',
                border: `2px solid ${extractState === 'extracting' ? C.accent : extractState === 'preview' ? C.green : inputFocused ? C.accent : C.accent + '44'}`,
                borderRadius: 12, fontSize: isMobile ? 15 : 16, color: C.text,
                fontFamily: SANS, outline: 'none', background: C.bg,
                boxShadow: inputFocused || extractState !== 'idle' ? '0 4px 20px rgba(232,123,90,0.12)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                opacity: extractState === 'extracting' ? 0.7 : 1,
              }}
            />
          </div>

          {/* Extraction status */}
          {extractState === 'extracting' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, fontFamily: SANS, color: C.accent, fontWeight: 500 }}>
                Reading recipe from {extractDomain}...
              </span>
            </div>
          )}

          {/* Extraction preview */}
          {extractState === 'preview' && extractedRecipe && (
            <div style={{ marginTop: 16, animation: 'slideUp 0.3s ease', textAlign: 'left' }}>
              <div style={{
                padding: '18px 20px', borderRadius: 14,
                background: C.bg, border: `1.5px solid ${C.green}`,
                boxShadow: '0 4px 20px rgba(107,158,98,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: C.green, textTransform: 'uppercase', letterSpacing: 1 }}>Recipe found</span>
                </div>
                <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 8px', lineHeight: 1.2 }}>
                  {extractedRecipe.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {extractedRecipe.time_total && <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(extractedRecipe.time_total)}</span>}
                  {extractedRecipe.cuisine && <><span style={{ color: C.rule, fontSize: 8 }}>·</span><span style={{ fontSize: 11, fontFamily: SANS, color: C.text3 }}>{extractedRecipe.cuisine}</span></>}
                  <span style={{ color: C.rule, fontSize: 8 }}>·</span>
                  <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{ingCount} ingredients · {stepCount} steps</span>
                </div>
                <button
                  onClick={startCooking}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 24px', borderRadius: 12, border: 'none',
                    background: C.accent, color: '#fff',
                    fontSize: 16, fontWeight: 700, fontFamily: SANS, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(232,123,90,0.3)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Start Cooking
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                </button>
              </div>
              <button
                onClick={() => { setExtractState('idle'); setInput(''); setExtractedRecipe(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.text3, fontFamily: SANS, marginTop: 8, padding: '4px 0' }}
              >
                Try a different recipe
              </button>
            </div>
          )}

          {/* Extraction error */}
          {extractState === 'error' && (
            <div style={{ marginTop: 16, animation: 'fadeIn 0.2s ease', textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: C.accent, fontFamily: SANS, margin: '0 0 10px' }}>
                {extractError} Paste the recipe text instead:
              </p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste the full recipe text here..."
                rows={6}
                style={{
                  width: '100%', padding: 14, borderRadius: 10,
                  border: `1.5px solid ${C.rule}`, background: C.bg, color: C.text,
                  fontFamily: SANS, fontSize: 14, outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => {
                    if (pasteText.trim()) {
                      extractRecipe(input.trim())
                    }
                  }}
                  disabled={!pasteText.trim()}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    background: pasteText.trim() ? C.accent : C.ruleLight,
                    color: pasteText.trim() ? '#fff' : C.text3,
                    fontSize: 13, fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
                  }}
                >
                  Extract from text
                </button>
                <button
                  onClick={() => { setExtractState('idle'); setInput(''); setExtractError('') }}
                  style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.rule}`, background: 'transparent', color: C.text3, fontSize: 13, fontFamily: SANS, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons + quick tags (only in idle state) */}
          {extractState === 'idle' && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Link href="/scan" style={{
                  padding: '7px 16px', borderRadius: 20,
                  border: `1.5px solid ${C.rule}`, background: 'transparent',
                  color: C.text2, fontSize: 12, fontFamily: SANS, fontWeight: 600,
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 14 }}>📷</span> Scan a cookbook
                </Link>
                {['pasta', 'chicken', 'vegetarian', 'baking'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/browse?q=${encodeURIComponent(tag)}`)}
                    style={{
                      padding: '5px 14px', borderRadius: 20,
                      border: `1px solid ${C.rule}`, background: 'transparent',
                      color: C.text3, fontSize: 12, fontFamily: SANS, cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <Link href="/browse" style={{ fontSize: 12, fontFamily: SANS, color: C.text3, textDecoration: 'none' }}>
                or browse <span style={{ color: C.accent, fontWeight: 600 }}>{totalCount} recipes from around the world →</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ===== TONIGHT'S PICK ===== */}
      {tonightsPick && (
        <div style={{
          maxWidth: 640, margin: '0 auto',
          padding: isMobile ? '24px 16px' : '36px clamp(16px,4vw,24px)',
          animation: 'slideUp 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent }} />
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: C.accent, textTransform: 'uppercase', letterSpacing: 1.5 }}>Tonight&apos;s pick</span>
          </div>
          <Link href={`/recipe/${tonightsPick.slug}`} style={{ display: 'block', borderRadius: 14, overflow: 'hidden', background: C.warm, marginBottom: 16, aspectRatio: '16/9' }}>
            {tonightsPick.image_url ? <img src={tonightsPick.image_url} alt={tonightsPick.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <BrokenEggCard />}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(tonightsPick.time_total)}</span>
            {tonightsPick.cuisine && <><span style={{ color: C.rule, fontSize: 8 }}>·</span><span style={{ fontSize: 11, fontFamily: SANS, color: C.text3 }}>{tonightsPick.cuisine}</span></>}
          </div>
          <h3 style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.text, lineHeight: 1.15, margin: '0 0 8px', letterSpacing: -0.5 }}>{tonightsPick.title}</h3>
          {tonightsPick.description && <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 480 }}>{tonightsPick.description}</p>}
          <Link href={`/recipe/${tonightsPick.slug}/cook`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 12, border: 'none',
            background: C.accent, color: '#fff',
            fontSize: 16, fontWeight: 700, fontFamily: SANS, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(232,123,90,0.3)',
          }}>
            Start Cooking
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}><div style={{ height: 1, background: C.rule }} /></div>

      {/* ===== WHAT CAN I COOK? ===== */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '24px 16px' : '28px clamp(16px,4vw,24px)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🍳</span>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: MONO, margin: 0 }}>What can I cook?</p>
          </div>
          <Link href="/pantry" style={{ fontSize: 11, fontFamily: SANS, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>Full kitchen →</Link>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 12,
          padding: '10px 14px', marginBottom: kitchenTags.length > 0 ? 12 : 0,
        }}>
          {kitchenTags.map(tag => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.rule}`,
              fontSize: 12, fontFamily: SANS, fontWeight: 500, color: C.text,
            }}>
              {tag}
              <button onClick={() => setKitchenTags(prev => prev.filter(t => t !== tag))} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 11, color: C.text3, lineHeight: 1,
              }}>×</button>
            </span>
          ))}
          <input
            value={kitchenInput}
            onChange={e => setKitchenInput(e.target.value)}
            onKeyDown={handleKitchenKeyDown}
            placeholder={kitchenTags.length === 0 ? 'Type ingredients you have...' : 'Add more...'}
            style={{
              flex: 1, minWidth: 120, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, fontFamily: SANS, color: C.text, padding: '4px 0',
            }}
          />
        </div>

        {/* Quick matches */}
        {kitchenMatches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {kitchenMatches.slice(0, 3).map(m => (
              <Link key={m.recipe.id} href={`/recipe/${m.recipe.slug}`} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 8, background: C.warm, border: `1px solid ${C.ruleLight}`,
                textDecoration: 'none', transition: 'border-color 0.1s',
              }}>
                {m.recipe.image_url ? (
                  <img src={m.recipe.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: C.cool, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.recipe.title}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>
                    {m.recipe.cuisine}{m.recipe.time_total ? ` · ${formatTime(m.recipe.time_total)}` : ''}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontFamily: MONO, color: m.fraction >= 0.6 ? C.green : C.gold, fontWeight: 600, flexShrink: 0 }}>
                  {m.matched}/{m.total}
                </span>
              </Link>
            ))}
            {kitchenMatches.length > 3 && (
              <Link href="/pantry" style={{ fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 600, textDecoration: 'none', textAlign: 'center', padding: '6px 0' }}>
                +{kitchenMatches.length - 3} more matches →
              </Link>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}><div style={{ height: 1, background: C.rule }} /></div>

      {/* ===== BROWSE BY CUISINE ===== */}
      {categories.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px' : '28px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: MONO, margin: 0 }}>Browse by cuisine</p>
            <Link href="/browse" style={{ fontSize: 11, fontFamily: SANS, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>See all {totalCount} →</Link>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.slice(0, isMobile ? 8 : 12).map(cat => (
              <Link key={cat.id} href={`/browse?category=${cat.id}`} style={{
                padding: '8px 14px', borderRadius: 20, border: `1px solid ${C.ruleLight}`, background: C.warm,
                textDecoration: 'none', fontSize: 12, fontFamily: SANS, fontWeight: 500, color: C.text2,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {cat.name} <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{cat.recipe_count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}><div style={{ height: 1, background: C.rule }} /></div>

      {/* ===== DISCOVER RECIPES (shuffled) ===== */}
      {shuffledRecipes.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 32px' : '28px clamp(16px,4vw,24px) 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: MONO, margin: 0 }}>Discover</p>
            <button
              onClick={() => shuffleRecipes(allRecipesRef.current, tonightsPick?.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: `1px solid ${C.rule}`, borderRadius: 16,
                padding: '4px 12px', cursor: 'pointer', color: C.text2,
                fontSize: 10, fontFamily: MONO, letterSpacing: '0.03em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.color = C.text2 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              Shuffle
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {shuffledRecipes.map((recipe, i) => (
              <Link key={recipe.id} href={`/recipe/${recipe.slug}`} style={{
                display: 'flex', gap: 14, padding: '12px 0',
                borderBottom: i < shuffledRecipes.length - 1 ? `1px solid ${C.ruleLight}` : 'none',
                textDecoration: 'none', animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
              }}>
                <div style={{ width: 72, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.warm, border: `1px solid ${C.ruleLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {recipe.image_url ? <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <BrokenEggSmall />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {recipe.time_total && <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{formatTime(recipe.time_total)}</span>}
                    {recipe.cuisine && <><span style={{ color: C.rule, fontSize: 8 }}>·</span><span style={{ fontSize: 10, fontFamily: SANS, color: C.text3 }}>{recipe.cuisine}</span></>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 'auto' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index<EggDot size={6} /></p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>Recipes are free to read, use, and share. No ads. No paywalls. Community-curated. Always.</p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, textAlign: isMobile ? 'left' : 'right' }}>
              <p style={{ margin: '0 0 4px' }}>{totalCount} recipes · {categories.length} cuisines</p>
              <p style={{ margin: 0 }}><Link href="/contribute" style={{ color: C.accent, textDecoration: 'none' }}>Import</Link>{' · '}<Link href="/browse" style={{ color: C.accent, textDecoration: 'none' }}>Browse</Link></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>© 2026 RecDex</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
