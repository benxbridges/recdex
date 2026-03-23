'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'
import OnboardingFlow, { type OnboardingProfile } from '@/app/components/OnboardingFlow'

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
  submitted_by?: string | null; source?: string | null
}

type Category = { id: string; name: string; recipe_count: number }

type CommunitySubmission = {
  id: string; url: string
  platform: 'tiktok' | 'youtube' | 'instagram' | 'other'
  title: string; author_name: string | null; author_url: string | null
  thumbnail_url: string | null
  display_name: string; submitter_note: string | null
  upvote_count: number; related_recipe_slug: string | null
  status: string; created_at: string
}

type OEmbedResult = {
  title?: string; author_name?: string; author_url?: string
  thumbnail_url?: string; thumbnail_width?: number; thumbnail_height?: number
  html?: string
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

function detectPlatform(url: string): 'tiktok' | 'youtube' | 'instagram' | 'other' {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('tiktok.com')) return 'tiktok'
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube'
    if (hostname.includes('instagram.com')) return 'instagram'
  } catch { /* invalid URL */ }
  return 'other'
}

async function fetchOembed(url: string): Promise<OEmbedResult | null> {
  const platform = detectPlatform(url)
  if (platform === 'tiktok' || platform === 'youtube') {
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`)
      if (res.ok) return await res.json()
    } catch { /* ignore */ }
  }
  return null
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function getDisplayName(): string {
  try { return JSON.parse(localStorage.getItem('recdex-profile') || '{}').displayName || '' }
  catch { return '' }
}

// ===== COMMENT DRAWER =====
type ItemComment = {
  id: string; item_type: string; item_id: string; item_title: string | null
  display_name: string; body: string; created_at: string
}

function CommentDrawer({ itemType, itemId, itemTitle, onClose }: { itemType: string; itemId: string; itemTitle: string; onClose: () => void }) {
  const [comments, setComments] = useState<ItemComment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [visible, setVisible] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 250)
  }, [onClose])

  useEffect(() => {
    setLoading(true)
    if (itemType === 'recipe') {
      // Use existing comments table for recipes
      supabase.from('comments').select('id, recipe_id, display_name, body, created_at')
        .eq('recipe_id', itemId).order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setComments(data.map(c => ({ ...c, item_type: 'recipe', item_id: c.recipe_id, item_title: null })))
          setLoading(false)
        })
    } else {
      fetch(`/api/comments?item_type=${encodeURIComponent(itemType)}&item_id=${encodeURIComponent(itemId)}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setComments(data) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [itemType, itemId])

  const postComment = async () => {
    const displayName = getDisplayName()
    if (!displayName || !body.trim()) return
    setPosting(true)
    try {
      if (itemType === 'recipe') {
        // Post to existing comments table for recipes
        const { data } = await supabase.from('comments').insert({
          recipe_id: itemId, display_name: displayName, body: body.trim(),
        }).select().single()
        if (data) {
          setComments(prev => [{ ...data, item_type: 'recipe', item_id: data.recipe_id, item_title: null }, ...prev])
          setBody('')
        }
      } else {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: itemType, item_id: itemId, item_title: itemTitle, display_name: displayName, body: body.trim() }),
        })
        const data = await res.json()
        if (data?.id) { setComments(prev => [data, ...prev]); setBody('') }
      }
    } catch { /* ignore */ }
    setPosting(false)
  }

  const displayName = getDisplayName()

  return (
    <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) handleClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1100, background: visible ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
      transition: 'background 0.25s ease',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
    }}>
      <div style={{
        background: C.warm, borderRadius: '16px 16px 0 0', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        width: '100%', maxWidth: 960,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', border: `1px solid ${C.ruleLight}`, borderBottom: 'none',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s ease',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.rule }} />
        </div>

        {/* Header */}
        <div style={{ padding: '4px 20px 14px', borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemTitle}</h3>
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.text3, padding: '4px 0 4px 12px', flexShrink: 0 }}>✕</button>
        </div>

        {/* Scrollable comments */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS, textAlign: 'center', padding: '20px 0' }}>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>No comments yet. Be the first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.ruleLight}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: SANS, flexShrink: 0 }}>{c.display_name.charAt(0).toUpperCase()}</div>
                  <span style={{ fontSize: 11, fontFamily: MONO, color: C.accent, fontWeight: 500 }}>@{c.display_name}</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, fontFamily: SANS, color: C.text, lineHeight: 1.5, margin: 0, paddingLeft: 32 }}>{c.body}</p>
              </div>
            ))
          )}
        </div>

        {/* Post input */}
        <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${C.ruleLight}`, background: C.cool, borderRadius: '0 0 0 0' }}>
          {displayName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: SANS, flexShrink: 0 }}>{displayName.charAt(0).toUpperCase()}</div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Add a comment..."
                rows={1}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.ruleLight}`, background: C.bg, fontSize: 13, fontFamily: SANS, color: C.text, resize: 'none', outline: 'none', lineHeight: 1.4, minHeight: 36 }}
                onFocus={e => { e.target.style.borderColor = C.accent }}
                onBlur={e => { e.target.style.borderColor = C.ruleLight }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
              />
              <button onClick={postComment} disabled={posting || !body.trim()} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: body.trim() ? C.accent : C.ruleLight,
                color: body.trim() ? '#fff' : C.text3,
                fontSize: 12, fontWeight: 600, fontFamily: SANS, transition: 'all 0.15s', flexShrink: 0,
              }}>{posting ? '...' : 'Post'}</button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.text2, fontFamily: SANS, textAlign: 'center', padding: '4px 0' }}>
              <Link href="/profile" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>Set up your profile</Link> to comment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
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

const PLATFORM_STYLES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tiktok:    { label: 'TikTok',    color: '#E8F5E9', bg: '#1A231A', icon: '♫' },
  youtube:   { label: 'YouTube',   color: '#FF6B6B', bg: '#2A1C1C', icon: '▶' },
  instagram: { label: 'Instagram', color: '#E07BA8', bg: '#2A1C22', icon: '◎' },
  other:     { label: 'Link',      color: C.blue,    bg: C.blueBg,  icon: '◉' },
}

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORM_STYLES[platform] || PLATFORM_STYLES.other
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      color: p.color, background: p.bg, padding: '2px 7px', borderRadius: 3,
      fontFamily: MONO, display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <span style={{ fontSize: 8 }}>{p.icon}</span> {p.label}
    </span>
  )
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
            <button onClick={addToShoppingList} style={{ width: '100%', padding: '12px 16px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
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
                <Link href={`/recipe/${recipe.slug}`} style={{ display: 'block', fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500, textDecoration: 'none', margin: '8px 0 0', paddingLeft: 38 }}>View full recipe →</Link>
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
          {/* View full recipe */}
          <Link href={`/recipe/${recipe.slug}`} style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>View full recipe →</Link>
        </div>
      </div>

      {/* Grocery list sub-modal */}
      {showGroceryList && <GroceryListModal recipe={recipe} onClose={() => setShowGroceryList(false)} />}
    </div>
  )
}

// ===== COOKBOOK DATA =====
type BookReview = { id: string; book_key: string; display_name: string; body: string; rating: string | null; created_at: string }
type BookShelf = { id: string; book_key: string; client_id: string; display_name: string | null; liked: boolean; owned: boolean; favorite_recipe: string | null; created_at: string }

