'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

// ===== TYPES =====
type Recipe = {
  slug: string
  title: string
  image_url: string | null
  photo_credit: string | null
  cuisine: string | null
  source_attribution: string | null
  created_at: string
  ingredients?: { name: string; amount: string; unit: string }[]
  steps?: { step: number; text: string }[]
}

type UnsplashImage = {
  url: string
  thumb: string
  credit: string
}

// ===== HELPERS =====
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ===== MAIN PAGE =====
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('recdex-admin-auth')
    if (stored) setAuthed(true)
    setCheckingAuth(false)
  }, [])

  async function handleLogin() {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', password }),
      })
      if (res.ok) {
        localStorage.setItem('recdex-admin-auth', password)
        setAuthed(true)
      } else {
        setAuthError('Invalid password')
      }
    } catch {
      setAuthError('Connection error')
    }
    setAuthLoading(false)
  }

  if (checkingAuth) return null

  if (!authed) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 12, padding: 40, maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 24, color: C.text, margin: '0 0 8px' }}>RecDex Admin</h1>
          <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 24px' }}>Enter password to continue</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 6,
              padding: '10px 14px', fontFamily: SANS, fontSize: 14, color: C.text,
              outline: 'none', marginBottom: 12,
            }}
          />
          {authError && <p style={{ fontFamily: SANS, fontSize: 12, color: C.accent, margin: '0 0 12px' }}>{authError}</p>}
          <button
            onClick={handleLogin}
            disabled={authLoading || !password}
            style={{
              width: '100%', background: C.text, color: C.bg, border: 'none', borderRadius: 6,
              padding: '10px 0', fontFamily: SANS, fontSize: 13, fontWeight: 600,
              cursor: authLoading ? 'wait' : 'pointer', opacity: authLoading ? 0.6 : 1,
            }}
          >
            {authLoading ? 'Checking...' : 'Sign In'}
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboard password={localStorage.getItem('recdex-admin-auth') || ''} onLogout={() => { localStorage.removeItem('recdex-admin-auth'); setAuthed(false) }} />
}

// ===== DASHBOARD =====
function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [tab, setTab] = useState<'photos' | 'recipes'>('photos')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [unsplashKey, setUnsplashKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Load Unsplash key from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recdex-unsplash-key')
    if (stored) setUnsplashKey(stored)
  }, [])

  const loadRecipes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select('slug, title, image_url, photo_credit, cuisine, source_attribution, created_at, ingredients, steps')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (!error && data) setRecipes(data as Recipe[])
    setLoading(false)
  }, [])

  useEffect(() => { loadRecipes() }, [loadRecipes])

  const pad = 'clamp(16px, 4vw, 24px)'

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* Header */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, background: C.bg, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: `14px ${pad}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>RecDex Admin</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {(['photos', 'recipes'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? C.accentBg : 'transparent',
                  border: `1px solid ${tab === t ? C.accent : 'transparent'}`,
                  color: tab === t ? C.accent : C.text2,
                  borderRadius: 6, padding: '6px 16px',
                  fontFamily: MONO, fontSize: 11, cursor: 'pointer',
                  textTransform: 'capitalize', letterSpacing: '0.03em',
                }}
              >
                {t}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: C.rule, margin: '0 8px' }} />
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
              style={{ background: showSettings ? C.accentBg : 'none', border: showSettings ? `1px solid ${C.accent}` : '1px solid transparent', color: showSettings ? C.accent : C.text3, borderRadius: 6, padding: '5px 8px', fontSize: 14, cursor: 'pointer' }}
            >⚙</button>
            <button onClick={onLogout} style={{ background: 'none', border: 'none', color: C.text3, fontFamily: MONO, fontSize: 10, cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ background: C.warm, borderBottom: `1px solid ${C.rule}`, padding: `16px ${pad}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h3 style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Settings</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontFamily: SANS, fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>Unsplash Access Key</label>
              <input
                type="text"
                value={unsplashKey}
                onChange={e => setUnsplashKey(e.target.value)}
                placeholder="Paste your Unsplash Access Key..."
                style={{
                  flex: 1, minWidth: 240, background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 6,
                  padding: '8px 12px', fontFamily: MONO, fontSize: 11, color: C.text, outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  localStorage.setItem('recdex-unsplash-key', unsplashKey.trim())
                  setShowSettings(false)
                }}
                style={{
                  background: C.text, color: C.bg, border: 'none', borderRadius: 6,
                  padding: '8px 16px', fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >Save</button>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '8px 0 0' }}>
              Get a free key at <span style={{ color: C.text2 }}>unsplash.com/developers</span> → New Application → Access Key
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `24px ${pad} 80px` }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>Loading recipes</span>
          </div>
        ) : tab === 'photos' ? (
          <PhotoReview recipes={recipes} password={password} onUpdate={loadRecipes} unsplashKey={unsplashKey} />
        ) : (
          <RecipeManagement recipes={recipes} password={password} onUpdate={loadRecipes} />
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${C.text3}; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

const APPROVED_KEY = 'recdex-photo-approved'

function loadApproved(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(APPROVED_KEY) || '[]')) }
  catch { return new Set() }
}
function saveApproved(set: Set<string>) {
  localStorage.setItem(APPROVED_KEY, JSON.stringify(Array.from(set)))
}

