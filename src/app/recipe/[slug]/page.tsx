'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

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

type Comment = {
  id: string; recipe_id: string; display_name: string
  body: string; rating: string | null
  created_at: string
}

type PrivateNote = {
  recipeId: string; text: string; createdAt: number; updatedAt: number
}

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
  return <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: d.color, background: d.bg, padding: '3px 8px', borderRadius: 2, fontFamily: MONO }}>{d.label}</span>
}

function BrokenEggSVG({ width = 60 }: { width?: number }) {
  const h = width * 0.75
  return (
    <svg width={width} height={h} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="115" rx="55" ry="18" fill={C.rule} opacity="0.5" />
      <ellipse cx="100" cy="113" rx="48" ry="14" fill={C.warm} />
      <g transform="translate(42, 30) rotate(-8)">
        <path d="M0 50 C0 22, 12 0, 28 0 C44 0, 56 22, 56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill={C.warm} stroke={C.rule} strokeWidth="1.5" />
        <path d="M8 45 C8 25, 16 8, 28 8 C40 8, 48 25, 48 45" fill="none" stroke={C.rule} strokeWidth="1" />
      </g>
      <g transform="translate(102, 35) rotate(12)">
        <path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22, 36 0, 20 0 C4 0, -8 22, 0 48Z" fill={C.warm} stroke={C.rule} strokeWidth="1.5" />
        <path d="M8 42 C4 24, 10 8, 20 8 C30 8, 40 24, 40 42" fill="none" stroke={C.rule} strokeWidth="1" />
      </g>
      <ellipse cx="100" cy="108" rx="16" ry="12" fill={C.eggPoint} opacity="0.3" />
      <ellipse cx="100" cy="106" rx="13" ry="10" fill={C.eggPoint} opacity="0.5" />
      <ellipse cx="98" cy="104" rx="4" ry="3" fill={C.warm} opacity="0.3" />
    </svg>
  )
}

function ContributePhotoCTA() {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', height: '100%', background: hovered ? C.cool : C.warm, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s', gap: 10 }}>
      <BrokenEggSVG width={50} />
      <div style={{ padding: '8px 16px', borderRadius: 6, border: `1.5px dashed ${hovered ? C.accent : C.rule}`, background: hovered ? C.accentBg : C.warm, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hovered ? C.accent : C.text3} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke 0.15s' }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: SANS, color: hovered ? C.accent : C.text3, transition: 'color 0.15s' }}>Add a photo</span>
      </div>
    </div>
  )
}

function RecipeBoxNav() {
  return (
    <Link href="/profile" style={{ textDecoration: 'none' }}>
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 10px', borderRadius: 4, border: `1.5px solid ${C.rule}`, background: C.warm }}>
        <div style={{ position: 'relative', width: 26, height: 22 }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, background: '#D4A574', borderRadius: '2px 2px 3px 3px', border: '1.5px solid #B8956A' }} />
          <div style={{ position: 'absolute', top: 2, left: -1, right: -1, height: 8, background: '#C49660', borderRadius: '3px 3px 0 0', border: '1.5px solid #B8956A', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 4, width: 5, height: 5, background: C.warm, borderRadius: '2px 2px 0 0', border: `1px solid ${C.rule}`, borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: -1, left: 11, width: 5, height: 6, background: C.warm, borderRadius: '2px 2px 0 0', border: `1px solid ${C.rule}`, borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: 1, left: 18, width: 5, height: 4, background: C.warm, borderRadius: '2px 2px 0 0', border: `1px solid ${C.rule}`, borderBottom: 'none' }} />
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text, fontFamily: SANS, lineHeight: 1 }}>Profile</span>
        </div>
      </div>
    </Link>
  )
}

