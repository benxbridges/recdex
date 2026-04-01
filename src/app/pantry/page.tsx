'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

// ===== TYPES =====
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

type IngredientItem = { name: string; amount: string; unit: string; notes?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecipeRow = {
  id: string
  slug: string
  title: string
  description: string | null
  image_url: string | null
  cuisine: string | null
  difficulty: string
  time_total: number | null
  servings: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ingredients: any[]
}

const GROCERY_KEY = 'recdex-grocery'
const PANTRY_KEY = 'recdex-pantry'

const COMMON_STAPLES = ['salt', 'pepper', 'oil', 'butter', 'garlic', 'onion']

// ===== HELPERS =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIngredientItems(ingredients: any[]): IngredientItem[] {
  let items: IngredientItem[] = []
  if (!ingredients || ingredients.length === 0) return items
  if (ingredients[0]?.group) items = ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  else items = ingredients as IngredientItem[]
  return items.map(item => ({ ...item, name: item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : item.name }))
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
}

/** Fuzzy ingredient match: "chicken" matches "chicken breast", "boneless chicken thigh", etc. */
function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const u = userIngredient.toLowerCase().trim()
  const r = recipeIngredient.toLowerCase().trim()
  if (!u || !r) return false
  // exact match
  if (r === u) return true
  // user word appears in recipe ingredient name
  if (r.includes(u)) return true
  // recipe ingredient word appears in user input (e.g. user typed "chicken breast", recipe has "chicken")
  if (u.includes(r)) return true
  // check individual words for partial matching (e.g. "tomato" matches "tomatoes")
  const uWords = u.split(/\s+/)
  const rWords = r.split(/\s+/)
  for (const uw of uWords) {
    if (uw.length < 3) continue
    for (const rw of rWords) {
      if (rw.length < 3) continue
      // stem-like match: one starts with the other (tomato/tomatoes, chicken/chickens)
      if (rw.startsWith(uw) || uw.startsWith(rw)) return true
    }
  }
  return false
}

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

function DonutProgress({ have, total, size = 36 }: { have: number; total: number; size?: number }) {
  const fraction = total > 0 ? have / total : 0
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const filled = circumference * fraction
  const gap = circumference - filled
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Background ring */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.ruleLight} strokeWidth={4} />
      {/* Filled ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={fraction >= 1 ? C.green : fraction >= 0.6 ? C.green : C.gold}
        strokeWidth={4}
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.3s ease' }}
      />
      {/* Center text */}
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size <= 36 ? 8 : 10, fontFamily: MONO, fill: C.text, fontWeight: 600 }}>
        {have}/{total}
      </text>
    </svg>
  )
}