function getClientId(): string {
  let id = localStorage.getItem('recdex-client-id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('recdex-client-id', id) }
  return id
}

const BOOKS = [
  { key: 'salt-fat-acid-heat', title: 'Salt, Fat, Acid, Heat', author: 'Samin Nosrat', isbn: '9781476753836', color: '#E8C170', accent: '#B8862D', blurb: 'The fundamentals, beautifully taught.', url: 'https://bookshop.org/p/books/salt-fat-acid-heat-mastering-the-elements-of-good-cooking-samin-nosrat/688dffb91cf9000a' },
  { key: 'the-food-lab', title: 'The Food Lab', author: 'J. Kenji López-Alt', isbn: '9780393081084', color: '#4A6741', accent: '#fff', blurb: 'Science-driven home cooking.', url: 'https://bookshop.org/p/books/the-food-lab-better-home-cooking-through-science-j-kenji-lopez-alt/16021521' },
  { key: 'essentials-italian', title: 'Essentials of Classic Italian Cooking', author: 'Marcella Hazan', isbn: '9780394584041', color: '#C84A2A', accent: '#FDE8D0', blurb: 'The Italian kitchen bible.', url: 'https://bookshop.org/p/books/essentials-of-classic-italian-cooking-30th-anniversary-edition-a-cookbook-marcella-hazan/ab8a9f657a0275b1' },
  { key: 'mastering-french', title: 'Mastering the Art of French Cooking', author: 'Julia Child', isbn: '9780375413407', color: '#2C3E6B', accent: '#E0D4B8', blurb: 'Where it all started.', url: 'https://bookshop.org/p/books/mastering-the-art-of-french-cooking-volume-1-a-cookbook-julia-child/b53c1bec7abff872' },
  { key: 'ottolenghi-simple', title: 'Ottolenghi Simple', author: 'Yotam Ottolenghi', isbn: '9781607749165', color: '#F5F0E0', accent: '#1A1A18', blurb: 'Vibrant weeknight cooking.', url: 'https://bookshop.org/p/books/ottolenghi-simple-a-cookbook-yotam-ottolenghi/12838994' },
  { key: 'joy-of-cooking', title: 'Joy of Cooking', author: 'Irma S. Rombauer', isbn: '9781501169717', color: '#8B2323', accent: '#F5E6C8', blurb: 'The one every kitchen needs.', url: 'https://bookshop.org/p/books/joy-of-cooking-2019-edition-fully-revised-and-updated-irma-s-rombauer/951724' },
  { key: 'six-seasons', title: 'Six Seasons', author: 'Joshua McFadden', isbn: '9781579656317', color: '#6B8E5A', accent: '#fff', blurb: 'Vegetables at their peak.', url: 'https://bookshop.org/p/books/six-seasons-a-new-way-with-vegetables-joshua-mcfadden/6e6aa62a4ee2c649' },
  { key: 'mexico-city-kitchen', title: 'My Mexico City Kitchen', author: 'Gabriela Cámara', isbn: '9780399580574', color: '#D4A574', accent: '#3A2518', blurb: 'Sophisticated, accessible Mexican.', url: 'https://bookshop.org/p/books/my-mexico-city-kitchen-recipes-and-convictions-a-cookbook-malena-watrous/11369337' },
]

function BookDetailModal({ book, onClose }: { book: typeof BOOKS[0]; onClose: () => void }) {
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [shelves, setShelves] = useState<BookShelf[]>([])
  const [myShelf, setMyShelf] = useState<BookShelf | null>(null)
  const [reviewBody, setReviewBody] = useState('')
  const [favRecipe, setFavRecipe] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingFav, setSavingFav] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [reviewsRes, shelvesRes] = await Promise.all([
        supabase.from('book_reviews').select('*').eq('book_key', book.key).order('created_at', { ascending: false }),
        supabase.from('book_shelves').select('*').eq('book_key', book.key),
      ])
      if (reviewsRes.data) setReviews(reviewsRes.data)
      if (shelvesRes.data) {
        setShelves(shelvesRes.data)
        const clientId = getClientId()
        const mine = shelvesRes.data.find(s => s.client_id === clientId)
        if (mine) { setMyShelf(mine); setFavRecipe(mine.favorite_recipe || '') }
      }
      setLoading(false)
    }
    fetchData()
  }, [book.key])

  const getDisplayName = () => {
    try { return JSON.parse(localStorage.getItem('recdex-profile') || '{}').displayName || '' } catch { return '' }
  }

  const toggleLike = async () => {
    const clientId = getClientId()
    const displayName = getDisplayName()
    if (myShelf) {
      const newLiked = !myShelf.liked
      await supabase.from('book_shelves').update({ liked: newLiked }).eq('id', myShelf.id)
      const updated = { ...myShelf, liked: newLiked }
      setMyShelf(updated)
      setShelves(prev => prev.map(s => s.id === myShelf.id ? updated : s))
    } else {
      const { data } = await supabase.from('book_shelves').insert({ book_key: book.key, client_id: clientId, display_name: displayName || null, liked: true, owned: false }).select()
      if (data?.[0]) { setMyShelf(data[0]); setShelves(prev => [...prev, data[0]]) }
    }
  }

  const toggleOwned = async () => {
    const clientId = getClientId()
    const displayName = getDisplayName()
    if (myShelf) {
      const newOwned = !myShelf.owned
      await supabase.from('book_shelves').update({ owned: newOwned }).eq('id', myShelf.id)
      const updated = { ...myShelf, owned: newOwned }
      setMyShelf(updated)
      setShelves(prev => prev.map(s => s.id === myShelf.id ? updated : s))
    } else {
      const { data } = await supabase.from('book_shelves').insert({ book_key: book.key, client_id: clientId, display_name: displayName || null, liked: false, owned: true }).select()
      if (data?.[0]) { setMyShelf(data[0]); setShelves(prev => [...prev, data[0]]) }
    }
  }

  const saveFavoriteRecipe = async () => {
    if (!myShelf) return
    setSavingFav(true)
    await supabase.from('book_shelves').update({ favorite_recipe: favRecipe.trim() || null }).eq('id', myShelf.id)
    const updated = { ...myShelf, favorite_recipe: favRecipe.trim() || null }
    setMyShelf(updated)
    setShelves(prev => prev.map(s => s.id === myShelf.id ? updated : s))
    setSavingFav(false)
  }

  const postReview = async () => {
    const displayName = getDisplayName()
    if (!displayName || !reviewBody.trim()) return
    setPosting(true)
    const { data } = await supabase.from('book_reviews').insert({ book_key: book.key, display_name: displayName, body: reviewBody.trim() }).select()
    if (data) setReviews(prev => [data[0], ...prev])
    setReviewBody('')
    setPosting(false)
  }

  const displayName = getDisplayName()
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
  const likeCount = shelves.filter(s => s.liked).length
  const ownCount = shelves.filter(s => s.owned).length
  const isLiked = myShelf?.liked || false
  const isOwned = myShelf?.owned || false
  const owners = shelves.filter(s => s.owned && s.display_name)

  return (
    <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: C.bg, borderRadius: 12, width: '100%', maxWidth: 520,
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header with cover */}
        <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={book.title} style={{ width: 90, height: 135, borderRadius: 4, objectFit: 'cover', boxShadow: '2px 3px 8px rgba(0,0,0,0.15)', background: book.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.25 }}>{book.title}</h3>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{book.author}</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: '0 0 12px', lineHeight: 1.5 }}>{book.blurb}</p>
            <a href={book.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 5, background: C.text, color: C.bg,
              fontSize: 11, fontWeight: 600, fontFamily: SANS, textDecoration: 'none',
            }}>Buy on Bookshop.org ↗</a>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.text3, padding: 4 }}>✕</button>
        </div>

        {/* Letterboxd-style action bar */}
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* Like button */}
          <button onClick={toggleLike} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? '#E25555' : 'none'} stroke={isLiked ? '#E25555' : C.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.2s' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ fontSize: 10, fontFamily: MONO, color: isLiked ? '#E25555' : C.text3, fontWeight: isLiked ? 600 : 400 }}>
              {likeCount > 0 ? `${likeCount} like${likeCount !== 1 ? 's' : ''}` : 'Like'}
            </span>
          </button>

          <div style={{ width: 1, height: 36, background: C.ruleLight }} />

          {/* Own / shelf button */}
          <button onClick={toggleOwned} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={isOwned ? C.green : 'none'} stroke={isOwned ? C.green : C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.2s' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              {isOwned && <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />}
            </svg>
            <span style={{ fontSize: 10, fontFamily: MONO, color: isOwned ? C.green : C.text3, fontWeight: isOwned ? 600 : 400 }}>
              {isOwned ? 'On my shelf' : 'I own this'}
            </span>
          </button>

          <div style={{ width: 1, height: 36, background: C.ruleLight }} />

          {/* Collection count */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0' }}>
            <span style={{ fontSize: 20, fontFamily: MONO, fontWeight: 700, color: ownCount > 0 ? C.text : C.text3, lineHeight: 1 }}>{ownCount}</span>
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>
              {ownCount === 1 ? 'collection' : 'collections'}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Favorite recipe input (shown when owned) */}
          {isOwned && (
            <div style={{ marginBottom: 20, padding: '14px 16px', background: C.greenBg, borderRadius: 8, border: `1px solid ${C.green}20` }}>
              <p style={{ fontSize: 11, fontFamily: MONO, color: C.green, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontWeight: 600 }}>My favorite recipe from this book</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={favRecipe}
                  onChange={e => setFavRecipe(e.target.value)}
                  placeholder="e.g. The roast chicken on page 142"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 5, border: `1.5px solid ${C.ruleLight}`, background: C.warm, fontSize: 13, fontFamily: SANS, color: C.text, outline: 'none' }}
                  onKeyDown={e => { if (e.key === 'Enter') saveFavoriteRecipe() }}
                />
                <button onClick={saveFavoriteRecipe} disabled={savingFav} style={{
                  padding: '8px 14px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: C.green, color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: SANS,
                  opacity: savingFav ? 0.6 : 1,
                }}>{savingFav ? '...' : 'Save'}</button>
              </div>
            </div>
          )}

          {/* Who owns this */}
          {owners.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <h4 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>On the shelf</h4>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{owners.length} {owners.length === 1 ? 'cook' : 'cooks'}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {owners.map(o => (
                  <div key={o.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: 8, background: C.warm, border: `1px solid ${C.ruleLight}`,
                    maxWidth: '100%', minWidth: 0,
                  }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: SANS, flexShrink: 0 }}>{o.display_name!.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontFamily: MONO, color: C.accent, fontWeight: 500 }}>@{o.display_name}</span>
                      {o.favorite_recipe && (
                        <p style={{ fontSize: 11, fontFamily: SANS, color: C.text2, margin: '2px 0 0', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>★ {o.favorite_recipe}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider if we showed shelf section */}
          {owners.length > 0 && <div style={{ height: 1, background: C.ruleLight, margin: '0 0 20px' }} />}

          {/* Reviews section */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h4 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>What cooks are saying</h4>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{reviews.length}</span>
          </div>

          {/* Post input */}
          {displayName ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: SANS }}>{displayName.charAt(0).toUpperCase()}</div>
                <span style={{ fontSize: 12, fontFamily: MONO, color: C.accent }}>@{displayName}</span>
              </div>
              <textarea
                value={reviewBody}
                onChange={e => setReviewBody(e.target.value)}
                placeholder={`What do you love about ${book.title}?`}
                style={{ width: '100%', minHeight: 60, padding: '10px 14px', borderRadius: 6, border: `1.5px solid ${C.ruleLight}`, background: C.warm, fontSize: 13, fontFamily: SANS, color: C.text, lineHeight: 1.5, resize: 'vertical', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = C.rule }}
                onBlur={e => { e.target.style.borderColor = C.ruleLight }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button onClick={postReview} disabled={posting || !reviewBody.trim()} style={{
                  padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: reviewBody.trim() ? C.text : C.ruleLight,
                  color: reviewBody.trim() ? C.bg : C.text3,
                  fontSize: 12, fontWeight: 600, fontFamily: SANS, transition: 'all 0.15s',
                }}>{posting ? 'Posting...' : 'Post'}</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', borderRadius: 6, background: C.warm, border: `1px solid ${C.ruleLight}`, marginBottom: 20, fontSize: 12, color: C.text2, fontFamily: SANS }}>
              <Link href="/profile" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>Set up your profile</Link> to share your thoughts on this book.
            </div>
          )}

          {/* Reviews list */}
          {loading ? (
            <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>Loading...</p>
          ) : reviews.length === 0 ? (
            <p style={{ fontSize: 13, color: C.text3, fontFamily: SANS, fontStyle: 'italic' }}>No reviews yet. Be the first to share your thoughts!</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.ruleLight}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: SANS }}>{r.display_name.charAt(0).toUpperCase()}</div>
                  <span style={{ fontSize: 11, fontFamily: MONO, color: C.accent }}>@{r.display_name}</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <p style={{ fontSize: 13, fontFamily: SANS, color: C.text, lineHeight: 1.55, margin: 0 }}>{r.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
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

// ===== EXTERNAL RECIPES (mock data) =====
const SOURCES: Record<string, { color: string; bg: string }> = {
  'NYT Cooking': { color: '#E87B5A', bg: C.accentBg },
  'Bon Appétit': { color: '#D4A24E', bg: C.goldBg },
  'Serious Eats': { color: '#5A9ABF', bg: C.blueBg },
}
// ===== DISCUSSION THREADS (mock data) =====
const THREAD_TAGS: Record<string, { color: string; bg: string }> = {
  'Cookware': { color: C.blue, bg: C.blueBg },
  'Technique': { color: C.green, bg: C.greenBg },
  'Discussion': { color: C.gold, bg: C.goldBg },
  'Rec me': { color: C.accent, bg: C.accentBg },
}
const THREADS = [
  { id: 't1', title: 'Best Dutch oven under $100?', tag: 'Cookware', author: 'sarah_m', replies: 14, upvotes: 32, timeAgo: '3h', topReply: { user: 'marco_r', text: 'Lodge 6qt. Not even close for the price.' } },
  { id: 't2', title: 'How do you actually get a good sear without setting off the smoke alarm?', tag: 'Technique', author: 'jake_w', replies: 23, upvotes: 47, timeAgo: '5h', topReply: { user: 'priya_s', text: 'Avocado oil + make sure the steak is bone dry. Pat it like you mean it.' } },
  { id: 't3', title: 'What\'s a dish you were afraid to try but turned out easy?', tag: 'Discussion', author: 'nina_k', replies: 41, upvotes: 89, timeAgo: '8h', topReply: { user: 'alex_r', text: 'Fresh pasta. Literally flour + eggs. I was so intimidated for years.' } },
  { id: 't4', title: 'Need a weeknight dinner that impresses guests but takes <45 min', tag: 'Rec me', author: 'foodie_j', replies: 19, upvotes: 28, timeAgo: '12h', topReply: { user: 'ben_c', text: 'Miso salmon + quick pickled cucumbers. Looks restaurant-level, takes 25 min.' } },
]

const EXTERNAL_RECIPES = [
  { id: 'ext-1', title: 'Crispy Salt and Pepper Chicken Thighs', source: 'NYT Cooking', cuisine: 'American', time: '45 min', rating: 4.5, reviews: 23, image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=200&fit=crop', topReview: { user: 'sarah_m', text: 'Made this 3 times this month. The pepper ratio is perfect.' }, similar: { title: 'Chicken Tikka Masala', slug: 'chicken-tikka-masala' } },
  { id: 'ext-2', title: "BA's Best Bolognese", source: 'Bon Appétit', cuisine: 'Italian', time: '3 hr', rating: 4.8, reviews: 41, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=200&fit=crop', topReview: { user: 'marco_r', text: 'Worth every minute of the 3 hours. Sunday sauce energy.' }, similar: { title: 'Classic Ragù', slug: 'classic-ragu' } },
  { id: 'ext-3', title: 'Halal Cart-Style Chicken and Rice', source: 'Serious Eats', cuisine: 'American', time: '1 hr', rating: 4.7, reviews: 18, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop', topReview: { user: 'foodie_j', text: 'The white sauce recipe here is the real secret.' }, similar: null },
  { id: 'ext-4', title: 'Tangy Pomegranate Chicken', source: 'NYT Cooking', cuisine: 'Middle Eastern', time: '50 min', rating: 4.3, reviews: 9, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=200&fit=crop', topReview: { user: 'nina_k', text: 'Added sumac. Game changer.' }, similar: { title: 'Chicken Shawarma', slug: 'chicken-shawarma' } },
]

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.3
  return (
    <span style={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < full ? C.gold : i === full && half ? `url(#half-${rating})` : 'none'} stroke={i < full || (i === full && half) ? C.gold : C.rule} strokeWidth="2">
          {i === full && half && (
            <defs><linearGradient id={`half-${rating}`}><stop offset="50%" stopColor={C.gold} /><stop offset="50%" stopColor="transparent" /></linearGradient></defs>
          )}
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

// ===== CAROUSEL ROW =====
function CarouselRow({ title, seeAllHref, children }: { title: string; seeAllHref?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, padding: '0 clamp(16px,4vw,24px)' }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h2>
        {seeAllHref && <Link href={seeAllHref} style={{ fontSize: 11, fontFamily: SANS, color: C.accent, fontWeight: 500, textDecoration: 'none' }}>See all →</Link>}
      </div>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 'clamp(16px,4vw,24px)', paddingRight: 'clamp(16px,4vw,24px)', paddingBottom: 8,
        scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </div>
    </div>
  )
}

// ===== CAROUSEL CARDS =====
const CARD_W = 220
const CARD_W_M = 165
const CARD_IMG_H = 140
const CARD_IMG_H_M = 110
const CARD_H = 280
const CARD_H_M = 240

function CardSaveOverlay({ id, saved, onToggle }: { id: string; saved: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle(id) }}
      style={{
        position: 'absolute', top: 8, right: 8, zIndex: 3,
        width: 30, height: 30, borderRadius: '50%',
        background: saved ? C.accent : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', padding: 0,
      }}
      aria-label={saved ? 'Unsave recipe' : 'Save recipe'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}

function CardFooter({ commentCount, cta, ctaColor, onCommentClick, onCtaClick }: { commentCount?: number; cta: string; ctaColor?: string; onCommentClick?: (e: React.MouseEvent) => void; onCtaClick?: (e: React.MouseEvent) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', marginTop: 'auto', flexShrink: 0,
      background: C.cool, borderTop: `1.5px solid ${C.accent}`,
      borderRadius: '0 0 7px 7px',
    }}>
      <div
        onClick={onCommentClick ? (e) => { e.preventDefault(); e.stopPropagation(); onCommentClick(e) } : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: onCommentClick ? 'pointer' : 'default', padding: '2px 4px', borderRadius: 4, transition: 'background 0.1s' }}
        onMouseEnter={onCommentClick ? e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,74,42,0.1)' } : undefined}
        onMouseLeave={onCommentClick ? e => { (e.currentTarget as HTMLElement).style.background = 'transparent' } : undefined}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: 9, fontFamily: MONO, color: C.accent, fontWeight: 600 }}>{commentCount || 0}</span>
      </div>
      <span
        onClick={onCtaClick ? (e) => { e.preventDefault(); e.stopPropagation(); onCtaClick(e) } : undefined}
        style={{ fontSize: 10, fontFamily: SANS, fontWeight: 600, color: ctaColor || C.accent, marginLeft: 'auto', cursor: onCtaClick ? 'pointer' : 'default', padding: '2px 4px', borderRadius: 4, transition: 'background 0.1s' }}
        onMouseEnter={onCtaClick ? e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,74,42,0.1)' } : undefined}
        onMouseLeave={onCtaClick ? e => { (e.currentTarget as HTMLElement).style.background = 'transparent' } : undefined}
      >{cta}</span>
    </div>
  )
}

function CarouselRecipeCard({ recipe, onQuickView, isMobile, saved, onToggleSave, commentCount, onCommentClick }: { recipe: Recipe; onQuickView: (id: string) => void; isMobile: boolean; saved?: boolean; onToggleSave?: (id: string) => void; commentCount?: number; onCommentClick?: (e: React.MouseEvent) => void }) {
  const router = useRouter()
  const w = isMobile ? CARD_W_M : CARD_W
  const imgH = isMobile ? CARD_IMG_H_M : CARD_IMG_H
  const h = isMobile ? CARD_H_M : CARD_H
  return (
    <div
      style={{
        width: w, height: h, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
        border: `1px solid ${C.ruleLight}`, background: C.warm, scrollSnapAlign: 'start',
        transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      <div onClick={() => onQuickView(recipe.id)} style={{ width: w, height: imgH, overflow: 'hidden', background: C.cool, position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          : <BrokenEggCard />
        }
        {onToggleSave && <CardSaveOverlay id={recipe.id} saved={!!saved} onToggle={onToggleSave} />}
      </div>
      <div onClick={() => onQuickView(recipe.id)} style={{ padding: '10px 12px 8px', flex: 1, overflow: 'hidden', cursor: 'pointer' }}>
        <h3 style={{
          fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.25, margin: '0 0 6px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>{recipe.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <DifficultyBadge difficulty={recipe.difficulty} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>{formatTime(recipe.time_total)}</span>
          {recipe.cuisine && <><span style={{ color: C.rule, fontSize: 7 }}>·</span><span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>{recipe.cuisine}</span></>}
        </div>
      </div>
      <CardFooter commentCount={commentCount} cta="Cook this →" onCommentClick={onCommentClick} onCtaClick={() => router.push(`/recipe/${recipe.slug}`)} />
    </div>
  )
}

const EXTERNAL_SOURCE_COLORS: Record<string, { bg: string; bgLight: string; text: string }> = {
  'NYT Cooking': { bg: '#8B7355', bgLight: '#F5F0E8', text: '#FFF' },
  'Bon Appétit': { bg: '#E8614D', bgLight: '#FDF0EC', text: '#FFF' },
  'Serious Eats': { bg: '#2B8C8C', bgLight: '#EBF5F5', text: '#FFF' },
  'Epicurious': { bg: '#B8860B', bgLight: '#FDF5E6', text: '#FFF' },
  'Food52': { bg: '#C25B28', bgLight: '#FDF0E8', text: '#FFF' },
}

function CarouselExternalCard({ ext, isMobile, commentCount, onCommentClick }: { ext: { id: string; title: string; source_name: string; source_url: string; description: string | null; cuisine: string | null; time_estimate: string | null; matched_recipe_slug: string | null }; isMobile: boolean; commentCount?: number; onCommentClick?: (e: React.MouseEvent) => void }) {
  const w = isMobile ? CARD_W_M : CARD_W
  const imgH = isMobile ? CARD_IMG_H_M : CARD_IMG_H
  const h = isMobile ? CARD_H_M : CARD_H
  const sc = EXTERNAL_SOURCE_COLORS[ext.source_name] || { bg: C.text3, bgLight: C.cool, text: '#FFF' }
  return (
    <a href={ext.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}>
      <div
        style={{
          width: w, height: h, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
          border: `1px solid ${C.ruleLight}`, transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        {/* Colored header */}
        <div style={{ width: w, height: imgH, flexShrink: 0, background: sc.bg, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px 14px' }}>
          <span style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{ext.source_name}</span>
          <h3 style={{
            fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: sc.text, lineHeight: 1.25, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>{ext.title}</h3>
        </div>
        <div style={{ padding: '10px 12px 8px', background: C.warm, flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: ext.description ? 6 : 0 }}>
            {ext.cuisine && <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>{ext.cuisine}</span>}
            {ext.cuisine && ext.time_estimate && <span style={{ color: C.rule, fontSize: 7 }}>·</span>}
            {ext.time_estimate && <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>{ext.time_estimate}</span>}
          </div>
          {ext.description && <p style={{
            fontSize: 11, fontFamily: SANS, color: C.text2, lineHeight: 1.4, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>{ext.description}</p>}
        </div>
        <CardFooter commentCount={commentCount} cta={`Read on ${ext.source_name} →`} onCommentClick={onCommentClick} />
      </div>
    </a>
  )
}

function CarouselCommunityCard({ submission, isMobile, commentCount, onCommentClick }: { submission: CommunitySubmission; isMobile: boolean; commentCount?: number; onCommentClick?: (e: React.MouseEvent) => void }) {
  const w = isMobile ? CARD_W_M : CARD_W
  const imgH = isMobile ? CARD_IMG_H_M : CARD_IMG_H
  const h = isMobile ? CARD_H_M : CARD_H
  const platform = PLATFORM_STYLES[submission.platform] || PLATFORM_STYLES.other
  return (
    <a href={submission.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}>
      <div
        style={{
          width: w, height: h, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
          border: `1px solid ${C.ruleLight}`, background: C.warm, transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        {/* Thumbnail or platform-colored placeholder */}
        <div style={{ width: w, height: imgH, flexShrink: 0, overflow: 'hidden', background: C.cool, position: 'relative' }}>
          {submission.thumbnail_url
            ? <img src={submission.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: platform.bg }}>
                <span style={{ fontSize: 28, opacity: 0.6 }}>{platform.icon}</span>
              </div>
          }
          {/* Platform badge overlay */}
          <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
            <PlatformBadge platform={submission.platform} />
          </div>
        </div>
        <div style={{ padding: '10px 12px 8px', flex: 1, overflow: 'hidden' }}>
          <h3 style={{
            fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.25, margin: '0 0 4px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>{submission.title}</h3>
          {submission.author_name && <p style={{ fontSize: 9, fontFamily: MONO, color: C.text3, margin: 0 }}>by {submission.author_name}</p>}
        </div>
        <CardFooter commentCount={commentCount} cta="Watch →" onCommentClick={onCommentClick} />
      </div>
    </a>
  )
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`
  return `${count} views`
}

function CarouselViralCard({ video, isMobile }: { video: { videoId: string; dishName: string; channelTitle: string; thumbnail: string; url: string; viewCount: number; platform: string }; isMobile: boolean }) {
  const w = isMobile ? CARD_W_M : CARD_W
  const imgH = isMobile ? CARD_IMG_H_M : CARD_IMG_H
  const h = isMobile ? CARD_H_M : CARD_H
  const isTikTok = video.platform === 'tiktok-via-youtube'
  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}>
      <div
        style={{
          width: w, height: h, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
          border: `1px solid ${C.ruleLight}`, background: C.warm, transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        <div style={{ width: w, height: imgH, flexShrink: 0, overflow: 'hidden', background: C.cool, position: 'relative' }}>
          {video.thumbnail
            ? <img src={video.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                <span style={{ fontSize: 28, opacity: 0.6 }}>▶</span>
              </div>
          }
          <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 4 }}>
            <span style={{
              fontSize: 9, fontFamily: MONO, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              color: '#fff', background: isTikTok ? 'rgba(0,0,0,0.75)' : 'rgba(255,0,0,0.75)',
            }}>
              {isTikTok ? 'TikTok' : 'YouTube'}
            </span>
            <span style={{ fontSize: 9, fontFamily: MONO, fontWeight: 600, padding: '2px 6px', borderRadius: 4, color: '#fff', background: 'rgba(0,0,0,0.6)' }}>
              {formatViewCount(video.viewCount)}
            </span>
          </div>
        </div>
        <div style={{ padding: '10px 12px 8px', flex: 1, overflow: 'hidden' }}>
          <h3 style={{
            fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.25, margin: '0 0 4px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>{video.dishName}</h3>
          <p style={{ fontSize: 9, fontFamily: MONO, color: C.text3, margin: 0 }}>{video.channelTitle}</p>
        </div>
        <div style={{ padding: '0 12px 10px' }}>
          <span style={{ fontSize: 10, fontFamily: SANS, color: C.accent, fontWeight: 500 }}>Watch →</span>
        </div>
      </div>
    </a>
  )
}

function DiscussionListItem({ thread, hasRealData }: {
  thread: { id: string; title: string; tag: string | null; author_display_name: string; reply_count: number; upvote_count: number; created_at: string; topReply?: { user: string; text: string } | null }
  hasRealData: boolean
}) {
  const tagStyle = THREAD_TAGS[thread.tag || ''] || { color: C.text3, bg: C.cool }
  return (
    <Link href={hasRealData ? `/community/${thread.id}` : '/community'} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        style={{
          padding: '14px 16px', borderBottom: `1px solid ${C.ruleLight}`, cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.cool }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {/* Top row: upvotes + content */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Upvote column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 32, paddingTop: 2 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2.5"><path d="M12 4l-8 8h5v8h6v-8h5z" /></svg>
            <span style={{ fontSize: 12, fontFamily: MONO, color: C.text, fontWeight: 600 }}>{thread.upvote_count}</span>
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {thread.tag && (
                <span style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, letterSpacing: 0.5, padding: '2px 8px', borderRadius: 3, background: tagStyle.bg, color: tagStyle.color }}>{thread.tag}</span>
              )}
              <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>@{thread.author_display_name}</span>
            </div>
            <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.35, margin: '0 0 6px' }}>{thread.title}</h3>
            {/* Top reply preview */}
            {thread.topReply && (
              <div style={{ padding: '6px 10px', background: C.cool, borderRadius: 6, borderLeft: `2px solid ${C.accent}`, marginBottom: 6 }}>
                <p style={{ fontSize: 12, fontFamily: SANS, color: C.text2, lineHeight: 1.4, margin: 0 }}>
                  <span style={{ fontWeight: 600, color: C.accent, fontFamily: MONO, fontSize: 10 }}>@{thread.topReply.user}</span>{' '}
                  {thread.topReply.text}
                </p>
              </div>
            )}
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{thread.reply_count} replies</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: SANS, color: C.accent, fontWeight: 600, marginLeft: 'auto' }}>Join →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ===== SUBMIT MODAL =====
function SubmitModal({ onClose, onSubmitted, categories }: {
  onClose: () => void
  onSubmitted: (submission?: CommunitySubmission) => void
  categories: Category[]
}) {
  const [tab, setTab] = useState<'link' | 'recipe'>('link')
  const backdropRef = useRef<HTMLDivElement>(null)
  const displayName = getDisplayName()

  // Link tab state
  const [linkUrl, setLinkUrl] = useState('')
  const [linkPlatform, setLinkPlatform] = useState<'tiktok' | 'youtube' | 'instagram' | 'other'>('other')
  const [oembedData, setOembedData] = useState<OEmbedResult | null>(null)
  const [oembedLoading, setOembedLoading] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkNote, setLinkNote] = useState('')
  const [linkRelated, setLinkRelated] = useState('')
  const [linkRelatedSearch, setLinkRelatedSearch] = useState('')
  const [linkRelatedResults, setLinkRelatedResults] = useState<{ slug: string; title: string }[]>([])
  const [linkPosting, setLinkPosting] = useState(false)
  const [linkError, setLinkError] = useState('')

  // Recipe tab state
  const [recipeTitle, setRecipeTitle] = useState('')
  const [recipeDesc, setRecipeDesc] = useState('')
  const [recipeCuisine, setRecipeCuisine] = useState('')
  const [recipeDifficulty, setRecipeDifficulty] = useState('easy')
  const [recipeTime, setRecipeTime] = useState('')
  const [recipeServings, setRecipeServings] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState([{ name: '', amount: '', unit: '' }])
  const [recipeSteps, setRecipeSteps] = useState([''])
  const [recipeImageUrl, setRecipeImageUrl] = useState('')
  const [recipePosting, setRecipePosting] = useState(false)
  const [recipeError, setRecipeError] = useState('')
  const [similarWarning, setSimilarWarning] = useState('')

  // oEmbed fetch on URL change
  const oembedTimer = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => {
    if (!linkUrl.trim()) { setOembedData(null); setLinkPlatform('other'); return }
    const platform = detectPlatform(linkUrl)
    setLinkPlatform(platform)
    setOembedData(null)
    if (platform === 'tiktok' || platform === 'youtube') {
      if (oembedTimer.current) clearTimeout(oembedTimer.current)
      oembedTimer.current = setTimeout(async () => {
        setOembedLoading(true)
        const data = await fetchOembed(linkUrl)
        if (data) {
          setOembedData(data)
          if (data.title) setLinkTitle(data.title)
        }
        setOembedLoading(false)
      }, 400)
    }
    return () => { if (oembedTimer.current) clearTimeout(oembedTimer.current) }
  }, [linkUrl])

  // Related recipe search
  useEffect(() => {
    if (!linkRelatedSearch.trim()) { setLinkRelatedResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('recipes').select('slug, title').ilike('title', `%${linkRelatedSearch}%`).eq('status', 'published').limit(5)
      if (data) setLinkRelatedResults(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [linkRelatedSearch])

  // Originality check on recipe title blur
  const checkOriginality = async () => {
    if (!recipeTitle.trim()) { setSimilarWarning(''); return }
    const { data } = await supabase.from('recipes').select('title').ilike('title', `%${recipeTitle.trim()}%`).eq('status', 'published').limit(3)
    if (data && data.length > 0) {
      setSimilarWarning(`A recipe for "${data[0].title}" already exists on RecDex. Is yours a different version?`)
    } else {
      setSimilarWarning('')
    }
  }

  // Submit link
  const submitLink = async () => {
    if (!linkUrl.trim() || !linkTitle.trim() || !displayName) return
    setLinkPosting(true)
    setLinkError('')
    const { data, error } = await supabase.from('community_submissions').insert({
      url: linkUrl.trim(),
      platform: linkPlatform,
      title: linkTitle.trim(),
      author_name: oembedData?.author_name || null,
      author_url: oembedData?.author_url || null,
      thumbnail_url: oembedData?.thumbnail_url || null,
      display_name: displayName,
      submitter_note: linkNote.trim() || null,
      related_recipe_slug: linkRelated || null,
    }).select().single()
    if (error) {
      if (error.code === '23505') setLinkError('This link has already been shared!')
      else setLinkError('Something went wrong. Try again.')
      setLinkPosting(false)
      return
    }
    setLinkPosting(false)
    if (data) onSubmitted(data as CommunitySubmission)
    onClose()
  }

  // Submit recipe
  const submitRecipe = async () => {
    if (!recipeTitle.trim() || !displayName) return
    const validIngredients = recipeIngredients.filter(i => i.name.trim())
    const validSteps = recipeSteps.filter(s => s.trim())
    if (validIngredients.length === 0 || validSteps.length === 0) {
      setRecipeError('Add at least one ingredient and one step.')
      return
    }
    setRecipePosting(true)
    setRecipeError('')
    const slug = recipeTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
    const { error } = await supabase.from('recipes').insert({
      slug,
      title: recipeTitle.trim(),
      description: recipeDesc.trim() || null,
      cuisine: recipeCuisine || null,
      difficulty: recipeDifficulty,
      time_total: recipeTime ? parseInt(recipeTime) : null,
      servings: recipeServings ? parseInt(recipeServings) : null,
      image_url: recipeImageUrl.trim() || null,
      ingredients: validIngredients.map(i => ({ name: i.name.trim(), amount: i.amount.trim(), unit: i.unit.trim() })),
      steps: validSteps.map((text, i) => ({ step: i + 1, text: text.trim(), timer_minutes: null })),
      tags: [],
      status: 'published',
      submitted_by: displayName,
      source: 'community',
    })
    if (error) {
      setRecipeError('Something went wrong. Try again.')
      setRecipePosting(false)
      return
    }
    setRecipePosting(false)
    onSubmitted()
    onClose()
  }

  // Profile gate paused during testing — will re-enable for launch
  // if (!displayName) { ... }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 6, border: `1.5px solid ${C.ruleLight}`, background: C.cool, fontSize: 13, fontFamily: SANS, color: C.text, outline: 'none' }

  return (
    <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'backdropIn 0.2s ease',
    }}>
      <div style={{
        background: C.bg, borderRadius: 12, width: '100%', maxWidth: 560,
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `1px solid ${C.ruleLight}`,
        animation: 'modalIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.ruleLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Contribute</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.text3, padding: 4 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            {(['link', 'recipe'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: SANS, fontSize: 13, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? C.text : C.text3,
                borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
                marginBottom: -1,
              }}>
                {t === 'link' ? 'Share a link' : 'Add a recipe'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'link' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Recipe URL</label>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Paste a TikTok, YouTube, Instagram, or blog link" style={inputStyle} />
                {linkUrl.trim() && (
                  <div style={{ marginTop: 6 }}>
                    <PlatformBadge platform={linkPlatform} />
                    {oembedLoading && <span style={{ fontSize: 11, color: C.text3, fontFamily: SANS, marginLeft: 8 }}>Fetching preview...</span>}
                  </div>
                )}
              </div>

              {oembedData && oembedData.thumbnail_url && (
                <div style={{ display: 'flex', gap: 12, padding: 12, background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={oembedData.thumbnail_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oembedData.title}</p>
                    {oembedData.author_name && <p style={{ fontFamily: MONO, fontSize: 10, color: C.text3, margin: 0 }}>by {oembedData.author_name}</p>}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>
                  Title {(linkPlatform === 'instagram' || linkPlatform === 'other') && !oembedData?.title && <span style={{ color: C.accent }}>*</span>}
                </label>
                <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder={oembedData?.title ? '' : 'What recipe is this?'} style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Your note <span style={{ fontWeight: 400, color: C.text3 }}>(optional)</span></label>
                <input value={linkNote} onChange={e => setLinkNote(e.target.value.slice(0, 140))} placeholder="Why are you sharing this?" maxLength={140} style={inputStyle} />
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3, float: 'right', marginTop: 2 }}>{linkNote.length}/140</span>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Similar on RecDex <span style={{ fontWeight: 400, color: C.text3 }}>(optional)</span></label>
                {linkRelated ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.warm, borderRadius: 6, border: `1px solid ${C.ruleLight}` }}>
                    <span style={{ fontSize: 12, fontFamily: SANS, color: C.text, flex: 1 }}>{linkRelatedResults.find(r => r.slug === linkRelated)?.title || linkRelated}</span>
                    <button onClick={() => { setLinkRelated(''); setLinkRelatedSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.text3 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input value={linkRelatedSearch} onChange={e => setLinkRelatedSearch(e.target.value)} placeholder="Search for a similar recipe..." style={inputStyle} />
                    {linkRelatedResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, marginTop: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        {linkRelatedResults.map(r => (
                          <button key={r.slug} onClick={() => { setLinkRelated(r.slug); setLinkRelatedSearch(''); setLinkRelatedResults([]) }} style={{
                            display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                            cursor: 'pointer', textAlign: 'left', fontFamily: SANS, fontSize: 12, color: C.text,
                          }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.background = C.cool }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none' }}
                          >{r.title}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {linkError && <p style={{ fontSize: 12, color: C.accent, fontFamily: SANS, margin: 0 }}>{linkError}</p>}
            </div>
          )}

          {tab === 'recipe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Recipe title <span style={{ color: C.accent }}>*</span></label>
                <input value={recipeTitle} onChange={e => setRecipeTitle(e.target.value)} onBlur={checkOriginality} placeholder="e.g., Grandma's Chicken Soup" style={inputStyle} />
                {similarWarning && <p style={{ fontSize: 11, color: C.gold, fontFamily: SANS, margin: '4px 0 0', lineHeight: 1.4 }}>{similarWarning}</p>}
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Description <span style={{ fontWeight: 400, color: C.text3 }}>(optional)</span></label>
                <textarea value={recipeDesc} onChange={e => setRecipeDesc(e.target.value)} placeholder="A short description of this recipe" rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Cuisine</label>
                  <select value={recipeCuisine} onChange={e => setRecipeCuisine(e.target.value)} style={inputStyle}>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Difficulty</label>
                  <select value={recipeDifficulty} onChange={e => setRecipeDifficulty(e.target.value)} style={inputStyle}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Total time (min)</label>
                  <input type="number" value={recipeTime} onChange={e => setRecipeTime(e.target.value)} placeholder="e.g., 45" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Servings</label>
                  <input type="number" value={recipeServings} onChange={e => setRecipeServings(e.target.value)} placeholder="e.g., 4" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Ingredients <span style={{ color: C.accent }}>*</span></label>
                {recipeIngredients.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input value={ing.amount} onChange={e => { const next = [...recipeIngredients]; next[i] = { ...next[i], amount: e.target.value }; setRecipeIngredients(next) }} placeholder="Amt" style={{ ...inputStyle, width: 60 }} />
                    <input value={ing.unit} onChange={e => { const next = [...recipeIngredients]; next[i] = { ...next[i], unit: e.target.value }; setRecipeIngredients(next) }} placeholder="Unit" style={{ ...inputStyle, width: 60 }} />
                    <input value={ing.name} onChange={e => { const next = [...recipeIngredients]; next[i] = { ...next[i], name: e.target.value }; setRecipeIngredients(next) }} placeholder="Ingredient name" style={{ ...inputStyle, flex: 1 }} />
                    {recipeIngredients.length > 1 && (
                      <button onClick={() => setRecipeIngredients(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.text3, padding: '0 4px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setRecipeIngredients(prev => [...prev, { name: '', amount: '', unit: '' }])} style={{ background: 'none', border: `1px dashed ${C.rule}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontFamily: SANS, color: C.text3, width: '100%' }}>+ Add ingredient</button>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Steps <span style={{ color: C.accent }}>*</span></label>
                {recipeSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3, paddingTop: 10, flexShrink: 0, width: 20, textAlign: 'right' }}>{i + 1}.</span>
                    <textarea value={step} onChange={e => { const next = [...recipeSteps]; next[i] = e.target.value; setRecipeSteps(next) }} placeholder={`Step ${i + 1}`} rows={2} style={{ ...inputStyle, flex: 1, resize: 'vertical' as const }} />
                    {recipeSteps.length > 1 && (
                      <button onClick={() => setRecipeSteps(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.text3, padding: '4px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setRecipeSteps(prev => [...prev, ''])} style={{ background: 'none', border: `1px dashed ${C.rule}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontFamily: SANS, color: C.text3, width: '100%' }}>+ Add step</button>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: SANS, display: 'block', marginBottom: 4 }}>Image URL <span style={{ fontWeight: 400, color: C.text3 }}>(optional)</span></label>
                <input value={recipeImageUrl} onChange={e => setRecipeImageUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>

              {recipeError && <p style={{ fontSize: 12, color: C.accent, fontFamily: SANS, margin: 0 }}>{recipeError}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.ruleLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: SANS }}>{displayName.charAt(0).toUpperCase()}</div>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>@{displayName}</span>
          </div>
          {tab === 'link' ? (
            <button onClick={submitLink} disabled={linkPosting || !linkUrl.trim() || !linkTitle.trim()} style={{
              padding: '9px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: linkUrl.trim() && linkTitle.trim() ? C.accent : C.ruleLight,
              color: linkUrl.trim() && linkTitle.trim() ? '#fff' : C.text3,
              fontSize: 12, fontWeight: 600, fontFamily: SANS, transition: 'all 0.15s',
            }}>{linkPosting ? 'Sharing...' : 'Share link'}</button>
          ) : (
            <button onClick={submitRecipe} disabled={recipePosting || !recipeTitle.trim()} style={{
              padding: '9px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: recipeTitle.trim() ? C.accent : C.ruleLight,
              color: recipeTitle.trim() ? '#fff' : C.text3,
              fontSize: 12, fontWeight: 600, fontFamily: SANS, transition: 'all 0.15s',
            }}>{recipePosting ? 'Adding...' : 'Add recipe'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== SUBMISSION CARD =====
function SubmissionCard({ submission, hasUpvoted, onUpvote, isMobile }: {
  submission: CommunitySubmission
  hasUpvoted: boolean
  onUpvote: () => void
  isMobile: boolean
}) {
  return (
    <div style={{
      borderRadius: 12, background: C.warm, border: `1px solid ${C.ruleLight}`, overflow: 'hidden',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ width: isMobile ? 90 : 110, flexShrink: 0, aspectRatio: '3/4', background: C.cool, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {submission.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={submission.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          ) : (
            <BrokenEggCard />
          )}
        </div>
        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <PlatformBadge platform={submission.platform} />
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0.4 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
          <a href={submission.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.25, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{submission.title}</h3>
          </a>
          <div style={{ fontSize: 10, fontFamily: MONO, color: C.text3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {submission.author_name && <span>by {submission.author_name}</span>}
            {submission.author_name && <span style={{ color: C.rule }}>·</span>}
            <span>shared by <span style={{ color: C.accent }}>@{submission.display_name}</span></span>
          </div>
          {submission.submitter_note && (
            <p style={{ fontSize: 11, color: C.text2, fontFamily: SANS, lineHeight: 1.35, margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
              &ldquo;{submission.submitter_note}&rdquo;
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
            <button onClick={e => { e.stopPropagation(); onUpvote() }} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 4,
              border: `1px solid ${hasUpvoted ? C.accent : C.ruleLight}`, background: hasUpvoted ? C.accentBg : 'transparent',
              cursor: 'pointer', fontSize: 10, fontFamily: MONO, color: hasUpvoted ? C.accent : C.text3, fontWeight: hasUpvoted ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill={hasUpvoted ? C.accent : 'none'} stroke={hasUpvoted ? C.accent : C.text3} strokeWidth="2.5">
                <path d="M12 4l-8 8h5v8h6v-8h5z" />
              </svg>
              {submission.upvote_count}
            </button>
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{timeAgo(submission.created_at)}</span>
            {submission.related_recipe_slug && (
              <Link href={`/recipe/${submission.related_recipe_slug}`} style={{ fontSize: 10, fontFamily: SANS, color: C.accent, textDecoration: 'none', fontWeight: 500, marginLeft: 'auto' }}>
                Similar on RecDex →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [quickViewId, setQuickViewId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchPinned, setSearchPinned] = useState(false)
  const [searchMode, setSearchMode] = useState<'recipe' | 'pantry'>('recipe')
  const [pantryCount, setPantryCount] = useState(0)
  const searchHeroRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [view, setView] = useState<'home' | 'browse'>('home')
  const [rotdSaved, setRotdSaved] = useState(false)
  const [selectedBook, setSelectedBook] = useState<typeof BOOKS[0] | null>(null)
  const [bookStats, setBookStats] = useState<Record<string, { likes: number; owns: number }>>({})
  const [myBookActions, setMyBookActions] = useState<Record<string, { liked: boolean; owned: boolean }>>({})
  const [recentComments, setRecentComments] = useState<{ id: string; display_name: string; body: string; created_at: string; recipe_title?: string; recipe_slug?: string; recipe_image?: string | null }[]>([])

  // Comment drawer state
  const [commentDrawer, setCommentDrawer] = useState<{ itemType: string; itemId: string; itemTitle: string } | null>(null)
  const [itemCommentCounts, setItemCommentCounts] = useState<Record<string, number>>({})

  const openCommentDrawer = useCallback((itemType: string, itemId: string, itemTitle: string) => {
    setCommentDrawer({ itemType, itemId, itemTitle })
  }, [])

  // Save state (NYT-style bookmark on cards)
  const [homeSavedIds, setHomeSavedIds] = useState<string[]>([])
  const [commentCountsMap, setCommentCountsMap] = useState<Record<string, number>>({})

  // Community submissions state
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([])
  const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([])
  const [submissionSort, setSubmissionSort] = useState<'recent' | 'top'>('recent')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userUpvotes, setUserUpvotes] = useState<string[]>([])

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
      if (!profile.onboardingComplete) setShowOnboarding(true)
    } catch { setShowOnboarding(true) }
  }, [])

  // Community threads state
  const [communityThreads, setCommunityThreads] = useState<{ id: string; title: string; tag: string | null; author_display_name: string; reply_count: number; upvote_count: number; created_at: string; topReply?: { user: string; text: string } | null }[]>([])

  // External recipes state
  const [externalRecipes, setExternalRecipes] = useState<{ id: string; title: string; source_name: string; source_url: string; description: string | null; cuisine: string | null; time_estimate: string | null; matched_recipe_slug: string | null }[]>([])

  // Fetch recent community comments
  useEffect(() => {
    async function fetchRecentComments() {
      const { data: comments } = await supabase.from('comments').select('id, display_name, body, created_at, recipe_id').order('created_at', { ascending: false }).limit(6)
      if (comments && comments.length > 0) {
        // Fetch recipe titles + images for these comments
        const recipeIds = [...new Set(comments.map(c => c.recipe_id))]
        const { data: recipes } = await supabase.from('recipes').select('id, title, slug, image_url').in('id', recipeIds)
        const recipeMap = new Map((recipes || []).map(r => [r.id, r]))
        setRecentComments(comments.map(c => {
          const recipe = recipeMap.get(c.recipe_id)
          return { id: c.id, display_name: c.display_name, body: c.body, created_at: c.created_at, recipe_title: recipe?.title, recipe_slug: recipe?.slug, recipe_image: recipe?.image_url }
        }))
      }
    }
    fetchRecentComments()
  }, [])

  // Fetch community threads with top reply
  useEffect(() => {
    async function fetchThreads() {
      const { data: threads } = await supabase.from('threads').select('id, title, tag, author_display_name, reply_count, upvote_count, created_at')
        .order('created_at', { ascending: false }).limit(6)
      if (!threads || threads.length === 0) return
      // Fetch first reply for each thread
      const { data: replies } = await supabase.from('thread_replies').select('thread_id, author_display_name, body')
        .in('thread_id', threads.map(t => t.id))
        .order('created_at', { ascending: true })
      const replyMap = new Map<string, { user: string; text: string }>()
      if (replies) {
        for (const r of replies) {
          if (!replyMap.has(r.thread_id)) replyMap.set(r.thread_id, { user: r.author_display_name, text: r.body })
        }
      }
      setCommunityThreads(threads.map(t => ({ ...t, topReply: replyMap.get(t.id) || null })))
    }
    fetchThreads()
  }, [])

  // Fetch external recipes
  useEffect(() => {
    supabase.from('external_recipes').select('id, title, source_name, source_url, description, cuisine, time_estimate, matched_recipe_slug')
      .eq('status', 'active')
      .order('created_at', { ascending: false }).limit(24)
      .then(({ data }) => { if (data) setExternalRecipes(data) })
  }, [])

  // Fetch item_comments counts for non-recipe items (external, community, books)
  const fetchItemCommentCounts = useCallback(async () => {
    try {
      const { data } = await supabase.from('item_comments').select('item_type, item_id')
      if (data) {
        const counts: Record<string, number> = {}
        for (const c of data) {
          const key = `${c.item_type}:${c.item_id}`
          counts[key] = (counts[key] || 0) + 1
        }
        setItemCommentCounts(counts)
      }
    } catch { /* table may not exist yet */ }
  }, [])

  useEffect(() => { fetchItemCommentCounts() }, [fetchItemCommentCounts])

  // Fetch book shelf stats
  useEffect(() => {
    async function fetchBookStats() {
      const { data } = await supabase.from('book_shelves').select('*')
      if (data) {
        const stats: Record<string, { likes: number; owns: number }> = {}
        const clientId = getClientId()
        const myActions: Record<string, { liked: boolean; owned: boolean }> = {}
        for (const s of data as BookShelf[]) {
          if (!stats[s.book_key]) stats[s.book_key] = { likes: 0, owns: 0 }
          if (s.liked) stats[s.book_key].likes++
          if (s.owned) stats[s.book_key].owns++
          if (s.client_id === clientId) myActions[s.book_key] = { liked: s.liked, owned: s.owned }
        }
        setBookStats(stats)
        setMyBookActions(myActions)
      }
    }
    fetchBookStats()
  }, [selectedBook]) // refetch when modal closes to update counts

  // Fetch community submissions
  useEffect(() => {
    async function fetchSubmissions() {
      const orderCol = submissionSort === 'top' ? 'upvote_count' : 'created_at'
      const { data } = await supabase.from('community_submissions').select('*').eq('status', 'active').order(orderCol, { ascending: false }).limit(8)
      if (data) setSubmissions(data as CommunitySubmission[])
    }
    fetchSubmissions()
  }, [submissionSort])


  // Load upvote state from localStorage
  useEffect(() => {
    try { setUserUpvotes(JSON.parse(localStorage.getItem('recdex-upvotes') || '[]')) } catch { /* ignore */ }
    try { setHomeSavedIds(JSON.parse(localStorage.getItem('recdex-box') || '[]')) } catch { /* ignore */ }
  }, [])

  const toggleHomeSave = (id: string) => {
    setHomeSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('recdex-box', JSON.stringify(next))
      return next
    })
  }

  // Hydrate upvotes from server
  useEffect(() => {
    const dn = getDisplayName()
    if (!dn || submissions.length === 0) return
    supabase.from('submission_upvotes').select('submission_id').eq('display_name', dn).in('submission_id', submissions.map(s => s.id))
      .then(({ data }) => {
        if (data) {
          const serverIds = data.map(d => d.submission_id)
          setUserUpvotes(prev => {
            const merged = [...new Set([...prev, ...serverIds])]
            localStorage.setItem('recdex-upvotes', JSON.stringify(merged))
            return merged
          })
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions])

  const toggleUpvote = async (submissionId: string) => {
    const dn = getDisplayName()
    if (!dn) return
    const already = userUpvotes.includes(submissionId)
    if (already) {
      setUserUpvotes(prev => { const next = prev.filter(id => id !== submissionId); localStorage.setItem('recdex-upvotes', JSON.stringify(next)); return next })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, upvote_count: Math.max(0, s.upvote_count - 1) } : s))
      await supabase.rpc('remove_upvote', { p_submission_id: submissionId, p_display_name: dn })
    } else {
      setUserUpvotes(prev => { const next = [...prev, submissionId]; localStorage.setItem('recdex-upvotes', JSON.stringify(next)); return next })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, upvote_count: s.upvote_count + 1 } : s))
      const { data: success } = await supabase.rpc('upvote_submission', { p_submission_id: submissionId, p_display_name: dn })
      if (!success) {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, upvote_count: s.upvote_count - 1 } : s))
      }
    }
  }

  // Fallback slugs (used when no activity data exists)
  const FALLBACK_SLUGS = ['shakshouka', 'pad-thai', 'chicken-tikka-masala', 'chocolate-chip-cookies', 'carbonara']
  const QUICK_SLUGS = ['guacamole', 'hummus', 'scrambled-eggs', 'aglio-e-olio', 'fried-rice', 'pesto-alla-genovese']
  // Deterministic daily rotation: pick a recipe based on the date
  // Uses a better scatter so consecutive days don't pick adjacent recipes
  function getRotdIndex(total: number): number {
    const d = new Date()
    // Days since epoch — simple, stable seed
    const daysSinceEpoch = Math.floor(d.getTime() / 86400000)
    // Multiply by a large prime to scatter, then mod
    return ((daysSinceEpoch * 2654435761) >>> 0) % total
  }

  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])
  const [quickRecipes, setQuickRecipes] = useState<Recipe[]>([])
  const [rotdRecipe, setRotdRecipe] = useState<Recipe | null>(null)
  const [viralVideos, setViralVideos] = useState<{ videoId: string; dishName: string; channelTitle: string; thumbnail: string; url: string; viewCount: number; platform: string }[]>([])

  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem('recdex-pantry') || '[]'); setPantryCount(p.length) } catch { /* ignore */ } }, [])
  useEffect(() => {
    const onScroll = () => {
      if (searchHeroRef.current) {
        const rect = searchHeroRef.current.getBoundingClientRect()
        setSearchPinned(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { supabase.from('categories').select('*').order('sort_order').then(({ data }) => { if (data) setCategories(data) }) }, [])
  useEffect(() => { supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'published').then(({ count }) => { if (count) setTotalCount(count) }) }, [])

  // Fetch homepage data with dynamic trending
  useEffect(() => {
    async function fetchHomepage() {
      // 1. Fetch all published recipes
      const { data: allRecipes } = await supabase.from('recipes').select('*').eq('status', 'published')
      if (!allRecipes) return

      // Set Recipe of the Day — rotates daily based on date hash
      const rotdIdx = getRotdIndex(allRecipes.length)
      const todaysRotd = allRecipes[rotdIdx]
      setRotdRecipe(todaysRotd)

      // 2. Get comment counts per recipe from Supabase
      const { data: commentData } = await supabase.from('comments').select('recipe_id')
      const commentCounts: Record<string, number> = {}
      if (commentData) {
        for (const c of commentData) {
          commentCounts[c.recipe_id] = (commentCounts[c.recipe_id] || 0) + 1
        }
      }
      setCommentCountsMap(commentCounts)

      // 3. Get local activity data (saves + cooks)
      let savedIds: string[] = []
      let cookedSlugs: Record<string, number> = {}
      try {
        const box = localStorage.getItem('recdex-box')
        if (box) savedIds = JSON.parse(box)
        const cooked = localStorage.getItem('recdex-cooked')
        if (cooked) {
          const events = JSON.parse(cooked) as { recipeSlug: string }[]
          for (const e of events) {
            cookedSlugs[e.recipeSlug] = (cookedSlugs[e.recipeSlug] || 0) + 1
          }
        }
      } catch { /* ignore localStorage errors */ }

      // 4. Score each recipe: comments×3 + saves×2 + cooks×1
      const scored = allRecipes
        .filter(r => r.id !== todaysRotd?.id) // exclude Recipe of the Day
        .map(r => ({
          recipe: r,
          score: (commentCounts[r.id] || 0) * 3
            + (savedIds.includes(String(r.id)) ? 2 : 0)
            + (cookedSlugs[r.slug] || 0),
        }))
        .sort((a, b) => b.score - a.score)

      // 5. Use scored results if there's any activity, otherwise fallback
      const hasActivity = scored.some(s => s.score > 0)
      if (hasActivity) {
        setFeaturedRecipes(scored.slice(0, 5).map(s => s.recipe))
      } else {
        setFeaturedRecipes(allRecipes.filter(r => FALLBACK_SLUGS.includes(r.slug)))
      }

      // Quick meals
      const { data: quick } = await supabase.from('recipes').select('*').in('slug', QUICK_SLUGS).eq('status', 'published')
      if (quick) setQuickRecipes(quick)
    }
    fetchHomepage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch viral/trending videos from YouTube/TikTok
  useEffect(() => {
    async function fetchViral() {
      try {
        const res = await fetch('/api/trending?limit=8')
        if (!res.ok) return
        const data = await res.json()
        if (data.videos) setViralVideos(data.videos)
      } catch { /* ignore */ }
    }
    fetchViral()
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

  // Switch to browse when searching in recipe mode
  useEffect(() => { if (searchQuery.trim() && searchMode === 'recipe') setView('browse') }, [searchQuery, searchMode])

  // Pantry match: filter recipes by ingredient input
  const pantryMatches = (() => {
    if (searchMode !== 'pantry' || !searchQuery.trim()) return []
    const terms = searchQuery.toLowerCase().split(',').map(t => t.trim()).filter(Boolean)
    if (terms.length === 0) return []
    const allRecipes = [...featuredRecipes, ...quickRecipes, ...(rotdRecipe ? [rotdRecipe] : [])]
    const unique = Array.from(new Map(allRecipes.map(r => [r.id, r])).values())
    return unique
      .map(r => {
        const items = getIngredientItems(r.ingredients)
        const total = items.length || 1
        // Count how many of the recipe's ingredients the user has
        const haveCount = items.filter(item => terms.some(term => item.name.toLowerCase().includes(term))).length
        const needCount = total - haveCount
        return { recipe: r, haveCount, needCount, totalIngredients: total, fraction: haveCount / total }
      })
      .filter(m => m.haveCount > 0)
      .sort((a, b) => b.fraction - a.fraction || a.needCount - b.needCount)
      .slice(0, 12)
  })()

  const activeCategoryName = activeCategory === 'all' ? 'All Recipes' : categories.find(c => c.id === activeCategory)?.name || 'All Recipes'
  const quickViewRecipe = quickViewId ? (recipes.find(r => r.id === quickViewId) || featuredRecipes.find(r => r.id === quickViewId) || quickRecipes.find(r => r.id === quickViewId) || (rotdRecipe?.id === quickViewId ? rotdRecipe : null)) : null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      {showOnboarding && (
        <OnboardingFlow onComplete={(profile: OnboardingProfile) => {
          setShowOnboarding(false)
        }} />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}input::placeholder{color:${C.text3}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.rule}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes modalIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes backdropIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: isMobile ? 'relative' : 'sticky', top: isMobile ? undefined : 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '12px 16px 10px' : '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setView('home'); setSearchQuery(''); setActiveCategory('all'); setMobileMenuOpen(false) }}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
              {!isMobile && <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>An open recipe commons</p>}
            </div>
            {/* Desktop nav */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, fontFamily: SANS }}>
                <Link href="/browse" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Browse</Link>
                <Link href="/community" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Community</Link>
                <Link href="/lists" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Lists</Link>
                <Link href="/trending" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 10 }}>🔥</span>Trending</Link>
                <Link href="/scan" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 10 }}>📷</span>Scan</Link>
                <Link href="/contribute" style={{ textDecoration: 'none', color: C.accent, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Contribute</Link>
                <div style={{ width: 1, height: 14, background: C.rule }} />
                <Link href="/pantry" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 13 }}>🛒</span><span style={{ fontSize: 11, fontWeight: 500 }}>Kitchen</span>
                </Link>
                <Link href="/profile" style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: C.text2 }}>
                  <RecipeBoxIcon /><span style={{ fontSize: 11, fontWeight: 500 }}>Profile</span>
                </Link>
                <ThemeToggle />
              </div>
            )}
            {/* Mobile nav controls */}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ThemeToggle />
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round">
                    {mobileMenuOpen
                      ? <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>
                      : <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>
                    }
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Mobile menu dropdown */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            borderTop: `1px solid ${C.rule}`, background: C.bg,
            padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {[
              { href: '/browse', label: 'Browse', icon: null },
              { href: '/community', label: 'Community', icon: null },
              { href: '/lists', label: 'Lists', icon: null },
              { href: '/trending', label: 'Trending', icon: '🔥' },
              { href: '/scan', label: 'Scan cookbook', icon: '📷' },
              { href: '/contribute', label: '+ Contribute', icon: null, accent: true },
              { href: '/pantry', label: 'Kitchen', icon: '🛒' },
              { href: '/profile', label: 'Profile', icon: null },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{
                textDecoration: 'none', padding: '10px 8px', borderRadius: 6,
                fontSize: 14, fontFamily: SANS, fontWeight: item.accent ? 600 : 500,
                color: item.accent ? C.accent : C.text2,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* SEARCH HERO */}
      <div ref={searchHeroRef} style={{ background: C.warm, borderBottom: `1px solid ${C.rule}`, padding: isMobile ? '20px 16px 12px' : '32px clamp(16px,4vw,24px) 16px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>
            {searchMode === 'recipe' ? 'What are you cooking today?' : "What's in your kitchen?"}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, marginBottom: 14 }}>
            {searchMode === 'recipe' ? `${totalCount} recipes · No life stories · Just food` : 'Type ingredients and we\'ll find what you can make'}
          </p>
          {/* Mode toggle */}
          <div style={{ display: 'inline-flex', borderRadius: 8, border: `1px solid ${C.rule}`, overflow: 'hidden', marginBottom: 16 }}>
            <button onClick={() => { setSearchMode('recipe'); setSearchQuery(''); setView('home') }} style={{
              padding: '7px 18px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: SANS,
              background: searchMode === 'recipe' ? C.text : 'transparent', color: searchMode === 'recipe' ? C.bg : C.text3,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              Find a recipe
            </button>
            <button onClick={() => { setSearchMode('pantry'); setSearchQuery(''); setView('home') }} style={{
              padding: '7px 18px', border: 'none', borderLeft: `1px solid ${C.rule}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: SANS,
              background: searchMode === 'pantry' ? C.text : 'transparent', color: searchMode === 'pantry' ? C.bg : C.text3,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 13 }}>🥬</span>
              Use what you have
            </button>
          </div>
          {/* Search input */}
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? C.accent : C.text3} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.15s' }}>
              {searchMode === 'recipe'
                ? <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>
                : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>
              }
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              placeholder={searchMode === 'recipe' ? 'Search by recipe, ingredient, or cuisine...' : 'Type ingredients: chicken, garlic, lemon...'}
              style={{ width: '100%', padding: isMobile ? '12px 14px 12px 40px' : '14px 18px 14px 46px', border: `2px solid ${searchMode === 'pantry' ? C.green : C.accent}`, borderRadius: 8, fontSize: isMobile ? 14 : 15, color: C.text, fontFamily: SANS, outline: 'none', background: C.warm, boxShadow: searchFocused ? `0 2px 16px ${searchMode === 'pantry' ? 'rgba(107,158,98,0.15)' : 'rgba(232,123,90,0.15)'}` : 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box', textAlign: 'center' }} />
          </div>
          {/* Quick tags — expand on focus */}
          {(searchFocused || searchQuery.trim()) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap', animation: 'fadeIn 0.15s ease' }}>
              {(searchMode === 'recipe'
                ? ['pasta', 'chicken', 'vegetarian', 'under 30 min', 'baking']
                : ['chicken, rice', 'pasta, tomato', 'eggs, cheese', 'ground beef', 'tofu, soy sauce']
              ).map(tag => (
                <button key={tag} onMouseDown={e => { e.preventDefault(); setSearchQuery(tag) }} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C.rule}`, background: 'transparent', color: C.text3, fontSize: 11, fontFamily: SANS, cursor: 'pointer' }}>{tag}</button>
              ))}
            </div>
          )}
          {/* Pantry count hint */}
          {searchMode === 'pantry' && pantryCount > 0 && !searchQuery.trim() && (
            <Link href="/pantry" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontFamily: SANS, color: C.green, fontWeight: 500, textDecoration: 'none' }}>
              You have {pantryCount} item{pantryCount !== 1 ? 's' : ''} saved · Start from your pantry →
            </Link>
          )}
        </div>
        {/* TICKER — below search */}
        <div style={{ maxWidth: 640, margin: '14px auto 0', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: SANS, flexShrink: 0 }}>Live</span>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, flexShrink: 0, animation: 'pulse 2s ease infinite' }} />
          <CookedRecentlyFeed />
        </div>
      </div>

      {/* PINNED SEARCH BAR — appears when hero scrolls out */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: C.bg, borderBottom: `1px solid ${C.rule}`,
        padding: '10px clamp(16px,4vw,24px)',
        transform: (searchPinned && !isMobile) ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.25s ease',
        pointerEvents: (searchPinned && !isMobile) ? 'auto' : 'none',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recipes…"
            style={{ width: '100%', padding: '10px 16px 10px 40px', border: `1.5px solid ${C.accent}44`, borderRadius: 8, fontSize: 14, color: C.text, fontFamily: SANS, outline: 'none', background: C.warm, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* ===== HOME VIEW — CAROUSEL ROWS ===== */}
      {view === 'home' && (() => {
        // Data prep
        const threads = communityThreads.length > 0
          ? communityThreads
          : THREADS.map(t => ({ id: t.id, title: t.title, tag: t.tag, author_display_name: t.author, reply_count: t.replies, upvote_count: t.upvotes, created_at: '', topReply: t.topReply }))
        const externals = externalRecipes.length > 0
          ? externalRecipes
          : EXTERNAL_RECIPES.map(e => ({ id: e.id, title: e.title, source_name: e.source, source_url: '#', description: null, cuisine: e.cuisine, time_estimate: e.time, matched_recipe_slug: e.similar?.slug || null }))

        // Pantry mode: show matches instead of carousels
        if (searchMode === 'pantry' && searchQuery.trim()) {
          return (
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px clamp(16px,4vw,24px)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Recipes you can make</h2>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{pantryMatches.length} match{pantryMatches.length !== 1 ? 'es' : ''}</span>
              </div>
              {pantryMatches.length === 0 && (
                <p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>No matches yet. Try adding more ingredients.</p>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {pantryMatches.map(m => {
                  const pct = Math.round((m.haveCount / m.totalIngredients) * 100)
                  const ready = m.needCount === 0
                  const circumference = 2 * Math.PI * 10 // r=10
                  const filled = circumference * (m.haveCount / m.totalIngredients)
                  return (
                  <div key={m.recipe.id} onClick={() => setQuickViewId(m.recipe.id)} style={{
                    width: isMobile ? '100%' : 200, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: `1px solid ${ready ? C.green : C.ruleLight}`, background: C.warm, position: 'relative',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    {/* Match badge — mini donut + actionable text */}
                    <div style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 2,
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 8px 4px 5px', borderRadius: 6,
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    }}>
                      {/* Mini donut chart */}
                      <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                        <circle cx="12" cy="12" r="10" fill="none"
                          stroke={ready ? '#6B9E62' : '#E8A44A'}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${filled} ${circumference}`}
                        />
                      </svg>
                      <span style={{ fontSize: 10, fontWeight: 600, fontFamily: SANS, color: '#fff', lineHeight: 1.2 }}>
                        {ready
                          ? 'Ready to cook!'
                          : m.needCount <= 3
                            ? `Need ${m.needCount} more`
                            : `Have ${m.haveCount}/${m.totalIngredients}`
                        }
                      </span>
                    </div>
                    <div style={{ width: '100%', height: isMobile ? 140 : 130, overflow: 'hidden', background: C.cool }}>
                      {m.recipe.image_url
                        ? <img src={m.recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        : <BrokenEggCard />
                      }
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.25, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{m.recipe.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <DifficultyBadge difficulty={m.recipe.difficulty} />
                        <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>{formatTime(m.recipe.time_total)}</span>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* 1. POPULAR RECIPES */}
            {featuredRecipes.length > 0 && (
              <CarouselRow title="Popular on RecDex" seeAllHref="/trending">
                {featuredRecipes.map(r => (
                  <CarouselRecipeCard key={r.id} recipe={r} onQuickView={setQuickViewId} isMobile={isMobile} saved={homeSavedIds.includes(r.id)} onToggleSave={toggleHomeSave} commentCount={commentCountsMap[r.id]} onCommentClick={() => openCommentDrawer('recipe', r.id, r.title)} />
                ))}
              </CarouselRow>
            )}

            {/* 2. FROM THE WEB — external recipes */}
            {externals.length > 0 && (
              <CarouselRow title="From the Web">
                {externals.map(ext => (
                  <CarouselExternalCard key={ext.id} ext={ext} isMobile={isMobile} commentCount={itemCommentCounts[`external:${ext.id}`] || 0} onCommentClick={() => openCommentDrawer('external', ext.id, ext.title)} />
                ))}
              </CarouselRow>
            )}

            {/* 3. RECIPE OF THE DAY */}
            {rotdRecipe && (
              <div style={{ padding: '24px clamp(16px,4vw,24px)', borderBottom: `1px solid ${C.ruleLight}`, animation: 'fadeIn 0.3s ease both' }}>
                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
                    <span style={{ fontSize: 9, fontWeight: 700, fontFamily: MONO, color: C.accent, textTransform: 'uppercase', letterSpacing: 1 }}>Recipe of the Day</span>
                  </div>
                  <Link href={`/recipe/${rotdRecipe.slug}`} style={{ display: 'block', borderRadius: 10, overflow: 'hidden', background: C.warm, marginBottom: 12, aspectRatio: '16/9' }}>
                    {rotdRecipe.image_url ? <img src={rotdRecipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <BrokenEggCard />}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <DifficultyBadge difficulty={rotdRecipe.difficulty} />
                    <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{formatTime(rotdRecipe.time_total)}</span>
                    {rotdRecipe.cuisine && <><span style={{ color: C.rule, fontSize: 8 }}>·</span><span style={{ fontSize: 10, fontFamily: SANS, color: C.text3 }}>{rotdRecipe.cuisine}</span></>}
                  </div>
                  <h3 onClick={() => setQuickViewId(rotdRecipe.id)} style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2, margin: '0 0 6px', cursor: 'pointer' }}>{rotdRecipe.title}</h3>
                  <p style={{ fontFamily: SERIF, fontSize: 14, color: C.text2, lineHeight: 1.6, margin: '0 0 12px' }}>{rotdRecipe.description}</p>
                  {TIPS[rotdRecipe.slug] && (
                    <div style={{ padding: '8px 12px', background: C.cool, borderRadius: 6, borderLeft: `3px solid ${C.accent}`, marginBottom: 12 }}>
                      <p style={{ fontSize: 12, color: C.text, fontFamily: SANS, lineHeight: 1.5, margin: 0 }}>
                        <span style={{ fontWeight: 600, color: C.accent }}>@{TIPS[rotdRecipe.slug].user}</span> {TIPS[rotdRecipe.slug].text}
                      </p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setQuickViewId(rotdRecipe.id)} style={{ padding: '10px 24px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Cook this</button>
                    <button onClick={() => toggleHomeSave(rotdRecipe.id)} style={{ padding: '10px 16px', borderRadius: 6, border: `1.5px solid ${homeSavedIds.includes(rotdRecipe.id) ? C.green : C.rule}`, background: homeSavedIds.includes(rotdRecipe.id) ? C.greenBg : 'transparent', color: homeSavedIds.includes(rotdRecipe.id) ? C.green : C.text3, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={homeSavedIds.includes(rotdRecipe.id) ? C.green : 'none'} stroke={homeSavedIds.includes(rotdRecipe.id) ? C.green : 'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      {homeSavedIds.includes(rotdRecipe.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. VIRAL — trending YouTube/TikTok recipe videos */}
            {viralVideos.length > 0 && (
              <CarouselRow title="Viral" seeAllHref="/trending">
                {viralVideos.map(v => (
                  <CarouselViralCard key={v.videoId} video={v} isMobile={isMobile} />
                ))}
              </CarouselRow>
            )}

            {/* 4b. COMMUNITY PICKS — user submissions (shows when available) */}
            {submissions.length > 0 && (
              <CarouselRow title="Community Picks" seeAllHref="/community">
                {submissions.map(sub => (
                  <CarouselCommunityCard key={sub.id} submission={sub} isMobile={isMobile} commentCount={itemCommentCounts[`community:${sub.id}`] || 0} onCommentClick={() => openCommentDrawer('community', sub.id, sub.title)} />
                ))}
              </CarouselRow>
            )}

            {/* 5. QUICK MEALS */}
            {quickRecipes.length > 0 && (
              <CarouselRow title="Quick Meals" seeAllHref="/browse">
                {quickRecipes.map(r => (
                  <CarouselRecipeCard key={r.id} recipe={r} onQuickView={setQuickViewId} isMobile={isMobile} saved={homeSavedIds.includes(r.id)} onToggleSave={toggleHomeSave} commentCount={commentCountsMap[r.id]} onCommentClick={() => openCommentDrawer('recipe', r.id, r.title)} />
                ))}
              </CarouselRow>
            )}

            {/* 6. COMMUNITY DISCUSSIONS — Reddit-style list */}
            {threads.length > 0 && (
              <div style={{ padding: '20px clamp(16px,4vw,24px) 8px' }}>
                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>Discussions</h2>
                    <Link href="/community" style={{ fontSize: 11, fontFamily: SANS, color: C.accent, fontWeight: 500, textDecoration: 'none' }}>See all →</Link>
                  </div>
                  <div style={{ borderRadius: 8, border: `1px solid ${C.ruleLight}`, overflow: 'hidden', background: C.warm }}>
                    {threads.map(t => (
                      <DiscussionListItem key={t.id} thread={t} hasRealData={communityThreads.length > 0} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. EXPLORE STRIP */}
            <div style={{ padding: '28px clamp(16px,4vw,24px) 8px' }}>
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Explore</h2>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{totalCount} recipes</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {[
                    { emoji: '🔥', label: 'Trending', href: '/trending' },
                    { emoji: '💬', label: 'Community', href: '/community' },
                    { emoji: '📖', label: 'Browse all', href: '/browse' },
                    { emoji: '📋', label: 'Lists', href: '/lists' },
                    { emoji: '📷', label: 'Scan a cookbook', href: '/scan' },
                    { emoji: '✏️', label: 'Contribute', href: '/contribute' },
                  ].map(link => (
                    <Link key={link.label} href={link.href} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 8,
                      background: C.warm, border: `1px solid ${C.ruleLight}`,
                      textDecoration: 'none', fontSize: 12, fontFamily: SANS, fontWeight: 500, color: C.text2,
                    }}>
                      <span style={{ fontSize: 14 }}>{link.emoji}</span>{link.label}
                    </Link>
                  ))}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, fontFamily: SANS, margin: '0 0 8px' }}>By cuisine</p>
                  <div style={{
                    display: isMobile ? 'grid' : 'flex',
                    ...(isMobile
                      ? { gridTemplateColumns: '1fr 1fr', gap: 6 }
                      : { gap: 6, flexWrap: 'wrap' as const }),
                  }}>
                    {categories.slice(0, 12).map(cat => (
                      <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setView('browse') }} style={{
                        padding: '7px 12px', borderRadius: 6, border: `1px solid ${C.ruleLight}`,
                        background: 'transparent', color: C.text2, fontSize: 11, fontFamily: SANS, cursor: 'pointer',
                        textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {cat.name} <span style={{ color: C.text3, fontFamily: MONO, fontSize: 9 }}>{cat.recipe_count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. COOKBOOKS */}
            <div style={{ padding: '0 clamp(16px,4vw,24px) 20px' }}>
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, fontFamily: SANS, margin: 0 }}>Essential cookbooks</p>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: C.text3 }}>via bookshop.org</span>
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                  {BOOKS.map((book, i) => {
                    const stats = bookStats[book.key] || { likes: 0, owns: 0 }
                    const bookComments = itemCommentCounts[`book:${book.key}`] || 0
                    return (
                      <div key={i} style={{ flexShrink: 0, width: 90 }}>
                        <div onClick={() => setSelectedBook(book)} style={{ cursor: 'pointer' }}>
                          <img src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`} alt={book.title}
                            style={{ width: 90, height: 135, borderRadius: 3, objectFit: 'cover', background: book.color, boxShadow: '1px 2px 6px rgba(0,0,0,0.1)' }} />
                          <p style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 600, color: C.text, margin: '5px 0 1px', lineHeight: 1.2 }}>{book.title}</p>
                          <p style={{ fontFamily: SANS, fontSize: 9, color: C.text3, margin: '0 0 3px' }}>{book.author}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); openCommentDrawer('book', book.key, book.title) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span style={{ fontSize: 9, fontFamily: MONO, color: C.accent, fontWeight: 600 }}>{bookComments}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* MISSION BANNER */}
            <div style={{ padding: '0 clamp(16px,4vw,24px) 24px' }}>
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div style={{ padding: '20px 24px', borderRadius: 8, background: C.warm, border: `1px solid ${C.ruleLight}`, textAlign: 'center' }}>
                  <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>Recipes belong to everyone</p>
                  <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, lineHeight: 1.5, margin: '0 0 10px' }}>Free, ad-free, open commons for cooking knowledge.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <Link href="/contribute" style={{ padding: '8px 18px', borderRadius: 6, background: C.text, color: C.bg, fontSize: 11, fontWeight: 600, fontFamily: SANS, textDecoration: 'none' }}>Contribute</Link>
                    <Link href="/about" style={{ padding: '8px 18px', borderRadius: 6, border: `1px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 11, fontWeight: 500, fontFamily: SANS, textDecoration: 'none' }}>Learn more</Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )
      })()}

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
                <div style={{ height: 1.5, background: C.rule, marginTop: 8 }} />
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

      {/* BOOK DETAIL MODAL */}
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}

      {/* SUBMIT MODAL */}
      {showSubmitModal && <SubmitModal
        onClose={() => setShowSubmitModal(false)}
        onSubmitted={(sub) => {
          if (sub) setSubmissions(prev => [sub, ...prev])
          supabase.from('recipes').select('*').eq('source', 'community').eq('status', 'published').order('created_at', { ascending: false }).limit(6)
            .then(({ data }) => { if (data) setCommunityRecipes(data) })
        }}
        categories={categories}
      />}

      {/* COMMENT DRAWER */}
      {commentDrawer && (
        <CommentDrawer
          itemType={commentDrawer.itemType}
          itemId={commentDrawer.itemId}
          itemTitle={commentDrawer.itemTitle}
          onClose={() => {
            setCommentDrawer(null)
            fetchItemCommentCounts()
            // Refresh recipe comment counts too
            supabase.from('comments').select('recipe_id').then(({ data }) => {
              if (data) {
                const counts: Record<string, number> = {}
                for (const c of data) counts[c.recipe_id] = (counts[c.recipe_id] || 0) + 1
                setCommentCountsMap(counts)
              }
            })
          }}
        />
      )}

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
              <p style={{ margin: 0 }}><Link href="/contribute" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>Contribute</Link> · <Link href="/trending" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>Trending</Link> · <Link href="/about" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>About</Link></p>
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