// ===== GROCERY LIST MODAL =====
function GroceryListModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const router = useRouter()
  const items = getIngredientItems(recipe.ingredients)
  // Items start unselected — click + to add
  const [added, setAdded] = useState<Record<number, boolean>>({})
  const [addedToList, setAddedToList] = useState(false)
  const [listCopied, setListCopied] = useState(false)

  const addItem = (i: number) => setAdded(prev => ({ ...prev, [i]: true }))
  const removeItem = (i: number) => setAdded(prev => ({ ...prev, [i]: false }))
  const addedCount = Object.values(added).filter(Boolean).length

  const addAll = () => {
    const all: Record<number, boolean> = {}
    items.forEach((_, i) => { all[i] = true })
    setAdded(all)
  }

  // One-click: add ALL items directly to shopping list (no two-step)
  const addAllToShoppingList = () => {
    const stored = localStorage.getItem('recdex-grocery')
    let existing: { recipeId: string; name: string; amount: string; unit: string; notes?: string; recipeTitle: string; recipeSlug: string; checked: boolean }[] = []
    if (stored) {
      try { existing = JSON.parse(stored) } catch { /* ignore */ }
    }
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

  // Check if this recipe's items are already in the shopping list
  useEffect(() => {
    const stored = localStorage.getItem('recdex-grocery')
    if (stored) {
      try {
        const existing = JSON.parse(stored)
        const hasRecipe = existing.some((item: { recipeId: string }) => item.recipeId === recipe.id)
        if (hasRecipe) setAddedToList(true)
      } catch { /* ignore */ }
    }
  }, [recipe.id])

  const addToShoppingList = () => {
    const stored = localStorage.getItem('recdex-grocery')
    let existing: { recipeId: string; name: string; amount: string; unit: string; notes?: string; recipeTitle: string; recipeSlug: string; checked: boolean }[] = []
    if (stored) {
      try { existing = JSON.parse(stored) } catch { /* ignore */ }
    }
    // Remove any existing items from this recipe (replace with fresh selection)
    existing = existing.filter(item => item.recipeId !== recipe.id)
    // Only add selected items
    const newItems = items
      .filter((_, i) => added[i])
      .map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeSlug: recipe.slug,
        checked: false,
      }))
    localStorage.setItem('recdex-grocery', JSON.stringify([...existing, ...newItems]))
    setAddedToList(true)
  }

  const copyToClipboard = async () => {
    // Copy added items, or all items if none selected
    const toCopy = addedCount > 0 ? items.filter((_, i) => added[i]) : items
    const lines = toCopy.map(ing => {
      const amt = ing.amount ? ` / ${ing.amount}${ing.unit ? ` ${ing.unit}` : ''}` : ''
      return `${ing.name}${amt}${ing.notes ? ` (${ing.notes})` : ''}`
    })
    await navigator.clipboard?.writeText(`${recipe.title}\n${lines.join('\n')}`)
    setListCopied(true)
    setTimeout(() => setListCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`@keyframes listIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes backdropIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.4)', backdropFilter: 'blur(10px)', animation: 'backdropIn 0.2s ease' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, maxHeight: '85vh', background: C.bg, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'listIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px', fontFamily: SANS }}>Grocery List</p>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{recipe.title}</h3>
              <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, marginTop: 2 }}>
                Serves {recipe.servings || 4} · {items.length} ingredient{items.length !== 1 ? 's' : ''}
              </p>
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
                <span style={{
                  fontSize: 14, fontFamily: SANS, flex: 1,
                  color: isAdded ? C.text3 : C.text,
                  fontStyle: isAdded ? 'italic' : 'normal',
                  transition: 'all 0.15s',
                }}>
                  {ing.name}
                  {ing.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {ing.amount}{ing.unit ? ` ${ing.unit}` : ''}</span>}
                  {ing.notes && <span style={{ color: C.text3 }}> ({ing.notes})</span>}
                </span>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${isAdded ? C.green : C.rule}`,
                  background: isAdded ? C.green : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  color: isAdded ? '#fff' : C.text3,
                  fontSize: 15, fontWeight: 300, lineHeight: 1,
                }}>
                  {isAdded ? <span style={{ fontSize: 12, fontWeight: 600 }}>✓</span> : '+'}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${C.rule}`, flexShrink: 0 }}>
          {addedToList ? (
            <button onClick={() => router.push('/pantry')} style={{
              width: '100%', padding: '12px 16px', borderRadius: 6, border: 'none',
              background: C.green, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              Added — view shopping list
            </button>
          ) : addedCount > 0 ? (
            <button onClick={addToShoppingList} style={{
              width: '100%', padding: '12px 16px', borderRadius: 6, border: 'none',
              background: C.text, color: C.bg,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {addedCount === items.length ? 'Add all to shopping list' : `Add ${addedCount} item${addedCount !== 1 ? 's' : ''} to shopping list`}
            </button>
          ) : (
            <button onClick={addAllToShoppingList} style={{
              width: '100%', padding: '12px 16px', borderRadius: 6,
              border: `1.5px solid ${C.green}`, background: C.greenBg,
              color: C.green, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: SANS,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              Add all to shopping list
            </button>
          )}
          {/* Copy to clipboard */}
          <button onClick={copyToClipboard} style={{
            width: '100%', marginTop: addedToList || addedCount > 0 ? 8 : 0, padding: '10px 16px', borderRadius: 6,
            border: `1.5px solid ${C.rule}`, background: 'transparent',
            color: listCopied ? C.green : C.text2,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            transition: 'all 0.15s',
          }}>
            {listCopied ? '✓ Copied to clipboard' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== SHARE CARD MODAL =====
function ShareCardModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [linkCopied, setLinkCopied] = useState(false)
  const items = getIngredientItems(recipe.ingredients)

  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const shareNative = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: recipe.title, url: window.location.href }) } catch { /* cancelled */ }
    } else {
      await copyLink()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@keyframes cardIn{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.55)', backdropFilter: 'blur(10px)', animation: 'backdropIn 0.2s ease' }} onClick={onClose} />
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(380px, 90vw)', animation: 'cardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* The card */}
        <div style={{ background: '#FFFEFA', border: `1.5px solid ${C.text}`, borderRadius: 10, padding: '28px 26px 24px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: 2, color: C.text3, textTransform: 'uppercase' }}>Recipe Index</span>
            <span style={{ fontFamily: MONO, fontSize: 8, color: C.text3 }}>recipeindex.org</span>
          </div>
          <div style={{ height: 1, background: C.rule, marginBottom: 18 }} />

          {/* Title & meta */}
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.15, letterSpacing: -0.5 }}>{recipe.title}</h2>
          {recipe.cuisine && <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: '0 0 2px' }}>{recipe.cuisine}</p>}
          {recipe.description && <p style={{ fontFamily: SERIF, fontSize: 12, color: C.text2, margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>{recipe.description}</p>}

          <div style={{ height: 1, background: C.rule, margin: '14px 0' }} />

          {/* Time & servings */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
            {recipe.time_total && <span style={{ fontSize: 11, fontFamily: MONO, color: C.text2 }}>{formatTime(recipe.time_total)}</span>}
            {recipe.time_active && <><span style={{ color: C.rule }}>·</span><span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(recipe.time_active)} active</span></>}
            <span style={{ color: C.rule }}>·</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.text2 }}>serves {recipe.servings || 4}{recipe.servings_label ? ` ${recipe.servings_label}` : ''}</span>
          </div>

          {/* Ingredients */}
          {items.length > 0 && (
            <>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px', fontFamily: SANS }}>Ingredients</p>
              <div style={{ columns: 2, columnGap: 16, marginBottom: 16 }}>
                {items.map((ing, i) => (
                  <p key={i} style={{ fontSize: 12, color: C.text, margin: '3px 0', fontFamily: SANS, lineHeight: 1.4, breakInside: 'avoid' as const }}>
                    {ing.name}{ing.amount && <span style={{ color: C.text3 }}> / {ing.amount}{ing.unit ? ` ${ing.unit}` : ''}</span>}
                  </p>
                ))}
              </div>
            </>
          )}

          <div style={{ height: 1, background: C.rule, margin: '14px 0 12px' }} />

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: C.text2, fontFamily: SANS, fontWeight: 500 }}>Recipe Index<EggDot size={5} /></span>
              <p style={{ fontSize: 10, color: C.text3, fontFamily: MONO, margin: '2px 0 0' }}>Free recipes, no ads, always.</p>
            </div>
            <div style={{ width: 44, height: 44, border: `1.5px solid ${C.text}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontFamily: MONO, color: C.text3, textAlign: 'center', lineHeight: 1.3 }}>QR<br/>code</div>
          </div>
        </div>

        {/* Action buttons below card */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={copyLink} style={{ flex: 1, padding: '9px 0', border: `1px solid ${linkCopied ? C.green : C.rule}`, borderRadius: 6, background: linkCopied ? C.greenBg : C.warm, color: linkCopied ? C.green : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, transition: 'all 0.15s' }}>
            {linkCopied ? 'Copied!' : 'Copy link'}
          </button>
          <button style={{ flex: 1, padding: '9px 0', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.warm, color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Save image</button>
          <button onClick={shareNative} style={{ flex: 1, padding: '9px 0', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.warm, color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Share</button>
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '9px 0', border: 'none', borderRadius: 6, background: C.text, color: C.bg, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, marginTop: 6 }}>Close</button>
      </div>
    </div>
  )
}

// ===== KITCHEN CONSENSUS (mock data) =====
type ConsensusPoint = { label: string; consensus: string; percentage: number; alternative?: string; altPercentage?: number }
type ConsensusData = {
  recipesAnalyzed: number
  sources: string[]
  ingredients: ConsensusPoint[]
  techniques: ConsensusPoint[]
  differs: { point: string; detail: string }[]
}

const CONSENSUS_DATA: Record<string, ConsensusData> = {
  'carbonara': {
    recipesAnalyzed: 18,
    sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Food Network', 'Allrecipes', 'Epicurious'],
    ingredients: [
      { label: 'Cream?', consensus: 'No cream', percentage: 83, alternative: 'Add cream', altPercentage: 17 },
      { label: 'Pork', consensus: 'Guanciale', percentage: 61, alternative: 'Pancetta', altPercentage: 33 },
      { label: 'Eggs', consensus: 'Whole eggs + extra yolks', percentage: 72, alternative: 'Yolks only', altPercentage: 28 },
      { label: 'Cheese', consensus: 'Pecorino Romano', percentage: 67, alternative: 'Parm + Pecorino mix', altPercentage: 33 },
      { label: 'Pasta', consensus: 'Spaghetti', percentage: 55, alternative: 'Rigatoni', altPercentage: 30 },
    ],
    techniques: [
      { label: 'When to add eggs?', consensus: 'Off heat completely', percentage: 89, alternative: 'Over low heat', altPercentage: 11 },
      { label: 'Toast the pepper?', consensus: 'Yes, bloom in rendered fat', percentage: 72, alternative: 'Add at the end', altPercentage: 28 },
      { label: 'Pasta water?', consensus: 'Save and use ½ cup', percentage: 94 },
      { label: 'Start guanciale cold?', consensus: 'Yes, cold pan', percentage: 78, alternative: 'Hot pan', altPercentage: 22 },
    ],
    differs: [
      { point: 'Uses a mix of parmesan and pecorino', detail: '67% of recipes go pure Pecorino Romano — this recipe blends both for a milder flavor' },
    ],
  },
  'cacio-e-pepe': {
    recipesAnalyzed: 12,
    sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Food52', 'Epicurious'],
    ingredients: [
      { label: 'Cheese', consensus: 'Pecorino Romano only', percentage: 92, alternative: 'Add parmesan', altPercentage: 8 },
      { label: 'Pepper', consensus: 'Whole black peppercorns', percentage: 85, alternative: 'Pre-ground', altPercentage: 15 },
      { label: 'Pasta', consensus: 'Tonnarelli or spaghetti', percentage: 75, alternative: 'Bucatini', altPercentage: 25 },
      { label: 'Butter?', consensus: 'No butter', percentage: 70, alternative: 'Small amount', altPercentage: 30 },
    ],
    techniques: [
      { label: 'Toast the pepper?', consensus: 'Yes, in dry pan first', percentage: 83, alternative: 'Skip toasting', altPercentage: 17 },
      { label: 'Pasta water method', consensus: 'Add starchy water gradually', percentage: 88 },
      { label: 'When to add cheese?', consensus: 'Off heat, with pasta water', percentage: 75, alternative: 'Toss over low heat', altPercentage: 25 },
    ],
    differs: [],
  },
}

function EggChart({ percentage, size = 48 }: { percentage: number; size?: number }) {
  const w = size
  const h = size * 1.35
  const cx = w / 2
  // Egg path: classic egg shape using cubic beziers — narrow top, wide bottom
  const eggPath = `M${cx},${h * 0.04} C${w * 0.18},${h * 0.04} ${w * 0.05},${h * 0.38} ${w * 0.05},${h * 0.56} C${w * 0.05},${h * 0.8} ${w * 0.25},${h * 0.97} ${cx},${h * 0.97} C${w * 0.75},${h * 0.97} ${w * 0.95},${h * 0.8} ${w * 0.95},${h * 0.56} C${w * 0.95},${h * 0.38} ${w * 0.82},${h * 0.04} ${cx},${h * 0.04}Z`
  const fillY = h * (1 - percentage / 100)
  const color = percentage >= 80 ? C.blue : percentage >= 60 ? `${C.blue}CC` : `${C.blue}88`
  const id = `egg-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <clipPath id={id}>
          <path d={eggPath} />
        </clipPath>
      </defs>
      {/* Egg background */}
      <path d={eggPath} fill={C.warm} stroke={C.rule} strokeWidth="1.5" />
      {/* Fill from bottom */}
      <rect x="0" y={fillY} width={w} height={h - fillY} fill={color} clipPath={`url(#${id})`} opacity="0.8" />
      {/* Egg outline on top */}
      <path d={eggPath} fill="none" stroke={C.ruleLight} strokeWidth="1" />
      {/* Percentage text */}
      <text x={cx} y={h * 0.55} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.24, fontFamily: MONO, fontWeight: 700, fill: C.text }}>
        {percentage}%
      </text>
    </svg>
  )
}

