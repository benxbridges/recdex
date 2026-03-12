'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

// ===== TYPES =====
type IngredientItem = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredients = any[]

type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; category_id: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  time_passive: number | null; time_passive_label: string | null
  image_url: string | null; servings: number | null; servings_label: string | null
  tags: string[] | null; ingredients: RawIngredients; steps: Step[]
}

// ===== HELPERS =====
function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  if (!ingredients || ingredients.length === 0) return []
  if (ingredients[0]?.group) return ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  return ingredients as IngredientItem[]
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60), m = minutes % 60
    return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`
  }
  return `${minutes} min`
}

function normalizeCuisine(c: string | null): string {
  return c?.split(/[,/]/)[0].trim() || 'Other'
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

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = DIFFICULTY_MAP[difficulty?.toLowerCase()] || DIFFICULTY_MAP.medium
  return <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: d.color, background: d.bg, padding: '2px 7px', borderRadius: 1, fontFamily: MONO }}>{d.label}</span>
}

function RecipeBoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.1L21 9" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}

function BrokenEggCard() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.warm }}>
      <svg width="40" height="30" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
        <ellipse cx="100" cy="115" rx="55" ry="18" fill={C.ruleLight} />
        <g transform="translate(42, 30) rotate(-8)">
          <path d="M0 50 C0 22, 12 0, 28 0 C44 0, 56 22, 56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill={C.cool} stroke={C.rule} strokeWidth="2.5" />
        </g>
        <g transform="translate(102, 35) rotate(12)">
          <path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22, 36 0, 20 0 C4 0, -8 22, 0 48Z" fill={C.cool} stroke={C.rule} strokeWidth="2.5" />
        </g>
        <ellipse cx="100" cy="108" rx="16" ry="12" fill="#E8A44A" opacity="0.2" />
        <ellipse cx="100" cy="106" rx="13" ry="10" fill="#E8A44A" opacity="0.35" />
      </svg>
    </div>
  )
}

// ===== RECIPE CARD =====
function RecipeCard({ recipe, matchedIngredient, onClick }: {
  recipe: Recipe
  matchedIngredient: string | null
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${hovered ? C.accent : C.rule}`,
        background: C.warm,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: C.cool, overflow: 'hidden', flexShrink: 0 }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          : <BrokenEggCard />
        }
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <DifficultyBadge difficulty={recipe.difficulty} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {recipe.cuisine && (
            <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>
              {normalizeCuisine(recipe.cuisine)}
            </span>
          )}
          {recipe.time_total && (
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{formatTime(recipe.time_total)}</span>
          )}
        </div>

        <h3 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.3 }}>
          {recipe.title}
        </h3>

        {recipe.description && (
          <p style={{
            fontSize: 12, color: C.text2, lineHeight: 1.5, margin: 0, fontFamily: SANS,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {recipe.description}
          </p>
        )}

        {matchedIngredient && (
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 9, fontFamily: MONO, color: C.gold, background: C.goldBg, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.04em' }}>
              ◆ {matchedIngredient}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== RECIPE ROW (list view) =====
function RecipeRow({ recipe, matchedIngredient, onClick }: {
  recipe: Recipe
  matchedIngredient: string | null
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        background: hovered ? C.warm : 'transparent',
        borderBottom: `1px solid ${C.ruleLight}`,
        transition: 'background 0.1s ease',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: 72, height: 50, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: C.warm, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          : <svg width="24" height="18" viewBox="0 0 200 150" fill="none" style={{ opacity: 0.3 }}>
              <g transform="translate(42,30) rotate(-8)"><path d="M0 50 C0 22,12 0,28 0 C44 0,56 22,56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill={C.cool} stroke={C.rule} strokeWidth="3"/></g>
              <g transform="translate(102,35) rotate(12)"><path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22,36 0,20 0 C4 0,-8 22,0 48Z" fill={C.cool} stroke={C.rule} strokeWidth="3"/></g>
              <ellipse cx="100" cy="106" rx="13" ry="10" fill="#E8A44A" opacity="0.35"/>
            </svg>
        }
      </div>

      {/* Title + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.25 }}>{recipe.title}</span>
          {recipe.cuisine && <span style={{ fontSize: 11, color: C.text3, fontFamily: SANS, flexShrink: 0 }}>{normalizeCuisine(recipe.cuisine)}</span>}
        </div>
        {recipe.description && (
          <p style={{ fontSize: 12, color: C.text2, margin: '2px 0 0', fontFamily: SANS, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipe.description}
          </p>
        )}
        {matchedIngredient && (
          <span style={{ fontSize: 9, fontFamily: MONO, color: C.gold, background: C.goldBg, padding: '1px 7px', borderRadius: 3, letterSpacing: '0.04em', marginTop: 3, display: 'inline-block' }}>
            ◆ {matchedIngredient}
          </span>
        )}
      </div>

      {/* Meta: difficulty + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <DifficultyBadge difficulty={recipe.difficulty} />
        {recipe.time_total && (
          <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3, minWidth: 52, textAlign: 'right' }}>{formatTime(recipe.time_total)}</span>
        )}
      </div>
    </div>
  )
}

// ===== VIEW TOGGLE ICONS =====
function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill={active ? C.accent : C.text3} />
      <rect x="9" y="1" width="6" height="6" rx="1" fill={active ? C.accent : C.text3} />
      <rect x="1" y="9" width="6" height="6" rx="1" fill={active ? C.accent : C.text3} />
      <rect x="9" y="9" width="6" height="6" rx="1" fill={active ? C.accent : C.text3} />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  const col = active ? C.accent : C.text3
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="4" height="3" rx="0.5" fill={col} />
      <rect x="7" y="2.5" width="8" height="2" rx="1" fill={col} />
      <rect x="1" y="6.5" width="4" height="3" rx="0.5" fill={col} />
      <rect x="7" y="7" width="8" height="2" rx="1" fill={col} />
      <rect x="1" y="11" width="4" height="3" rx="0.5" fill={col} />
      <rect x="7" y="11.5" width="8" height="2" rx="1" fill={col} />
    </svg>
  )
}

// ===== CUISINE SECTION HEADER =====
function SectionHeader({ cuisine, count }: { cuisine: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '40px 0 20px' }}>
      <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.text, flexShrink: 0 }}>{cuisine}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: C.rule }} />
    </div>
  )
}

// ===== MAIN PAGE =====
function BrowseContent() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeCuisine, setActiveCuisine] = useState<string>('all')
  const [activeTime, setActiveTime] = useState<string>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all recipes once
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('recipes')
        .select('id,slug,title,description,cuisine,category_id,difficulty,time_total,time_active,time_passive,time_passive_label,image_url,servings,servings_label,tags,ingredients,steps')
        .eq('status', 'published')
        .order('title', { ascending: true })
      if (data) setRecipes(data as Recipe[])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 680)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Derived cuisine list
  const cuisines = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of recipes) {
      const c = normalizeCuisine(r.cuisine)
      counts[c] = (counts[c] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
  }, [recipes])

  // Filter + search
  const { filtered, matchMap } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchMap = new Map<string, string>() // id → matched ingredient name

    let result = recipes

    // Cuisine filter
    if (activeCuisine !== 'all') {
      result = result.filter(r => normalizeCuisine(r.cuisine) === activeCuisine)
    }

    // Time filter
    if (activeTime === 'under30') result = result.filter(r => r.time_total && r.time_total <= 30)
    else if (activeTime === 'under60') result = result.filter(r => r.time_total && r.time_total <= 60)

    // Text search across title, cuisine, description, tags, AND ingredients
    if (q.length >= 2) {
      result = result.filter(r => {
        if (r.title.toLowerCase().includes(q)) return true
        if (r.cuisine?.toLowerCase().includes(q)) return true
        if (r.description?.toLowerCase().includes(q)) return true
        if (r.tags?.some(t => t.toLowerCase().includes(q))) return true
        const items = getIngredientItems(r.ingredients)
        const match = items.find(ing => ing.name.toLowerCase().includes(q))
        if (match) { matchMap.set(r.id, match.name); return true }
        return false
      })
    }

    return { filtered: result, matchMap }
  }, [recipes, query, activeCuisine, activeTime])

  // Group by cuisine for default view
  const grouped = useMemo(() => {
    if (query.trim().length >= 2 || activeCuisine !== 'all' || activeTime !== 'all') return null
    const groups: Record<string, Recipe[]> = {}
    for (const r of filtered) {
      const c = normalizeCuisine(r.cuisine)
      if (!groups[c]) groups[c] = []
      groups[c].push(r)
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
  }, [filtered, query, activeCuisine, activeTime])

  const isSearching = query.trim().length >= 2 || activeCuisine !== 'all' || activeTime !== 'all'
  const pad = 'clamp(16px, 4vw, 24px)'
  const cols = isMobile ? 2 : 3

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: isMobile ? 12 : 16,
  }

  function handleCardClick(recipe: Recipe) {
    router.push(`/recipe/${recipe.slug}`)
  }

  function clearSearch() {
    setQuery('')
    setActiveCuisine('all')
    setActiveTime('all')
    inputRef.current?.focus()
  }

  const searchResultLabel = (() => {
    const q = query.trim()
    if (q.length >= 2) {
      const hasIngMatch = filtered.some(r => matchMap.has(r.id))
      if (hasIngMatch && !filtered.some(r => r.title.toLowerCase().includes(q.toLowerCase()))) {
        return `${filtered.length} recipe${filtered.length !== 1 ? 's' : ''} with "${q}"`
      }
      return `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${q}"`
    }
    if (activeCuisine !== 'all') return `${filtered.length} ${activeCuisine} recipe${filtered.length !== 1 ? 's' : ''}`
    if (activeTime !== 'all') return `${filtered.length} recipe${filtered.length !== 1 ? 's' : ''}`
    return null
  })()

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>

      {/* HEADER */}
      <header style={{ borderBottom: `1px solid ${C.ruleLight}`, padding: `16px ${pad}`, position: 'sticky', top: 0, background: C.bg, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.5, lineHeight: 1 }}>
              Recipe Index<EggDot size={8} />
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 10, color: C.text3, margin: '3px 0 0', letterSpacing: 0.3 }}>An open recipe commons</p>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, fontFamily: SANS }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, fontFamily: MONO, letterSpacing: 0.3 }}>Browse</span>
            <Link href="/community" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Community</Link>
            <Link href="/lists" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Lists</Link>
            <div style={{ width: 1, height: 14, background: C.rule }} />
            <Link href="/pantry" style={{ textDecoration: 'none', color: C.text2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>🛒</span>
              {!isMobile && <span style={{ fontSize: 11, fontWeight: 500 }}>Kitchen</span>}
            </Link>
            <Link href="/profile" style={{ textDecoration: 'none', color: C.text2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RecipeBoxIcon />
              {!isMobile && <span style={{ fontSize: 11, fontWeight: 500 }}>Profile</span>}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO + SEARCH */}
      <div style={{ padding: `clamp(32px, 5vw, 52px) ${pad} 0`, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>
            {loading ? '—' : `${recipes.length} recipes`}
          </p>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.1, letterSpacing: -1 }}>
            All Recipes<EggDot size={11} />
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: '8px 0 0', lineHeight: 1.5 }}>
            Browse the full collection — or search by dish, ingredient, or cuisine.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveCuisine('all') }}
            placeholder="Search by dish, ingredient, or cuisine…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.warm, border: `1px solid ${query ? C.accent : C.rule}`,
              borderRadius: 8, padding: '12px 44px 12px 42px',
              fontFamily: SANS, fontSize: 14, color: C.text,
              outline: 'none', transition: 'border-color 0.15s ease',
            }}
            onFocus={e => { if (!query) e.target.style.borderColor = C.text3 }}
            onBlur={e => { if (!query) e.target.style.borderColor = C.rule }}
          />
          {query && (
            <button
              onClick={clearSearch}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 18, lineHeight: 1, padding: 4 }}
            >×</button>
          )}
        </div>

        {/* FILTER CHIPS ROW */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {/* Time filters */}
          {[
            { key: 'all', label: 'Any time' },
            { key: 'under30', label: 'Under 30 min' },
            { key: 'under60', label: 'Under 1 hr' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTime(key)} style={{
              background: activeTime === key ? C.accentBg : C.warm,
              border: `1px solid ${activeTime === key ? C.accent : C.rule}`,
              color: activeTime === key ? C.accent : C.text2,
              borderRadius: 20, padding: '4px 12px',
              fontFamily: MONO, fontSize: 10, cursor: 'pointer',
              letterSpacing: '0.03em', transition: 'all 0.1s ease',
            }}>{label}</button>
          ))}

          <div style={{ width: 1, height: 16, background: C.rule, margin: '0 4px' }} />

          {/* Cuisine chips — top cuisines + "All" */}
          <button onClick={() => setActiveCuisine('all')} style={{
            background: activeCuisine === 'all' ? C.accentBg : C.warm,
            border: `1px solid ${activeCuisine === 'all' ? C.accent : C.rule}`,
            color: activeCuisine === 'all' ? C.accent : C.text2,
            borderRadius: 20, padding: '4px 12px',
            fontFamily: MONO, fontSize: 10, cursor: 'pointer',
            letterSpacing: '0.03em', transition: 'all 0.1s ease',
          }}>All cuisines</button>

          {cuisines.slice(0, isMobile ? 6 : 10).map(({ name }) => (
            <button key={name} onClick={() => { setActiveCuisine(name); setQuery('') }} style={{
              background: activeCuisine === name ? C.accentBg : C.warm,
              border: `1px solid ${activeCuisine === name ? C.accent : C.rule}`,
              color: activeCuisine === name ? C.accent : C.text2,
              borderRadius: 20, padding: '4px 12px',
              fontFamily: MONO, fontSize: 10, cursor: 'pointer',
              letterSpacing: '0.03em', transition: 'all 0.1s ease',
            }}>{name}</button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: `24px ${pad} 80px`, maxWidth: 1100, margin: '0 auto' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: MONO, fontSize: 11, color: C.text3, letterSpacing: 1 }}>
            Loading recipes…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, color: C.text2, marginBottom: 8 }}>No recipes found</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, marginBottom: 20 }}>Try a different ingredient or dish name.</p>
            <button onClick={clearSearch} style={{ background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, borderRadius: 6, padding: '8px 20px', fontFamily: MONO, fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
              Clear search
            </button>
          </div>
        ) : isSearching ? (
          /* FLAT VIEW — search/filter active */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: `1px solid ${C.ruleLight}`, paddingBottom: 16 }}>
              <p style={{ fontFamily: SERIF, fontSize: 20, color: C.text, margin: 0, flex: 1 }}>
                {searchResultLabel}
              </p>
              {(query.trim() || activeCuisine !== 'all' || activeTime !== 'all') && (
                <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: C.text3, fontFamily: MONO, fontSize: 10, cursor: 'pointer', textDecoration: 'underline', padding: 0, letterSpacing: '0.03em' }}>
                  clear
                </button>
              )}
              {/* View toggle */}
              <div style={{ display: 'flex', gap: 2, background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, padding: 3 }}>
                <button onClick={() => setViewMode('grid')} title="Grid view" style={{ background: viewMode === 'grid' ? C.rule : 'transparent', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <GridIcon active={viewMode === 'grid'} />
                </button>
                <button onClick={() => setViewMode('list')} title="List view" style={{ background: viewMode === 'list' ? C.rule : 'transparent', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ListIcon active={viewMode === 'list'} />
                </button>
              </div>
            </div>
            {viewMode === 'grid' ? (
              <div style={gridStyle}>
                {filtered.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} matchedIngredient={matchMap.get(recipe.id) || null} onClick={() => handleCardClick(recipe)} />
                ))}
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${C.ruleLight}` }}>
                {filtered.map(recipe => (
                  <RecipeRow key={recipe.id} recipe={recipe} matchedIngredient={matchMap.get(recipe.id) || null} onClick={() => handleCardClick(recipe)} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* GROUPED BY CUISINE — default cookbook view */
          <>
            {/* View toggle for default state */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 2, background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, padding: 3 }}>
                <button onClick={() => setViewMode('grid')} title="Grid view" style={{ background: viewMode === 'grid' ? C.rule : 'transparent', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <GridIcon active={viewMode === 'grid'} />
                </button>
                <button onClick={() => setViewMode('list')} title="List view" style={{ background: viewMode === 'list' ? C.rule : 'transparent', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ListIcon active={viewMode === 'list'} />
                </button>
              </div>
            </div>
            {grouped?.map(([cuisine, items]) => (
              <div key={cuisine}>
                <SectionHeader cuisine={cuisine} count={items.length} />
                {viewMode === 'grid' ? (
                  <div style={gridStyle}>
                    {items.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} matchedIngredient={null} onClick={() => handleCardClick(recipe)} />
                    ))}
                  </div>
                ) : (
                  <div style={{ borderTop: `1px solid ${C.ruleLight}` }}>
                    {items.map(recipe => (
                      <RecipeRow key={recipe.id} recipe={recipe} matchedIngredient={null} onClick={() => handleCardClick(recipe)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${C.ruleLight}`, padding: `20px ${pad}`, textAlign: 'center' }}>
        <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: 0 }}>
          Recipes are free to read, use, and share.{' '}
          <Link href="/" style={{ color: C.accent, textDecoration: 'none' }}>← Back home</Link>
        </p>
      </div>

      <style>{`
        input::placeholder { color: ${C.text3}; }
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  )
}
