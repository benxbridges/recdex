'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'

// ===== TYPES =====
type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  image_url: string | null; servings: number | null
}

type CookEvent = {
  recipeId: string; recipeSlug: string; recipeTitle: string
  cookedAt: number; rating?: string; substitutions?: string; tip?: string
}

type Socials = { website?: string; instagram?: string; twitter?: string; tiktok?: string }

type UserProfile = {
  displayName: string; bio: string; favoriteRecipeId: string | null; dislikes: string[]
  favoriteDishes: string[] // up to 4 recipe IDs — Letterboxd-style top picks
  socials: Socials
}

type RecipeMin = { id: string; slug: string; title: string; image_url: string | null }

type GroceryItem = {
  name: string
  amount: string
  unit: string
  notes?: string
  recipeId: string
  recipeTitle: string
  recipeSlug: string
  checked: boolean
}

type PantryItem = {
  id: string
  name: string
  category: string
  addedAt: number
}

const RATING_EMOJI: Record<string, string> = { amazing: '🤩', good: '😊', ok: '😐', tricky: '😅' }

const GROCERY_KEY = 'recdex-grocery'
const PANTRY_KEY = 'recdex-pantry'

const CATEGORIES = [
  { key: 'produce', label: 'Produce', icon: '🥬' },
  { key: 'protein', label: 'Protein', icon: '🥩' },
  { key: 'dairy', label: 'Dairy & Eggs', icon: '🧈' },
  { key: 'grains', label: 'Grains & Pasta', icon: '🌾' },
  { key: 'canned', label: 'Canned & Jarred', icon: '🥫' },
  { key: 'spices', label: 'Spices & Seasonings', icon: '🧂' },
  { key: 'oils', label: 'Oils & Vinegars', icon: '🫒' },
  { key: 'baking', label: 'Baking', icon: '🧁' },
  { key: 'condiments', label: 'Condiments & Sauces', icon: '🍯' },
  { key: 'frozen', label: 'Frozen', icon: '🧊' },
  { key: 'other', label: 'Other', icon: '📦' },
]

// ===== HELPERS =====
function formatDate(ts: number): string {
  const d = new Date(ts)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}



