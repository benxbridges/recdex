'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

// ===== DESIGN TOKENS =====
const C = {
  bg: '#FEFDFB', warm: '#F5F2EC', cool: '#F8F6F1',
  text: '#1A1A18', text2: '#5C5647', text3: '#9C9585',
  rule: '#D4CDBE', ruleLight: '#E8E4DB',
  accent: '#C84A2A', accentBg: '#FDF3F0', accentMed: 'rgba(200,74,42,0.2)',
  green: '#4A6741', greenBg: '#F0F5EE',
  blue: '#3D6B8E', blueBg: '#EFF5F9',
  gold: '#A8862A', goldBg: '#FBF7ED',
  timerBg: '#FDF8F6', timerRing: 'rgba(200,74,42,0.15)',
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

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
  tags: string[] | null
  ingredients: RawIngredients; steps: Step[]
}

type Category = { id: string; name: string; recipe_count: number }

// ===== HELPERS =====
function capitalizeIngredient(name: string): string {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  let items: IngredientItem[] = []
  if (!ingredients || ingredients.length === 0) return items
  if (ingredients[0]?.group) items = ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  else items = ingredients as IngredientItem[]
  return items.map(item => ({ ...item, name: capitalizeIngredient(item.name) }))
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
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

// Small broken egg for thumbnails (80×56 browse view)
function BrokenEggSmall() {
  return (
    <svg width="32" height="24" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
      <ellipse cx="100" cy="115" rx="55" ry="18" fill={C.ruleLight} />
      <g transform="translate(42, 30) rotate(-8)">
        <path d="M0 50 C0 22, 12 0, 28 0 C44 0, 56 22, 56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill={C.warm} stroke={C.rule} strokeWidth="3" />
      </g>
      <g transform="translate(102, 35) rotate(12)">
        <path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22, 36 0, 20 0 C4 0, -8 22, 0 48Z" fill={C.warm} stroke={C.rule} strokeWidth="3" />
      </g>
      <ellipse cx="100" cy="108" rx="16" ry="12" fill="#E8A44A" opacity="0.25" />
      <ellipse cx="100" cy="106" rx="13" ry="10" fill="#E8A44A" opacity="0.35" />
    </svg>
  )
}

// Larger broken egg for card placeholders (community picks, quick meals)
function BrokenEggCard() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.warm }}>
      <svg width="48" height="36" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.4 }}>
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

function CookCount({ count }: { count: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: MONO, color: C.text3 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {count.toLocaleString()} cooked
    </span>
  )
}

function TimeDisplay({ total, active, passiveLabel, passiveTime }: {
  total: number | null; active: number | null; passiveLabel: string | null; passiveTime: number | null
}) {
  if (!total) return null
  return (
    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontWeight: 500, color: C.text }}>{formatTime(total)}</span>
      {active && <><span style={{ color: C.text3 }}>·</span><span>{formatTime(active)} active</span></>}
      {passiveLabel && <><span style={{ color: C.text3 }}>·</span><span style={{ color: C.accent, fontSize: 10 }}>{passiveTime ? formatTime(passiveTime) + ' ' : ''}{passiveLabel}</span></>}
    </span>
  )
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

// ===== COOKED RECENTLY TICKER =====
const COOKED_RECENTLY = [
  { user: 'maria_c', recipe: 'Cacio e Pepe', time: '2 min ago', hasPhoto: true },
  { user: 'jake_w', recipe: 'Shakshouka', time: '8 min ago', hasPhoto: true },
  { user: 'home_cook_84', recipe: 'Banana Bread', time: '14 min ago', hasPhoto: false },
  { user: 'priya_s', recipe: 'Dal Tadka', time: '22 min ago', hasPhoto: true },
  { user: 'alex_r', recipe: 'Pad Thai', time: '31 min ago', hasPhoto: false },
  { user: 'nina_k', recipe: 'Chocolate Chip Cookies', time: '45 min ago', hasPhoto: true },
  { user: 'sam_b', recipe: 'Carbonara', time: '1 hr ago', hasPhoto: true },
  { user: 'lu_chen', recipe: 'Fried Rice', time: '1 hr ago', hasPhoto: false },
]

