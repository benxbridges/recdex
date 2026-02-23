'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

// ===== DESIGN TOKENS (v8 prototype) =====
const C = {
  bg: '#FEFDFB', warm: '#F5F2EC', cool: '#F8F6F1',
  text: '#1A1A18', text2: '#5C5647', text3: '#9C9585',
  rule: '#D4CDBE', ruleLight: '#E8E4DB',
  accent: '#C84A2A', accentBg: '#FDF3F0', accentMed: 'rgba(200,74,42,0.2)',
  green: '#4A6741', greenBg: '#F0F5EE',
  blue: '#3D6B8E', blueBg: '#EFF5F9',
  gold: '#A8862A', goldBg: '#FBF7ED',
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// ===== TYPES =====
type Recipe = {
  id: string
  slug: string
  title: string
  description: string | null
  cuisine: string | null
  category_id: string | null
  difficulty: string
  time_total: number | null
  time_active: number | null
  time_passive: number | null
  time_passive_label: string | null
  image_url: string | null
  servings: number | null
  tags: string[] | null
}

type Category = {
  id: string
  name: string
  recipe_count: number
}

// ===== HELPERS =====
function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr${hrs > 1 ? 's' : ''}`
  }
  return `${minutes} min`
}

// ===== SMALL COMPONENTS =====
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    easy: { color: C.green, bg: C.greenBg },
    medium: { color: C.gold, bg: C.goldBg },
    hard: { color: C.accent, bg: C.accentBg },
  }
  const s = styles[difficulty] || styles.easy
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      color: s.color, background: s.bg, padding: '2px 7px', borderRadius: 1,
      fontFamily: MONO,
    }}>
      {difficulty}
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
      {active && (
        <>
          <span style={{ color: C.text3 }}>·</span>
          <span>{formatTime(active)} active</span>
        </>
      )}
      {passiveLabel && (
        <>
          <span style={{ color: C.text3 }}>·</span>
          <span style={{ color: C.accent, fontSize: 10 }}>
            {passiveTime ? formatTime(passiveTime) + ' ' : ''}{passiveLabel}
          </span>
        </>
      )}
    </span>
  )
}

function SearchIcon({ focused }: { focused: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={focused ? C.text : C.text3} strokeWidth="2" strokeLinecap="round"
      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

// ===== RECIPE CARD =====
function RecipeCard({ recipe, isExpanded, onToggle }: {
  recipe: Recipe; isExpanded: boolean; onToggle: () => void
}) {
  return (
    <div style={{ borderBottom: `1px solid ${C.rule}`, padding: '14px 0' }}>
      {/* Collapsed row */}
      <div
        style={{ display: 'flex', gap: 14, cursor: 'pointer' }}
        onClick={onToggle}
      >
        {/* Thumbnail */}
        <div style={{
          width: 80, height: 56, borderRadius: 2, overflow: 'hidden', flexShrink: 0,
          background: C.warm, border: `1px solid ${C.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22, opacity: 0.5 }}>🍽</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{
              fontFamily: SERIF, fontSize: 16.5, fontWeight: 600, color: C.text,
              margin: 0, lineHeight: 1.25,
            }}>
              {recipe.title}
            </h3>
            <span style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>{recipe.cuisine}</span>
          </div>

          {/* Description - 1 line truncated */}
          {recipe.description && (
            <p style={{
              fontSize: 13, color: C.text2, lineHeight: 1.45, margin: '3px 0 0', fontFamily: SANS,
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            }}>
              {recipe.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            <span style={{ color: C.rule, fontSize: 11 }}>|</span>
            <TimeDisplay total={recipe.time_total} active={recipe.time_active}
              passiveLabel={recipe.time_passive_label} passiveTime={recipe.time_passive} />
          </div>
        </div>

        {/* Chevron */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: 6, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div style={{ marginTop: 14, paddingLeft: 94, animation: 'fadeIn 0.15s ease' }}>
          {/* Full description */}
          {recipe.description && (
            <p style={{
              fontSize: 14, color: C.text, lineHeight: 1.6, margin: '0 0 16px',
              fontFamily: SERIF, fontStyle: 'italic', maxWidth: 520,
            }}>
              &ldquo;{recipe.description}&rdquo;
            </p>
          )}

          {/* Passive time callout */}
          {recipe.time_passive_label && recipe.time_passive && (
            <div style={{
              marginBottom: 14, padding: '8px 12px', background: C.accentBg,
              border: `1px solid ${C.accentMed}`, borderRadius: 2,
              fontSize: 12, color: C.accent, fontFamily: SANS,
            }}>
              + {formatTime(recipe.time_passive)} {recipe.time_passive_label}
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {recipe.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontFamily: MONO, color: C.text3, padding: '2px 8px',
                  background: C.cool, borderRadius: 2,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons — Cook this below ingredients area */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button style={{
              padding: '10px 24px', borderRadius: 2, border: 'none',
              background: C.text, color: C.bg,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Cook this
            </button>
            <button style={{
              padding: '10px 20px', borderRadius: 2,
              border: `1.5px solid ${C.rule}`, background: 'transparent',
              color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            }}>
              Save
            </button>
            <button style={{
              padding: '10px 20px', borderRadius: 2,
              border: `1.5px solid ${C.text}`, background: C.text,
              color: C.bg, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            }}>
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== MAIN PAGE =====
export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  // Fetch total count on mount
  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
      if (count) setTotalCount(count)
    }
    fetchCount()
  }, [])

  // Fetch recipes when category or search changes
  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true)
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('status', 'published')
        .order('title')

      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory)
      }

      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,cuisine.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        )
      }

      const { data } = await query
      if (data) setRecipes(data)
      setLoading(false)
    }
    fetchRecipes()
  }, [activeCategory, searchQuery])

  const activeCategoryName = activeCategory === 'all'
    ? 'All Recipes'
    : categories.find(c => c.id === activeCategory)?.name || 'All Recipes'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      {/* Fonts & Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        ::selection { background: rgba(200,74,42,0.15); color: ${C.text}; }
        input::placeholder { color: ${C.text3}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.rule}; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ===== HEADER ===== */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px clamp(16px,4vw,24px) 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h1 style={{
                fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 700,
                color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1,
              }}>
                Recipe Index
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: '6px 0 0', letterSpacing: 0.3 }}>
                An open recipe commons. Free forever. No ads.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: SANS }}>
              <span style={{ color: C.text2, cursor: 'pointer' }}>about</span>
              <span style={{ color: C.text2, cursor: 'pointer' }}>contribute</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, fontFamily: MONO, color: C.text3, flexWrap: 'wrap' }}>
            <span>{totalCount} recipes</span>
            <span>{categories.length} categories</span>
            <span>updated daily</span>
          </div>
        </div>
      </header>

      {/* ===== SEARCH BAR ===== */}
      <div style={{
        borderBottom: `1px solid ${C.rule}`,
        background: searchFocused ? '#fff' : C.bg,
        transition: 'background 0.15s',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px clamp(16px,4vw,24px)' }}>
          <div style={{ position: 'relative' }}>
            <SearchIcon focused={searchFocused} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search by recipe name, ingredient, cuisine, or tag..."
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                border: `1.5px solid ${searchFocused ? C.text : C.rule}`,
                borderRadius: 2, fontSize: 14, color: C.text,
                fontFamily: SANS, outline: 'none', background: 'transparent',
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== MOBILE CATEGORY PILLS ===== */}
      {isMobile && (
        <div style={{
          maxWidth: 960, margin: '0 auto',
          padding: '12px clamp(16px,4vw,24px)',
          display: 'flex', gap: 4, overflowX: 'auto',
          borderBottom: `1px solid ${C.ruleLight}`,
        }}>
          <button
            onClick={() => { setActiveCategory('all'); setExpandedId(null) }}
            style={{
              padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 2, cursor: 'pointer',
              fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === 'all' ? 600 : 400,
              background: activeCategory === 'all' ? C.text : 'transparent',
              color: activeCategory === 'all' ? C.bg : C.text3,
            }}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setExpandedId(null) }}
              style={{
                padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 2, cursor: 'pointer',
                fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400,
                background: activeCategory === cat.id ? C.text : 'transparent',
                color: activeCategory === cat.id ? C.bg : C.text3,
              }}
            >{cat.name}</button>
          ))}
        </div>
      )}

      {/* ===== BODY: SIDEBAR + RECIPES ===== */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>
        <div style={{ display: 'flex' }}>

          {/* Sidebar (desktop only) */}
          {!isMobile && (
            <div style={{
              width: 210, flexShrink: 0, paddingTop: 20, paddingRight: 24,
              borderRight: `1px solid ${C.rule}`,
              position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
            }}>
              <p style={{
                fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase',
                letterSpacing: 2, margin: '0 0 10px', fontFamily: SANS,
              }}>Categories</p>

              {/* All Recipes */}
              <button
                onClick={() => { setActiveCategory('all'); setExpandedId(null) }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: SANS, textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: 12.5, color: activeCategory === 'all' ? C.text : C.text2,
                  fontWeight: activeCategory === 'all' ? 600 : 400,
                  borderBottom: activeCategory === 'all' ? `1.5px solid ${C.text}` : '1.5px solid transparent',
                  paddingBottom: 1,
                }}>All Recipes</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{totalCount}</span>
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setExpandedId(null) }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: SANS, textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: 12.5, color: activeCategory === cat.id ? C.text : C.text2,
                    fontWeight: activeCategory === cat.id ? 600 : 400,
                    borderBottom: activeCategory === cat.id ? `1.5px solid ${C.text}` : '1.5px solid transparent',
                    paddingBottom: 1,
                  }}>{cat.name}</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{cat.recipe_count}</span>
                </button>
              ))}

              {/* Index Points info */}
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
                <p style={{
                  fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase',
                  letterSpacing: 2, margin: '0 0 8px', fontFamily: SANS,
                }}>Index Points</p>
                <div style={{ fontSize: 11, color: C.text2, fontFamily: SANS, lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 1px' }}>+25 recipe submitted</p>
                  <p style={{ margin: '0 0 1px' }}>+10 photo added</p>
                  <p style={{ margin: '0 0 1px' }}>+5 helpful comment</p>
                  <p style={{ margin: '0 0 1px' }}>+3 substitution tip</p>
                </div>
              </div>

              {/* Trust signal */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}` }}>
                <p style={{
                  fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase',
                  letterSpacing: 2, margin: '0 0 6px', fontFamily: SANS,
                }}>Trust Signal</p>
                <p style={{ fontSize: 10.5, color: C.text2, fontFamily: SANS, lineHeight: 1.5, margin: 0 }}>
                  <span style={{ fontWeight: 600, color: C.green }}>Repeat cooks</span> track how many people made a recipe more than once.
                </p>
              </div>

              <p style={{ fontSize: 10, color: C.text3, margin: '20px 0 0', fontFamily: SANS, lineHeight: 1.5 }}>
                Recipes are free to read, use, and share. Always.
              </p>
            </div>
          )}

          {/* Recipe list */}
          <div style={{
            flex: 1, minWidth: 0,
            paddingLeft: isMobile ? 0 : 24,
            paddingTop: 16, paddingBottom: 60,
          }}>
            {/* Category header */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                <h2 style={{
                  fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text,
                  margin: 0, lineHeight: 1,
                }}>
                  {activeCategoryName}
                </h2>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>
                  {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
              </div>
              <div style={{ height: 1.5, background: C.text, marginTop: 8 }} />
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>Loading recipes...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && recipes.length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>
                  {searchQuery ? `No recipes found for "${searchQuery}". Try a different search.` : 'No recipes in this category yet.'}
                </p>
              </div>
            )}

            {/* Recipe cards */}
            {!loading && recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isExpanded={expandedId === recipe.id}
                onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
                Recipe Index
              </p>
              <p style={{
                fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS,
              }}>
                An open recipe commons. Recipes are free to read, use, and share.
                No ads. No paywalls. Community-curated. Always.
              </p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, textAlign: isMobile ? 'left' : 'right' }}>
              <p style={{ margin: '0 0 4px' }}>{totalCount} recipes · {categories.length} categories</p>
              <p style={{ margin: '0 0 4px' }}>updated daily</p>
              <p style={{ margin: 0 }}>
                <span style={{ color: C.accent, cursor: 'pointer' }}>Contribute</span>
                {' · '}
                <span style={{ color: C.accent, cursor: 'pointer' }}>About</span>
              </p>
            </div>
          </div>
          <div style={{
            marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>
              © 2026 RecDex · Public Benefit Corporation
            </span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>
              recipeindex.org
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}