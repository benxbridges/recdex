'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'

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
  const [tab, setTab] = useState<'cook' | 'list' | 'pantry'>('cook')
  const [isMobile, setIsMobile] = useState(false)

  // Shopping list state
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])

  // Pantry state
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [pantrySearch, setPantrySearch] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('produce')
  const [activeCategory, setActiveCategory] = useState('all')

  // Expanded recipe view (shows full ingredient list inline)
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

  // Copy feedback
  const [listCopied, setListCopied] = useState(false)

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

  const savePantry = useCallback((items: PantryItem[]) => {
    setPantryItems(items)
    localStorage.setItem(PANTRY_KEY, JSON.stringify(items))
  }, [])

  // Toggle item checked — click to strikethrough
  const toggleItem = (index: number) => {
    const updated = [...groceryItems]
    updated[index] = { ...updated[index], checked: !updated[index].checked }
    saveGrocery(updated)
  }

  // Remove all "got" items permanently
  const clearGot = () => {
    saveGrocery(groceryItems.filter(item => !item.checked))
  }

  // Remove all items from a recipe
  const removeRecipeItems = (recipeId: string) => {
    saveGrocery(groceryItems.filter(item => item.recipeId !== recipeId))
  }

  // Clear entire list
  const clearAll = () => { saveGrocery([]) }

  // Add pantry item
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

  const removePantryItem = (id: string) => {
    savePantry(pantryItems.filter(item => item.id !== id))
  }

  // Split items: need (active) vs got (checked)
  const needItems = groceryItems.filter(i => !i.checked)
  const gotItems = groceryItems.filter(i => i.checked)

  // Group all items by recipe (checked items stay in-place with strikethrough)
  const needByRecipe: Record<string, { items: GroceryItem[]; indices: number[] }> = {}
  groceryItems.forEach((item, idx) => {
    if (!needByRecipe[item.recipeId]) needByRecipe[item.recipeId] = { items: [], indices: [] }
    needByRecipe[item.recipeId].items.push(item)
    needByRecipe[item.recipeId].indices.push(idx)
  })

  // Pantry cross-reference
  const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase().trim()))
  const isInPantry = (name: string) => pantryNames.has(name.toLowerCase().trim())

  // Filter pantry items
  const filteredPantry = pantryItems.filter(item => {
    const matchesSearch = !pantrySearch || item.name.toLowerCase().includes(pantrySearch.toLowerCase())
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Group pantry items by category
  const pantryByCategory: Record<string, PantryItem[]> = {}
  filteredPantry.forEach(item => {
    if (!pantryByCategory[item.category]) pantryByCategory[item.category] = []
    pantryByCategory[item.category].push(item)
  })

  // Copy list
  const copyList = async () => {
    const lines: string[] = []
    Object.entries(needByRecipe).forEach(([, { items }]) => {
      const first = items[0]
      if (first) lines.push(`\u2014 ${first.recipeTitle} \u2014`)
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

  const textList = async () => {
    const lines: string[] = ['Grocery List']
    Object.entries(needByRecipe).forEach(([, { items }]) => {
      const first = items[0]
      if (first) lines.push(`\n${first.recipeTitle}:`)
      items.forEach(item => {
        const amt = item.amount ? `${item.amount}${item.unit ? ` ${item.unit}` : ''} ` : ''
        lines.push(`- ${amt}${item.name}`)
      })
    })
    const text = lines.join('\n')
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }) } catch { /* cancelled */ }
    } else {
      const smsBody = encodeURIComponent(text)
      window.open(`sms:?&body=${smsBody}`, '_self')
    }
  }

  const totalCount = groceryItems.length
  const recipeCount = new Set(groceryItems.map(i => i.recipeId)).size

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

  // Tab subtitle
  const tabSubtitle = () => {
    if (tab === 'cook') {
      if (allUserIngredients.length === 0) return 'Add ingredients to find recipes'
      return `${allUserIngredients.length} ingredient${allUserIngredients.length !== 1 ? 's' : ''} \u00b7 ${matchedRecipes.length} match${matchedRecipes.length !== 1 ? 'es' : ''}`
    }
    if (tab === 'list') {
      return totalCount === 0 ? 'No items yet' : `${needItems.length} to get${gotItems.length > 0 ? ` \u00b7 ${gotItems.length} purchased` : ''} \u00b7 ${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}`
    }
    return `${pantryItems.length} item${pantryItems.length !== 1 ? 's' : ''} tracked`
  }

  const tabTitle = () => {
    if (tab === 'cook') return 'What can I cook?'
    if (tab === 'list') return 'Shopping List'
    return 'My Pantry'
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <SiteHeader />

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Page title + tabs */}
        <div style={{ paddingTop: 28, paddingBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px', fontFamily: SANS }}>Pantry</p>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: '0 0 2px', letterSpacing: -0.5 }}>
            Cook with what you have.
          </h2>
          <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 20px' }}>
            {tabSubtitle()}
          </p>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.rule}`, overflowX: 'auto' }}>
            {[
              { key: 'cook' as const, label: isMobile ? 'Cook' : 'What can I cook?', icon: '🍳' },
              { key: 'list' as const, label: 'Shopping List', icon: '🛒' },
              { key: 'pantry' as const, label: 'My Pantry', icon: '🏠' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: isMobile ? '10px 14px' : '10px 20px', border: 'none', background: 'transparent',
                fontFamily: SANS, fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? C.text : C.text3,
                cursor: 'pointer', position: 'relative',
                borderBottom: tab === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
                marginBottom: -1, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== WHAT CAN I COOK? TAB ===== */}
        {tab === 'cook' && (
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
        )}

        {/* ===== SHOPPING LIST TAB ===== */}
        {tab === 'list' && (
          <div style={{ paddingTop: 16, paddingBottom: 40, animation: 'fadeIn 0.25s ease' }}>
            {totalCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
                  Your shopping list is empty
                </h3>
                <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  Browse recipes and tap &ldquo;Grocery list&rdquo; &rarr; &ldquo;Add to shopping list&rdquo; to start building your list.
                </p>
                <button onClick={() => router.push('/')} style={{
                  padding: '12px 28px', borderRadius: 6, border: 'none',
                  background: C.text, color: C.bg,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                }}>Browse recipes</button>
              </div>
            ) : (
              <>
                {/* Items still needed — grouped by recipe */}
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

                    {/* Expanded: full ingredient list for this recipe */}
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
                          }}>open recipe &#8599;</button>
                        )}
                      </div>
                    )}

                    {/* Clickable items — strikethrough when checked, stay in place */}
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
                            {item.checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>&#10003;</span>}
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
                  }}>{listCopied ? '✓ Copied' : 'Copy'}</button>
                  <button onClick={textList} style={{
                    flex: 1, padding: '10px 16px', borderRadius: 6,
                    border: `1.5px solid ${C.green}`, background: C.greenBg,
                    color: C.green, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    Text list
                  </button>
                  <button onClick={clearAll} style={{
                    padding: '10px 16px', borderRadius: 6,
                    border: `1.5px solid ${C.ruleLight}`, background: 'transparent',
                    color: C.text3, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                  }}>Clear all</button>
                </div>

                {/* Clear purchased button — only when there are checked items */}
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

        {/* ===== MY PANTRY TAB ===== */}
        {tab === 'pantry' && (
          <div style={{ paddingTop: 16, paddingBottom: 40, animation: 'fadeIn 0.25s ease' }}>

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
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, marginBottom: 4 }}>
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
                              }}>&times;</button>
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
                        {pantryItems.length} item{pantryItems.length !== 1 ? 's' : ''} &middot; {new Set(pantryItems.map(i => i.category)).size} categor{new Set(pantryItems.map(i => i.category)).size !== 1 ? 'ies' : 'y'}
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
