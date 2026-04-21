'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import { withUtm } from '@/app/lib/unsplash'
import ThemeToggle from '@/app/components/ThemeToggle'

// ===== TYPES =====
type IngredientItem = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredients = any[]

type Recipe = {
  id: string; slug: string; title: string; description: string | null
  summary: string | null
  cuisine: string | null; category_id: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  time_passive: number | null; time_passive_label: string | null
  image_url: string | null; servings: number | null; servings_label: string | null
  tags: string[] | null
  ingredients: RawIngredients; steps: Step[]
  submitted_by?: string | null; source?: string | null; source_attribution?: string | null
  video_url?: string | null; creator_name?: string | null; creator_url?: string | null
  photo_credit?: string | null
  unsplash_id?: string | null
  photographer_url?: string | null
  unsplash_photo_url?: string | null
  download_location?: string | null
  cookbook_title?: string | null
  cookbook_author?: string | null
  cookbook_purchase_url?: string | null
  source_url?: string | null
}

type Comment = {
  id: string; recipe_id: string; display_name: string
  body: string; rating: string | null; rating_numeric: number | null
  created_at: string
}

type PrivateNote = {
  recipeId: string; text: string; createdAt: number; updatedAt: number
}

// ===== HELPERS =====
function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function capitalizeIngredient(name: string): string {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  let items: IngredientItem[] = []
  if (!ingredients || ingredients.length === 0) return items
  // Grouped container shape: [{ group: "Sauce", items: [...] }]
  // vs flat-with-per-item-group: [{ name, amount, unit, group: "Sauce" }]
  // Only treat as container if there's an actual items array.
  if (ingredients[0]?.group && Array.isArray(ingredients[0]?.items)) {
    items = ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  } else {
    items = ingredients as IngredientItem[]
  }
  return items.map(item => ({ ...item, name: capitalizeIngredient(item.name) }))
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
}

function scaleAmount(amount: string, multiplier: number): string {
  if (!amount || multiplier === 1) return amount
  // Parse the number — handle fractions like "1/2", "1.5", etc.
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  const scaled = num * multiplier
  // Nice rounding: show fractions for common cooking amounts
  if (scaled === Math.floor(scaled)) return String(scaled)
  // Round to nearest quarter
  const rounded = Math.round(scaled * 4) / 4
  if (rounded === Math.floor(rounded)) return String(rounded)
  // Show as decimal with 1 place if clean, otherwise as fraction
  const frac = rounded - Math.floor(rounded)
  const whole = Math.floor(rounded)
  const fracs: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
  if (fracs[frac]) return whole > 0 ? `${whole} ${fracs[frac]}` : fracs[frac]
  return String(Math.round(scaled * 10) / 10)
}

// ===== VIDEO EMBED =====
function detectVideoPlatform(url: string): 'youtube' | 'tiktok' | 'instagram' | null {
  try {
    const h = new URL(url).hostname.toLowerCase()
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
    if (h.includes('tiktok.com')) return 'tiktok'
    if (h.includes('instagram.com')) return 'instagram'
  } catch { /* invalid */ }
  return null
}

function getEmbedUrl(url: string, platform: 'youtube' | 'tiktok' | 'instagram'): string | null {
  try {
    if (platform === 'youtube') {
      const parsed = new URL(url)
      const id = parsed.hostname.includes('youtu.be')
        ? parsed.pathname.slice(1).split('?')[0]
        : parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop() || ''
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null
    }
    if (platform === 'tiktok') {
      const match = new URL(url).pathname.match(/\/video\/(\d+)/)
      return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : null
    }
    if (platform === 'instagram') {
      const match = new URL(url).pathname.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
      return match ? `https://www.instagram.com/p/${match[1]}/embed/` : null
    }
  } catch { /* invalid */ }
  return null
}

