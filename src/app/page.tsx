'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

// ===== DESIGN TOKENS (matching v8 prototype) =====
const C = {
  bg: '#FEFDFB', warm: '#F5F2EC', cool: '#F8F6F1',
  text: '#1A1A18', text2: '#5C5647', text3: '#9C9585',
  rule: '#D4CDBE', ruleLight: '#E8E4DB',
  accent: '#C84A2A', accentBg: '#FDF3F0',
  green: '#4A6741', greenBg: '#F0F5EE',
  blue: '#3D6B8E', blueBg: '#EFF5F9',
  gold: '#A8862A', goldBg: '#FBF7ED',
}

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

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    easy: { color: C.green, bg: C.greenBg },
    medium: { color: C.gold, bg: C.goldBg },
    hard: { color: C.accent, bg: C.accentBg },
  }
  const s = styles[difficulty] || styles.easy
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 2,
    }}>
      {difficulty}
    </span>
  )
}

// ===== RECIPE CARD =====
function RecipeCard({ recipe, isExpanded, onToggle }: {
  recipe: Recipe
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '14px 0',
        borderBottom: `1px solid ${C.ruleLight}`,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = C.cool)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Collapsed view */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Thumbnail placeholder */}
        <div style={{
          width: 72, height: 50, borderRadius: 3, flexShrink: 0,
          background: C.warm,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          🍽
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{
              fontSize: 16, fontWeight: 600, color: C.text, margin: 0,
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}>
              {recipe.title}
            </h3>
            {recipe.cuisine && (
              <span style={{ fontSize: 11, color: C.text3, fontStyle: 'italic' }}>
                {recipe.cuisine}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            {recipe.time_total && (
              <span style={{ fontSize: 12, color: C.text2, fontFamily: "'JetBrains Mono', monospace" }}>
                {formatTime(recipe.time_total)}
                {recipe.time_active && (
                  <span style={{ color: C.text3 }}> · {formatTime(recipe.time_active)} active</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Expand arrow */}
        <span style={{
          fontSize: 14, color: C.text3, transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          flexShrink: 0, marginTop: 4,
        }}>
          ▸
        </span>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div style={{ marginTop: 14, paddingLeft: 86, animation: 'fadeIn 0.2s ease' }}>
          {recipe.description && (
            <p style={{
              fontSize: 14, lineHeight: 1.6, color: C.text2, margin: '0 0 12px',
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}>
              {recipe.description}
            </p>
          )}

          {recipe.time_passive_label && (
            <p style={{ fontSize: 12, color: C.accent, margin: '0 0 12px' }}>
              + {formatTime(recipe.time_passive)} {recipe.time_passive_label}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button style={{
              padding: '8px 16px', borderRadius: 3, border: 'none',
              background: C.text, color: C.bg,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Cook this
            </button>
            <button style={{
              padding: '8px 16px', borderRadius: 3,
              border: `1.5px solid ${C.rule}`, background: 'transparent',
              color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              Save
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
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

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
        query = query.or(`title.ilike.%${searchQuery}%,cuisine.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data, count } = await query
      if (data) {
        setRecipes(data)
        setTotalCount(data.length)
      }
      setLoading(false)
    }
    fetchRecipes()
  }, [activeCategory, searchQuery])

  const filteredRecipes = recipes

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        ::selection { background: rgba(200,74,42,0.15); }
        input:focus { outline: none; border-color: ${C.accent} !important; }
      `}</style>

      {/* Header */}
      <header style={{
        maxWidth: 960, margin: '0 auto', padding: '32px 24px 24px',
        borderBottom: `1.5px solid ${C.text}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 700, color: C.text, margin: 0,
              fontFamily: "'Source Serif 4', Georgia, serif",
              letterSpacing: '-0.01em',
            }}>
              Recipe Index
            </h1>
            <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>
              {totalCount} recipes · Free forever · No ads
            </p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: C.accent,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            RECDEX
          </span>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 40 }}>

        {/* Sidebar */}
        <nav style={{
          width: 200, flexShrink: 0, paddingTop: 24,
          position: 'sticky', top: 0, height: 'fit-content',
        }}>
          <div
            onClick={() => { setActiveCategory('all'); setSearchQuery('') }}
            style={{
              padding: '8px 12px', borderRadius: 3, marginBottom: 4, cursor: 'pointer',
              background: activeCategory === 'all' ? C.warm : 'transparent',
              color: activeCategory === 'all' ? C.text : C.text2,
              fontSize: 13, fontWeight: activeCategory === 'all' ? 600 : 400,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span>All Recipes</span>
            <span style={{ fontSize: 11, color: C.text3 }}>{totalCount}</span>
          </div>

          <div style={{ height: 1, background: C.ruleLight, margin: '8px 0' }} />

          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearchQuery('') }}
              style={{
                padding: '6px 12px', borderRadius: 3, marginBottom: 2, cursor: 'pointer',
                background: activeCategory === cat.id ? C.warm : 'transparent',
                color: activeCategory === cat.id ? C.text : C.text2,
                fontSize: 13, fontWeight: activeCategory === cat.id ? 600 : 400,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (activeCategory !== cat.id) e.currentTarget.style.background = C.cool }}
              onMouseLeave={e => { if (activeCategory !== cat.id) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{cat.name}</span>
              <span style={{ fontSize: 11, color: C.text3 }}>{cat.recipe_count}</span>
            </div>
          ))}
        </nav>

        {/* Recipe list */}
        <main style={{ flex: 1, paddingTop: 24, paddingBottom: 80 }}>
          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 3,
                border: `1.5px solid ${C.rule}`, background: C.bg,
                fontSize: 14, color: C.text,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            />
          </div>

          {/* Category title */}
          {activeCategory !== 'all' && (
            <h2 style={{
              fontSize: 22, fontWeight: 600, color: C.text, margin: '0 0 16px',
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}>
              {categories.find(c => c.id === activeCategory)?.name}
            </h2>
          )}

          {/* Loading state */}
          {loading && (
            <p style={{ color: C.text3, fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
              Loading recipes...
            </p>
          )}

          {/* Recipe list */}
          {!loading && filteredRecipes.length === 0 && (
            <p style={{ color: C.text3, fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
              No recipes found{searchQuery ? ` for "${searchQuery}"` : ''}.
            </p>
          )}

          {!loading && filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isExpanded={expandedId === recipe.id}
              onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
            />
          ))}
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        maxWidth: 960, margin: '0 auto', padding: '24px',
        borderTop: `1px solid ${C.ruleLight}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
          RecDex · Recipes belong to everyone
        </p>
        <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
          Free · No ads · Open commons
        </p>
      </footer>
    </div>
  )
}