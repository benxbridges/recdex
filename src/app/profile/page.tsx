'use client'

import { useState, useEffect } from 'react'
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
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// ===== TYPES =====
type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  image_url: string | null; servings: number | null
}

type GroceryItem = {
  name: string; amount: string; unit: string; notes?: string
  recipeId: string; recipeTitle: string; recipeSlug: string; checked: boolean
}

type PantryItem = { id: string; name: string; category: string; addedAt: number }

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
function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
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


// ===== MAIN PAGE =====
export default function ProfilePage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load all localStorage data + fetch saved recipes from Supabase
  useEffect(() => {
    const boxRaw = localStorage.getItem('recdex-box')
    const groceryRaw = localStorage.getItem('recdex-grocery')
    const pantryRaw = localStorage.getItem('recdex-pantry')

    let ids: string[] = []
    if (boxRaw) try { ids = JSON.parse(boxRaw) } catch { /* ignore */ }
    setSavedIds(ids)

    if (groceryRaw) try { setGroceryItems(JSON.parse(groceryRaw)) } catch { /* ignore */ }
    if (pantryRaw) try { setPantryItems(JSON.parse(pantryRaw)) } catch { /* ignore */ }

    if (ids.length > 0) {
      supabase.from('recipes').select('id, slug, title, description, cuisine, difficulty, time_total, time_active, image_url, servings')
        .in('id', ids).eq('status', 'published')
        .then(({ data }) => { if (data) setSavedRecipes(data); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [])

  const unsaveRecipe = (recipeId: string) => {
    const newIds = savedIds.filter(id => id !== recipeId)
    setSavedIds(newIds)
    setSavedRecipes(prev => prev.filter(r => r.id !== recipeId))
    localStorage.setItem('recdex-box', JSON.stringify(newIds))
  }

  // Derived stats
  const groceryRemaining = groceryItems.filter(i => !i.checked).length
  const groceryRecipeCount = new Set(groceryItems.map(i => i.recipeId)).size
  const pantryCategoryCount = new Set(pantryItems.map(i => i.category)).size

  // Grocery grouped by recipe
  const groceryByRecipe: Record<string, { title: string; slug: string; items: GroceryItem[] }> = {}
  groceryItems.forEach(item => {
    if (!groceryByRecipe[item.recipeId]) {
      groceryByRecipe[item.recipeId] = { title: item.recipeTitle, slug: item.recipeSlug, items: [] }
    }
    groceryByRecipe[item.recipeId].items.push(item)
  })

  // Pantry grouped by category
  const pantryByCat: Record<string, number> = {}
  pantryItems.forEach(item => { pantryByCat[item.category] = (pantryByCat[item.category] || 0) + 1 })

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
              <Link href="/pantry" style={{ textDecoration: 'none', color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>🛒</span><span style={{ fontSize: 11, fontWeight: 500 }}>Kitchen</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title + stats */}
        <div style={{ paddingTop: 28, paddingBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px', fontFamily: SANS }}>Profile</p>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: '0 0 4px', letterSpacing: -0.5 }}>
            Your Cookbook
          </h2>
          <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: 0 }}>
            {savedIds.length} saved · {groceryItems.length} grocery item{groceryItems.length !== 1 ? 's' : ''} · {pantryItems.length} in pantry
          </p>
        </div>

        {/* STATS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20, marginBottom: 32 }}>
          <div style={{ background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 10, padding: isMobile ? '16px 14px' : '20px 24px', textAlign: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: savedIds.length > 0 ? C.text : C.text3, lineHeight: 1 }}>{savedIds.length}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.text3, marginTop: 4 }}>Recipes Saved</div>
          </div>
          <div style={{ background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 10, padding: isMobile ? '16px 14px' : '20px 24px', textAlign: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8 }}>
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: groceryRemaining > 0 ? C.text : C.text3, lineHeight: 1 }}>{groceryRemaining}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.text3, marginTop: 4 }}>On Your List</div>
          </div>
          <div style={{ background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: 10, padding: isMobile ? '16px 14px' : '20px 24px', textAlign: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: pantryItems.length > 0 ? C.text : C.text3, lineHeight: 1 }}>{pantryItems.length}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.text3, marginTop: 4 }}>In Pantry</div>
          </div>
        </div>

        <div style={{ height: 1, background: C.rule, marginBottom: 28 }} />

        {/* SAVED RECIPES */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Saved Recipes</h3>
            {savedIds.length > 0 && <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>YOUR COLLECTION</span>}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: 13, color: C.text3 }}>Loading recipes...</p>
            </div>
          ) : savedRecipes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.rule} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
                No saved recipes yet
              </h3>
              <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                Browse the index and tap &ldquo;Save&rdquo; on recipes you want to cook later.
              </p>
              <button onClick={() => router.push('/')} style={{
                padding: '12px 28px', borderRadius: 6, border: 'none',
                background: C.text, color: C.bg,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
              }}>Browse recipes</button>
            </div>
          ) : (
            <div>
              {savedRecipes.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < savedRecipes.length - 1 ? `1px solid ${C.ruleLight}` : 'none',
                  animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3, flexShrink: 0 }}>{i + 1}.</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/recipe/${r.slug}`} style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>
                          {r.title}
                        </Link>
                        <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3, whiteSpace: 'nowrap' }}>
                          {r.cuisine && `${r.cuisine} · `}{formatTime(r.time_total)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <DifficultyBadge difficulty={r.difficulty} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => unsaveRecipe(r.id)} title="Remove" style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0,
                    color: C.text3, fontSize: 11, fontFamily: MONO, opacity: 0.6,
                  }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ height: 1, background: C.rule, marginBottom: 28 }} />

        {/* GROCERY LIST SUMMARY */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Shopping List</h3>
            {groceryItems.length > 0 && <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{groceryRemaining} ITEM{groceryRemaining !== 1 ? 'S' : ''} · {groceryRecipeCount} RECIPE{groceryRecipeCount !== 1 ? 'S' : ''}</span>}
          </div>

          {groceryItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>🛒</div>
              <h4 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.text, margin: '0 0 6px' }}>Your shopping list is empty</h4>
              <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.6, margin: 0, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
                Add ingredients from any recipe to start building your list.
              </p>
            </div>
          ) : (
            <div>
              {Object.entries(groceryByRecipe).map(([recipeId, group]) => {
                const remaining = group.items.filter(i => !i.checked).length
                const total = group.items.length
                return (
                  <div key={recipeId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.ruleLight}` }}>
                    <div>
                      <Link href={`/recipe/${group.slug}`} style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>{group.title}</Link>
                      <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '2px 0 0' }}>
                        {remaining === 0 ? 'all purchased' : `${remaining} of ${total} remaining`}
                      </p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${remaining === 0 ? C.green : C.ruleLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {remaining === 0 ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      ) : (
                        <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600, color: C.text2 }}>{remaining}</span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 14 }}>
                <Link href="/pantry" style={{ fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500, textDecoration: 'none' }}>View full shopping list →</Link>
              </div>
            </div>
          )}
        </section>

        <div style={{ height: 1, background: C.rule, marginBottom: 28 }} />

        {/* PANTRY OVERVIEW */}
        <section style={{ marginBottom: 36, paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>My Pantry</h3>
            {pantryItems.length > 0 && <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{pantryItems.length} ITEM{pantryItems.length !== 1 ? 'S' : ''} · {pantryCategoryCount} CATEGOR{pantryCategoryCount !== 1 ? 'IES' : 'Y'}</span>}
          </div>

          {pantryItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>🏠</div>
              <h4 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.text, margin: '0 0 6px' }}>Your pantry is empty</h4>
              <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                Track what you have at home and we&apos;ll highlight items you already own on your shopping list.
              </p>
              <button onClick={() => router.push('/pantry')} style={{
                padding: '10px 24px', borderRadius: 6, border: 'none',
                background: C.text, color: C.bg,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
              }}>Set up pantry</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {CATEGORIES.map(cat => {
                  const count = pantryByCat[cat.key] || 0
                  if (count === 0) return null
                  return (
                    <div key={cat.key} style={{
                      padding: '6px 12px', borderRadius: 20,
                      background: C.warm, border: `1px solid ${C.ruleLight}`,
                      fontSize: 12, fontFamily: SANS, color: C.text2,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ fontSize: 13 }}>{cat.icon}</span>
                      {cat.label}
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>({count})</span>
                    </div>
                  )
                })}
              </div>
              <Link href="/pantry" style={{ fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500, textDecoration: 'none' }}>Manage pantry →</Link>
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