// ===== MAIN PAGE =====
export default function ProfilePage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)

  // Core data
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])

  // Profile + cook history
  const [profile, setProfile] = useState<UserProfile>({ displayName: '', bio: '', favoriteRecipeId: null, dislikes: [], favoriteDishes: [], socials: {} })
  const [cookEvents, setCookEvents] = useState<CookEvent[]>([])

  // UI states
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [editingSocials, setEditingSocials] = useState(false)
  const [favDishRecipes, setFavDishRecipes] = useState<RecipeMin[]>([])
  const [showFavDishPicker, setShowFavDishPicker] = useState<number | null>(null)
  const [favDishSearch, setFavDishSearch] = useState('')
  const [favDishResults, setFavDishResults] = useState<RecipeMin[]>([])
  const favDishInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const bioInputRef = useRef<HTMLTextAreaElement>(null)

  // Tab state: Overview | Shopping List | Pantry
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'pantry'>('overview')

  // Shopping list state
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const [listCopied, setListCopied] = useState(false)

  // Pantry state
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [pantrySearch, setPantrySearch] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('produce')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const boxRaw = localStorage.getItem('recdex-box')
    const cookedRaw = localStorage.getItem('recdex-cooked')
    const profileRaw = localStorage.getItem('recdex-profile')

    let ids: string[] = []
    if (boxRaw) try { ids = JSON.parse(boxRaw) } catch { /* ignore */ }
    setSavedIds(ids)

    if (cookedRaw) try { setCookEvents(JSON.parse(cookedRaw)) } catch { /* ignore */ }

    let prof: UserProfile = { displayName: '', bio: '', favoriteRecipeId: null, dislikes: [], favoriteDishes: [], socials: {} }
    if (profileRaw) try { prof = { ...prof, ...JSON.parse(profileRaw) } } catch { /* ignore */ }
    if (!prof.favoriteDishes) prof.favoriteDishes = []
    if (!prof.socials) prof.socials = {}
    setProfile(prof)
    setNameInput(prof.displayName)
    setBioInput(prof.bio || '')

    // Load favorite dish recipes (now includes image_url)
    if (prof.favoriteDishes && prof.favoriteDishes.length > 0) {
      supabase.from('recipes').select('id, slug, title, image_url').in('id', prof.favoriteDishes)
        .then(({ data }) => { if (data) setFavDishRecipes(data) })
    }

    if (ids.length > 0) {
      supabase.from('recipes').select('id, slug, title, description, cuisine, difficulty, time_total, time_active, image_url, servings')
        .in('id', ids).eq('status', 'published')
        .then(({ data }) => { if (data) setSavedRecipes(data); setLoading(false) })
    } else {
      setLoading(false)
    }

    // Load grocery + pantry from localStorage
    const groceryRaw = localStorage.getItem(GROCERY_KEY)
    if (groceryRaw) try { setGroceryItems(JSON.parse(groceryRaw)) } catch { /* ignore */ }
    const pantryRaw = localStorage.getItem(PANTRY_KEY)
    if (pantryRaw) try { setPantryItems(JSON.parse(pantryRaw)) } catch { /* ignore */ }
  }, [])

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated)
    localStorage.setItem('recdex-profile', JSON.stringify(updated))
  }

  // Favorite dish picker search (now fetches image_url too)
  useEffect(() => {
    if (showFavDishPicker === null || favDishSearch.length < 2) { setFavDishResults([]); return }
    const timer = setTimeout(() => {
      // Escape LIKE/ILIKE metacharacters so users can't inject wildcards
      // (e.g. `%%%%%` forces an expensive full-table scan).
      const escaped = favDishSearch.replace(/[\\%_]/g, '\\$&')
      supabase.from('recipes').select('id, slug, title, image_url').eq('status', 'published')
        .ilike('title', `%${escaped}%`).limit(8)
        .then(({ data }) => { if (data) setFavDishResults(data) })
    }, 200)
    return () => clearTimeout(timer)
  }, [favDishSearch, showFavDishPicker])

  const unsaveRecipe = (recipeId: string) => {
    const newIds = savedIds.filter(id => id !== recipeId)
    setSavedIds(newIds)
    setSavedRecipes(prev => prev.filter(r => r.id !== recipeId))
    localStorage.setItem('recdex-box', JSON.stringify(newIds))
  }

  // === Shopping list helpers ===
  const saveGrocery = useCallback((items: GroceryItem[]) => {
    setGroceryItems(items)
    localStorage.setItem(GROCERY_KEY, JSON.stringify(items))
  }, [])

  const toggleItem = (index: number) => {
    const updated = [...groceryItems]
    updated[index] = { ...updated[index], checked: !updated[index].checked }
    saveGrocery(updated)
  }

  const clearGot = () => { saveGrocery(groceryItems.filter(item => !item.checked)) }
  const removeRecipeItems = (recipeId: string) => { saveGrocery(groceryItems.filter(item => item.recipeId !== recipeId)) }
  const clearAllGrocery = () => { saveGrocery([]) }

  const needItems = groceryItems.filter(i => !i.checked)
  const gotItems = groceryItems.filter(i => i.checked)
  const totalGroceryCount = groceryItems.length
  const groceryRecipeCount = new Set(groceryItems.map(i => i.recipeId)).size

  const needByRecipe: Record<string, { items: GroceryItem[]; indices: number[] }> = {}
  groceryItems.forEach((item, idx) => {
    if (!needByRecipe[item.recipeId]) needByRecipe[item.recipeId] = { items: [], indices: [] }
    needByRecipe[item.recipeId].items.push(item)
    needByRecipe[item.recipeId].indices.push(idx)
  })

  const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase().trim()))
  const isInPantry = (name: string) => pantryNames.has(name.toLowerCase().trim())

  const copyList = async () => {
    const lines: string[] = []
    Object.entries(needByRecipe).forEach(([, { items }]) => {
      const first = items[0]
      if (first) lines.push(`— ${first.recipeTitle} —`)
      items.forEach(item => {
        const amt = item.amount ? ` / ${item.amount}${item.unit ? ` ${item.unit}` : ''}` : ''
        lines.push(`  ${item.name}${amt}`)
      })
      lines.push('')
    })
    await navigator.clipboard?.writeText(lines.join('\n'))
    setListCopied(true)
    setTimeout(() => setListCopied(false), 2000)
  }

  // === Pantry helpers ===
  const savePantry = useCallback((items: PantryItem[]) => {
    setPantryItems(items)
    localStorage.setItem(PANTRY_KEY, JSON.stringify(items))
  }, [])

  const addPantryItem = () => {
    if (!newItemName.trim()) return
    const item: PantryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      addedAt: Date.now(),
    }
    savePantry([...pantryItems, item])
    setNewItemName('')
    setAddingItem(false)
  }

  const removePantryItem = (id: string) => { savePantry(pantryItems.filter(item => item.id !== id)) }

  const filteredPantry = pantryItems.filter(item => {
    const matchesSearch = !pantrySearch || item.name.toLowerCase().includes(pantrySearch.toLowerCase())
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const pantryByCategory: Record<string, PantryItem[]> = {}
  filteredPantry.forEach(item => {
    if (!pantryByCategory[item.category]) pantryByCategory[item.category] = []
    pantryByCategory[item.category].push(item)
  })

  // Derived stats
  const totalCooks = cookEvents.length
  const uniqueDishes = new Set(cookEvents.map(e => e.recipeId)).size
  const lastCooked = cookEvents.length > 0 ? cookEvents.reduce((a, b) => a.cookedAt > b.cookedAt ? a : b) : null
  const savedCount = savedIds.length

  // Week streak
  const weekStreak = (() => {
    if (cookEvents.length === 0) return 0
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
    const now = new Date()
    const dow = now.getDay() || 7
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + 1).getTime()
    let streak = 0
    let ws = startOfWeek
    while (true) {
      const we = ws + ONE_WEEK
      if (cookEvents.some(e => e.cookedAt >= ws && e.cookedAt < we)) {
        streak++
        ws -= ONE_WEEK
      } else break
    }
    return streak
  })()

  // Cook counts per recipe (for mostCooked banner)
  const cookCounts: Record<string, { count: number; title: string; slug: string; lastRating?: string; lastCooked: number }> = {}
  cookEvents.forEach(e => {
    if (!cookCounts[e.recipeId]) cookCounts[e.recipeId] = { count: 0, title: e.recipeTitle, slug: e.recipeSlug, lastCooked: e.cookedAt }
    cookCounts[e.recipeId].count++
    if (e.rating) cookCounts[e.recipeId].lastRating = e.rating
    if (e.cookedAt > cookCounts[e.recipeId].lastCooked) cookCounts[e.recipeId].lastCooked = e.cookedAt
  })
  const dishesList = Object.entries(cookCounts).sort((a, b) => b[1].count - a[1].count)
  const mostCooked = dishesList[0] || null

  // Activity feed
  type ActivityItem = { type: 'cooked'; event: CookEvent }
  const activityFeed: ActivityItem[] = cookEvents.map(e => ({ type: 'cooked' as const, event: e }))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <SiteHeader />

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* ========== UNIFIED PROFILE CARD ========== */}
        <div style={{ marginTop: 24, marginBottom: 16, background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 12, overflow: 'hidden' }}>

          {/* Top section: avatar + name + bio + fav + dislikes */}
          <div style={{ padding: isMobile ? '14px 12px 12px' : '22px 28px 18px' }}>

            {/* Avatar + name row */}
            <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: profile.displayName ? C.accent : C.ruleLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontFamily: SANS, fontSize: 19, fontWeight: 700, color: profile.displayName ? '#fff' : C.text3,
              }}>
                {profile.displayName ? profile.displayName[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingName ? (
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const trimmed = nameInput.trim().replace(/\s+/g, '_').toLowerCase()
                    if (trimmed) saveProfile({ ...profile, displayName: trimmed })
                    setEditingName(false)
                  }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 15, color: C.accent }}>@</span>
                    <input ref={nameInputRef} value={nameInput} onChange={e => setNameInput(e.target.value)}
                      placeholder="pick_a_name" autoFocus
                      style={{ fontFamily: MONO, fontSize: 15, color: C.text, background: C.bg, border: `1.5px solid ${C.rule}`, borderRadius: 4, padding: '4px 8px', outline: 'none', flex: 1, maxWidth: 200 }} />
                    <button type="submit" style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.green, background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button type="button" onClick={() => { setEditingName(false); setNameInput(profile.displayName) }} style={{ fontSize: 11, fontFamily: SANS, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 50) }} style={{ cursor: 'pointer' }}>
                      {profile.displayName ? (
                        <span style={{ fontFamily: MONO, fontSize: 15, color: C.accent, fontWeight: 600 }}>@{profile.displayName}</span>
                      ) : (
                        <span style={{ fontFamily: MONO, fontSize: 15, color: C.text3, fontStyle: 'italic' }}>Pick a display name...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 14 }}>
              {editingBio ? (
                <div>
                  <textarea ref={bioInputRef} value={bioInput}
                    onChange={e => { if (e.target.value.length <= 150) setBioInput(e.target.value) }}
                    placeholder="A little about your cooking style..." autoFocus rows={2}
                    style={{ width: '100%', fontFamily: SANS, fontSize: 13, color: C.text, background: C.bg, border: `1.5px solid ${C.rule}`, borderRadius: 6, padding: '8px 10px', outline: 'none', resize: 'none', lineHeight: 1.5 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontFamily: MONO, color: bioInput.length >= 140 ? C.accent : C.text3 }}>{bioInput.length}/150</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { saveProfile({ ...profile, bio: bioInput.trim() }); setEditingBio(false) }}
                        style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.green, background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => { setEditingBio(false); setBioInput(profile.bio || '') }}
                        style={{ fontSize: 11, fontFamily: SANS, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <p onClick={() => { setEditingBio(true); setTimeout(() => bioInputRef.current?.focus(), 50) }}
                  style={{ margin: 0, fontFamily: SANS, fontSize: 13, color: profile.bio ? C.text2 : C.text3, lineHeight: 1.5, cursor: 'pointer', fontStyle: profile.bio ? 'normal' : 'italic' }}>
                  {profile.bio || 'Add a bio...'}
                </p>
              )}
            </div>

            {/* Social Links */}
            <div style={{ marginBottom: 14 }}>
              {editingSocials ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: C.bg, border: `1.5px solid ${C.rule}`, borderRadius: 8, padding: 12 }}>
                  {([
                    ['website', '🌐', 'Website URL'] as const,
                    ['instagram', '📷', 'Instagram handle'] as const,
                    ['twitter', '𝕏', 'X / Twitter handle'] as const,
                    ['tiktok', '🎵', 'TikTok handle'] as const,
                  ]).map(([key, icon, placeholder]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                      <input
                        value={profile.socials[key] || ''}
                        onChange={e => saveProfile({ ...profile, socials: { ...profile.socials, [key]: e.target.value } })}
                        placeholder={placeholder}
                        style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: C.text, background: 'transparent', border: 'none', borderBottom: `1px solid ${C.ruleLight}`, outline: 'none', padding: '3px 0' }}
                      />
                    </div>
                  ))}
                  <button onClick={() => setEditingSocials(false)}
                    style={{ alignSelf: 'flex-end', fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.green, background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>Done</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {profile.socials.website && (
                    <a href={profile.socials.website.startsWith('http') ? profile.socials.website : `https://${profile.socials.website}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: MONO, fontSize: 11, color: C.blue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 12 }}>🌐</span>{profile.socials.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                  {profile.socials.instagram && (
                    <a href={`https://instagram.com/${profile.socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: MONO, fontSize: 11, color: C.blue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 12 }}>📷</span>@{profile.socials.instagram.replace('@', '')}
                    </a>
                  )}
                  {profile.socials.twitter && (
                    <a href={`https://x.com/${profile.socials.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: MONO, fontSize: 11, color: C.blue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 12 }}>𝕏</span>@{profile.socials.twitter.replace('@', '')}
                    </a>
                  )}
                  {profile.socials.tiktok && (
                    <a href={`https://tiktok.com/@${profile.socials.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: MONO, fontSize: 11, color: C.blue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 12 }}>🎵</span>@{profile.socials.tiktok.replace('@', '')}
                    </a>
                  )}
                  <button onClick={() => setEditingSocials(true)}
                    style={{ background: 'none', border: `1px dashed ${C.rule}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                    {Object.values(profile.socials).some(Boolean) ? '✎' : '+ links'}
                  </button>
                </div>
              )}
            </div>

            {/* Last Cooked */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: SANS, color: C.text3 }}>Last cooked:</span>
                {lastCooked ? (
                  <Link href={`/recipe/${lastCooked.recipeSlug}`} style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, fontStyle: 'italic', color: C.text, textDecoration: 'none' }}>
                    {lastCooked.recipeTitle}
                  </Link>
                ) : (
                  <span style={{ fontFamily: SANS, fontSize: 12, color: C.text3, fontStyle: 'italic' }}>Nothing yet</span>
                )}
                {lastCooked && <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{formatDate(lastCooked.cookedAt)}</span>}
              </div>
            </div>

          </div>

        </div>

        {/* Stats row — own container below profile card */}
        <div style={{ marginBottom: 16, background: C.cool, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-around', alignItems: 'baseline', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: uniqueDishes > 0 ? C.text : C.text3 }}>{uniqueDishes}</span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: C.text3 }}>Cooked</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text3 }}>0</span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: C.text3 }}>Contributed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: weekStreak > 0 ? C.green : C.text3 }}>{weekStreak}</span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: C.text3 }}>Week Streak</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: savedCount > 0 ? C.text : C.text3 }}>{savedCount}</span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: C.text3 }}>Saved</span>
          </div>
        </div>

        {/* ========== TAB BAR ========== */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.rule}`, marginBottom: 20 }}>
          {([
            { key: 'overview' as const, label: 'Overview' },
            { key: 'list' as const, label: 'Shopping List' },
            { key: 'pantry' as const, label: 'Pantry' },
          ]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent',
              fontFamily: SANS, fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? C.text : C.text3,
              cursor: 'pointer', position: 'relative',
              borderBottom: activeTab === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t.label}
              {t.key === 'list' && totalGroceryCount > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, fontFamily: MONO, color: C.accent, fontWeight: 600 }}>{totalGroceryCount}</span>
              )}
              {t.key === 'pantry' && pantryItems.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, fontFamily: MONO, color: C.text3 }}>{pantryItems.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === 'overview' && (
          <>
            {/* MOST COOKED — right below profile */}
            {mostCooked && (
              <div style={{ marginBottom: 24, padding: '10px 16px', background: C.greenBg, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 12, fontFamily: SANS, color: C.text2 }}>Most cooked:</span>
                <Link href={`/recipe/${mostCooked[1].slug}`} style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.green, textDecoration: 'none' }}>{mostCooked[1].title}</Link>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>x {mostCooked[1].count}</span>
              </div>
            )}

            {/* ========== FAVORITE DISHES — Letterboxd-style 4 picks with images ========== */}
            <section style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 12px' }}>Favorite Dishes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? 8 : 10 }}>
                {[0, 1, 2, 3].map(slotIdx => {
                  const dishId = profile.favoriteDishes[slotIdx]
                  const dish = dishId ? favDishRecipes.find(r => r.id === dishId) : null
                  const isPickingThis = showFavDishPicker === slotIdx
                  const hasImage = dish && dish.image_url
                  return (
                    <div key={slotIdx} style={{ position: 'relative' }}>
                      <div
                        onClick={() => {
                          if (!isPickingThis) {
                            setShowFavDishPicker(slotIdx)
                            setFavDishSearch('')
                            setFavDishResults([])
                            setTimeout(() => favDishInputRef.current?.focus(), 50)
                          }
                        }}
                        style={{
                          aspectRatio: '3/4', borderRadius: 8,
                          background: hasImage ? 'none' : dish ? C.accentBg : C.warm,
                          border: `1.5px ${dish ? 'solid' : 'dashed'} ${dish ? (hasImage ? 'transparent' : C.accentMed) : C.ruleLight}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: hasImage ? 'flex-end' : 'center',
                          padding: 0, cursor: 'pointer', textAlign: 'center',
                          transition: 'border-color 0.15s ease, background 0.15s ease',
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {dish ? (
                          hasImage ? (
                            <>
                              {/* Full background image */}
                              <img
                                src={dish.image_url!}
                                alt={dish.title}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              {/* Dark gradient scrim at bottom */}
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                              }} />
                              {/* Title overlaid on scrim */}
                              <span style={{
                                position: 'relative', zIndex: 1,
                                fontFamily: SERIF, fontSize: isMobile ? 10 : 13, fontWeight: 600,
                                color: '#fff', lineHeight: 1.25, padding: isMobile ? '6px 6px 8px' : '8px 10px 10px',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                wordBreak: 'break-word' as const,
                              }}>
                                {dish.title}
                              </span>
                              {/* Remove button */}
                              <button
                                onClick={(ev) => {
                                  ev.stopPropagation()
                                  const newFavs = [...profile.favoriteDishes]
                                  newFavs.splice(slotIdx, 1)
                                  saveProfile({ ...profile, favoriteDishes: newFavs })
                                  setFavDishRecipes(prev => prev.filter(r => r.id !== dishId))
                                }}
                                style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10, fontFamily: MONO, padding: '2px 5px', borderRadius: 3, zIndex: 2 }}
                              >✕</button>
                            </>
                          ) : (
                            <>
                              {/* No image — styled background with title */}
                              <span style={{
                                fontFamily: SERIF, fontSize: isMobile ? 10 : 13, fontWeight: 600, color: C.text, lineHeight: 1.3,
                                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                                padding: isMobile ? 8 : 12,
                                wordBreak: 'break-word' as const,
                              }}>
                                {dish.title}
                              </span>
                              <button
                                onClick={(ev) => {
                                  ev.stopPropagation()
                                  const newFavs = [...profile.favoriteDishes]
                                  newFavs.splice(slotIdx, 1)
                                  saveProfile({ ...profile, favoriteDishes: newFavs })
                                  setFavDishRecipes(prev => prev.filter(r => r.id !== dishId))
                                }}
                                style={{ position: 'absolute', bottom: 5, right: 5, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 10, fontFamily: MONO, opacity: 0.5, padding: '2px 4px' }}
                              >✕</button>
                            </>
                          )
                        ) : (
                          <div style={{ padding: isMobile ? 8 : 12 }}>
                            <span style={{ fontSize: 20, marginBottom: 4, opacity: 0.3, display: 'block' }}>+</span>
                            <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: SANS, color: C.text3 }}>Add dish</span>
                          </div>
                        )}
                      </div>

                      {/* Picker dropdown */}
                      {isPickingThis && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                          marginTop: 4, background: C.bg, border: `1.5px solid ${C.rule}`, borderRadius: 8,
                          padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                          minWidth: isMobile ? 180 : 200,
                        }}>
                          <input ref={favDishInputRef} value={favDishSearch} onChange={e => setFavDishSearch(e.target.value)}
                            placeholder="Search recipes..." autoFocus
                            style={{ width: '100%', fontFamily: SANS, fontSize: 12, color: C.text, background: 'transparent', border: 'none', outline: 'none', padding: '4px 0', borderBottom: `1px solid ${C.ruleLight}`, marginBottom: 4 }} />
                          {favDishResults.filter(r => !profile.favoriteDishes.includes(r.id)).map(r => (
                            <div key={r.id} onClick={() => {
                              const newFavs = [...profile.favoriteDishes]
                              if (newFavs.length <= slotIdx) {
                                while (newFavs.length < slotIdx) newFavs.push('')
                                newFavs.push(r.id)
                              } else {
                                newFavs[slotIdx] = r.id
                              }
                              const cleaned = newFavs.filter(Boolean).slice(0, 4)
                              saveProfile({ ...profile, favoriteDishes: cleaned })
                              setFavDishRecipes(prev => [...prev.filter(p => p.id !== r.id), r])
                              setShowFavDishPicker(null)
                              setFavDishSearch('')
                            }}
                              style={{ padding: '6px 4px', cursor: 'pointer', fontFamily: SERIF, fontSize: 12, color: C.text, borderBottom: `1px solid ${C.ruleLight}` }}>
                              {r.title}
                            </div>
                          ))}
                          {favDishSearch.length >= 2 && favDishResults.filter(r => !profile.favoriteDishes.includes(r.id)).length === 0 && (
                            <p style={{ fontSize: 11, color: C.text3, margin: '8px 0 4px', fontFamily: SANS }}>No matches</p>
                          )}
                          <button onClick={() => { setShowFavDishPicker(null); setFavDishSearch('') }}
                            style={{ fontSize: 11, fontFamily: SANS, color: C.text3, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ========== RECENT ACTIVITY — compact bars ========== */}
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Recent Activity</h3>

              {activityFeed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: C.warm, borderRadius: 10, border: `1px solid ${C.ruleLight}` }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.7 }}>👨‍🍳</div>
                  <h4 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>No activity yet</h4>
                  <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                    Cook a recipe, leave a note, or save something — it&apos;ll all show up here.
                  </p>
                  <button onClick={() => router.push('/')} style={{ padding: '10px 24px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>Find something to cook</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activityFeed.slice(0, activityExpanded ? 50 : 5).map((item, i) => {
                    const e = item.event
                    const ratingEmoji = e.rating ? (RATING_EMOJI[e.rating] || '') : ''
                    return (
                      <div key={`${e.recipeId}-${e.cookedAt}`} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 6,
                        background: C.warm, border: `1px solid ${C.ruleLight}`,
                        animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                      }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, flexShrink: 0, minWidth: 42 }}>{formatDate(e.cookedAt)}</span>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>👨‍🍳</span>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: SANS, fontSize: 12, color: C.text3 }}>Cooked</span>
                          <Link href={`/recipe/${e.recipeSlug}`} style={{
                            fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {e.recipeTitle}
                          </Link>
                          {ratingEmoji && <span style={{ fontSize: 13, flexShrink: 0 }}>{ratingEmoji}</span>}
                          {e.tip && (
                            <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 120 : 200 }}>
                              &ldquo;{e.tip}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {!activityExpanded && activityFeed.length > 5 && (
                    <button onClick={() => setActivityExpanded(true)} style={{
                      padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: SANS, fontSize: 12, fontWeight: 500, color: C.accent, textAlign: 'center',
                    }}>
                      Show {activityFeed.length - 5} more →
                    </button>
                  )}
                  {activityExpanded && activityFeed.length > 5 && (
                    <button onClick={() => setActivityExpanded(false)} style={{
                      padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: SANS, fontSize: 12, fontWeight: 500, color: C.text3, textAlign: 'center',
                    }}>
                      Show less
                    </button>
                  )}
                </div>
              )}
            </section>

            <div style={{ height: 1, background: C.rule, marginBottom: 28 }} />

            {/* ========== SAVED RECIPES — horizontal scroll ========== */}
            <section style={{ marginBottom: 36, paddingBottom: 20 }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Saved Recipes</h3>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 18, height: 18, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <span style={{ fontSize: 13, color: C.text3 }}>Loading recipes</span>
                </div>
              ) : savedRecipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.rule} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>No saved recipes yet</h3>
                  <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                    Browse the index and tap &ldquo;Save&rdquo; on recipes you want to cook later.
                  </p>
                  <button onClick={() => router.push('/')} style={{ padding: '12px 28px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>Browse recipes</button>
                </div>
              ) : (
                <div className="hide-scrollbar" style={{
                  display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
                  scrollSnapType: 'x mandatory',
                }}>
                  {savedRecipes.map((r, i) => (
                    <Link key={r.id} href={`/recipe/${r.slug}`} style={{
                      textDecoration: 'none', flexShrink: 0,
                      width: isMobile ? 200 : 220, padding: '14px 16px', borderRadius: 10,
                      background: C.warm, border: `1px solid ${C.ruleLight}`,
                      display: 'flex', flexDirection: 'column', gap: 6,
                      scrollSnapAlign: 'start',
                      animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                    }}>
                      <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {r.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>
                          {r.cuisine && `${r.cuisine}`}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {/* Browse more card */}
                  <div onClick={() => router.push('/')} style={{
                    flexShrink: 0, width: isMobile ? 140 : 160, padding: '14px 16px', borderRadius: 10,
                    background: C.cool, border: `1.5px dashed ${C.ruleLight}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    scrollSnapAlign: 'start', cursor: 'pointer',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3, textAlign: 'center' }}>Browse more</span>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* ========== SHOPPING LIST TAB ========== */}
        {activeTab === 'list' && (
          <div style={{ maxWidth: 480, paddingTop: 8, paddingBottom: 40, animation: 'fadeIn 0.25s ease' }}>
            <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 16px' }}>
              {totalGroceryCount === 0 ? 'No items yet' : `${needItems.length} to get${gotItems.length > 0 ? ` · ${gotItems.length} purchased` : ''} · ${groceryRecipeCount} recipe${groceryRecipeCount !== 1 ? 's' : ''}`}
            </p>

            {totalGroceryCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
                  Your shopping list is empty
                </h3>
                <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  Browse recipes and tap &ldquo;Grocery list&rdquo; to start building your list.
                </p>
                <button onClick={() => router.push('/')} style={{
                  padding: '12px 28px', borderRadius: 6, border: 'none',
                  background: C.text, color: C.bg,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                }}>Browse recipes</button>
              </div>
            ) : (
              <>
                {Object.entries(needByRecipe).map(([recipeId, { items, indices }]) => {
                  const isExpanded = expandedRecipe === recipeId
                  const checkedCount = items.filter(i => i.checked).length
                  const allDone = checkedCount === items.length

                  return (
                    <div key={recipeId} style={{ marginBottom: 20 }}>
                      {/* Recipe header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 11, fontFamily: SERIF, fontWeight: 700,
                            color: allDone ? C.text3 : C.text, textDecoration: 'underline', textDecorationColor: C.rule,
                            textUnderlineOffset: 3, transition: 'color 0.15s',
                          }}>
                            {items[0]?.recipeTitle || 'Recipe'}
                          </span>
                          {checkedCount > 0 && (
                            <span style={{ fontSize: 9, fontFamily: MONO, color: allDone ? C.green : C.text3 }}>
                              {checkedCount}/{items.length}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => setExpandedRecipe(isExpanded ? null : recipeId)} style={{
                            padding: '2px 8px', borderRadius: 4, border: 'none',
                            background: isExpanded ? C.warm : 'transparent', fontSize: 10, color: C.accent,
                            cursor: 'pointer', fontFamily: MONO, fontWeight: 500,
                          }}>{isExpanded ? 'close' : 'view'}</button>
                          <button onClick={() => removeRecipeItems(recipeId)} style={{
                            padding: '2px 8px', borderRadius: 4, border: 'none',
                            background: 'transparent', fontSize: 10, color: C.text3,
                            cursor: 'pointer', fontFamily: MONO,
                          }}>remove</button>
                        </div>
                      </div>

                      {/* Expanded view */}
                      {isExpanded && (
                        <div style={{ padding: '8px 14px 10px', marginBottom: 4, borderRadius: 8, background: C.warm, border: `1px solid ${C.ruleLight}`, animation: 'slideDown 0.2s ease' }}>
                          <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 6px', fontFamily: SANS }}>All ingredients</p>
                          {items.map((item, i) => (
                            <p key={i} style={{ fontSize: 12, color: item.checked ? C.text3 : C.text, margin: '3px 0', fontFamily: SANS, lineHeight: 1.4, fontStyle: item.checked ? 'italic' : 'normal', textDecoration: item.checked ? 'line-through' : 'none' }}>
                              {item.name}
                              {item.amount && <span style={{ color: C.text3 }}> / {item.amount}{item.unit ? ` ${item.unit}` : ''}</span>}
                              {item.notes && <span style={{ color: C.text3 }}> ({item.notes})</span>}
                            </p>
                          ))}
                          {items[0]?.recipeSlug && (
                            <button onClick={() => router.push(`/recipe/${items[0].recipeSlug}`)} style={{
                              marginTop: 8, padding: '4px 0', border: 'none',
                              background: 'transparent', fontSize: 10, color: C.accent,
                              cursor: 'pointer', fontFamily: MONO, fontWeight: 500,
                            }}>open recipe ↗</button>
                          )}
                        </div>
                      )}

                      {/* Clickable items */}
                      {items.map((item, i) => {
                        const inPantry = isInPantry(item.name)
                        return (
                          <div key={`${recipeId}-${i}`} onClick={() => toggleItem(indices[i])} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 0',
                            borderBottom: `1px solid ${C.ruleLight}`,
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}>
                            <span style={{
                              fontSize: 13, fontFamily: SANS, flex: 1,
                              color: item.checked ? C.rule : C.text,
                              textDecoration: item.checked ? 'line-through' : 'none',
                              transition: 'all 0.15s',
                            }}>
                              {item.name}
                              {item.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {item.amount}{item.unit ? ` ${item.unit}` : ''}</span>}
                              {item.notes && <span style={{ color: C.text3, fontSize: 11 }}> ({item.notes})</span>}
                            </span>
                            {!item.checked && inPantry && (
                              <span style={{
                                fontSize: 8, fontWeight: 600, fontFamily: MONO,
                                color: C.green, background: C.greenBg,
                                padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap',
                              }}>HAVE</span>
                            )}
                            <div style={{
                              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                              border: `1.5px solid ${item.checked ? C.green : C.rule}`,
                              background: item.checked ? C.green : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}>
                              {item.checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>✓</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Action bar */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                  <button onClick={copyList} style={{
                    flex: 1, padding: '10px 16px', borderRadius: 6,
                    border: `1.5px solid ${C.rule}`, background: 'transparent',
                    color: listCopied ? C.green : C.text2, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: SANS, transition: 'all 0.15s',
                  }}>{listCopied ? '✓ Copied' : 'Copy to clipboard'}</button>
                  <button onClick={clearAllGrocery} style={{
                    padding: '10px 16px', borderRadius: 6,
                    border: `1.5px solid ${C.ruleLight}`, background: 'transparent',
                    color: C.text3, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                  }}>Clear all</button>
                </div>

                {gotItems.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={clearGot} style={{
                      padding: '6px 12px', borderRadius: 4, border: `1px solid ${C.ruleLight}`,
                      background: 'transparent', fontSize: 10, color: C.text3,
                      cursor: 'pointer', fontFamily: MONO,
                    }}>clear {gotItems.length} purchased</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========== PANTRY TAB ========== */}
        {activeTab === 'pantry' && (
          <div style={{ maxWidth: 480, paddingTop: 8, paddingBottom: 40, animation: 'fadeIn 0.25s ease' }}>
            <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 16px' }}>
              {pantryItems.length} item{pantryItems.length !== 1 ? 's' : ''} tracked
            </p>

            {/* Search + Add */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
                <input
                  value={pantrySearch}
                  onChange={e => setPantrySearch(e.target.value)}
                  placeholder="Search pantry..."
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                    border: `1.5px solid ${C.rule}`, background: C.warm,
                    fontSize: 13, color: C.text, fontFamily: SANS,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.rule }}
                />
              </div>
              <button onClick={() => setAddingItem(!addingItem)} style={{
                padding: '10px 16px', borderRadius: 8, border: 'none',
                background: addingItem ? C.ruleLight : C.text, color: addingItem ? C.text3 : C.bg,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
                {addingItem ? 'Cancel' : '+ Add item'}
              </button>
            </div>

            {/* Add item form */}
            {addingItem && (
              <div style={{
                padding: 16, marginBottom: 20, borderRadius: 10,
                background: C.warm, border: `1px solid ${C.ruleLight}`,
                animation: 'slideDown 0.2s ease',
              }}>
                <input
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Item name (e.g. Greek yogurt)"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') addPantryItem() }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 6,
                    border: `1.5px solid ${C.rule}`, background: C.bg,
                    fontSize: 14, color: C.text, fontFamily: SANS,
                    outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                  }}
                />
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Category</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.key} onClick={() => setNewItemCategory(cat.key)} style={{
                        padding: '5px 10px', borderRadius: 6, border: 'none',
                        background: newItemCategory === cat.key ? C.text : C.bg,
                        color: newItemCategory === cat.key ? C.bg : C.text3,
                        fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                        transition: 'all 0.1s',
                      }}>
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={addPantryItem} disabled={!newItemName.trim()} style={{
                  width: '100%', padding: '11px', borderRadius: 6, border: 'none',
                  background: newItemName.trim() ? C.green : C.ruleLight,
                  color: newItemName.trim() ? '#fff' : C.text3,
                  fontSize: 13, fontWeight: 600, cursor: newItemName.trim() ? 'pointer' : 'default',
                  fontFamily: SANS, transition: 'all 0.15s',
                }}>Add to pantry</button>
              </div>
            )}

            {/* Category filter */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, marginBottom: 4 }}>
              <button onClick={() => setActiveCategory('all')} style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', whiteSpace: 'nowrap',
                background: activeCategory === 'all' ? C.text : 'transparent',
                color: activeCategory === 'all' ? C.bg : C.text3,
                fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
              }}>All ({pantryItems.length})</button>
              {CATEGORIES.map(cat => {
                const count = pantryItems.filter(i => i.category === cat.key).length
                if (count === 0) return null
                return (
                  <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', whiteSpace: 'nowrap',
                    background: activeCategory === cat.key ? C.text : 'transparent',
                    color: activeCategory === cat.key ? C.bg : C.text3,
                    fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {cat.icon} {cat.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Pantry items */}
            {pantryItems.length === 0 && !addingItem ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
                  Your pantry is empty
                </h3>
                <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
                  Add items you already have at home. When you build a shopping list, items already in your pantry will be marked so you don&apos;t double-buy.
                </p>
                <button onClick={() => setAddingItem(true)} style={{
                  padding: '12px 28px', borderRadius: 6, border: 'none',
                  background: C.text, color: C.bg,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                }}>+ Add your first item</button>
              </div>
            ) : (
              <>
                {filteredPantry.length === 0 && (pantrySearch || activeCategory !== 'all') ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                    <p style={{ fontSize: 14, color: C.text3 }}>No items match{pantrySearch ? ` "${pantrySearch}"` : ''}</p>
                  </div>
                ) : (
                  Object.entries(pantryByCategory).map(([catKey, items]) => {
                    const cat = CATEGORIES.find(c => c.key === catKey) || CATEGORIES[CATEGORIES.length - 1]
                    return (
                      <div key={catKey} style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 14 }}>{cat.icon}</span>
                          <h4 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>{cat.label}</h4>
                          <span style={{ fontSize: 11, color: C.text3, fontFamily: MONO }}>({items.length})</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
                          {items.map(item => (
                            <div key={item.id} style={{
                              background: C.warm, borderRadius: 8,
                              padding: '10px 12px',
                              border: `1px solid ${C.ruleLight}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                            }}>
                              <span style={{ fontSize: 13, color: C.text, fontWeight: 500, fontFamily: SANS }}>{item.name}</span>
                              <button onClick={() => removePantryItem(item.id)} style={{
                                background: 'none', border: 'none', fontSize: 14, color: C.text3,
                                cursor: 'pointer', padding: '0 2px', lineHeight: 1, opacity: 0.5, flexShrink: 0,
                              }}>x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}

                {pantryItems.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 16, borderTop: `1px solid ${C.ruleLight}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.text3, fontFamily: MONO }}>
                        {pantryItems.length} item{pantryItems.length !== 1 ? 's' : ''} · {new Set(pantryItems.map(i => i.category)).size} categor{new Set(pantryItems.map(i => i.category)).size !== 1 ? 'ies' : 'y'}
                      </span>
                      <button onClick={() => { savePantry([]); setActiveCategory('all') }} style={{
                        padding: '6px 12px', borderRadius: 6,
                        border: `1px solid ${C.ruleLight}`, background: 'transparent',
                        fontSize: 11, fontWeight: 500, color: C.text3, cursor: 'pointer', fontFamily: SANS,
                      }}>Clear all</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index<EggDot size={6} /></p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>A collection of kitchen tools and recipes to help you become your best cook.</p>
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
    </div>
  )
}
