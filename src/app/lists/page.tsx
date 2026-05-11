'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT } from '@/app/lib/theme'
import { formatTime, shuffle } from '@/app/lib/format'
import SiteHeader from '@/app/components/SiteHeader'

// ===== TYPES =====
type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; difficulty: string
  time_total: number | null; image_url: string | null
}

type UserList = {
  id: string; name: string; description: string
  recipeIds: string[]; createdAt: number; updatedAt: number
}

type AutoList = {
  key: string; name: string; subtitle: string; emoji: string
  accentColor: string; bgColor: string
  recipes: Recipe[]
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

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// ===== MAIN PAGE =====
export default function ListsPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)

  // Auto-generated lists
  const [autoLists, setAutoLists] = useState<AutoList[]>([])

  // User-created lists
  const [userLists, setUserLists] = useState<UserList[]>([])
  const [userListRecipes, setUserListRecipes] = useState<Map<string, Recipe>>(new Map())

  // Create / edit list UI
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingList, setEditingList] = useState<UserList | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [recipeSearch, setRecipeSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Recipe[]>([])
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Expanded auto list
  const [expandedAutoList, setExpandedAutoList] = useState<string | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load auto-generated lists from Supabase
  useEffect(() => {
    async function loadAutoLists() {
      try {
        // Fetch all recipes
        const { data: allRecipes } = await supabase
          .from('recipes')
          .select('id, slug, title, description, cuisine, difficulty, time_total, image_url')
          .eq('status', 'published')

        if (!allRecipes) { setLoading(false); return }

        // Fetch comment counts per recipe
        const { data: comments } = await supabase
          .from('comments')
          .select('recipe_id')

        const commentCounts = new Map<string, number>()
        if (comments) {
          comments.forEach(c => commentCounts.set(c.recipe_id, (commentCounts.get(c.recipe_id) || 0) + 1))
        }

        const lists: AutoList[] = []

        // 1. Most Discussed — recipes with most comments
        const discussed = [...allRecipes]
          .filter(r => commentCounts.has(r.id))
          .sort((a, b) => (commentCounts.get(b.id) || 0) - (commentCounts.get(a.id) || 0))
          .slice(0, 10)
        if (discussed.length > 0) {
          lists.push({
            key: 'most-discussed', name: 'Most Discussed', subtitle: 'Recipes with the most community notes',
            emoji: '💬', accentColor: C.accent, bgColor: C.accentBg, recipes: discussed,
          })
        }

        // 2. Quick Weeknight Meals — under 30 min
        const quick = shuffle(allRecipes.filter(r => r.time_total && r.time_total <= 30)).slice(0, 10)
        if (quick.length > 0) {
          lists.push({
            key: 'quick-meals', name: 'Quick Weeknight Meals', subtitle: 'Ready in 30 minutes or less',
            emoji: '⚡', accentColor: C.gold, bgColor: C.goldBg, recipes: quick,
          })
        }

        // 3. Weekend Projects — longer/harder recipes
        const weekend = shuffle(allRecipes.filter(r => (r.time_total && r.time_total >= 60) || ['hard', 'difficult', 'advanced'].includes(r.difficulty?.toLowerCase()))).slice(0, 10)
        if (weekend.length > 0) {
          lists.push({
            key: 'weekend-projects', name: 'Weekend Projects', subtitle: 'Worth the extra time and effort',
            emoji: '🍖', accentColor: C.green, bgColor: C.greenBg, recipes: weekend,
          })
        }

        // 4. Beginner Friendly — easy recipes
        const beginner = shuffle(allRecipes.filter(r => ['easy', 'simple', 'beginner'].includes(r.difficulty?.toLowerCase()))).slice(0, 10)
        if (beginner.length > 0) {
          lists.push({
            key: 'beginner-friendly', name: 'Beginner Friendly', subtitle: 'Great first recipes to build confidence',
            emoji: '🌱', accentColor: C.green, bgColor: C.greenBg, recipes: beginner,
          })
        }

        // 5. Around the World — one from each cuisine
        const cuisineMap = new Map<string, Recipe>()
        allRecipes.forEach(r => {
          if (r.cuisine && !cuisineMap.has(r.cuisine)) cuisineMap.set(r.cuisine, r)
        })
        const world = Array.from(cuisineMap.values()).slice(0, 10)
        if (world.length >= 5) {
          lists.push({
            key: 'around-the-world', name: 'Around the World', subtitle: 'One dish from every cuisine',
            emoji: '🌍', accentColor: C.blue, bgColor: C.blueBg, recipes: world,
          })
        }

        setAutoLists(lists)
      } catch (err) {
        console.error('Lists load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAutoLists()
  }, [])

  // Load user lists from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('recdex-lists')
    if (raw) {
      try {
        const parsed: UserList[] = JSON.parse(raw)
        setUserLists(parsed)
        // Load recipe data for all recipes in user lists
        const allIds = parsed.flatMap(l => l.recipeIds)
        if (allIds.length > 0) {
          supabase.from('recipes').select('id, slug, title, description, cuisine, difficulty, time_total, image_url')
            .in('id', [...new Set(allIds)])
            .then(({ data }) => {
              if (data) {
                const map = new Map<string, Recipe>()
                data.forEach(r => map.set(r.id, r))
                setUserListRecipes(map)
              }
            })
        }
      } catch { /* ignore */ }
    }
  }, [])

  const saveUserLists = (lists: UserList[]) => {
    setUserLists(lists)
    localStorage.setItem('recdex-lists', JSON.stringify(lists))
  }

  // Recipe search for list creation
  useEffect(() => {
    if (recipeSearch.length < 2) { setSearchResults([]); return }
    const timer = setTimeout(() => {
      supabase.from('recipes').select('id, slug, title, description, cuisine, difficulty, time_total, image_url')
        .eq('status', 'published').ilike('title', `%${recipeSearch}%`).limit(8)
        .then(({ data }) => { if (data) setSearchResults(data) })
    }, 200)
    return () => clearTimeout(timer)
  }, [recipeSearch])

  const openCreateModal = (list?: UserList) => {
    if (list) {
      setEditingList(list)
      setNewListName(list.name)
      setNewListDesc(list.description)
      setSelectedRecipeIds([...list.recipeIds])
    } else {
      setEditingList(null)
      setNewListName('')
      setNewListDesc('')
      setSelectedRecipeIds([])
    }
    setRecipeSearch('')
    setSearchResults([])
    setShowCreateModal(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const saveList = () => {
    const name = newListName.trim()
    if (!name) return
    const now = Date.now()

    if (editingList) {
      // Update existing
      const updated = userLists.map(l =>
        l.id === editingList.id ? { ...l, name, description: newListDesc.trim(), recipeIds: selectedRecipeIds, updatedAt: now } : l
      )
      saveUserLists(updated)
      // Update recipe cache
      searchResults.forEach(r => {
        if (selectedRecipeIds.includes(r.id)) {
          setUserListRecipes(prev => new Map(prev).set(r.id, r))
        }
      })
    } else {
      // Create new
      const newList: UserList = {
        id: crypto.randomUUID(), name, description: newListDesc.trim(),
        recipeIds: selectedRecipeIds, createdAt: now, updatedAt: now,
      }
      saveUserLists([newList, ...userLists])
      // Update recipe cache
      searchResults.forEach(r => {
        if (selectedRecipeIds.includes(r.id)) {
          setUserListRecipes(prev => new Map(prev).set(r.id, r))
        }
      })
    }
    setShowCreateModal(false)
  }

  const deleteList = (listId: string) => {
    saveUserLists(userLists.filter(l => l.id !== listId))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <SiteHeader />

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title */}
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 700, color: C.text, margin: '0 0 4px', letterSpacing: -0.5 }}>
                Lists
              </h2>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: 0 }}>
                Curated collections for every kind of cook.
              </p>
            </div>
            <button onClick={() => openCreateModal()} style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: C.text, color: C.bg, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New List
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              <span style={{ fontFamily: SANS, fontSize: 14, color: C.text3 }}>Loading lists...</span>
            </div>
          </div>
        ) : (
          <>
            {/* ========== AUTO-GENERATED LISTS ========== */}
            <section style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>RecDex Picks</h3>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AUTO-GENERATED</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                {autoLists.map((list, i) => {
                  const isExpanded = expandedAutoList === list.key
                  return (
                    <div key={list.key} style={{
                      background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 12,
                      overflow: 'hidden', animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                      cursor: 'pointer',
                    }}
                      onClick={() => setExpandedAutoList(isExpanded ? null : list.key)}
                    >
                      {/* Card header */}
                      <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{
                          fontSize: 24, lineHeight: 1, flexShrink: 0,
                          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: list.bgColor, borderRadius: 10,
                        }}>{list.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 2px' }}>
                            {list.name}
                          </h4>
                          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: 0 }}>{list.subtitle}</p>
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: list.accentColor, fontWeight: 600 }}>{list.recipes.length} recipes</span>
                            <span style={{ fontSize: 10, color: C.text3 }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded recipe list */}
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${C.ruleLight}`, padding: '8px 0' }}>
                          {list.recipes.map((r, ri) => (
                            <Link key={r.id} href={`/recipe/${r.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 18px',
                                background: ri % 2 === 0 ? 'transparent' : `${C.bg}80`,
                              }}>
                              <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, width: 20, textAlign: 'right', flexShrink: 0 }}>{ri + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{
                                  fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                                }}>
                                  {r.title}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {r.time_total && (
                                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{formatTime(r.time_total)}</span>
                                )}
                                {r.difficulty && (() => {
                                  const d = DIFFICULTY_MAP[r.difficulty?.toLowerCase()] || DIFFICULTY_MAP.easy
                                  return <span style={{ fontSize: 8, fontFamily: MONO, fontWeight: 700, color: d.color, background: d.bg, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>{d.label}</span>
                                })()}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ========== USER LISTS ========== */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Your Lists</h3>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{userLists.length}</span>
              </div>

              {userLists.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 20px', background: C.warm,
                  borderRadius: 12, border: `1.5px dashed ${C.ruleLight}`,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }}>📋</div>
                  <h4 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>No lists yet</h4>
                  <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 20px', lineHeight: 1.6 }}>
                    Create your first list — meal prep ideas, date night dinners, or recipes to try this month.
                  </p>
                  <button onClick={() => openCreateModal()} style={{
                    padding: '10px 24px', borderRadius: 6, border: 'none',
                    background: C.text, color: C.bg, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: SANS,
                  }}>Create a list</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {userLists.map((list, i) => {
                    const recipes = list.recipeIds.map(id => userListRecipes.get(id)).filter(Boolean) as Recipe[]
                    return (
                      <div key={list.id} style={{
                        background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 12,
                        overflow: 'hidden', animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                      }}>
                        <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          {/* Poster stack — first 3 recipes as mini tiles */}
                          <div style={{ position: 'relative', width: 48, height: 56, flexShrink: 0 }}>
                            {[2, 1, 0].map(offset => (
                              <div key={offset} style={{
                                position: 'absolute',
                                top: offset * 3, left: offset * 3,
                                width: 42, height: 50, borderRadius: 6,
                                background: offset < recipes.length ? `${C.accent}${15 + offset * 8}` : C.ruleLight,
                                border: `1px solid ${C.ruleLight}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 3 - offset,
                              }}>
                                {offset === 0 && recipes.length > 0 && (
                                  <span style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 700, color: C.text, textAlign: 'center', padding: 2, lineHeight: 1.1, overflow: 'hidden' }}>
                                    {recipes[0].title.split(' ').slice(0, 2).join(' ')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 2px' }}>
                              {list.name}
                            </h4>
                            {list.description && (
                              <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: '0 0 6px', lineHeight: 1.4 }}>{list.description}</p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: MONO, fontSize: 10, color: C.accent, fontWeight: 600 }}>{list.recipeIds.length} recipes</span>
                              <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3 }}>
                                Updated {new Date(list.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Preview recipe titles */}
                            {recipes.length > 0 && (
                              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {recipes.slice(0, 4).map(r => (
                                  <Link key={r.id} href={`/recipe/${r.slug}`} style={{
                                    textDecoration: 'none', fontFamily: SANS, fontSize: 11, color: C.text2,
                                    background: C.bg, padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.ruleLight}`,
                                  }}>
                                    {r.title}
                                  </Link>
                                ))}
                                {recipes.length > 4 && (
                                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, padding: '2px 4px' }}>+{recipes.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                            <button onClick={() => openCreateModal(list)} style={{
                              background: 'none', border: `1px solid ${C.ruleLight}`, borderRadius: 4,
                              padding: '4px 8px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, color: C.text3,
                            }}>✎</button>
                            <button onClick={() => deleteList(list.id)} style={{
                              background: 'none', border: `1px solid ${C.ruleLight}`, borderRadius: 4,
                              padding: '4px 8px', cursor: 'pointer', fontFamily: MONO, fontSize: 10, color: C.text3,
                            }}>✕</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ========== CREATE/EDIT LIST MODAL ========== */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={() => setShowCreateModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.bg, borderRadius: 16, width: '100%', maxWidth: 520,
            maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ padding: '24px 24px 0' }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
                {editingList ? 'Edit List' : 'New List'}
              </h3>

              {/* Name */}
              <input
                value={newListName} onChange={e => setNewListName(e.target.value)}
                placeholder="List name"
                style={{
                  width: '100%', fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text,
                  background: 'transparent', border: 'none', borderBottom: `2px solid ${C.rule}`,
                  outline: 'none', padding: '8px 0', marginBottom: 12,
                }}
              />

              {/* Description */}
              <textarea
                value={newListDesc} onChange={e => setNewListDesc(e.target.value)}
                placeholder="What's this list about?"
                rows={2}
                style={{
                  width: '100%', fontFamily: SANS, fontSize: 13, color: C.text2,
                  background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 8,
                  outline: 'none', padding: '10px 12px', resize: 'none', marginBottom: 16,
                }}
              />

              {/* Recipe search */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>
                  Add recipes ({selectedRecipeIds.length} selected)
                </label>
                <input
                  ref={searchInputRef}
                  value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)}
                  placeholder="Search recipes to add..."
                  style={{
                    width: '100%', fontFamily: SANS, fontSize: 13, color: C.text,
                    background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 8,
                    outline: 'none', padding: '10px 12px',
                  }}
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div style={{ marginBottom: 16, maxHeight: 200, overflow: 'auto', border: `1px solid ${C.ruleLight}`, borderRadius: 8 }}>
                  {searchResults.filter(r => !selectedRecipeIds.includes(r.id)).map(r => (
                    <div key={r.id} onClick={() => {
                      setSelectedRecipeIds(prev => [...prev, r.id])
                      setUserListRecipes(prev => new Map(prev).set(r.id, r))
                      setRecipeSearch('')
                    }} style={{
                      padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      borderBottom: `1px solid ${C.ruleLight}`, background: C.bg,
                    }}>
                      <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text }}>{r.title}</span>
                      {r.cuisine && <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>{r.cuisine}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected recipes */}
              {selectedRecipeIds.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {selectedRecipeIds.map((id, idx) => {
                    const r = userListRecipes.get(id) || searchResults.find(sr => sr.id === id)
                    return (
                      <div key={id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                        borderBottom: `1px solid ${C.ruleLight}`,
                      }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, width: 20, textAlign: 'right' }}>{idx + 1}</span>
                        <span style={{ fontFamily: SERIF, fontSize: 13, color: C.text, flex: 1 }}>{r?.title || 'Unknown'}</span>
                        <button onClick={() => setSelectedRecipeIds(prev => prev.filter(x => x !== id))} style={{
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.text3, padding: '2px 6px',
                        }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px', borderTop: `1px solid ${C.ruleLight}`,
              display: 'flex', justifyContent: 'flex-end', gap: 10, background: C.warm,
              borderRadius: '0 0 16px 16px',
            }}>
              <button onClick={() => setShowCreateModal(false)} style={{
                padding: '10px 20px', borderRadius: 6, border: `1px solid ${C.rule}`,
                background: 'transparent', color: C.text2, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: SANS,
              }}>Cancel</button>
              <button onClick={saveList} disabled={!newListName.trim()} style={{
                padding: '10px 20px', borderRadius: 6, border: 'none',
                background: newListName.trim() ? C.text : C.ruleLight,
                color: newListName.trim() ? C.bg : C.text3,
                fontSize: 13, fontWeight: 600, cursor: newListName.trim() ? 'pointer' : 'default',
                fontFamily: SANS,
              }}>{editingList ? 'Save Changes' : 'Create List'}</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index<EggDot size={6} /></p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>A collection of kitchen tools and recipes to help you become your best cook.</p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO }}>
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span> · <span style={{ color: C.accent, cursor: 'pointer' }} onClick={() => router.push('/profile')}>Profile</span></p>
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