function VideoEmbed({ url }: { url: string }) {
  const platform = detectVideoPlatform(url)
  if (!platform) return null
  const embedUrl = getEmbedUrl(url, platform)
  if (!embedUrl) return null

  return (
    <div style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div style={{
        position: 'relative', width: '100%',
        aspectRatio: platform === 'tiktok' ? '9/16' : '16/9',
        maxHeight: platform === 'tiktok' ? 560 : undefined,
        maxWidth: platform === 'tiktok' ? 320 : undefined,
        borderRadius: 8, overflow: 'hidden', background: C.warm,
      }}>
        <iframe
          src={embedUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Recipe video"
        />
      </div>
    </div>
  )
}

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
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

function NoPhotoPlaceholder() {
  return (
    <div style={{ width: '100%', height: '100%', background: C.warm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BrokenEggSVG width={50} />
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
      const amt = ing.amount ? `${ing.amount}${ing.unit ? ` ${ing.unit}` : ''} ` : ''
      return `${amt}${ing.name}${ing.notes ? ` (${ing.notes})` : ''}`
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
                  {ing.amount && <span style={{ fontWeight: 400 }}>{ing.amount}{ing.unit ? ` ${ing.unit}` : ''} </span>}
                  {ing.name}
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
        {/* The card — uses theme bg so it renders correctly in dark + light mode */}
        <div style={{ background: C.bg, border: `1.5px solid ${C.rule}`, borderRadius: 10, padding: '28px 26px 24px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: 2, color: C.text3, textTransform: 'uppercase' }}>Recipe Index</span>
            <span style={{ fontFamily: MONO, fontSize: 8, color: C.text3 }}>recipeindex.org</span>
          </div>
          <div style={{ height: 1, background: C.rule, marginBottom: 18 }} />

          {/* Title & meta */}
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.15, letterSpacing: -0.5 }}>{recipe.title}</h2>
          {recipe.submitted_by && (
            <p style={{ fontFamily: SANS, fontSize: 11, color: C.blue, margin: '2px 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 2, background: C.blueBg, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: MONO, color: C.blue }}>Community</span>
              <span>by @{recipe.submitted_by}</span>
            </p>
          )}
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
                    {ing.amount && <span>{ing.amount}{ing.unit ? ` ${ing.unit}` : ''} </span>}{ing.name}
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

// ===== KITCHEN CONSENSUS =====
import { CONSENSUS_DATA, type ConsensusPoint } from '@/app/recipe/consensus-data'

function RecipeEditorNote({ slug }: { slug: string }) {
  const data = CONSENSUS_DATA[slug]
  if (!data || !data.differs || data.differs.length === 0) return null

  return (
    <div style={{
      padding: '12px 16px', background: C.warm, borderLeft: `3px solid ${C.accent}`,
      borderRadius: 8, marginBottom: 16,
    }}>
      <p style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.text3, margin: '0 0 8px' }}>
        What sets this version apart
      </p>
      {data.differs.map((d, i) => (
        <div key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
          <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{d.point}</p>
          <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0 }}>{d.detail}</p>
        </div>
      ))}
      <p style={{ fontFamily: MONO, fontSize: 9, color: C.text3, marginTop: 10, marginBottom: 0 }}>
        Based on {data.recipesAnalyzed} recipes
      </p>
    </div>
  )
}

function ConsensusAnnotations({ slug, isMobile }: { slug: string; isMobile: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const data = CONSENSUS_DATA[slug]
  if (!data) return null

  const isObvious = (p: ConsensusPoint) =>
    p.percentage >= 85 && (!p.altPercentage || p.altPercentage < 25)

  const interestingIngredients = data.ingredients.filter(p => !isObvious(p))
  const interestingTechniques = data.techniques.filter(p => !isObvious(p))
  const allPoints = [...interestingIngredients, ...interestingTechniques]
  const hasPoints = allPoints.length > 0

  return (
    <div style={{ marginTop: 12 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          fontFamily: MONO, fontSize: 11, color: C.blue, cursor: 'pointer',
          padding: '8px 0', userSelect: 'none' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <span>{expanded ? '\u25B4' : '\u25BE'}</span>
        <span>Kitchen Consensus · {data.recipesAnalyzed} recipes</span>
      </div>
      {expanded && (
        <div style={{
          padding: '12px 0 4px',
          columns: isMobile ? 1 : 2, columnGap: 24,
        }}>
          {hasPoints ? allPoints.map((point, i) => (
            <div key={i} style={{ breakInside: 'avoid' as const, marginBottom: 12 }}>
              <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '0 0 3px' }}>
                {point.label}
              </p>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.text, margin: '0 0 5px', lineHeight: 1.3 }}>
                {point.consensus}
                {point.alternative && (
                  <span style={{ color: C.text3 }}> vs. {point.alternative}</span>
                )}
              </p>
              {/* Split pill bar */}
              <div style={{ width: 96, height: 5, borderRadius: 3, background: C.ruleLight, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${point.percentage}%`, background: C.blue, borderRadius: '3px 0 0 3px', transition: 'width 0.2s' }} />
                {point.altPercentage && (
                  <div style={{ width: `${point.altPercentage}%`, background: `${C.blue}55` }} />
                )}
              </div>
            </div>
          )) : (
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: 0 }}>
              Strong consensus across {data.recipesAnalyzed} recipes — most cooks agree on the fundamentals here.
            </p>
          )}
        </div>
      )}
    </div>
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
  const [servingsMultiplier, setServingsMultiplier] = useState(1)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [commentPosting, setCommentPosting] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Shopping list toast
  const [shoppingToast, setShoppingToast] = useState(false)

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
      try {
        const { data, error } = await supabase.from('recipes').select('*').eq('slug', slug).eq('status', 'published').single()
        if (error) throw error
        if (data) setRecipe(data)
      } catch (err) {
        console.error('[recipe] Failed to load recipe:', err)
      }
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
    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: recipe?.title || '', url: window.location.href }).catch(() => {})
    } else {
      setShowShareCard(true)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 22, height: 22, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <span style={{ fontSize: 13, color: C.text3 }}>Loading recipe</span>
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
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
            </div>
            {!isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: SANS }}>
                <span onClick={() => router.push('/')} style={{ color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Browse</span>
                <div style={{ width: 1, height: 14, background: C.rule }} />
                <span onClick={() => router.push('/pantry')} style={{ color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Kitchen</span>
                <div style={{ width: 1, height: 14, background: C.rule }} />
                <span onClick={() => router.push('/profile')} style={{ color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Profile</span>
                <ThemeToggle />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span onClick={() => router.back()} style={{ color: C.text2, cursor: 'pointer', fontSize: 12, fontFamily: SANS }}>←</span>
                <ThemeToggle />
              </div>
            )}
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
              {recipe.photo_credit && (
                <div style={{
                  position: 'absolute', top: 8, right: 10,
                  fontSize: 9, fontFamily: SANS, color: 'rgba(255,255,255,0.6)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  letterSpacing: '0.02em',
                }}>
                  Photo by{' '}
                  {recipe.photographer_url ? (
                    <a href={withUtm(recipe.photographer_url)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{recipe.photo_credit}</a>
                  ) : recipe.photo_credit}
                  {' '}on{' '}
                  {recipe.unsplash_photo_url ? (
                    <a href={withUtm(recipe.unsplash_photo_url)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Unsplash</a>
                  ) : 'Unsplash'}
                </div>
              )}
            </>
          ) : (
            <NoPhotoPlaceholder />
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: isMobile ? 680 : 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title section */}
        <div style={{ paddingTop: isMobile ? 28 : 20, paddingBottom: isMobile ? 20 : 14, animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, fontFamily: SANS, color: C.text3 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span>
            <span>›</span>
            {recipe.cuisine && <><span style={{ cursor: 'pointer' }}>{recipe.cuisine}</span><span>›</span></>}
            <span style={{ color: C.text2 }}>{recipe.title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {recipe.time_total && <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600, color: C.accent, background: C.accentBg, padding: '3px 10px', borderRadius: 12, letterSpacing: 0.3 }}>{formatTime(recipe.time_total)}</span>}
            {recipe.time_active && <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600, color: C.accent, background: C.accentBg, padding: '3px 10px', borderRadius: 12, letterSpacing: 0.3 }}>{formatTime(recipe.time_active)} active</span>}
            {recipe.cuisine && <span style={{ fontSize: 12, fontFamily: SANS, color: C.text3 }}>{recipe.cuisine}</span>}
          </div>

          {/* Aggregate egg rating */}
          {(() => {
            const LEGACY_MAP: Record<string, number> = { amazing: 5, good: 4, ok: 3, 'just ok': 3, tricky: 2 }
            const nums = comments
              .map(c => c.rating_numeric ?? (c.rating ? LEGACY_MAP[c.rating.toLowerCase()] : null))
              .filter((n): n is number => n != null)
            if (nums.length === 0) return null
            const avg = nums.reduce((a, b) => a + b, 0) / nums.length
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.text }}>{avg.toFixed(1)}</span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const fill = Math.min(1, Math.max(0, avg - (n - 1)))
                    return (
                      <div key={n} style={{ position: 'relative', width: 14, height: 18 }}>
                        <div style={{
                          width: 14, height: 18, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                          background: C.ruleLight, position: 'absolute', top: 0, left: 0,
                        }} />
                        {fill > 0 && (
                          <div style={{
                            width: 14, height: 18, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                            background: C.accent, position: 'absolute', top: 0, left: 0,
                            clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)`,
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>({nums.length} {nums.length === 1 ? 'rating' : 'ratings'})</span>
              </div>
            )
          })()}

          {!recipe.image_url && (
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 10 }}>
              {recipe.title}
            </h1>
          )}

          {/* Source attribution — two-line: author + original source */}
          {(recipe.cookbook_title || recipe.creator_name || recipe.source_attribution) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12, fontFamily: SANS, fontSize: 12, color: C.text3 }}>
              {recipe.cookbook_title ? (
                <>
                  <div>
                    Adapted from{' '}
                    {recipe.cookbook_author ? (
                      <span style={{ color: C.text2, fontWeight: 600 }}>{recipe.cookbook_author}</span>
                    ) : (
                      <span style={{ color: C.text2, fontWeight: 600 }}>{recipe.cookbook_title}</span>
                    )}
                  </div>
                  {recipe.cookbook_author && (
                    <div>
                      Original source:{' '}
                      {recipe.cookbook_purchase_url ? (
                        <a href={recipe.cookbook_purchase_url} target="_blank" rel="noopener noreferrer" style={{ color: C.text3, textDecoration: 'underline', textDecorationColor: C.ruleLight, textUnderlineOffset: 2 }}>
                          {recipe.cookbook_title}
                        </a>
                      ) : (
                        <span>{recipe.cookbook_title}</span>
                      )}
                    </div>
                  )}
                </>
              ) : recipe.creator_name ? (
                <>
                  <div>
                    Inspired by{' '}
                    {recipe.creator_url ? (
                      <a href={recipe.creator_url} target="_blank" rel="noopener noreferrer" style={{ color: C.text2, fontWeight: 600, textDecoration: 'underline', textDecorationColor: C.ruleLight, textUnderlineOffset: 2 }}>
                        {recipe.creator_name}
                      </a>
                    ) : (
                      <span style={{ color: C.text2, fontWeight: 600 }}>{recipe.creator_name}</span>
                    )}
                  </div>
                  {recipe.video_url && (
                    <div>
                      Original source:{' '}
                      <a href={recipe.video_url} target="_blank" rel="noopener noreferrer" style={{ color: C.text3, textDecoration: 'underline', textDecorationColor: C.ruleLight, textUnderlineOffset: 2 }}>
                        {(() => { try { return new URL(recipe.video_url.startsWith('http') ? recipe.video_url : `https://${recipe.video_url}`).hostname.replace('www.', '') } catch { return 'Watch original' } })()}
                      </a>
                    </div>
                  )}
                </>
              ) : recipe.source_attribution ? (
                <>
                  <div>
                    Adapted from{' '}
                    <span style={{ color: C.text2, fontWeight: 600 }}>{recipe.source_attribution}</span>
                  </div>
                  {recipe.source_url && (
                    <div>
                      Original source:{' '}
                      <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" style={{ color: C.text3, textDecoration: 'underline', textDecorationColor: C.ruleLight, textUnderlineOffset: 2 }}>
                        {(() => { try { return new URL(recipe.source_url.startsWith('http') ? recipe.source_url : `https://${recipe.source_url}`).hostname.replace('www.', '') } catch { return recipe.source_url } })()}
                      </a>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {recipe.description && (
            <p style={{ fontFamily: SERIF, fontSize: isMobile ? 13 : 15, color: C.text2, lineHeight: 1.65, fontStyle: 'italic', maxWidth: 520, marginBottom: 16 }}>
              &ldquo;{recipe.description}&rdquo;
            </p>
          )}

          {/* Creator attribution (video-sourced recipes) */}
          {recipe.creator_name && recipe.video_url && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '6px 12px', borderRadius: 6, background: C.cool, border: `1px solid ${C.ruleLight}` }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: C.text3 }}>Recipe by</span>
              {recipe.creator_url ? (
                <a href={recipe.creator_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text2, textDecoration: 'none' }}>
                  {recipe.creator_name}
                </a>
              ) : (
                <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text2 }}>{recipe.creator_name}</span>
              )}
              <span style={{ color: C.rule }}>·</span>
              <a href={recipe.video_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: 12, color: C.text3, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Watch original
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          )}

          {/* AI-extracted badge + creator credit for video-sourced recipes */}
          {recipe.video_url && recipe.source_attribution === 'RecDex Trending' && (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 6, background: C.accentBg, border: `1px solid ${C.accentMed}`, alignSelf: 'flex-start' }}>
                <span style={{ fontSize: 12 }}>🤖</span>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>AI-extracted from video</span>
                <span style={{ color: C.rule }}>·</span>
                <a href={`/contribute?url=${encodeURIComponent(recipe.video_url)}`} style={{ fontFamily: SANS, fontSize: 11, color: C.accent, textDecoration: 'none', fontWeight: 500 }}>
                  Verify or edit
                </a>
              </div>
              {recipe.creator_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: SANS, color: C.text3 }}>
                  <span>Recipe by</span>
                  {recipe.creator_url ? (
                    <a href={recipe.creator_url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                      {recipe.creator_name}
                    </a>
                  ) : (
                    <span style={{ color: C.text2, fontWeight: 600 }}>{recipe.creator_name}</span>
                  )}
                  <span style={{ color: C.text3 }}>·</span>
                  <a href={recipe.video_url} target="_blank" rel="noopener noreferrer" style={{ color: C.text3, textDecoration: 'none' }}>
                    Watch original →
                  </a>
                </div>
              )}
            </div>
          )}

          <RecipeEditorNote slug={slug} />

          {/* Secondary actions — quieter row so COOK at the bottom of
              "How it cooks" stays the visual anchor */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {hasIngredients && (
              <button onClick={() => setShowGroceryList(true)} aria-label="Grocery list" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 2px', border: 'none', background: 'transparent',
                color: C.text3, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.color = C.text3 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6" /><path d="M9 16h6" />
                </svg>
                Grocery list
              </button>
            )}
            <button onClick={handleShare} aria-label="Share" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 2px', border: 'none', background: 'transparent',
              color: C.text3, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { e.currentTarget.style.color = C.text3 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
            <button onClick={toggleSave} aria-label={saved ? 'Saved' : 'Save'} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 2px', border: 'none', background: 'transparent',
              color: saved ? C.accent : C.text3, fontSize: 12, fontWeight: saved ? 600 : 500, cursor: 'pointer', fontFamily: SANS,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { if (!saved) e.currentTarget.style.color = C.text3 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? C.accent : 'none'} stroke={saved ? C.accent : 'currentColor'} strokeWidth="2" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: C.rule }} />

        {/* Video embed (video-sourced recipes) */}
        {recipe.video_url && <VideoEmbed url={recipe.video_url} />}

        {/* Two-column layout: ingredients sidebar + steps/comments on desktop */}
        <div style={!isMobile ? { display: 'flex', gap: 40 } : undefined}>
          {/* Left column: Ingredients (sticky on desktop) */}
          <div style={!isMobile ? { width: 320, flexShrink: 0, position: 'sticky' as const, top: 80, alignSelf: 'flex-start' } : undefined}>

        {/* Ingredients */}
        {hasIngredients ? (
          <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.05s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Ingredients</h2>
              {/* Servings adjuster */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.cool, borderRadius: 6, border: `1px solid ${C.ruleLight}`, overflow: 'hidden' }}>
                <button
                  onClick={() => {
                    const base = recipe.servings || 4
                    const current = Math.round(base * servingsMultiplier)
                    if (current > 1) setServingsMultiplier((current - 1) / base)
                  }}
                  style={{ width: 30, height: 30, border: 'none', background: 'none', color: C.text2, fontSize: 16, cursor: 'pointer', fontFamily: MONO, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.warm }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >−</button>
                <span style={{
                  minWidth: 60, textAlign: 'center', fontSize: 11, fontFamily: MONO,
                  color: servingsMultiplier !== 1 ? C.accent : C.text2, fontWeight: servingsMultiplier !== 1 ? 700 : 400,
                  padding: '0 4px', borderLeft: `1px solid ${C.ruleLight}`, borderRight: `1px solid ${C.ruleLight}`,
                  lineHeight: '30px',
                }}>
                  {Math.round((recipe.servings || 4) * servingsMultiplier)} servings
                </span>
                <button
                  onClick={() => {
                    const base = recipe.servings || 4
                    const current = Math.round(base * servingsMultiplier)
                    setServingsMultiplier((current + 1) / base)
                  }}
                  style={{ width: 30, height: 30, border: 'none', background: 'none', color: C.text2, fontSize: 16, cursor: 'pointer', fontFamily: MONO, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.warm }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >+</button>
              </div>
            </div>
            <div style={{ border: `1.5px solid ${C.ruleLight}`, borderRadius: 10, padding: '16px 20px', background: C.cool }}>
              <div style={{ columns: 1 }}>
                {ingredientItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0', breakInside: 'avoid' as const }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const stored = localStorage.getItem('recdex-grocery')
                        let existing: { name: string; amount: string; unit: string; recipeId: string; recipeTitle: string; recipeSlug: string; checked: boolean }[] = []
                        if (stored) { try { existing = JSON.parse(stored) } catch { /* */ } }
                        if (!existing.some(e => e.recipeTitle === recipe.title && e.name === item.name)) {
                          existing.push({
                            name: item.name,
                            amount: scaleAmount(item.amount, servingsMultiplier),
                            unit: item.unit,
                            recipeId: recipe.id,
                            recipeTitle: recipe.title,
                            recipeSlug: slug,
                            checked: false,
                          })
                          localStorage.setItem('recdex-grocery', JSON.stringify(existing))
                        }
                        setShoppingToast(true)
                        setTimeout(() => setShoppingToast(false), 1500)
                      }}
                      style={{
                        background: 'none', border: 'none', color: C.text3, fontSize: 15,
                        cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0,
                        opacity: 0.4, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.4' }}
                    >+</button>
                    <p style={{ fontSize: 15, color: C.text, margin: 0, fontFamily: SANS, lineHeight: 1.5 }}>
                      {item.amount && (
                        <span style={{ color: servingsMultiplier !== 1 ? C.accent : C.text, fontWeight: servingsMultiplier !== 1 ? 600 : 400, transition: 'color 0.15s' }}>
                          {scaleAmount(item.amount, servingsMultiplier)}{item.unit ? ` ${item.unit}` : ''}{' '}
                        </span>
                      )}
                      {item.name}
                      {item.notes && <span style={{ color: C.text3, fontSize: 13 }}> ({item.notes})</span>}
                    </p>
                  </div>
                ))}
              </div>
              <ConsensusAnnotations slug={slug} isMobile={isMobile} />
            </div>
            {/* Add to shopping list button */}
            <button
              onClick={() => {
                const stored = localStorage.getItem('recdex-grocery')
                let existing: { name: string; amount: string; unit: string; recipeId: string; recipeTitle: string; recipeSlug: string; checked: boolean }[] = []
                if (stored) {
                  try { existing = JSON.parse(stored) } catch { /* */ }
                }
                const newItems = ingredientItems
                  .filter(item => !existing.some(e => e.recipeTitle === recipe.title && e.name === item.name))
                  .map(item => ({
                    name: item.name,
                    amount: scaleAmount(item.amount, servingsMultiplier),
                    unit: item.unit,
                    recipeId: recipe.id,
                    recipeTitle: recipe.title,
                    recipeSlug: slug,
                    checked: false,
                  }))
                if (newItems.length > 0) {
                  localStorage.setItem('recdex-grocery', JSON.stringify([...existing, ...newItems]))
                }
                setShoppingToast(true)
                setTimeout(() => setShoppingToast(false), 2500)
              }}
              style={{
                marginTop: 12, padding: '10px 18px', borderRadius: 6,
                border: `1.5px solid ${C.green}`, background: C.greenBg,
                color: C.green, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: SANS,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Add to shopping list
            </button>
            {/* Shopping list toast */}
            {shoppingToast && (
              <div style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                padding: '10px 20px', borderRadius: 8,
                background: C.text, color: C.bg,
                fontSize: 13, fontWeight: 600, fontFamily: SANS,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                zIndex: 500, animation: 'fadeIn 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                Added to shopping list
              </div>
            )}
          </div>
        ) : (
          <div style={{ paddingTop: 24, paddingBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>Ingredients</h2>
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS, lineHeight: 1.6 }}>No ingredients listed yet for this recipe.</p>
          </div>
        )}

          </div>
          {/* Right column: Steps, Kitchen Consensus, Comments, Notes */}
          <div style={!isMobile ? { flex: 1, minWidth: 0 } : undefined}>

        {isMobile && <div style={{ height: 1, background: C.rule }} />}

        {/* How it cooks — a short prose arc that doesn't compete with cook mode */}
        {hasSteps ? (
          <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.1s both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>How it cooks</h2>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>
                {recipe.steps.length} steps{recipe.time_total ? ` · ${formatTime(recipe.time_total)}` : ''}
              </span>
            </div>

            {recipe.summary ? (
              <p style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.65, color: C.text2, margin: '0 0 24px' }}>
                {recipe.summary}
              </p>
            ) : (
              // Fallback for recipes that don't have a summary yet — show the
              // full step list. Backfill via scripts/backfill-summaries.ts will
              // remove this path once all recipes have summaries.
              <div style={{ marginBottom: 24 }}>
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
              </div>
            )}

            {/* The one COOK CTA — this is the action the whole recipe page
                funnels toward. Keep it alone at the bottom of the arc. */}
            <a href={`/recipe/${slug}/cook`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', marginTop: 8, padding: '18px 24px', borderRadius: 12, border: 'none',
              background: C.accent, color: '#fff', textAlign: 'center', textDecoration: 'none',
              fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
              letterSpacing: 0.5, boxShadow: '0 6px 20px rgba(232,123,90,0.32)',
              transition: 'transform 0.1s, box-shadow 0.15s',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2v2M10 2v2M14 2v2M4 6h16v2a8 8 0 0 1-16 0z" />
                <path d="M4 22h16" />
              </svg>
              COOK with step-by-step
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        ) : (
          <div style={{ paddingTop: 24, paddingBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>How it cooks</h2>
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS, lineHeight: 1.6 }}>No step-by-step instructions available for this recipe.</p>
          </div>
        )}

        <div style={{ height: 1, background: C.rule }} />

        {/* ===== COMMUNITY FEEDBACK (Kitchen Consensus) ===== */}
        {comments.length > 0 && (() => {
          const LEGACY_MAP_KC: Record<string, number> = { amazing: 5, good: 4, ok: 3, 'just ok': 3, tricky: 2 }
          const ratingNums: number[] = []
          const substitutions: { text: string; author: string; date: string }[] = []
          const tips: { text: string; author: string; date: string }[] = []

          comments.forEach(c => {
            const num = c.rating_numeric ?? (c.rating ? LEGACY_MAP_KC[c.rating.toLowerCase()] : null)
            if (num != null) ratingNums.push(num)
            const lines = c.body.split('\n')
            lines.forEach(line => {
              const subMatch = line.match(/🔄\s*Substitution:\s*(.+)/i)
              if (subMatch) substitutions.push({ text: subMatch[1].trim(), author: c.display_name, date: c.created_at })
              const tipMatch = line.match(/💡\s*Tip:\s*(.+)/i)
              if (tipMatch) tips.push({ text: tipMatch[1].trim(), author: c.display_name, date: c.created_at })
            })
          })

          const hasRatings = ratingNums.length > 0
          const avgRating = hasRatings ? ratingNums.reduce((a, b) => a + b, 0) / ratingNums.length : 0
          const hasTips = substitutions.length > 0 || tips.length > 0

          if (!hasRatings && !hasTips) return null

          return (
            <>
              <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.08s both' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Kitchen Consensus</h2>
                <div style={{
                  padding: '20px 22px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.warm} 0%, ${C.cool} 100%)`,
                  border: `1.5px solid ${C.ruleLight}`,
                }}>
                  {/* Aggregated egg ratings */}
                  {hasRatings && (
                    <div style={{ marginBottom: hasTips ? 20 : 0 }}>
                      <p style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px' }}>
                        How it turned out
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text }}>{avgRating.toFixed(1)}</span>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          {[1, 2, 3, 4, 5].map(n => {
                            const fill = Math.min(1, Math.max(0, avgRating - (n - 1)))
                            return (
                              <div key={n} style={{ position: 'relative', width: 16, height: 20 }}>
                                <div style={{
                                  width: 16, height: 20, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                                  background: C.ruleLight, position: 'absolute', top: 0, left: 0,
                                }} />
                                {fill > 0 && (
                                  <div style={{
                                    width: 16, height: 20, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                                    background: C.accent, position: 'absolute', top: 0, left: 0,
                                    clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)`,
                                  }} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>({ratingNums.length} {ratingNums.length === 1 ? 'rating' : 'ratings'})</span>
                      </div>
                    </div>
                  )}

                  {/* Substitution tips */}
                  {substitutions.length > 0 && (
                    <div style={{ marginBottom: tips.length > 0 ? 16 : 0 }}>
                      <p style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px' }}>
                        Substitutions
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {substitutions.map((sub, i) => (
                          <div key={i} style={{
                            padding: '8px 12px', borderRadius: 6,
                            background: C.bg, border: `1px solid ${C.ruleLight}`,
                            borderLeft: `3px solid ${C.gold}`,
                          }}>
                            <p style={{ fontSize: 13, fontFamily: SANS, color: C.text, margin: 0, lineHeight: 1.5 }}>{sub.text}</p>
                            <p style={{ fontSize: 10, fontFamily: MONO, color: C.text3, margin: '4px 0 0' }}>
                              @{sub.author} · {relativeTime(sub.date)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cooking tips */}
                  {tips.length > 0 && (
                    <div>
                      <p style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px' }}>
                        Cooking Tips
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tips.map((tip, i) => (
                          <div key={i} style={{
                            padding: '8px 12px', borderRadius: 6,
                            background: C.bg, border: `1px solid ${C.ruleLight}`,
                            borderLeft: `3px solid ${C.green}`,
                          }}>
                            <p style={{ fontSize: 13, fontFamily: SANS, color: C.text, margin: 0, lineHeight: 1.5 }}>{tip.text}</p>
                            <p style={{ fontSize: 10, fontFamily: MONO, color: C.text3, margin: '4px 0 0' }}>
                              @{tip.author} · {relativeTime(tip.date)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ height: 1, background: C.rule }} />
            </>
          )
        })()}

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
              {[...comments]
                .sort((a, b) => {
                  // Sort by likes (stored in localStorage), then by date
                  const likesA = parseInt(localStorage.getItem(`recdex-note-likes-${a.id}`) || '0')
                  const likesB = parseInt(localStorage.getItem(`recdex-note-likes-${b.id}`) || '0')
                  if (likesB !== likesA) return likesB - likesA
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                })
                .map((c, i, sorted) => {
                const likes = parseInt(localStorage.getItem(`recdex-note-likes-${c.id}`) || '0')
                const isTop = i === 0 && likes >= 5
                return (
                <div key={c.id} style={{
                  padding: '14px 0',
                  borderTop: i === 0 ? `1px solid ${C.ruleLight}` : 'none',
                  borderBottom: `1px solid ${C.ruleLight}`,
                }}>
                  {/* Top tip badge */}
                  {isTop && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: C.goldBg, borderRadius: 4, marginBottom: 8 }}>
                      <span style={{ fontSize: 10 }}>⭐</span>
                      <span style={{ fontSize: 9, fontFamily: MONO, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top tip</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    {/* Upvote column */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, paddingTop: 2, flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          const key = `recdex-note-likes-${c.id}`
                          const likedKey = `recdex-note-liked-${c.id}`
                          const alreadyLiked = localStorage.getItem(likedKey) === '1'
                          const current = parseInt(localStorage.getItem(key) || '0')
                          if (alreadyLiked) {
                            localStorage.setItem(key, String(Math.max(0, current - 1)))
                            localStorage.removeItem(likedKey)
                          } else {
                            localStorage.setItem(key, String(current + 1))
                            localStorage.setItem(likedKey, '1')
                          }
                          // Force re-render
                          setComments([...comments])
                        }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                          opacity: localStorage.getItem(`recdex-note-liked-${c.id}`) === '1' ? 1 : 0.5,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={localStorage.getItem(`recdex-note-liked-${c.id}`) === '1' ? C.accent : C.text3}
                          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: 'rotate(-30deg)' }}
                        >
                          <circle cx="10" cy="12" r="7" />
                          <line x1="17" y1="5" x2="22" y2="2" />
                        </svg>
                      </button>
                      <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 600, color: likes > 0 ? C.text2 : C.text3 }}>
                        {likes || ''}
                      </span>
                    </div>
                    {/* Comment content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', background: C.accent,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: SANS, flexShrink: 0,
                        }}>
                          {c.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 11, fontFamily: MONO, color: C.accent, fontWeight: 500 }}>
                          @{c.display_name}
                        </span>
                        <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {c.rating && <span style={{ fontSize: 12 }}>{c.rating}</span>}
                      </div>
                      <p style={{ fontSize: 14, fontFamily: SANS, color: C.text, lineHeight: 1.55, margin: 0 }}>
                        {c.body}
                      </p>
                    </div>
                  </div>
                </div>
                )
              })}
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
