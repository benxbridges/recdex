'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// ===== MAIN PAGE =====
export default function PantryPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'list' | 'pantry'>('list')
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
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

  const totalCount = groceryItems.length
  const recipeCount = new Set(groceryItems.map(i => i.recipeId)).size

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Page title + tabs */}
        <div style={{ paddingTop: 28, paddingBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px', fontFamily: SANS }}>Kitchen</p>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: '0 0 2px', letterSpacing: -0.5 }}>
            {tab === 'list' ? 'Shopping List' : 'My Pantry'}
          </h2>
          <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, margin: '0 0 20px' }}>
            {tab === 'list'
              ? (totalCount === 0 ? 'No items yet' : `${needItems.length} to get${gotItems.length > 0 ? ` · ${gotItems.length} purchased` : ''} · ${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}`)
              : `${pantryItems.length} item${pantryItems.length !== 1 ? 's' : ''} tracked`
            }
          </p>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.rule}` }}>
            {[
              { key: 'list' as const, label: 'Shopping List', icon: '🛒' },
              { key: 'pantry' as const, label: 'My Pantry', icon: '🏠' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 20px', border: 'none', background: 'transparent',
                fontFamily: SANS, fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? C.text : C.text3,
                cursor: 'pointer', position: 'relative',
                borderBottom: tab === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
                marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

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
                  Browse recipes and tap &ldquo;Grocery list&rdquo; → &ldquo;Add to shopping list&rdquo; to start building your list.
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
                          }}>open recipe ↗</button>
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
                              }}>×</button>
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

            {/* Photo scan teaser */}
            <div style={{
              marginTop: 32, padding: '20px 24px', borderRadius: 10,
              background: C.accentBg, border: `1px solid ${C.accentMed}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
              <p style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
                Photo scanning coming soon
              </p>
              <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, margin: 0 }}>
                Snap your fridge or pantry and we&apos;ll identify what you have automatically.
              </p>
            </div>
          </div>
        )}
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
              <p style={{ margin: 0 }}><Link href="/" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>Home</Link> · <Link href="/about" style={{ color: C.accent, cursor: 'pointer', textDecoration: 'none' }}>About</Link></p>
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