function CookedRecentlyFeed() {
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setOffset(p => (p + 1) % COOKED_RECENTLY.length), 3000)
    return () => clearInterval(interval)
  }, [])
  const visible = 3
  const items = Array.from({ length: visible }, (_, i) => COOKED_RECENTLY[(offset + i) % COOKED_RECENTLY.length])
  return (
    <div style={{ display: 'flex', gap: 16, overflow: 'hidden', padding: '4px 0' }}>
      {items.map((item, i) => (
        <div key={`${item.user}-${offset}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, animation: 'fadeIn 0.4s ease', opacity: i === 0 || i === visible - 1 ? 0.5 : 1 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.ruleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: C.text3, fontFamily: SANS }}>{item.user[0].toUpperCase()}</div>
          <span style={{ fontSize: 11, color: C.text, fontFamily: SANS }}>
            <span style={{ fontWeight: 500 }}>@{item.user}</span>
            <span style={{ color: C.text3 }}> made </span>
            <span style={{ fontWeight: 500 }}>{item.recipe}</span>
          </span>
          <span style={{ fontSize: 9, color: C.text3, fontFamily: MONO }}>{item.time}</span>
          {item.hasPhoto && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, flexShrink: 0 }} />}
        </div>
      ))}
    </div>
  )
}

// ===== RECIPE CARD (Browse view) =====
function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.rule}`, padding: '14px 0' }}>
      <div style={{ display: 'flex', gap: 14, cursor: 'pointer' }} onClick={onClick}>
        <div style={{ width: 80, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: C.warm, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {recipe.image_url ? <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <BrokenEggSmall />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 16.5, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.25, display: 'inline' }}>{recipe.title}</h3>
            <span style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>{recipe.cuisine}</span>
          </div>
          {recipe.description && (
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.45, margin: '3px 0 0', fontFamily: SANS, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{recipe.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            <span style={{ color: C.rule, fontSize: 11 }}>|</span>
            <TimeDisplay total={recipe.time_total} active={recipe.time_active} passiveLabel={recipe.time_passive_label} passiveTime={recipe.time_passive} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== GROCERY LIST MODAL (for quick view) =====
function GroceryListModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const router = useRouter()
  const items = getIngredientItems(recipe.ingredients)
  const [added, setAdded] = useState<Record<number, boolean>>({})
  const [addedToList, setAddedToList] = useState(false)
  const [listCopied, setListCopied] = useState(false)

  const addItem = (i: number) => setAdded(prev => ({ ...prev, [i]: true }))
  const removeItem = (i: number) => setAdded(prev => ({ ...prev, [i]: false }))
  const addedCount = Object.values(added).filter(Boolean).length

  const addAllToShoppingList = () => {
    const stored = localStorage.getItem('recdex-grocery')
    let existing: { recipeId: string; name: string; amount: string; unit: string; notes?: string; recipeTitle: string; recipeSlug: string; checked: boolean }[] = []
    if (stored) { try { existing = JSON.parse(stored) } catch { /* ignore */ } }
    existing = existing.filter(item => item.recipeId !== recipe.id)
    const newItems = items.map(ing => ({
      name: ing.name, amount: ing.amount, unit: ing.unit, notes: ing.notes,
      recipeId: recipe.id, recipeTitle: recipe.title, recipeSlug: recipe.slug, checked: false,
    }))
    localStorage.setItem('recdex-grocery', JSON.stringify([...existing, ...newItems]))
    const a: Record<number, boolean> = {}
    items.forEach((_, i) => { a[i] = true })
    setAdded(a)
    setAddedToList(true)
  }

  useEffect(() => {
    const stored = localStorage.getItem('recdex-grocery')
    if (stored) {
      try {
        const existing = JSON.parse(stored)
        if (existing.some((item: { recipeId: string }) => item.recipeId === recipe.id)) setAddedToList(true)
      } catch { /* ignore */ }
    }
  }, [recipe.id])

  const addToShoppingList = () => {
    const stored = localStorage.getItem('recdex-grocery')
    let existing: { recipeId: string; name: string; amount: string; unit: string; notes?: string; recipeTitle: string; recipeSlug: string; checked: boolean }[] = []
    if (stored) { try { existing = JSON.parse(stored) } catch { /* ignore */ } }
    existing = existing.filter(item => item.recipeId !== recipe.id)
    const newItems = items.filter((_, i) => added[i]).map(ing => ({
      name: ing.name, amount: ing.amount, unit: ing.unit, notes: ing.notes,
      recipeId: recipe.id, recipeTitle: recipe.title, recipeSlug: recipe.slug, checked: false,
    }))
    localStorage.setItem('recdex-grocery', JSON.stringify([...existing, ...newItems]))
    setAddedToList(true)
  }

  const copyToClipboard = async () => {
    const toCopy = addedCount > 0 ? items.filter((_, i) => added[i]) : items
    const lines = toCopy.map(ing => {
      const amt = ing.amount ? ` / ${ing.amount}${ing.unit ? ` ${ing.unit}` : ''}` : ''
      return `${ing.name}${amt}${ing.notes ? ` (${ing.notes})` : ''}`
    })
    await navigator.clipboard?.writeText(`${recipe.title}\n${lines.join('\n')}`)
    setListCopied(true)
    setTimeout(() => setListCopied(false), 2000)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.4)', backdropFilter: 'blur(10px)', animation: 'backdropIn 0.2s ease' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, maxHeight: '85vh', background: C.bg, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px', fontFamily: SANS }}>Grocery List</p>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{recipe.title}</h3>
              <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, marginTop: 2 }}>Serves {recipe.servings || 4} · {items.length} ingredient{items.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: C.text3, cursor: 'pointer', padding: 4 }}>×</button>
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', overflowY: 'auto', flex: 1 }}>
          {!addedToList && items.length > 1 && (
            <p style={{ fontSize: 10, fontFamily: MONO, color: C.text3, margin: '0 0 8px', textAlign: 'center' }}>select items or add all below</p>
          )}
          {items.map((ing, i) => {
            const isAdded = added[i]
            return (
              <div key={i} onClick={() => isAdded ? removeItem(i) : addItem(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.ruleLight}`, cursor: 'pointer' }}>
                <span style={{ fontSize: 14, fontFamily: SANS, flex: 1, color: isAdded ? C.text3 : C.text, fontStyle: isAdded ? 'italic' : 'normal', transition: 'all 0.15s' }}>
                  {capitalizeIngredient(ing.name)}
                  {ing.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {ing.amount}{ing.unit ? ` ${ing.unit}` : ''}</span>}
                  {ing.notes && <span style={{ color: C.text3 }}> ({ing.notes})</span>}
                </span>
                <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${isAdded ? C.green : C.rule}`, background: isAdded ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', color: isAdded ? '#fff' : C.text3, fontSize: 15, fontWeight: 300, lineHeight: 1 }}>
                  {isAdded ? <span style={{ fontSize: 12, fontWeight: 600 }}>✓</span> : '+'}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${C.rule}`, flexShrink: 0 }}>
          {addedToList ? (
            <button onClick={() => router.push('/pantry')} style={{ width: '100%', padding: '12px 16px', borderRadius: 6, border: 'none', background: C.green, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              Added — view shopping list
            </button>
          ) : addedCount > 0 ? (
            <button onClick={addToShoppingList} style={{ width: '100%', padding: '12px 16px', borderRadius: 6, border: 'none', background: C.text, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {addedCount === items.length ? 'Add all to shopping list' : `Add ${addedCount} item${addedCount !== 1 ? 's' : ''} to shopping list`}
            </button>
          ) : (
            <button onClick={addAllToShoppingList} style={{ width: '100%', padding: '12px 16px', borderRadius: 6, border: `1.5px solid ${C.green}`, background: C.greenBg, color: C.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              Add all to shopping list
            </button>
          )}
          <button onClick={copyToClipboard} style={{ width: '100%', marginTop: addedToList || addedCount > 0 ? 8 : 0, padding: '10px 16px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: listCopied ? C.green : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, transition: 'all 0.15s' }}>
            {listCopied ? '✓ Copied to clipboard' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== RECIPE QUICK VIEW MODAL =====
function RecipeQuickViewModal({ recipe, onClose, isMobile }: { recipe: Recipe; onClose: () => void; isMobile: boolean }) {
  const router = useRouter()
  const ingredientItems = getIngredientItems(recipe.ingredients)
  const hasIngredients = ingredientItems.length > 0
  const hasSteps = recipe.steps && recipe.steps.length > 0
  const [saved, setSaved] = useState(false)
  const [showGroceryList, setShowGroceryList] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('recdex-box')
    if (stored) {
      try { const box = JSON.parse(stored); setSaved(box.includes(recipe.id)) } catch { /* ignore */ }
    }
  }, [recipe.id])

  const toggleSave = () => {
    const stored = localStorage.getItem('recdex-box')
    let box: string[] = []
    if (stored) { try { box = JSON.parse(stored) } catch { /* ignore */ } }
    if (box.includes(recipe.id)) { box = box.filter(id => id !== recipe.id); setSaved(false) }
    else { box.push(recipe.id); setSaved(true) }
    localStorage.setItem('recdex-box', JSON.stringify(box))
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/recipe/${recipe.slug}`
    if (navigator.share) { try { await navigator.share({ title: recipe.title, url }) } catch { /* cancelled */ } }
    else { await navigator.clipboard?.writeText(url) }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const onEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !showGroceryList) onClose()
  }, [onClose, showGroceryList])
  useEffect(() => { window.addEventListener('keydown', onEscape); return () => window.removeEventListener('keydown', onEscape) }, [onEscape])

  const stepsToShow = recipe.steps?.slice(0, 3) || []
  const remainingSteps = (recipe.steps?.length || 0) - stepsToShow.length

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.4)', backdropFilter: 'blur(10px)', animation: 'backdropIn 0.2s ease' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 560, maxHeight: isMobile ? '100vh' : '90vh',
        background: C.bg, borderRadius: isMobile ? 0 : 14, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* Hero image */}
        <div style={{ position: 'relative', aspectRatio: isMobile ? '16/10' : '16/9', flexShrink: 0, background: C.warm, overflow: 'hidden' }}>
          {recipe.image_url ? (
            <>
              <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
            </>
          ) : <BrokenEggCard />}
          <div style={{ position: 'absolute', bottom: 16, left: 20, right: 60 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{recipe.title}</h2>
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 20px' }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            <TimeDisplay total={recipe.time_total} active={recipe.time_active} passiveLabel={recipe.time_passive_label} passiveTime={recipe.time_passive} />
            {recipe.cuisine && <><span style={{ color: C.rule }}>·</span><span style={{ fontSize: 11, fontFamily: SANS, color: C.text3 }}>{recipe.cuisine}</span></>}
          </div>

          {/* Description */}
          {recipe.description && (
            <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.text, lineHeight: 1.6, margin: '0 0 16px' }}>&ldquo;{recipe.description}&rdquo;</p>
          )}

          {/* Passive time callout */}
          {recipe.time_passive_label && recipe.time_passive && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: C.accentBg, border: `1px solid ${C.accentMed}`, borderRadius: 6, fontSize: 12, color: C.accent, fontFamily: SANS }}>+ {formatTime(recipe.time_passive)} {recipe.time_passive_label}</div>
          )}

          {/* Ingredients */}
          {hasIngredients && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Ingredients</h3>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>serves {recipe.servings || 4}</span>
              </div>
              <div style={{ border: `1.5px solid ${C.ruleLight}`, borderRadius: 10, padding: '14px 18px', background: C.cool }}>
                <div style={{ columns: isMobile ? 1 : 2, columnGap: 28 }}>
                  {ingredientItems.map((item, i) => (
                    <p key={i} style={{ fontSize: 14, color: C.text, margin: '4px 0', fontFamily: SANS, lineHeight: 1.5, breakInside: 'avoid' as const }}>
                      {capitalizeIngredient(item.name)}
                      {item.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {item.amount}{item.unit ? ` ${item.unit}` : ''}</span>}
                      {item.notes && <span style={{ color: C.text3, fontSize: 12 }}> ({item.notes})</span>}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Steps preview */}
          {hasSteps && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Steps</h3>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{recipe.steps.length} steps</span>
              </div>
              {stepsToShow.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 700, background: C.ruleLight, color: C.text3 }}>{i + 1}</div>
                  <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, color: C.text, margin: 0 }}>{s.text}</p>
                </div>
              ))}
              {remainingSteps > 0 && (
                <p style={{ fontSize: 12, fontFamily: MONO, color: C.text3, margin: '4px 0 0', paddingLeft: 38 }}>+ {remainingSteps} more step{remainingSteps !== 1 ? 's' : ''}...</p>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${C.rule}`, padding: '16px 24px 20px' }}>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {hasIngredients && (
              <button onClick={() => setShowGroceryList(true)} style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>
                Grocery list
              </button>
            )}
            <button onClick={handleShare} style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              Share
            </button>
            <button onClick={toggleSave} style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: `1.5px solid ${saved ? C.accent : C.rule}`, background: saved ? C.accentBg : 'transparent', color: saved ? C.accent : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? C.accent : 'none'} stroke={saved ? C.accent : 'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
          {/* Cook mode */}
          {hasSteps && (
            <button onClick={() => router.push(`/recipe/${recipe.slug}/cook`)} style={{ width: '100%', padding: '13px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS, marginBottom: 8 }}>Cook mode →</button>
          )}
          {/* View full recipe */}
          <div style={{ textAlign: 'center' }}>
            <Link href={`/recipe/${recipe.slug}`} style={{ fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500, textDecoration: 'none' }}>View full recipe →</Link>
          </div>
        </div>
      </div>

      {/* Grocery list sub-modal */}
      {showGroceryList && <GroceryListModal recipe={recipe} onClose={() => setShowGroceryList(false)} />}
    </div>
  )
}

// ===== COMMUNITY TIP CARD =====
const TIPS: Record<string, { user: string; text: string }> = {
  'cacio-e-pepe': { user: 'maria_c', text: 'Add the cheese off heat in three batches. Patience is the whole recipe.' },
  'shakshouka': { user: 'jake_w', text: 'Add a pinch of smoked paprika. Trust me.' },
  'pad-thai': { user: 'nina_k', text: 'Soak noodles in room temp water, never hot.' },
  'chicken-tikka-masala': { user: 'priya_s', text: 'Overnight marinade makes all the difference.' },
  'chocolate-chip-cookies': { user: 'sam_b', text: 'Chill dough 24 hrs for the best texture.' },
  'carbonara': { user: 'maria_c', text: 'Temper the eggs. Take it off heat before adding.' },
  'banana-bread': { user: 'home_cook_84', text: 'Freeze overripe bananas. They work even better.' },
  'guacamole': { user: 'alex_r', text: 'A little cumin goes a long way.' },
  'hummus': { user: 'priya_s', text: 'Peel the chickpeas for restaurant-level smooth.' },
  'fried-rice': { user: 'lu_chen', text: 'Day-old rice is non-negotiable.' },
}

// ===== MAIN PAGE =====
export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [quickViewId, setQuickViewId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [view, setView] = useState<'home' | 'browse'>('home')
  const [rotdSaved, setRotdSaved] = useState(false)

  // Featured recipe slugs
  const FEATURED_SLUGS = ['cacio-e-pepe', 'shakshouka', 'pad-thai', 'chicken-tikka-masala', 'chocolate-chip-cookies', 'carbonara']
  const QUICK_SLUGS = ['guacamole', 'hummus', 'scrambled-eggs', 'aglio-e-olio', 'fried-rice', 'pesto-alla-genovese']

  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])
  const [quickRecipes, setQuickRecipes] = useState<Recipe[]>([])
  const [rotdRecipe, setRotdRecipe] = useState<Recipe | null>(null)

  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 700); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  useEffect(() => { supabase.from('categories').select('*').order('sort_order').then(({ data }) => { if (data) setCategories(data) }) }, [])
  useEffect(() => { supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'published').then(({ count }) => { if (count) setTotalCount(count) }) }, [])

  // Fetch homepage data
  useEffect(() => {
    async function fetchHomepage() {
      const { data: feat } = await supabase.from('recipes').select('*').in('slug', FEATURED_SLUGS).eq('status', 'published')
      if (feat) {
        setFeaturedRecipes(feat.filter(r => r.slug !== 'cacio-e-pepe'))
        setRotdRecipe(feat.find(r => r.slug === 'cacio-e-pepe') || feat[0])
      }
      const { data: quick } = await supabase.from('recipes').select('*').in('slug', QUICK_SLUGS).eq('status', 'published')
      if (quick) setQuickRecipes(quick)
    }
    fetchHomepage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch browse recipes
  useEffect(() => {
    if (view !== 'browse' && !searchQuery) return
    async function fetchRecipes() {
      setLoading(true)
      let query = supabase.from('recipes').select('*').eq('status', 'published').order('title')
      if (activeCategory !== 'all') query = query.eq('category_id', activeCategory)
      if (searchQuery.trim()) query = query.or(`title.ilike.%${searchQuery}%,cuisine.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      const { data } = await query
      if (data) setRecipes(data)
      setLoading(false)
    }
    fetchRecipes()
  }, [activeCategory, searchQuery, view])

  // Switch to browse when searching
  useEffect(() => { if (searchQuery.trim()) setView('browse') }, [searchQuery])

  const activeCategoryName = activeCategory === 'all' ? 'All Recipes' : categories.find(c => c.id === activeCategory)?.name || 'All Recipes'
  const quickViewRecipe = quickViewId ? (recipes.find(r => r.id === quickViewId) || featuredRecipes.find(r => r.id === quickViewId) || quickRecipes.find(r => r.id === quickViewId) || (rotdRecipe?.id === quickViewId ? rotdRecipe : null)) : null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}input::placeholder{color:${C.text3}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.rule}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes modalIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes backdropIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => { setView('home'); setSearchQuery(''); setActiveCategory('all') }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>An open recipe commons</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, fontFamily: SANS }}>
              <span style={{ color: C.text2, cursor: 'pointer' }}>about</span>
              <span style={{ color: C.text2, cursor: 'pointer' }}>contribute</span>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <Link href="/pantry" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>🛒</span><span style={{ fontSize: 11, fontWeight: 500 }}>Kitchen</span>
              </Link>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: C.text2 }}>
                <RecipeBoxIcon /><span style={{ fontSize: 11, fontWeight: 500 }}>My Box</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div style={{ borderBottom: `1px solid ${C.ruleLight}`, padding: '10px clamp(16px,4vw,24px)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: SANS, flexShrink: 0 }}>Live</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, animation: 'pulse 2s ease infinite' }} />
          <CookedRecentlyFeed />
        </div>
      </div>

      {/* SEARCH HERO */}
      <div style={{ background: C.warm, borderBottom: `1px solid ${C.rule}`, padding: '32px clamp(16px,4vw,24px) 28px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>What do you want to cook?</p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, marginBottom: 18 }}>{totalCount} recipes · No life stories · Just food</p>
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? C.text : C.text3} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.15s' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              placeholder="Search by recipe, ingredient, or cuisine..."
              style={{ width: '100%', padding: '14px 18px 14px 46px', border: `2px solid ${searchFocused ? C.text : C.rule}`, borderRadius: 8, fontSize: 15, color: C.text, fontFamily: SANS, outline: 'none', background: '#fff', boxShadow: searchFocused ? '0 2px 12px rgba(0,0,0,0.06)' : 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['pasta', 'chicken', 'vegetarian', 'under 30 min', 'baking'].map(tag => (
              <button key={tag} onClick={() => setSearchQuery(tag)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C.rule}`, background: 'transparent', color: C.text3, fontSize: 11, fontFamily: SANS, cursor: 'pointer' }}>{tag}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== HOME VIEW ===== */}
      {view === 'home' && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

          {/* RECIPE OF THE DAY */}
          {rotdRecipe && (
            <section style={{ paddingTop: 28, paddingBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
                  <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Recipe of the Day</h2>
                </div>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>FEB 24</span>
              </div>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <Link href={`/recipe/${rotdRecipe.slug}`} style={{ flex: '1 1 380px', aspectRatio: '16/10', borderRadius: 10, overflow: 'hidden', background: C.warm, minHeight: 220, display: 'block' }}>
                  {rotdRecipe.image_url ? <img src={rotdRecipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <BrokenEggCard />}
                </Link>
                <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <DifficultyBadge difficulty={rotdRecipe.difficulty} />
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(rotdRecipe.time_total)}</span>
                    <span style={{ color: C.rule }}>·</span>
                    <span style={{ fontSize: 11, fontFamily: SANS, color: C.text3 }}>{rotdRecipe.cuisine}</span>
                  </div>
                  <Link href={`/recipe/${rotdRecipe.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 8, borderBottom: `1px solid ${C.ruleLight}`, paddingBottom: 2, display: 'inline' }}>{rotdRecipe.title}</h3>
                  </Link>
                  <p style={{ fontFamily: SERIF, fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 12, maxWidth: 360 }}>{rotdRecipe.description}</p>
                  {TIPS[rotdRecipe.slug] && (
                    <div style={{ padding: '8px 12px', background: C.cool, borderRadius: 6, borderLeft: `3px solid ${C.accent}`, marginBottom: 14 }}>
                      <p style={{ fontSize: 12, color: C.text, fontFamily: SANS, lineHeight: 1.5, margin: 0 }}>
                        <span style={{ fontWeight: 600, color: C.accent }}>@{TIPS[rotdRecipe.slug].user}</span> {TIPS[rotdRecipe.slug].text}
                      </p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/recipe/${rotdRecipe.slug}/cook`} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '10px 24px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Cook this</button>
                    </Link>
                    <button onClick={() => setRotdSaved(!rotdSaved)} style={{ padding: '10px 16px', borderRadius: 6, border: `1.5px solid ${rotdSaved ? C.green : C.rule}`, background: rotdSaved ? C.greenBg : 'transparent', color: rotdSaved ? C.green : C.text3, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={rotdSaved ? C.green : 'none'} stroke={rotdSaved ? C.green : 'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      {rotdSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div style={{ height: 1, background: C.rule }} />

          {/* COMMUNITY PICKS */}
          <section style={{ paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Community picks</h2>
              <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>WHAT COOKS ARE LOVING</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {featuredRecipes.slice(0, 4).map((r, i) => (
                <div key={r.id} style={{ cursor: 'pointer', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }} onClick={() => setQuickViewId(r.id)}>
                  <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', background: C.warm, border: `1px solid ${C.ruleLight}`, marginBottom: 8 }}>
                    {r.image_url ? <img src={r.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <BrokenEggCard />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <DifficultyBadge difficulty={r.difficulty} />
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(r.time_total)}</span>
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.25, display: 'inline' }}>{r.title}</h3>
                  {TIPS[r.slug] && (
                    <div style={{ padding: '6px 10px', background: C.cool, borderRadius: 6, borderLeft: `2px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, color: C.text2, fontFamily: SANS, lineHeight: 1.4, margin: 0 }}>
                        <span style={{ fontWeight: 600, color: C.text3 }}>@{TIPS[r.slug].user}</span> {TIPS[r.slug].text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 1, background: C.rule }} />

          {/* QUICK MEALS */}
          <section style={{ paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Under 30 minutes</h2>
              <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>QUICK MEALS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {quickRecipes.map((r, i) => (
                <div key={r.id} style={{ cursor: 'pointer', animation: `fadeIn 0.3s ease ${i * 0.04}s both` }} onClick={() => setQuickViewId(r.id)}>
                  <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 8, overflow: 'hidden', background: C.warm, border: `1px solid ${C.ruleLight}`, marginBottom: 6 }}>
                    {r.image_url ? <img src={r.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <BrokenEggCard />}
                  </div>
                  <h3 style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2, display: 'inline' }}>{r.title}</h3>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{formatTime(r.time_total)}</span>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 1, background: C.rule }} />

          {/* BROWSE BY CUISINE */}
          <section style={{ paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Browse by cuisine</h2>
              <button onClick={() => setView('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500 }}>Browse all {totalCount} recipes →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {categories.slice(0, 12).map((cat, i) => (
                <div key={cat.id} style={{ cursor: 'pointer', animation: `fadeIn 0.3s ease ${i * 0.03}s both` }} onClick={() => { setActiveCategory(cat.id); setView('browse') }}>
                  <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 8, overflow: 'hidden', position: 'relative', background: C.text }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10 }}>
                      <h3 style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 1 }}>{cat.name}</h3>
                      <span style={{ fontSize: 10, fontFamily: MONO, color: 'rgba(255,255,255,0.7)' }}>{cat.recipe_count} recipes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MISSION */}
          <div style={{ padding: '28px 32px', borderRadius: 10, background: C.warm, border: `1px solid ${C.rule}`, marginBottom: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>Recipes belong to everyone</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 14px' }}>Recipe Index is a free, ad-free, open commons for cooking knowledge. Built by cooks, for cooks.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>Contribute a recipe</button>
              <button style={{ padding: '9px 20px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Learn more</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BROWSE VIEW ===== */}
      {view === 'browse' && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>
          {/* Back to home */}
          <div style={{ padding: '12px 0' }}>
            <button onClick={() => { setView('home'); setSearchQuery(''); setActiveCategory('all') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500 }}>← Back to home</button>
          </div>
          {isMobile && (
            <div style={{ display: 'flex', gap: 4, paddingBottom: 12, overflowX: 'auto', borderBottom: `1px solid ${C.ruleLight}` }}>
              <button onClick={() => { setActiveCategory('all'); setQuickViewId(null) }} style={{ padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === 'all' ? 600 : 400, background: activeCategory === 'all' ? C.text : 'transparent', color: activeCategory === 'all' ? C.bg : C.text3 }}>All</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setQuickViewId(null) }} style={{ padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400, background: activeCategory === cat.id ? C.text : 'transparent', color: activeCategory === cat.id ? C.bg : C.text3 }}>{cat.name}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex' }}>
            {!isMobile && (
              <div style={{ width: 210, flexShrink: 0, paddingTop: 8, paddingRight: 24, borderRight: `1px solid ${C.rule}`, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px', fontFamily: SANS }}>Categories</p>
                <button onClick={() => { setActiveCategory('all'); setQuickViewId(null) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textAlign: 'left' }}>
                  <span style={{ fontSize: 12.5, color: activeCategory === 'all' ? C.text : C.text2, fontWeight: activeCategory === 'all' ? 600 : 400, borderBottom: activeCategory === 'all' ? `1.5px solid ${C.text}` : '1.5px solid transparent', paddingBottom: 1 }}>All Recipes</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{totalCount}</span>
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setQuickViewId(null) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textAlign: 'left' }}>
                    <span style={{ fontSize: 12.5, color: activeCategory === cat.id ? C.text : C.text2, fontWeight: activeCategory === cat.id ? 600 : 400, borderBottom: activeCategory === cat.id ? `1.5px solid ${C.text}` : '1.5px solid transparent', paddingBottom: 1 }}>{cat.name}</span>
                    <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{cat.recipe_count}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, paddingLeft: isMobile ? 0 : 24, paddingTop: 8, paddingBottom: 60 }}>
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1 }}>{activeCategoryName}</h2>
                  <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}{searchQuery && ` matching "${searchQuery}"`}</span>
                </div>
                <div style={{ height: 1.5, background: C.text, marginTop: 8 }} />
              </div>
              {loading && <div style={{ padding: '40px 0', textAlign: 'center' }}><p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>Loading recipes...</p></div>}
              {!loading && recipes.length === 0 && <div style={{ padding: '40px 0', textAlign: 'center' }}><p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>{searchQuery ? `No recipes found for "${searchQuery}".` : 'No recipes in this category yet.'}</p></div>}
              {!loading && recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setQuickViewId(recipe.id)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quickViewRecipe && <RecipeQuickViewModal recipe={quickViewRecipe} onClose={() => setQuickViewId(null)} isMobile={isMobile} />}

      {/* FOOTER */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index<EggDot size={6} /></p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>Recipes are free to read, use, and share. No ads. No paywalls. Community-curated. Always.</p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, textAlign: isMobile ? 'left' : 'right' }}>
              <p style={{ margin: '0 0 4px' }}>{totalCount} recipes · {categories.length} categories</p>
              <p style={{ margin: '0 0 4px' }}>updated daily</p>
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }}>Contribute</span> · <span style={{ color: C.accent, cursor: 'pointer' }}>About</span></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>© 2026 RecDex · Public Benefit Corporation</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>

    </div>
  )
}