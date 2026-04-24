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

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// Single static placeholder — rotation felt like marketing copy
const PLACEHOLDER = 'Paste a recipe link…'

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
  if (r === u) return true
  // Recipe ingredient contains the full user input (e.g. user: "sweet potato", recipe: "roasted sweet potatoes")
  if (r.includes(u)) return true
  // Multi-word user input (e.g. "sweet potato"): don't fall back to word-level matching
  // — "sweet potato" should NOT match "potato" recipe ingredient
  if (u.includes(' ')) return false
  // Single-word user input: match if it appears as a whole-word token in the recipe ingredient
  // (e.g. "chicken" matches "chicken breast", "boneless chicken thigh")
  const rWords = r.split(/[\s,]+/)
  return rWords.some(rw => rw === u || (u.length >= 4 && (rw.startsWith(u) || u.startsWith(rw))))
}

// ===== MAIN PAGE =====
export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const [shuffledRecipes, setShuffledRecipes] = useState<Recipe[]>([])
  const allRecipesRef = useRef<Recipe[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // "What Can I Cook?" state
  const [kitchenInput, setKitchenInput] = useState('')
  const [kitchenTags, setKitchenTags] = useState<string[]>([])
  const [kitchenSuggestions, setKitchenSuggestions] = useState<string[]>([])
  const [showAllKitchenMatches, setShowAllKitchenMatches] = useState(false)

  // Extraction state
  const [extractState, setExtractState] = useState<ExtractState>('idle')
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null)
  const [extractError, setExtractError] = useState('')
  const [pasteText, setPasteText] = useState('')
  const extractingUrlRef = useRef('')

  // Responsive
  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])

  // Onboarding — disabled for now while we strip the homepage down to a
  // toolkit. Keep the component + state around for future revival.
  const ONBOARDING_ENABLED = false
  useEffect(() => {
    if (!ONBOARDING_ENABLED) return
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
      shuffleRecipes(allRecipes)
    }
    fetchHomepage()
  }, [shuffleRecipes])

  // Extract recipe from URL
  const extractRecipe = useCallback(async (url: string) => {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    extractingUrlRef.current = normalized
    setExtractState('extracting')
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

  // Live recipe suggestions while typing a non-URL query. Matches against
  // title → cuisine → ingredient names, ranked by where the match lands.
  const searchMatches = useMemo(() => {
    const q = input.trim().toLowerCase()
    if (!q || q.length < 2 || isUrl(q) || extractState !== 'idle') return []
    const recipes = allRecipesRef.current
    if (!recipes.length) return []
    type Hit = { recipe: Recipe; score: number }
    const hits: Hit[] = []
    for (const r of recipes) {
      const title = (r.title || '').toLowerCase()
      const cuisine = (r.cuisine || '').toLowerCase()
      let score = 0
      if (title.startsWith(q)) score = 100
      else if (title.includes(q)) score = 60
      else if (cuisine.includes(q)) score = 30
      else {
        const items = getIngredientItems(r.ingredients)
        if (items.some(i => i.name.toLowerCase().includes(q))) score = 15
      }
      if (score > 0) hits.push({ recipe: r, score })
    }
    hits.sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title))
    return hits.slice(0, 5)
  }, [input, extractState])

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
        // Score: weight fraction heavily, but also reward matching the specific typed ingredients
        const tagMatchCount = userIngs.filter(u => items.some(i => ingredientMatches(u, i.name))).length
        const score = (matched.length / Math.max(items.length, 1)) * 0.7 + (tagMatchCount / Math.max(userIngs.length, 1)) * 0.3
        return { recipe: r, matched: matched.length, total: items.length, fraction: items.length > 0 ? matched.length / items.length : 0, score }
      })
      .filter(m => m.matched > 0)
      .sort((a, b) => b.score - a.score || a.total - b.total)
      .slice(0, 10)
  }, [kitchenTags])

  const COMMON_INGREDIENTS = [
    'chicken', 'beef', 'pork', 'salmon', 'shrimp', 'tofu', 'eggs', 'bacon',
    'pasta', 'rice', 'potatoes', 'sweet potato', 'lentils', 'chickpeas',
    'garlic', 'onion', 'tomatoes', 'spinach', 'broccoli', 'zucchini', 'mushrooms', 'bell pepper',
    'butter', 'olive oil', 'cream', 'parmesan', 'cheddar', 'feta',
    'lemon', 'lime', 'ginger', 'cilantro', 'basil', 'thyme',
    'soy sauce', 'miso', 'tahini', 'coconut milk',
  ]

  const handleKitchenInputChange = (val: string) => {
    setKitchenInput(val)
    if (val.length >= 2) {
      const q = val.toLowerCase().trim()
      const suggestions = COMMON_INGREDIENTS.filter(
        ing => ing.startsWith(q) && !kitchenTags.includes(ing)
      ).slice(0, 5)
      setKitchenSuggestions(suggestions)
    } else {
      setKitchenSuggestions([])
    }
  }

  const addKitchenTag = (val: string) => {
    const normalized = val.trim().toLowerCase()
    if (normalized && !kitchenTags.includes(normalized)) {
      setKitchenTags(prev => [...prev, normalized])
    }
    setKitchenInput('')
    setKitchenSuggestions([])
    setShowAllKitchenMatches(false)
  }

  const handleKitchenKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = kitchenInput.replace(/,$/, '').trim()
      if (val) addKitchenTag(val)
    } else if (e.key === 'Tab' && kitchenSuggestions.length > 0) {
      e.preventDefault()
      addKitchenTag(kitchenSuggestions[0])
    } else if (e.key === 'Escape') {
      setKitchenSuggestions([])
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

      {/* ===== HERO: THE TOOLKIT ===== */}
      <div style={{
        background: C.warm, borderBottom: `1px solid ${C.rule}`,
        padding: isMobile ? '36px 16px 28px' : '56px clamp(16px,4vw,24px) 44px',
        position: 'relative',
      }}>
        {/* Subtle radial accent behind the tool to make it feel like a command center */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 60% 50% at 50% 35%, ${C.accent}14 0%, transparent 70%)`,
        }} />
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{
            fontFamily: SERIF,
            fontSize: isMobile ? 30 : 42,
            fontWeight: 700, color: C.text, margin: '0 0 10px',
            letterSpacing: -1, lineHeight: 1.05,
          }}>
            Cook something.
          </h2>
          <p style={{
            fontFamily: SANS, fontSize: isMobile ? 13 : 14,
            color: C.text2, margin: '0 auto 22px', maxWidth: 420,
            lineHeight: 1.5,
          }}>
            Recipe Index helps you cook any recipe more easily — and find one when you&apos;re curious.
          </p>

          {/* ─── Toolbox ─── */}
          <div style={{
            maxWidth: 480, margin: '0 auto',
            background: C.bg, border: `1.5px solid ${C.rule}`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            textAlign: 'left' as const,
          }}>
            {/* ── Row 1: Paste a recipe link ── */}
            <div style={{
              position: 'relative',
              padding: isMobile ? '12px 14px' : '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: `1px solid ${C.ruleLight}`,
              background: extractState === 'extracting' ? `${C.accent}08` : inputFocused ? `${C.accent}06` : 'transparent',
              transition: 'background 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={extractState === 'extracting' ? C.accent : inputFocused ? C.accent : C.text3}
                strokeWidth="2" strokeLinecap="round"
                style={{ flexShrink: 0, transition: 'stroke 0.15s' }}
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
                placeholder={PLACEHOLDER}
                style={{
                  flex: 1, minWidth: 0,
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: isMobile ? 15 : 16, color: C.text,
                  fontFamily: SANS,
                  padding: '4px 0',
                  opacity: extractState === 'extracting' ? 0.6 : 1,
                }}
              />
              {extractState === 'extracting' && (
                <div style={{
                  width: 16, height: 16, border: `2px solid ${C.accent}`,
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', flexShrink: 0,
                }} />
              )}

              {/* Live suggestion dropdown */}
              {inputFocused && searchMatches.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 12, right: 12, marginTop: 2,
                  background: C.bg, border: `1.5px solid ${C.rule}`, borderRadius: 10,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.22)', zIndex: 30,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.12s ease',
                }}>
                  {searchMatches.map((m, i) => (
                    <div
                      key={m.recipe.id}
                      onMouseDown={e => { e.preventDefault(); router.push(`/recipe/${m.recipe.slug}`) }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: i < searchMatches.length - 1 ? `1px solid ${C.ruleLight}` : 'none',
                        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.warm }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontFamily: SERIF, fontSize: 14, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.recipe.title}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, flexShrink: 0 }}>
                        {m.recipe.cuisine || ''}{m.recipe.time_total ? ` · ${formatTime(m.recipe.time_total)}` : ''}
                      </span>
                    </div>
                  ))}
                  <div
                    onMouseDown={e => { e.preventDefault(); handleSubmit() }}
                    style={{
                      padding: '8px 14px', background: C.warm,
                      fontSize: 11, fontFamily: MONO, color: C.text3,
                      textAlign: 'center' as const, cursor: 'pointer',
                      borderTop: `1px solid ${C.ruleLight}`,
                    }}
                  >
                    Search all {totalCount} recipes →
                  </div>
                </div>
              )}
            </div>

            {/* ── Row 2: Scan a recipe ── */}
            <Link href="/scan" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: isMobile ? '12px 14px' : '14px 16px',
              borderBottom: `1px solid ${C.ruleLight}`,
              textDecoration: 'none', color: C.text,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = `${C.accent}06`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text3}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ flex: 1, fontSize: isMobile ? 15 : 16, fontFamily: SANS, fontWeight: 500 }}>
                Scan a recipe
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text3}
                strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>

            {/* ── Row 3: Cook with what you have ── */}
            <div style={{ padding: isMobile ? '10px 14px 12px' : '12px 16px 14px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                minHeight: 28,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text3}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M6 13h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" />
                  <path d="M20 13V9a2 2 0 0 0-2-2h-1" />
                  <path d="M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
                </svg>
                {kitchenTags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 9px', borderRadius: 7, background: C.warm, border: `1px solid ${C.ruleLight}`,
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
                  onChange={e => handleKitchenInputChange(e.target.value)}
                  onKeyDown={handleKitchenKeyDown}
                  placeholder={kitchenTags.length === 0 ? 'What do you have to cook with?' : 'Add more…'}
                  style={{
                    flex: 1, minWidth: 120, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: isMobile ? 14 : 15, fontFamily: SANS, color: C.text, padding: '4px 0',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Full pantry shortcut — sits below toolbox, not inside */}
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', maxWidth: 480, margin: '10px auto 0' }}>
            <Link href="/pantry" style={{
              fontSize: 11, fontFamily: MONO, color: C.text3,
              textDecoration: 'none', letterSpacing: 0.3,
            }}>
              Full pantry →
            </Link>
          </div>

          {/* Extraction preview */}
          {extractState === 'preview' && extractedRecipe && (
            <div style={{ marginTop: 16, animation: 'slideUp 0.3s ease', textAlign: 'left', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
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
            <div style={{ marginTop: 16, animation: 'fadeIn 0.2s ease', textAlign: 'left', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
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

          {/* Kitchen matches (below toolbox, still within hero) */}
          {kitchenMatches.length > 0 && (
            <div style={{
              marginTop: 16, textAlign: 'left' as const,
              maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
              display: 'flex', flexDirection: 'column', gap: 6,
              animation: 'fadeIn 0.2s ease',
            }}>
              {kitchenMatches.slice(0, showAllKitchenMatches ? 10 : 3).map(m => (
                <Link key={m.recipe.id} href={`/recipe/${m.recipe.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, background: C.bg, border: `1px solid ${C.ruleLight}`,
                  textDecoration: 'none',
                }}>
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
              {kitchenMatches.length > 3 && !showAllKitchenMatches && (
                <button onClick={() => setShowAllKitchenMatches(true)} style={{
                  fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '6px 0',
                }}>
                  +{kitchenMatches.length - 3} more matches →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== DISCOVER (index-style text list, no thumbnails) ===== */}
      {shuffledRecipes.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '24px 16px' : '36px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: MONO, margin: 0 }}>Discover</p>
              <button
                onClick={() => shuffleRecipes(allRecipesRef.current)}
                title="Shuffle"
                aria-label="Shuffle recipes"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 2, display: 'inline-flex', alignItems: 'center',
                  color: C.text3, transition: 'color 0.15s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.accent }}
                onMouseLeave={e => { e.currentTarget.style.color = C.text3 }}
                onMouseDown={e => { e.currentTarget.style.transform = 'rotate(18deg) scale(0.95)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'rotate(0deg) scale(1)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
                  <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
                  <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
                  <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
            <Link href="/browse" style={{ fontSize: 11, fontFamily: SANS, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>See all {totalCount} →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {shuffledRecipes.map((recipe, i) => (
              <Link key={recipe.id} href={`/recipe/${recipe.slug}`} style={{
                display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 0',
                borderBottom: i < shuffledRecipes.length - 1 ? `1px dashed ${C.ruleLight}` : 'none',
                textDecoration: 'none', animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
              }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.text, margin: 0, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.title}</h3>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3, flexShrink: 0 }}>
                  {recipe.cuisine}{recipe.time_total ? ` · ${formatTime(recipe.time_total)}` : ''}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}><div style={{ height: 1, background: C.rule }} /></div>

      {/* ===== BROWSE BY CUISINE ===== */}
      {categories.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 32px' : '28px clamp(16px,4vw,24px) 40px' }}>
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
