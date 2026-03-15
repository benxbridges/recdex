'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

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

type RecipeMin = { id: string; slug: string; title: string }

const RATING_EMOJI: Record<string, string> = { amazing: '🤩', good: '😊', ok: '😐', tricky: '😅' }

// ===== HELPERS =====
function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

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


// ===== EGG POINT SYSTEM =====
const EGG_TIERS = [
  { name: 'Home Cook', min: 0, color: C.text3 },
  { name: 'Line Cook', min: 25, color: C.gold },
  { name: 'Sous Chef', min: 100, color: C.green },
  { name: 'Chef', min: 500, color: C.blue },
  { name: 'Executive Chef', min: 2000, color: C.accent },
]

function getEggTier(eggs: number) {
  let tier = EGG_TIERS[0]
  for (const t of EGG_TIERS) {
    if (eggs >= t.min) tier = t
  }
  return tier
}

function EggBadge({ eggs, size = 12 }: { eggs: number; size?: number }) {
  const tier = getEggTier(eggs)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 6px 1px 3px', borderRadius: 8,
      background: `${tier.color}15`,
    }}>
      <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 12 16" fill="none">
        <path d="M6 0.5C4.2 0.5 1 4.5 1 9.5C1 12.5 3.2 15 6 15C8.8 15 11 12.5 11 9.5C11 4.5 7.8 0.5 6 0.5Z"
          fill={tier.color} />
        <ellipse cx="4.5" cy="8.5" rx="1.5" ry="2" fill="white" opacity="0.25" />
      </svg>
      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: tier.color, lineHeight: 1 }}>
        {eggs}
      </span>
    </span>
  )
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
  const [eggExpanded, setEggExpanded] = useState(false)
  const [editingSocials, setEditingSocials] = useState(false)
  const [favDishRecipes, setFavDishRecipes] = useState<RecipeMin[]>([])
  const [showFavDishPicker, setShowFavDishPicker] = useState<number | null>(null) // which slot index is being picked
  const [favDishSearch, setFavDishSearch] = useState('')
  const [favDishResults, setFavDishResults] = useState<RecipeMin[]>([])
  const favDishInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const bioInputRef = useRef<HTMLTextAreaElement>(null)

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
    if (!prof.favoriteDishes) prof.favoriteDishes = [] // migration guard
    if (!prof.socials) prof.socials = {} // migration guard
    setProfile(prof)
    setNameInput(prof.displayName)
    setBioInput(prof.bio || '')

    // Load favorite dish recipes
    if (prof.favoriteDishes && prof.favoriteDishes.length > 0) {
      supabase.from('recipes').select('id, slug, title').in('id', prof.favoriteDishes)
        .then(({ data }) => { if (data) setFavDishRecipes(data) })
    }

    if (ids.length > 0) {
      supabase.from('recipes').select('id, slug, title, description, cuisine, difficulty, time_total, time_active, image_url, servings')
        .in('id', ids).eq('status', 'published')
        .then(({ data }) => { if (data) setSavedRecipes(data); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [])

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated)
    localStorage.setItem('recdex-profile', JSON.stringify(updated))
  }

  // Favorite dish picker search
  useEffect(() => {
    if (showFavDishPicker === null || favDishSearch.length < 2) { setFavDishResults([]); return }
    const timer = setTimeout(() => {
      supabase.from('recipes').select('id, slug, title').eq('status', 'published')
        .ilike('title', `%${favDishSearch}%`).limit(8)
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

  // Derived stats
  const totalCooks = cookEvents.length
  const uniqueDishes = new Set(cookEvents.map(e => e.recipeId)).size
  const lastCooked = cookEvents.length > 0 ? cookEvents.reduce((a, b) => a.cookedAt > b.cookedAt ? a : b) : null

  // Week streak: consecutive weeks with at least one cook (counting back from current week)
  const weekStreak = (() => {
    if (cookEvents.length === 0) return 0
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
    const now = new Date()
    const dow = now.getDay() || 7 // Mon=1..Sun=7
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

  // Cook counts per recipe (for Dishes section)
  const cookCounts: Record<string, { count: number; title: string; slug: string; lastRating?: string; lastCooked: number }> = {}
  cookEvents.forEach(e => {
    if (!cookCounts[e.recipeId]) cookCounts[e.recipeId] = { count: 0, title: e.recipeTitle, slug: e.recipeSlug, lastCooked: e.cookedAt }
    cookCounts[e.recipeId].count++
    if (e.rating) cookCounts[e.recipeId].lastRating = e.rating
    if (e.cookedAt > cookCounts[e.recipeId].lastCooked) cookCounts[e.recipeId].lastCooked = e.cookedAt
  })
  const dishesList = Object.entries(cookCounts).sort((a, b) => b[1].count - a[1].count)
  const mostCooked = dishesList[0] || null

  // Egg point calculation
  const eggData = (() => {
    const breakdown = [
      { label: 'Recipes cooked', count: cookEvents.length, per: 1 },
      // Future: { label: 'Recipes contributed', count: 0, per: 100 },
      // Future: { label: 'Your recipes cooked by others', count: 0, per: 5 },
      // Future: { label: 'Your recipes saved by others', count: 0, per: 2 },
      // Future: { label: 'Likes on your comments', count: 0, per: 1 },
    ]
    const total = breakdown.reduce((sum, b) => sum + b.count * b.per, 0)
    return { total, breakdown }
  })()
  const eggTier = getEggTier(eggData.total)
  const nextEggTier = EGG_TIERS.find(t => t.min > eggData.total) || null
  const eggProgress = nextEggTier
    ? ((eggData.total - eggTier.min) / (nextEggTier.min - eggTier.min)) * 100
    : 100

  // Activity feed
  type ActivityItem = { type: 'cooked'; event: CookEvent }
  const activityFeed: ActivityItem[] = cookEvents.map(e => ({ type: 'cooked' as const, event: e }))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>An open recipe commons</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontFamily: SANS }}>
              <span onClick={() => router.push('/')} style={{ color: C.text2, cursor: 'pointer' }}>← Home</span>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <Link href="/community" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Community</Link>
              <Link href="/lists" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Lists</Link>
              <Link href="/pantry" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>🛒</span><span style={{ fontSize: 11, fontWeight: 500 }}>Kitchen</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* ========== UNIFIED PROFILE CARD ========== */}
        <div style={{ marginTop: 24, marginBottom: 16, background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 12, overflow: 'hidden' }}>

          {/* Top section: avatar + name + bio + fav + dislikes */}
          <div style={{ padding: isMobile ? '18px 16px 16px' : '22px 28px 18px' }}>

            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
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
                    {profile.displayName && <EggBadge eggs={eggData.total} />}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 14, paddingLeft: 62 }}>
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
            <div style={{ paddingLeft: 62, marginBottom: 14 }}>
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
            <div style={{ paddingLeft: 62, marginBottom: 14 }}>
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

            {/* Stats grid */}
            <div style={{ paddingLeft: 62, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: uniqueDishes > 0 ? C.text : C.text3 }}>{uniqueDishes}</span>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>Dishes Cooked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.text3 }}>0</span>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>Contributed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: weekStreak > 0 ? C.green : C.text3 }}>{weekStreak}</span>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>Week Streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.text3 }}>0 / 0</span>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>Following</span>
              </div>
            </div>

            {/* Egg rank — collapsed by default, subtle opt-in */}
            {profile.displayName && (
              <div style={{ paddingLeft: 62, marginTop: 12 }}>
                <div
                  onClick={() => setEggExpanded(!eggExpanded)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = eggExpanded ? '1' : '0.6')}
                >
                  <svg width={10} height={13} viewBox="0 0 12 16" fill="none">
                    <path d="M6 0.5C4.2 0.5 1 4.5 1 9.5C1 12.5 3.2 15 6 15C8.8 15 11 12.5 11 9.5C11 4.5 7.8 0.5 6 0.5Z" fill={eggTier.color} />
                  </svg>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                    {eggData.total} egg{eggData.total !== 1 ? 's' : ''} · {eggTier.name}
                  </span>
                  <span style={{ fontSize: 8, color: C.text3 }}>{eggExpanded ? '▲' : '▼'}</span>
                </div>
                {eggExpanded && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.ruleLight}`, animation: 'fadeIn 0.2s ease' }}>
                    {nextEggTier && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1, height: 3, background: C.ruleLight, borderRadius: 2, overflow: 'hidden', maxWidth: 140 }}>
                          <div style={{ height: '100%', background: eggTier.color, borderRadius: 2, width: `${Math.min(eggProgress, 100)}%`, transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3 }}>
                          {nextEggTier.min - eggData.total} to {nextEggTier.name}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {eggData.breakdown.filter(b => b.count > 0).map(b => (
                        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: eggTier.color, fontWeight: 600, minWidth: 28 }}>+{b.count * b.per}</span>
                          <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>{b.label}</span>
                        </div>
                      ))}
                      {eggData.total === 0 && (
                        <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3, fontStyle: 'italic' }}>Cook a recipe to earn your first egg!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* MOST COOKED — right below profile */}
        {mostCooked && (
          <div style={{ marginBottom: 24, padding: '10px 16px', background: C.greenBg, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 12, fontFamily: SANS, color: C.text2 }}>Most cooked:</span>
            <Link href={`/recipe/${mostCooked[1].slug}`} style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.green, textDecoration: 'none' }}>{mostCooked[1].title}</Link>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>× {mostCooked[1].count}</span>
          </div>
        )}

        {/* ========== FAVORITE DISHES — Letterboxd-style 4 picks ========== */}
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 12px' }}>Favorite Dishes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? 8 : 10 }}>
            {[0, 1, 2, 3].map(slotIdx => {
              const dishId = profile.favoriteDishes[slotIdx]
              const dish = dishId ? favDishRecipes.find(r => r.id === dishId) : null
              const isPickingThis = showFavDishPicker === slotIdx
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
                      background: dish ? C.accentBg : C.warm,
                      border: `1.5px ${dish ? 'solid' : 'dashed'} ${dish ? C.accentMed : C.ruleLight}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: isMobile ? 8 : 12, cursor: 'pointer', textAlign: 'center',
                      transition: 'border-color 0.15s ease, background 0.15s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {dish ? (
                      <>
                        <span style={{ fontFamily: SERIF, fontSize: isMobile ? 12 : 14, fontWeight: 600, color: C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                          {dish.title}
                        </span>
                        <span style={{ position: 'absolute', top: 5, right: 5, fontSize: 16, lineHeight: 1 }}>
                          ❤️
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
                    ) : (
                      <>
                        <span style={{ fontSize: 20, marginBottom: 4, opacity: 0.3 }}>+</span>
                        <span style={{ fontSize: isMobile ? 9 : 10, fontFamily: SANS, color: C.text3 }}>Add dish</span>
                      </>
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
                            // Fill gaps
                            while (newFavs.length < slotIdx) newFavs.push('')
                            newFavs.push(r.id)
                          } else {
                            newFavs[slotIdx] = r.id
                          }
                          // Remove empty strings and limit to 4
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
          <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Recent Activity</h3>

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

        {/* ========== @USERNAME'S DISHES — the flex ========== */}
        {dishesList.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 12px' }}>
              {profile.displayName ? `@${profile.displayName}'s` : 'Your'} Dishes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
              {dishesList.map(([id, dish], i) => (
                <Link key={id} href={`/recipe/${dish.slug}`} style={{
                  textDecoration: 'none', padding: '12px 14px', borderRadius: 8,
                  background: C.warm, border: `1px solid ${C.ruleLight}`,
                  display: 'flex', flexDirection: 'column', gap: 6,
                  animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                }}>
                  <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {dish.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 10, color: C.green, fontWeight: 600,
                      background: C.greenBg, padding: '1px 6px', borderRadius: 3,
                    }}>
                      {dish.count} cook{dish.count !== 1 ? 's' : ''}
                    </span>
                    {dish.lastRating && <span style={{ fontSize: 12 }}>{RATING_EMOJI[dish.lastRating] || ''}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}


        {/* ========== SAVED RECIPES — horizontal scroll ========== */}
        <section style={{ marginBottom: 36, paddingBottom: 20 }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Saved Recipes</h3>

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
                      {r.cuisine && `${r.cuisine} · `}{formatTime(r.time_total)}
                    </span>
                  </div>
                  <DifficultyBadge difficulty={r.difficulty} />
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
    </div>
  )
}