function IngredientEggCard({ point }: { point: ConsensusPoint }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 8px 10px' }}>
      <EggChart percentage={point.percentage} size={52} />
      {/* Label */}
      <p style={{ fontSize: 10, fontFamily: MONO, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, margin: '8px 0 3px' }}>
        {point.label}
      </p>
      {/* Consensus answer */}
      <p style={{ fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.text, margin: '0 0 2px', lineHeight: 1.2 }}>
        {point.consensus}
      </p>
      {/* Alternative */}
      {point.alternative && (
        <p style={{ fontSize: 9, fontFamily: SANS, color: C.text3, margin: '3px 0 0' }}>
          vs. {point.alternative} ({point.altPercentage}%)
        </p>
      )}
    </div>
  )
}

function KitchenConsensus({ slug }: { slug: string }) {
  const [expanded, setExpanded] = useState(false)
  const data = CONSENSUS_DATA[slug]
  if (!data) return null

  return (
    <>
      <div style={{ height: 1, background: C.rule }} />
      <div style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Collapsed header bar */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', background: C.cool, border: `1px solid ${C.ruleLight}`,
            borderLeft: `3px solid ${C.blue}`, borderRadius: expanded ? '8px 8px 0 0' : 8, cursor: 'pointer',
            transition: 'background 0.15s, border-radius 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.warm }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.cool }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6" /><path d="M10 3v6.5L4 20h16l-6-10.5V3" />
            <circle cx="12" cy="16" r="1" fill={C.blue} />
            <circle cx="10" cy="14" r="0.5" fill={C.blue} />
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text }}>Kitchen Consensus</span>
            <span style={{ fontFamily: SERIF, fontSize: 12, fontStyle: 'italic', color: C.text3, marginLeft: 8 }}>how most cooks make this dish</span>
          </span>
          <span style={{
            fontSize: 9, fontFamily: MONO, color: C.blue, padding: '2px 8px',
            background: C.blueBg, borderRadius: 4,
          }}>
            {data.recipesAnalyzed} recipes analyzed
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div style={{
            padding: '20px 16px', background: C.cool,
            border: `1px solid ${C.ruleLight}`, borderTop: 'none',
            borderLeft: `3px solid ${C.blue}`, borderRadius: '0 0 8px 8px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <p style={{ fontSize: 11, fontFamily: SANS, color: C.text3, margin: '0 0 20px', lineHeight: 1.4, textAlign: 'center' }}>
              We compared {data.recipesAnalyzed} versions of this dish. Here&apos;s what most cooks agree on.
            </p>

            {/* INGREDIENTS CONSENSUS */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px', textAlign: 'center' }}>
                Ingredients
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {data.ingredients.map((point, i) => (
                  <div key={i} style={{ background: C.warm, borderRadius: 10, border: `1px solid ${C.ruleLight}` }}>
                    <IngredientEggCard point={point} />
                  </div>
                ))}
              </div>
            </div>

            {/* TECHNIQUES CONSENSUS */}
            {data.techniques.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px', textAlign: 'center' }}>
                  Technique
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.techniques.map((point, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 2px' }}>
                          {point.label}
                        </p>
                        <p style={{ fontSize: 14, fontFamily: SANS, fontWeight: 600, color: C.text, margin: 0 }}>
                          {point.consensus}
                        </p>
                        {point.alternative && (
                          <p style={{ fontSize: 10, fontFamily: SANS, color: C.text3, margin: '2px 0 0' }}>
                            vs. {point.alternative} ({point.altPercentage}%)
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: 18, fontFamily: MONO, fontWeight: 700, color: C.blue }}>{point.percentage}%</span>
                        <p style={{ fontSize: 8, fontFamily: MONO, color: C.text3, margin: '2px 0 0' }}>agree</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Where this recipe differs */}
            {data.differs.length > 0 && (
              <div style={{
                padding: '10px 12px', background: C.accentBg,
                borderLeft: `3px solid ${C.accent}`, borderRadius: 6,
                marginBottom: 12,
              }}>
                <p style={{ fontSize: 10, fontFamily: MONO, fontWeight: 600, color: C.accent, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Where this recipe differs
                </p>
                {data.differs.map((d, i) => (
                  <div key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
                    <p style={{ fontSize: 13, fontFamily: SANS, fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{d.point}</p>
                    <p style={{ fontSize: 11, fontFamily: SANS, color: C.text2, margin: 0, lineHeight: 1.4 }}>{d.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sources footer */}
            <p style={{ fontSize: 9, fontFamily: MONO, color: C.text3, margin: '8px 0 0', lineHeight: 1.4, textAlign: 'center' }}>
              Synthesized from {data.recipesAnalyzed} versions across {data.sources.slice(0, 3).join(', ')}, and others.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// ===== RECIPE PAGE =====
export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showGroceryList, setShowGroceryList] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [commentPosting, setCommentPosting] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Private notes state
  const [privateNote, setPrivateNote] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true)
      const { data } = await supabase.from('recipes').select('*').eq('slug', slug).eq('status', 'published').single()
      if (data) setRecipe(data)
      setLoading(false)
    }
    if (slug) fetchRecipe()
  }, [slug])

  // Check local storage for saved state
  useEffect(() => {
    if (!recipe) return
    const box = JSON.parse(localStorage.getItem('recdex-box') || '[]')
    setSaved(box.includes(recipe.id))
  }, [recipe])

  // Fetch comments from Supabase
  useEffect(() => {
    if (!recipe) return
    async function fetchComments() {
      setCommentsLoading(true)
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('recipe_id', recipe!.id)
        .order('created_at', { ascending: false })
      if (data) setComments(data)
      setCommentsLoading(false)
    }
    fetchComments()
  }, [recipe])

  // Load private note from localStorage
  useEffect(() => {
    if (!recipe) return
    try {
      const notes: PrivateNote[] = JSON.parse(localStorage.getItem('recdex-notes') || '[]')
      const existing = notes.find(n => n.recipeId === recipe.id)
      if (existing) setPrivateNote(existing.text)
    } catch { /* ignore */ }
  }, [recipe])

  // Get display name from profile
  const getDisplayName = () => {
    try {
      const prof = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
      return prof.displayName || ''
    } catch { return '' }
  }

  const postComment = async () => {
    if (!recipe || !commentBody.trim()) return
    const displayName = getDisplayName()
    if (!displayName) return
    setCommentPosting(true)
    const { data, error } = await supabase.from('comments').insert({
      recipe_id: recipe.id,
      display_name: displayName,
      body: commentBody.trim(),
    }).select().single()
    if (data && !error) {
      setComments(prev => [data, ...prev])
      setCommentBody('')
    }
    setCommentPosting(false)
  }

  const savePrivateNote = () => {
    if (!recipe) return
    try {
      const notes: PrivateNote[] = JSON.parse(localStorage.getItem('recdex-notes') || '[]')
      const idx = notes.findIndex(n => n.recipeId === recipe.id)
      const now = Date.now()
      if (privateNote.trim()) {
        if (idx >= 0) {
          notes[idx] = { ...notes[idx], text: privateNote.trim(), updatedAt: now }
        } else {
          notes.push({ recipeId: recipe.id, text: privateNote.trim(), createdAt: now, updatedAt: now })
        }
      } else if (idx >= 0) {
        notes.splice(idx, 1)
      }
      localStorage.setItem('recdex-notes', JSON.stringify(notes))
      setEditingNote(false)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch { /* ignore */ }
  }

  const toggleSave = () => {
    if (!recipe) return
    const box = JSON.parse(localStorage.getItem('recdex-box') || '[]')
    if (saved) {
      localStorage.setItem('recdex-box', JSON.stringify(box.filter((id: string) => id !== recipe.id)))
    } else {
      localStorage.setItem('recdex-box', JSON.stringify([...box, recipe.id]))
    }
    setSaved(!saved)
  }

  const handleShare = () => {
    setShowShareCard(true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: C.text3 }}>Loading...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <BrokenEggSVG width={80} />
        <p style={{ fontSize: 16, color: C.text2, fontFamily: SERIF }}>Recipe not found</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 20px', borderRadius: 4, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>← Back to home</button>
      </div>
    )
  }

  const ingredientItems = getIngredientItems(recipe.ingredients)
  const hasSteps = recipe.steps && recipe.steps.length > 0
  const hasIngredients = ingredientItems.length > 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: SANS }}>
              <span onClick={() => router.push('/')} style={{ color: C.text2, cursor: 'pointer' }}>← Home</span>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <span onClick={() => router.push('/pantry')} style={{ color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>🛒</span><span style={{ fontSize: 11, fontWeight: 500 }}>Kitchen</span>
              </span>
              <RecipeBoxNav />
            </div>
          </div>
        </div>
      </header>

      {/* HERO IMAGE */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px clamp(16px,4vw,24px) 0' }}>
        <div style={{
          width: '100%', aspectRatio: isMobile ? '16/10' : '21/9',
          background: C.warm, overflow: 'hidden', borderRadius: 10,
          position: 'relative',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        }}>
          {recipe.image_url ? (
            <>
              <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {/* Title overlay on photo */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: isMobile ? '48px 20px 16px' : '60px 32px 22px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)',
              }}>
                <h1 style={{
                  fontFamily: SERIF, fontSize: 'clamp(22px, 4.5vw, 36px)', fontWeight: 700,
                  color: '#fff', lineHeight: 1.1, letterSpacing: -0.5, margin: 0,
                  textShadow: '0 1px 6px rgba(0,0,0,0.25)',
                }}>
                  {recipe.title}
                </h1>
              </div>
            </>
          ) : (
            <ContributePhotoCTA />
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title section */}
        <div style={{ paddingTop: 28, paddingBottom: 20, animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, fontFamily: SANS, color: C.text3 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span>
            <span>›</span>
            {recipe.cuisine && <><span style={{ cursor: 'pointer' }}>{recipe.cuisine}</span><span>›</span></>}
            <span style={{ color: C.text2 }}>{recipe.title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            {recipe.time_total && <span style={{ fontSize: 12, fontFamily: MONO, color: C.text2 }}>{formatTime(recipe.time_total)}</span>}
            {recipe.time_active && <><span style={{ color: C.rule }}>·</span><span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(recipe.time_active)} active</span></>}
            {recipe.cuisine && <><span style={{ color: C.rule }}>·</span><span style={{ fontSize: 12, fontFamily: SANS, color: C.text3 }}>{recipe.cuisine}</span></>}
          </div>

          {!recipe.image_url && (
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 10 }}>
              {recipe.title}
            </h1>
          )}

          {recipe.description && (
            <p style={{ fontFamily: SERIF, fontSize: 16, color: C.text2, lineHeight: 1.65, fontStyle: 'italic', maxWidth: 520, marginBottom: 16 }}>
              &ldquo;{recipe.description}&rdquo;
            </p>
          )}

          {/* Action buttons: Grocery list · Share · Save */}
          <div style={{ display: 'flex', gap: 8 }}>
            {hasIngredients && (
              <button onClick={() => setShowGroceryList(true)} style={{
                flex: 1, padding: '12px 16px', borderRadius: 6,
                border: `1.5px solid ${C.rule}`, background: 'transparent',
                color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6" /><path d="M9 16h6" />
                </svg>
                Grocery list
              </button>
            )}
            <button onClick={handleShare} style={{
              flex: 1, padding: '12px 16px', borderRadius: 6,
              border: `1.5px solid ${C.rule}`, background: 'transparent',
              color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
            <button onClick={toggleSave} style={{
              flex: 1, padding: '12px 16px', borderRadius: 6,
              border: `1.5px solid ${saved ? C.accent : C.rule}`,
              background: saved ? C.accentBg : 'transparent',
              color: saved ? C.accent : C.text2,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? C.accent : 'none'} stroke={saved ? C.accent : 'currentColor'} strokeWidth="2" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: C.rule }} />

        {/* Ingredients */}
        {hasIngredients ? (
          <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.05s both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Ingredients</h2>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>serves {recipe.servings || 4}{recipe.servings_label ? ` ${recipe.servings_label}` : ''}</span>
            </div>
            <div style={{ border: `1.5px solid ${C.ruleLight}`, borderRadius: 10, padding: '16px 20px', background: C.cool }}>
              <div style={{ columns: isMobile ? 1 : 2, columnGap: 32 }}>
                {ingredientItems.map((item, i) => (
                  <p key={i} style={{ fontSize: 15, color: C.text, margin: '6px 0', fontFamily: SANS, lineHeight: 1.5, breakInside: 'avoid' as const }}>
                    {item.name}
                    {item.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {item.amount}{item.unit ? ` ${item.unit}` : ''}</span>}
                    {item.notes && <span style={{ color: C.text3, fontSize: 13 }}> ({item.notes})</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: 24, paddingBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>Ingredients</h2>
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS, lineHeight: 1.6 }}>Full ingredient list coming soon. Know this recipe? You can help by contributing.</p>
          </div>
        )}

        <div style={{ height: 1, background: C.rule }} />

        {/* Steps preview */}
        {hasSteps ? (
          <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.1s both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Steps</h2>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{recipe.steps.length} steps</span>
            </div>
            {recipe.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 12, fontWeight: 700,
                  background: C.ruleLight, color: C.text3,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: C.text, margin: 0 }}>{s.text}</p>
                </div>
              </div>
            ))}
            <button onClick={() => router.push(`/recipe/${slug}/cook`)} style={{
              width: '100%', marginTop: 8, padding: '14px', borderRadius: 6, border: 'none',
              background: C.text, color: C.bg,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
            }}>Cook mode →</button>
          </div>
        ) : (
          <div style={{ paddingTop: 24, paddingBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>Steps</h2>
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS, lineHeight: 1.6 }}>Step-by-step instructions coming soon.</p>
          </div>
        )}

        <div style={{ height: 1, background: C.rule }} />

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div style={{ paddingTop: 20, paddingBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {recipe.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, fontFamily: MONO, color: C.text3, padding: '4px 10px', background: C.cool, borderRadius: 3 }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: C.rule }} />

        {/* ===== KITCHEN CONSENSUS ===== */}
        <KitchenConsensus slug={slug} />

        {/* ===== COMMUNITY NOTES ===== */}
        <div style={{ paddingTop: 28, paddingBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Community Notes</h2>
            {comments.length > 0 && (
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{comments.length}</span>
            )}
          </div>

          {/* Comment input */}
          {getDisplayName() ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: C.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: SANS,
                }}>
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontFamily: MONO, color: C.accent, fontWeight: 500 }}>@{getDisplayName()}</span>
              </div>
              <textarea
                ref={commentInputRef}
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                placeholder="Share a tip, substitution, or thought about this recipe..."
                style={{
                  width: '100%', minHeight: 72, padding: '12px 14px', borderRadius: 8,
                  border: `1.5px solid ${C.ruleLight}`, background: C.cool, resize: 'vertical',
                  fontFamily: SANS, fontSize: 14, color: C.text, lineHeight: 1.6,
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = C.accent }}
                onBlur={e => { e.target.style.borderColor = C.ruleLight }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={postComment}
                  disabled={!commentBody.trim() || commentPosting}
                  style={{
                    padding: '8px 18px', borderRadius: 6, border: 'none',
                    background: commentBody.trim() ? C.text : C.ruleLight,
                    color: commentBody.trim() ? '#fff' : C.text3,
                    fontSize: 12, fontWeight: 600, cursor: commentBody.trim() ? 'pointer' : 'default',
                    fontFamily: SANS, transition: 'all 0.15s', opacity: commentPosting ? 0.6 : 1,
                  }}
                >
                  {commentPosting ? 'Posting...' : 'Post note'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '16px 20px', borderRadius: 8, border: `1.5px dashed ${C.rule}`,
              background: C.cool, marginBottom: 24, textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: C.text2, fontFamily: SANS, margin: '0 0 8px' }}>
                Set up your profile to leave a note
              </p>
              <button
                onClick={() => router.push('/profile')}
                style={{
                  padding: '7px 16px', borderRadius: 5, border: `1.5px solid ${C.accent}`,
                  background: C.accentBg, color: C.accent,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                }}
              >
                Set up profile →
              </button>
            </div>
          )}

          {/* Comments list */}
          {commentsLoading ? (
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS }}>Loading notes...</p>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 14, color: C.text3, fontFamily: SERIF, fontStyle: 'italic', margin: '0 0 4px' }}>
                No notes yet
              </p>
              <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS, margin: 0 }}>
                Be the first to share a tip or thought about this recipe.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {comments.map((c, i) => (
                <div key={c.id} style={{
                  padding: '16px 0',
                  borderTop: i === 0 ? `1px solid ${C.ruleLight}` : 'none',
                  borderBottom: `1px solid ${C.ruleLight}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: C.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: SANS, flexShrink: 0,
                    }}>
                      {c.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontFamily: MONO, color: C.accent, fontWeight: 500 }}>
                      @{c.display_name}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {c.rating && <span style={{ fontSize: 13 }}>{c.rating}</span>}
                  </div>
                  <p style={{ fontSize: 14, fontFamily: SANS, color: C.text, lineHeight: 1.6, margin: 0, paddingLeft: 30 }}>
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: C.rule }} />

        {/* ===== YOUR NOTES (Private) ===== */}
        <div style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Your Notes</h2>
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              private
            </span>
          </div>
          <div style={{
            padding: '16px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg, #F8F5EE 0%, #F0EDE6 100%)',
            border: `1px solid ${C.ruleLight}`,
          }}>
            {editingNote || !privateNote ? (
              <>
                <textarea
                  value={privateNote}
                  onChange={e => setPrivateNote(e.target.value)}
                  onFocus={() => setEditingNote(true)}
                  placeholder="Jot down personal notes — adjustments, what worked, what to try next time..."
                  style={{
                    width: '100%', minHeight: 64, padding: '10px 12px', borderRadius: 6,
                    border: `1px solid ${C.ruleLight}`, background: C.warm,
                    resize: 'vertical', fontFamily: SANS, fontSize: 13, color: C.text,
                    lineHeight: 1.6, outline: 'none',
                  }}
                />
                {editingNote && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={() => { setEditingNote(false) }} style={{
                      padding: '6px 14px', borderRadius: 5, border: `1px solid ${C.rule}`,
                      background: 'transparent', color: C.text3, fontSize: 11, fontWeight: 500,
                      cursor: 'pointer', fontFamily: SANS,
                    }}>Cancel</button>
                    <button onClick={savePrivateNote} style={{
                      padding: '6px 14px', borderRadius: 5, border: 'none',
                      background: C.text, color: C.bg, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: SANS,
                    }}>Save note</button>
                  </div>
                )}
              </>
            ) : (
              <div onClick={() => setEditingNote(true)} style={{ cursor: 'pointer' }}>
                <p style={{ fontSize: 14, fontFamily: SANS, color: C.text, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {privateNote}
                </p>
                {noteSaved && (
                  <p style={{ fontSize: 11, fontFamily: MONO, color: C.green, marginTop: 6, marginBottom: 0 }}>✓ Saved</p>
                )}
                <p style={{ fontSize: 10, fontFamily: MONO, color: C.text3, marginTop: 8, marginBottom: 0 }}>Click to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index<EggDot size={6} /></p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>Recipes are free to read, use, and share. No ads. No paywalls. Always.</p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO }}>
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span> · <span style={{ color: C.accent, cursor: 'pointer' }}>About</span></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>© 2026 RecDex · Public Benefit Corporation</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>

      {/* GROCERY LIST MODAL */}
      {showGroceryList && <GroceryListModal recipe={recipe} onClose={() => setShowGroceryList(false)} />}

      {/* SHARE CARD MODAL */}
      {showShareCard && <ShareCardModal recipe={recipe} onClose={() => setShowShareCard(false)} />}
    </div>
  )
}