// ===== MAIN PAGE =====
export default function PantryPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  // Shopping list state (read/write for "Add missing to list")
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])

  // Pantry state (read-only, for "from your pantry" feature)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])

  // "What can I cook?" state
  const [cookInput, setCookInput] = useState('')
  const [cookTags, setCookTags] = useState<string[]>([])
  const [usePantry, setUsePantry] = useState(true)
  const [allRecipes, setAllRecipes] = useState<RecipeRow[]>([])
  const [recipesLoaded, setRecipesLoaded] = useState(false)
  const [addedMissing, setAddedMissing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(GROCERY_KEY)
    if (stored) {
      try { setGroceryItems(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(PANTRY_KEY)
    if (stored) {
      try { setPantryItems(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  // Fetch all published recipes once on mount
  useEffect(() => {
    async function fetchRecipes() {
      const { data } = await supabase
        .from('recipes')
        .select('id, slug, title, description, image_url, cuisine, difficulty, time_total, servings, ingredients')
        .eq('status', 'published')
      if (data) setAllRecipes(data)
      setRecipesLoaded(true)
    }
    fetchRecipes()
  }, [])

  const saveGrocery = useCallback((items: GroceryItem[]) => {
    setGroceryItems(items)
    localStorage.setItem(GROCERY_KEY, JSON.stringify(items))
  }, [])

  // ===== "What can I cook?" logic =====
  const handleCookInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = cookInput.replace(/,/g, '').trim()
      if (val && !cookTags.some(t => t.toLowerCase() === val.toLowerCase())) {
        setCookTags(prev => [...prev, val])
      }
      setCookInput('')
    }
  }

  const handleCookInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // If they paste comma-separated values
    if (val.includes(',')) {
      const parts = val.split(',').map(s => s.trim()).filter(Boolean)
      const lastPart = parts[parts.length - 1]
      const newTags = parts.slice(0, -1).filter(p => !cookTags.some(t => t.toLowerCase() === p.toLowerCase()))
      if (newTags.length > 0) setCookTags(prev => [...prev, ...newTags])
      // If val ends with comma, add all including last
      if (val.endsWith(',')) {
        const finalTag = lastPart
        if (finalTag && !cookTags.some(t => t.toLowerCase() === finalTag.toLowerCase()) && !newTags.some(t => t.toLowerCase() === finalTag.toLowerCase())) {
          setCookTags(prev => [...prev, finalTag])
        }
        setCookInput('')
      } else {
        setCookInput(lastPart || '')
      }
    } else {
      setCookInput(val)
    }
  }

  const removeCookTag = (tag: string) => {
    setCookTags(prev => prev.filter(t => t !== tag))
  }

  const addStaples = () => {
    const newOnes = COMMON_STAPLES.filter(s => !cookTags.some(t => t.toLowerCase() === s.toLowerCase()))
    if (newOnes.length > 0) setCookTags(prev => [...prev, ...newOnes])
  }

  // Combined user ingredients: tags + pantry items (if enabled)
  const allUserIngredients = useMemo(() => {
    const set = new Set(cookTags.map(t => t.toLowerCase().trim()))
    if (usePantry) {
      pantryItems.forEach(p => set.add(p.name.toLowerCase().trim()))
    }
    return Array.from(set)
  }, [cookTags, pantryItems, usePantry])

  // Match recipes
  const matchedRecipes = useMemo(() => {
    if (allUserIngredients.length === 0) return []

    const results: {
      recipe: RecipeRow
      ingredientItems: IngredientItem[]
      matched: string[]
      missing: string[]
      total: number
      fraction: number
    }[] = []

    for (const recipe of allRecipes) {
      const items = getIngredientItems(recipe.ingredients)
      if (items.length === 0) continue

      const matched: string[] = []
      const missing: string[] = []

      for (const item of items) {
        const name = item.name
        let found = false
        for (const userIng of allUserIngredients) {
          if (ingredientMatches(userIng, name)) {
            found = true
            break
          }
        }
        if (found) matched.push(name)
        else missing.push(name)
      }

      if (matched.length > 0) {
        results.push({
          recipe,
          ingredientItems: items,
          matched,
          missing,
          total: items.length,
          fraction: matched.length / items.length,
        })
      }
    }

    // Sort: highest fraction first, then fewest missing
    results.sort((a, b) => {
      if (Math.abs(b.fraction - a.fraction) > 0.001) return b.fraction - a.fraction
      return a.missing.length - b.missing.length
    })

    return results
  }, [allRecipes, allUserIngredients])

  const addMissingToGrocery = (recipe: RecipeRow, missing: string[], ingredientItems: IngredientItem[]) => {
    const existing = [...groceryItems]
    const newItems: GroceryItem[] = []
    for (const name of missing) {
      // check if already in grocery list for this recipe
      if (existing.some(g => g.recipeId === recipe.id && g.name.toLowerCase() === name.toLowerCase())) continue
      const itemData = ingredientItems.find(i => i.name === name)
      newItems.push({
        name,
        amount: itemData?.amount || '',
        unit: itemData?.unit || '',
        notes: itemData?.notes,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeSlug: recipe.slug,
        checked: false,
      })
    }
    if (newItems.length > 0) {
      saveGrocery([...existing, ...newItems])
    }
    setAddedMissing(prev => ({ ...prev, [recipe.id]: true }))
    setTimeout(() => setAddedMissing(prev => ({ ...prev, [recipe.id]: false })), 2000)
  }

  // Subtitle
  const subtitle = allUserIngredients.length === 0
    ? 'Add ingredients to find recipes'
    : `${allUserIngredients.length} ingredient${allUserIngredients.length !== 1 ? 's' : ''} \u00b7 ${matchedRecipes.length} match${matchedRecipes.length !== 1 ? 'es' : ''}`

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}`, position: 'sticky', top: 0, zIndex: 50, background: C.bg }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '12px 16px 10px' : '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
              {!isMobile && <p style={{ fontFamily: SANS, fontSize: 10, color: C.text3, margin: '3px 0 0', letterSpacing: 0.3 }}>Be a better cook.</p>}
            </div>
            {!isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: SANS }}>
                <Link href="/browse" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Browse</Link>
                <div style={{ width: 1, height: 14, background: C.rule }} />
                <Link href="/profile" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Profile</Link>
                <ThemeToggle />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Page title */}
        <div style={{ paddingTop: 28, paddingBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px', fontFamily: SANS }}>My Kitchen</p>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: '0 0 2px', letterSpacing: -0.5 }}>
            What can I cook?
          </h2>
          <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 20px' }}>
            {subtitle}
          </p>
        </div>

        {/* ===== INGREDIENT MATCHING ===== */}
        <div style={{ paddingTop: 16, paddingBottom: 40, animation: 'fadeIn 0.25s ease' }}>

          {/* Ingredient input */}
          <div style={{ marginBottom: 16 }}>
            <input
              value={cookInput}
              onChange={handleCookInputChange}
              onKeyDown={handleCookInputKeyDown}
              placeholder="What's in your fridge? chicken, garlic, rice..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 8,
                border: `1.5px solid ${C.rule}`, background: C.warm,
                fontSize: 14, color: C.text, fontFamily: SANS,
                outline: 'none', boxSizing: 'border-box',
                minHeight: 44,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
              onBlur={e => { e.currentTarget.style.borderColor = C.rule }}
            />
          </div>

          {/* Entered tags */}
          {cookTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {cookTags.map(tag => (
                <button key={tag} onClick={() => removeCookTag(tag)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.rule}`,
                  background: C.bg, fontSize: 12, color: C.text, fontFamily: SANS,
                  cursor: 'pointer', minHeight: 44, minWidth: 44, justifyContent: 'center',
                  transition: 'all 0.1s',
                }}>
                  {tag} <span style={{ color: C.text3, fontSize: 14, marginLeft: 2 }}>&times;</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick-add staples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={addStaples} style={{
              padding: '6px 12px', borderRadius: 6, border: `1px dashed ${C.rule}`,
              background: 'transparent', fontSize: 11, color: C.text3,
              cursor: 'pointer', fontFamily: SANS, fontWeight: 500,
              minHeight: 44, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              + Common staples
              <span style={{ fontSize: 10, color: C.text3, opacity: 0.7 }}>(salt, pepper, oil...)</span>
            </button>
          </div>

          {/* From your pantry */}
          {pantryItems.length > 0 && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, background: C.warm,
              border: `1px solid ${C.ruleLight}`, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3, textTransform: 'uppercase', letterSpacing: 1 }}>
                  From your pantry ({pantryItems.length})
                </span>
                <button onClick={() => setUsePantry(!usePantry)} style={{
                  padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.rule}`,
                  background: usePantry ? C.green : 'transparent',
                  color: usePantry ? '#fff' : C.text3,
                  fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: MONO,
                  transition: 'all 0.15s', minHeight: 32,
                }}>
                  {usePantry ? 'Included' : 'Excluded'}
                </button>
              </div>
              {usePantry && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {pantryItems.slice(0, 20).map(item => (
                    <span key={item.id} style={{
                      padding: '3px 8px', borderRadius: 4,
                      background: C.greenBg, fontSize: 10, color: C.green,
                      fontFamily: SANS, fontWeight: 500,
                    }}>
                      {item.name}
                    </span>
                  ))}
                  {pantryItems.length > 20 && (
                    <span style={{ padding: '3px 8px', fontSize: 10, color: C.text3, fontFamily: MONO }}>
                      +{pantryItems.length - 20} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recipe matches or empty state */}
          {allUserIngredients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍳</div>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
                Type what you have, and we&apos;ll find recipes you can make.
              </h3>
              {pantryItems.length > 0 && (
                <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '12px 0 0' }}>
                  Or start from your {pantryItems.length} saved pantry item{pantryItems.length !== 1 ? 's' : ''} &mdash;{' '}
                  <button onClick={() => setUsePantry(true)} style={{
                    background: 'none', border: 'none', color: C.accent,
                    cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 500, padding: 0,
                    textDecoration: 'underline', textUnderlineOffset: 2,
                  }}>include pantry</button>
                </p>
              )}
            </div>
          ) : !recipesLoaded ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: 13, color: C.text3, fontFamily: MONO }}>Loading recipes...</p>
            </div>
          ) : matchedRecipes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🤔</div>
              <p style={{ fontSize: 14, color: C.text3, lineHeight: 1.6 }}>
                No recipe matches yet. Try adding more ingredients.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
                {matchedRecipes.length} recipe{matchedRecipes.length !== 1 ? 's' : ''} you can make
              </p>
              {matchedRecipes.map(({ recipe, ingredientItems, matched, missing, total, fraction }) => (
                <div key={recipe.id} style={{
                  padding: '14px', marginBottom: 10, borderRadius: 10,
                  background: C.warm, border: `1px solid ${C.ruleLight}`,
                  animation: 'fadeIn 0.25s ease',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                  onClick={() => router.push(`/recipe/${recipe.slug}`)}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.accent }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.ruleLight }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* Recipe image or placeholder */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                      background: C.ruleLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {recipe.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={recipe.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 20, opacity: 0.4 }}>🍽</span>
                      )}
                    </div>

                    {/* Title + info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 3px', lineHeight: 1.3 }}>
                        {recipe.title}
                      </h4>
                      <p style={{ fontSize: 11, color: C.text3, margin: '0 0 6px', fontFamily: SANS }}>
                        {[recipe.cuisine, recipe.time_total ? formatTime(recipe.time_total) : null].filter(Boolean).join(' \u00b7 ')}
                      </p>

                      {/* Missing ingredients */}
                      {missing.length > 0 && (
                        <p style={{ fontSize: 11, color: C.text3, margin: '0 0 2px', fontFamily: SANS, lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600, color: C.text2 }}>Missing: </span>
                          {missing.slice(0, 4).join(', ')}
                          {missing.length > 4 && <span style={{ color: C.text3 }}> +{missing.length - 4} more</span>}
                        </p>
                      )}
                    </div>

                    {/* Donut progress */}
                    <DonutProgress have={matched.length} total={total} size={36} />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    {missing.length > 0 && (
                      <button onClick={() => addMissingToGrocery(recipe, missing, ingredientItems)} style={{
                        flex: 1, padding: '8px 10px', borderRadius: 6,
                        border: `1px solid ${C.rule}`, background: 'transparent',
                        fontSize: 11, fontWeight: 500, color: addedMissing[recipe.id] ? C.green : C.text2,
                        cursor: 'pointer', fontFamily: SANS,
                        minHeight: 44, transition: 'all 0.15s',
                      }}>
                        {addedMissing[recipe.id] ? '✓ Added to list' : `Add ${missing.length} missing to list`}
                      </button>
                    )}
                    <button onClick={() => router.push(`/recipe/${recipe.slug}/cook`)} style={{
                      padding: '8px 16px', borderRadius: 6, border: 'none',
                      background: fraction >= 0.8 ? C.green : C.text,
                      color: '#fff',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                      minHeight: 44, whiteSpace: 'nowrap',
                    }}>
                      Cook &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <p style={{ margin: 0 }}><Link href="/" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>Home</Link> &middot; <Link href="/about" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>About</Link></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>&copy; 2026 RecDex &middot; Public Benefit Corporation</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