// ===== PHOTO REVIEW TAB =====
function PhotoReview({ recipes, password, onUpdate, unsplashKey }: { recipes: Recipe[]; password: string; onUpdate: () => void; unsplashKey: string }) {
  const [filter, setFilter] = useState<'all' | 'has' | 'none' | 'nocredit' | 'approved' | 'pending'>('pending')
  const [page, setPage] = useState(0)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const perPage = 24

  useEffect(() => { setApproved(loadApproved()) }, [])

  const handleApprove = (slug: string) => {
    setApproved(prev => {
      const next = new Set(prev)
      next.add(slug)
      saveApproved(next)
      return next
    })
    // Auto-advance: close expand if open
    setExpandedSlug(s => s === slug ? null : s)
  }

  const handleUnapprove = (slug: string) => {
    setApproved(prev => {
      const next = new Set(prev)
      next.delete(slug)
      saveApproved(next)
      return next
    })
  }

  const withImage = recipes.filter(r => r.image_url)
  const noImage = recipes.filter(r => !r.image_url)
  const noCredit = recipes.filter(r => r.image_url && !r.photo_credit)
  const approvedList = recipes.filter(r => approved.has(r.slug))
  const pendingList = recipes.filter(r => !approved.has(r.slug))

  const filtered = useMemo(() => {
    if (filter === 'has') return withImage
    if (filter === 'none') return noImage
    if (filter === 'nocredit') return noCredit
    if (filter === 'approved') return approvedList
    if (filter === 'pending') return pendingList
    return recipes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, recipes, approved])

  const totalPages = Math.ceil(filtered.length / perPage)
  const pageRecipes = filtered.slice(page * perPage, (page + 1) * perPage)

  useEffect(() => { setPage(0) }, [filter])

  const pct = recipes.length > 0 ? Math.round((approved.size / recipes.length) * 100) : 0

  return (
    <>
      {/* Audit progress bar */}
      <div style={{ marginBottom: 20, padding: '14px 16px', background: C.warm, borderRadius: 8, border: `1px solid ${C.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Stat label="Total" value={recipes.length} color={C.text} />
            <Stat label="Approved" value={approved.size} color={C.green} />
            <Stat label="Pending" value={pendingList.length} color={C.gold} />
            <Stat label="No Image" value={noImage.length} color={C.accent} />
            <Stat label="No Credit" value={noCredit.length} color={C.text3} />
          </div>
          <button
            onClick={() => { setApproved(new Set()); saveApproved(new Set()) }}
            style={{ background: 'none', border: `1px solid ${C.rule}`, color: C.text3, borderRadius: 6, padding: '4px 10px', fontFamily: MONO, fontSize: 9, cursor: 'pointer' }}
          >Reset audit</button>
        </div>
        <div style={{ height: 6, background: C.rule, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: C.green, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, marginTop: 4, display: 'block' }}>{pct}% reviewed</span>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {([
          { key: 'pending' as const, label: 'Needs Review', count: pendingList.length, activeColor: C.gold },
          { key: 'all' as const, label: 'All', count: recipes.length, activeColor: C.accent },
          { key: 'approved' as const, label: 'Approved', count: approvedList.length, activeColor: C.green },
          { key: 'nocredit' as const, label: 'No Credit', count: noCredit.length, activeColor: C.text2 },
          { key: 'none' as const, label: 'No Image', count: noImage.length, activeColor: C.accent },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? `${f.activeColor}18` : C.warm,
              border: `1px solid ${filter === f.key ? f.activeColor : C.rule}`,
              color: filter === f.key ? f.activeColor : C.text2,
              borderRadius: 20, padding: '5px 14px',
              fontFamily: MONO, fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {f.label}
            <span style={{
              background: filter === f.key ? f.activeColor : C.rule,
              color: filter === f.key ? C.bg : C.text3,
              borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {pageRecipes.map(recipe => (
          <PhotoCard
            key={recipe.slug}
            recipe={recipe}
            expanded={expandedSlug === recipe.slug}
            isApproved={approved.has(recipe.slug)}
            onApprove={() => handleApprove(recipe.slug)}
            onUnapprove={() => handleUnapprove(recipe.slug)}
            onToggleExpand={() => setExpandedSlug(expandedSlug === recipe.slug ? null : recipe.slug)}
            password={password}
            onUpdate={onUpdate}
            unsplashKey={unsplashKey}
          />
        ))}
      </div>

      {pageRecipes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3 }}>
            {filter === 'pending' ? 'All photos approved!' : 'No recipes match this filter.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '6px 16px', fontFamily: MONO, fontSize: 11, cursor: page === 0 ? 'default' : 'pointer', color: page === 0 ? C.text3 : C.text, opacity: page === 0 ? 0.5 : 1 }}
          >Prev</button>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '6px 16px', fontFamily: MONO, fontSize: 11, cursor: page >= totalPages - 1 ? 'default' : 'pointer', color: page >= totalPages - 1 ? C.text3 : C.text, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >Next</button>
        </div>
      )}
    </>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

// ===== PHOTO CARD =====
function PhotoCard({ recipe, expanded, isApproved, onApprove, onUnapprove, onToggleExpand, password, onUpdate, unsplashKey }: {
  recipe: Recipe; expanded: boolean; isApproved: boolean
  onApprove: () => void; onUnapprove: () => void
  onToggleExpand: () => void; password: string; onUpdate: () => void; unsplashKey: string
}) {
  const [images, setImages] = useState<UnsplashImage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [selectedCredit, setSelectedCredit] = useState<string | null>(null)
  const [replacing, setReplacing] = useState(false)

  async function searchImages(q: string) {
    setSearchLoading(true)
    try {
      const keyParam = unsplashKey ? `&key=${encodeURIComponent(unsplashKey)}` : ''
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(q)}${keyParam}`)
      const data = await res.json()
      setImages(data.images || [])
    } catch { /* ignore */ }
    setSearchLoading(false)
  }

  function handleOpenReplace() {
    if (!expanded) {
      searchImages(recipe.title)
      setSearchQuery(recipe.title)
      setSelectedUrl(null)
      setSelectedCredit(null)
    }
    onToggleExpand()
  }

  async function handleReplace() {
    if (!selectedUrl) return
    setReplacing(true)
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-image', password, slug: recipe.slug, image_url: selectedUrl, photo_credit: selectedCredit }),
      })
      onUpdate()
      onApprove()
    } catch { /* ignore */ }
    setReplacing(false)
  }

  const borderColor = isApproved ? C.green : expanded ? C.gold : C.rule

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${borderColor}`, background: C.warm, transition: 'border-color 0.2s' }}>
      {/* Thumbnail */}
      <div style={{ width: '100%', height: 130, background: C.cool, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
        ) : (
          <EggPlaceholder />
        )}
        {isApproved && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: C.green, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <h4 style={{
          fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 4px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3,
        }}>{recipe.title}</h4>
        {/* Photo credit line */}
        <div style={{ fontFamily: MONO, fontSize: 9, color: recipe.photo_credit ? C.text3 : C.accent, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {recipe.photo_credit ? `© ${recipe.photo_credit}` : recipe.image_url ? 'Missing credit' : 'No image'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={isApproved ? onUnapprove : onApprove}
            title={isApproved ? 'Undo approval' : 'Approve image'}
            style={{ flex: 1, background: isApproved ? C.greenBg : C.warm, border: `1px solid ${isApproved ? C.green : C.rule}`, color: isApproved ? C.green : C.text3, borderRadius: 4, padding: '5px 0', fontSize: 14, cursor: 'pointer', fontWeight: 700, transition: 'all 0.15s' }}
          >&#10003;</button>
          <button
            onClick={handleOpenReplace}
            title="Search for replacement"
            style={{ flex: 1, background: expanded ? C.accentBg : C.warm, border: `1px solid ${expanded ? C.accent : C.rule}`, color: expanded ? C.accent : C.text3, borderRadius: 4, padding: '5px 0', fontSize: 14, cursor: 'pointer', fontWeight: 700, transition: 'all 0.15s' }}
          >&#8635;</button>
        </div>
      </div>

      {/* Expanded replace panel */}
      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${C.ruleLight}` }}>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 10 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchImages(searchQuery)}
              placeholder="Search images..."
              style={{
                flex: 1, background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 4,
                padding: '6px 10px', fontFamily: SANS, fontSize: 12, color: C.text, outline: 'none',
              }}
            />
            <button
              onClick={() => searchImages(searchQuery)}
              style={{ background: C.text, color: C.bg, border: 'none', borderRadius: 4, padding: '6px 12px', fontFamily: MONO, fontSize: 10, cursor: 'pointer' }}
            >Go</button>
          </div>

          {searchLoading ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>Searching...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedUrl(img.url); setSelectedCredit(img.credit) }}
                  style={{
                    borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${selectedUrl === img.url ? C.accent : 'transparent'}`,
                    opacity: selectedUrl && selectedUrl !== img.url ? 0.5 : 1,
                    transition: 'opacity 0.15s, border-color 0.15s',
                  }}
                >
                  <img src={img.thumb} alt={`Option ${i + 1}`} style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '2px 4px', fontFamily: MONO, fontSize: 8, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {img.credit}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUrl && (
            <button
              onClick={handleReplace}
              disabled={replacing}
              style={{
                width: '100%', marginTop: 10, background: C.green, color: '#fff', border: 'none',
                borderRadius: 4, padding: '7px 0', fontFamily: SANS, fontSize: 12, fontWeight: 600,
                cursor: replacing ? 'wait' : 'pointer', opacity: replacing ? 0.6 : 1,
              }}
            >
              {replacing ? 'Saving...' : `Use this — ${selectedCredit || 'no credit'}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function EggPlaceholder() {
  return (
    <svg width="40" height="50" viewBox="0 0 40 50" fill="none" style={{ opacity: 0.25 }}>
      <ellipse cx="20" cy="30" rx="16" ry="20" fill={C.rule} />
    </svg>
  )
}

// ===== RECIPE MANAGEMENT TAB =====
function RecipeManagement({ recipes, password, onUpdate }: { recipes: Recipe[]; password: string; onUpdate: () => void }) {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const perPage = 50

  const sources = useMemo(() => {
    const s = new Set<string>()
    recipes.forEach(r => { if (r.source_attribution) s.add(r.source_attribution) })
    return Array.from(s).sort()
  }, [recipes])

  const filtered = useMemo(() => {
    let result = recipes
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r => r.title.toLowerCase().includes(q))
    }
    if (sourceFilter !== 'all') {
      result = result.filter(r => r.source_attribution === sourceFilter)
    }
    return result
  }, [recipes, search, sourceFilter])

  const totalPages = Math.ceil(filtered.length / perPage)
  const pageRecipes = filtered.slice(page * perPage, (page + 1) * perPage)

  useEffect(() => { setPage(0) }, [search, sourceFilter])

  async function handleDelete(slug: string) {
    setDeleting(true)
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-recipe', password, slug }),
      })
      setConfirmDelete(null)
      onUpdate()
    } catch { /* ignore */ }
    setDeleting(false)
  }

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title..."
          style={{
            flex: 1, minWidth: 200, background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6,
            padding: '9px 14px', fontFamily: SANS, fontSize: 13, color: C.text, outline: 'none',
          }}
        />
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{
            background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6,
            padding: '9px 14px', fontFamily: MONO, fontSize: 11, color: C.text, outline: 'none',
            cursor: 'pointer', minWidth: 160,
          }}
        >
          <option value="all">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <p style={{ fontFamily: MONO, fontSize: 10, color: C.text3, marginBottom: 12 }}>
        {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div style={{ borderRadius: 8, border: `1px solid ${C.rule}`, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 40px', gap: 0, padding: '8px 14px', background: C.cool, borderBottom: `1px solid ${C.rule}` }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Title</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Source</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Cuisine</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Date</span>
          <span />
        </div>

        {pageRecipes.map(recipe => (
          <div key={recipe.slug}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 40px', gap: 0,
              padding: '10px 14px', borderBottom: `1px solid ${C.ruleLight}`,
              background: expandedSlug === recipe.slug ? C.warm : 'transparent',
              alignItems: 'center',
            }}>
              <span
                onClick={() => setExpandedSlug(expandedSlug === recipe.slug ? null : recipe.slug)}
                style={{ fontFamily: SERIF, fontSize: 13, color: C.text, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}
                title={recipe.title}
              >
                {recipe.title}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {recipe.source_attribution || '—'}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                {recipe.cuisine?.split(/[,/]/)[0].trim() || '—'}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                {formatDate(recipe.created_at)}
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {confirmDelete === recipe.slug ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => handleDelete(recipe.slug)}
                      disabled={deleting}
                      style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', fontFamily: MONO, fontSize: 9, cursor: 'pointer' }}
                    >Delete</button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ background: C.rule, color: C.text2, border: 'none', borderRadius: 3, padding: '3px 8px', fontFamily: MONO, fontSize: 9, cursor: 'pointer' }}
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(recipe.slug)}
                    title="Delete recipe"
                    style={{ background: C.accentBg, border: `1px solid ${C.accent}`, color: C.accent, borderRadius: 4, padding: '2px 8px', fontSize: 12, cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}
                  >&#10007;</button>
                )}
              </div>
            </div>

            {/* Expanded preview */}
            {expandedSlug === recipe.slug && (
              <div style={{ padding: '12px 14px 16px', background: C.warm, borderBottom: `1px solid ${C.rule}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Ingredients */}
                  <div>
                    <h5 style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Ingredients</h5>
                    {recipe.ingredients && Array.isArray(recipe.ingredients) ? (
                      <ul style={{ margin: 0, padding: '0 0 0 16px', fontFamily: SANS, fontSize: 12, color: C.text2, lineHeight: 1.8 }}>
                        {flattenIngredients(recipe.ingredients).slice(0, 12).map((ing, i) => (
                          <li key={i}>{ing.amount} {ing.unit} {ing.name}</li>
                        ))}
                        {flattenIngredients(recipe.ingredients).length > 12 && (
                          <li style={{ color: C.text3, fontStyle: 'italic' }}>+{flattenIngredients(recipe.ingredients).length - 12} more</li>
                        )}
                      </ul>
                    ) : <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0 }}>No ingredients data</p>}
                  </div>
                  {/* Steps */}
                  <div>
                    <h5 style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Steps (first 3)</h5>
                    {recipe.steps && Array.isArray(recipe.steps) ? (
                      <ol style={{ margin: 0, padding: '0 0 0 20px', fontFamily: SANS, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                        {recipe.steps.slice(0, 3).map((step, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>{typeof step === 'object' && step.text ? step.text : String(step)}</li>
                        ))}
                        {recipe.steps.length > 3 && (
                          <li style={{ color: C.text3, fontStyle: 'italic', listStyle: 'none', marginLeft: -20 }}>+{recipe.steps.length - 3} more steps</li>
                        )}
                      </ol>
                    ) : <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0 }}>No steps data</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {pageRecipes.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3 }}>No recipes match your filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '6px 16px', fontFamily: MONO, fontSize: 11, cursor: page === 0 ? 'default' : 'pointer', color: page === 0 ? C.text3 : C.text, opacity: page === 0 ? 0.5 : 1 }}
          >Prev</button>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '6px 16px', fontFamily: MONO, fontSize: 11, cursor: page >= totalPages - 1 ? 'default' : 'pointer', color: page >= totalPages - 1 ? C.text3 : C.text, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >Next</button>
        </div>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenIngredients(ingredients: any[]): { name: string; amount: string; unit: string }[] {
  if (!ingredients || ingredients.length === 0) return []
  if (ingredients[0]?.group) return ingredients.flatMap((g: { items: { name: string; amount: string; unit: string }[] }) => g.items || [])
  return ingredients
}
