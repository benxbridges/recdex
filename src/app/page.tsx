'use client'

import { useState, useEffect, useRef } from 'react'
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
  timerBg: '#FDF8F6', timerRing: 'rgba(200,74,42,0.15)',
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// ===== TYPES =====
type IngredientItem = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredients = any[] // Can be flat items or grouped

type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; category_id: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  time_passive: number | null; time_passive_label: string | null
  image_url: string | null; servings: number | null; servings_label: string | null
  tags: string[] | null
  ingredients: RawIngredients; steps: Step[]
}

// Normalize ingredients: handles both flat [{name, amount}] and grouped [{group, items}]
function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  if (!ingredients || ingredients.length === 0) return []
  // If first item has 'group' key, it's the old grouped format
  if (ingredients[0]?.group) {
    return ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  }
  // Otherwise it's flat
  return ingredients as IngredientItem[]
}

type Category = { id: string; name: string; recipe_count: number }

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

function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
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
      color: s.color, background: s.bg, padding: '2px 7px', borderRadius: 1, fontFamily: MONO,
    }}>{difficulty}</span>
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

function SearchIcon({ focused }: { focused: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={focused ? C.text : C.text3} strokeWidth="2" strokeLinecap="round"
      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

// ===== INLINE TIMER (for cook mode) =====
function InlineTimer({ minutes, label, timerKey, timers, onStart }: {
  minutes: number; label: string; timerKey: string
  timers: Record<string, { active: boolean; total: number; remaining: number; label: string }>
  onStart: (key: string, seconds: number, label: string) => void
}) {
  const t = timers[timerKey]
  const isActive = t && t.active
  const isFinished = t && t.active && t.remaining <= 0
  const seconds = minutes * 60

  if (isActive) {
    const pct = t.total > 0 ? ((t.total - t.remaining) / t.total) * 100 : 0
    return (
      <div style={{
        marginTop: 8, padding: '8px 12px', borderRadius: 2,
        background: isFinished ? C.accentBg : C.timerBg,
        border: `1.5px solid ${isFinished ? C.accentMed : C.timerRing}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 28, height: 28, position: 'relative', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="14" cy="14" r="11" fill="none" stroke={C.timerRing} strokeWidth="2" />
            <circle cx="14" cy="14" r="11" fill="none" stroke={isFinished ? C.accent : C.green} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 11}`} strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: isFinished ? C.accent : C.text, fontFamily: MONO }}>
              {isFinished ? '✓' : formatTimerDisplay(t.remaining)}
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: isFinished ? C.accent : C.text, margin: 0, fontFamily: SANS }}>
            {isFinished ? `${label} — Done!` : label}
          </p>
          <div style={{ height: 2, borderRadius: 1, background: C.timerRing, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 1, background: isFinished ? C.accent : C.green, width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <button onClick={e => { e.stopPropagation(); onStart(timerKey, seconds, label) }} style={{
      marginTop: 8, padding: '6px 12px', borderRadius: 2, border: `1.5px solid ${C.timerRing}`,
      background: C.timerBg, color: C.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M12 2v2" />
      </svg>
      Start timer · {formatTime(minutes)}
    </button>
  )
}

// ===== COOK MODE OVERLAY =====
function CookMode({ recipe, onExit, timers, startTimer, cancelTimer }: {
  recipe: Recipe; onExit: () => void
  timers: Record<string, { active: boolean; total: number; remaining: number; label: string }>
  startTimer: (key: string, seconds: number, label: string) => void
  cancelTimer: (key: string) => void
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const total = recipe.steps.length

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, fontFamily: SANS }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.4)', backdropFilter: 'blur(2px)' }} onClick={onExit} />
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(254,253,251,0.97)',
        display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '16px 20px 12px', borderBottom: `1.5px solid ${C.text}`,
          background: 'rgba(254,253,251,0.98)', flexShrink: 0,
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onExit} style={{
              background: 'none', border: `1px solid ${C.rule}`, borderRadius: 2,
              padding: '5px 12px', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            }}>← Exit</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: 0, fontFamily: SANS }}>Cook Mode</p>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '2px 0 0' }}>{recipe.title}</h2>
            </div>
            <button onClick={() => setShowIngredients(!showIngredients)} style={{
              background: showIngredients ? C.text : 'none',
              border: `1px solid ${showIngredients ? C.text : C.rule}`, borderRadius: 2,
              padding: '5px 12px', color: showIngredients ? C.bg : C.text2,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            }}>Ingredients</button>
          </div>

          {/* Progress bar */}
          <div style={{ maxWidth: 640, margin: '10px auto 0', display: 'flex', gap: 3 }}>
            {recipe.steps.map((_, i) => (
              <div key={i} onClick={() => setActiveStep(i)} style={{
                flex: 1, height: 4, borderRadius: 1, cursor: 'pointer',
                background: i < activeStep ? C.green : i === activeStep ? C.accent : C.ruleLight,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Ingredients slide-down */}
        {showIngredients && recipe.ingredients.length > 0 && (
          <div style={{ padding: '14px 20px', background: C.warm, borderBottom: `1px solid ${C.rule}`, flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px', fontFamily: SANS }}>
                Ingredients · serves {recipe.servings || 4}
              </p>
              <div style={{ columns: 2, columnGap: 20 }}>
                {getIngredientItems(recipe.ingredients).map((item, i) => (
                  <p key={i} style={{ fontSize: 12, color: C.text, margin: '2px 0', fontFamily: SANS, lineHeight: 1.4, breakInside: 'avoid' }}>
                    {item.amount && <span style={{ fontWeight: 500 }}>{item.amount} {item.unit} </span>}
                    {item.name}
                    {item.notes && <span style={{ color: C.text3 }}> ({item.notes})</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {recipe.steps.map((s, i) => {
              const isActive = i === activeStep
              const isCompleted = i < activeStep
              return (
                <div
                  key={i}
                  ref={el => { stepRefs.current[i] = el }}
                  onClick={() => setActiveStep(i)}
                  style={{
                    display: 'flex', gap: 14, padding: '14px 16px', marginBottom: 4,
                    borderRadius: 2, cursor: 'pointer',
                    background: isActive ? C.accentBg : 'transparent',
                    borderLeft: isActive ? `3px solid ${C.accent}` : isCompleted ? `3px solid ${C.green}` : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    opacity: isCompleted && !isActive ? 0.55 : 1,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 2, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 12, fontWeight: 700,
                    background: isCompleted ? C.greenBg : isActive ? C.accent : C.ruleLight,
                    color: isCompleted ? C.green : isActive ? '#fff' : C.text3,
                    transition: 'all 0.2s',
                  }}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: isActive ? SERIF : SANS,
                      fontSize: isActive ? 16 : 13.5,
                      lineHeight: isActive ? 1.6 : 1.5,
                      color: isCompleted ? C.text3 : C.text,
                      margin: 0, fontWeight: 400,
                    }}>{s.text}</p>
                    {s.timer_minutes && (isActive || timers[`${recipe.id}-${i}`]?.active) && (
                      <InlineTimer
                        minutes={s.timer_minutes}
                        label={`Step ${i + 1}`}
                        timerKey={`${recipe.id}-${i}`}
                        timers={timers}
                        onStart={startTimer}
                      />
                    )}
                  </div>
                </div>
              )
            })}

            {/* Finish */}
            {activeStep >= total - 1 && (
              <div style={{
                marginTop: 16, padding: 20, borderRadius: 2,
                background: C.greenBg, border: '1px solid #D5DDD2',
                textAlign: 'center', animation: 'fadeIn 0.2s ease',
              }}>
                <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.green, margin: '0 0 4px' }}>All steps complete</p>
                <p style={{ fontSize: 12, color: C.text2, margin: '0 0 14px', fontFamily: SANS }}>Nice work. How did it turn out?</p>
                <button onClick={onExit} style={{
                  padding: '10px 28px', borderRadius: 2, border: 'none',
                  background: C.green, color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                }}>Finish & close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== RECIPE CARD =====
function RecipeCard({ recipe, isExpanded, onToggle, onCookMode }: {
  recipe: Recipe; isExpanded: boolean; onToggle: () => void; onCookMode: () => void
}) {
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0
  const hasSteps = recipe.steps && recipe.steps.length > 0
  const ingredientItems = getIngredientItems(recipe.ingredients)

  return (
    <div style={{ borderBottom: `1px solid ${C.rule}`, padding: '14px 0' }}>
      <div style={{ display: 'flex', gap: 14, cursor: 'pointer' }} onClick={onToggle}>
        <div style={{
          width: 80, height: 56, borderRadius: 2, overflow: 'hidden', flexShrink: 0,
          background: C.warm, border: `1px solid ${C.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22, opacity: 0.5 }}>🍽</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 16.5, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.25 }}>{recipe.title}</h3>
            <span style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>{recipe.cuisine}</span>
          </div>
          {/* Only show truncated description when NOT expanded */}
          {!isExpanded && recipe.description && (
            <p style={{
              fontSize: 13, color: C.text2, lineHeight: 1.45, margin: '3px 0 0', fontFamily: SANS,
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            }}>{recipe.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            <span style={{ color: C.rule, fontSize: 11 }}>|</span>
            <TimeDisplay total={recipe.time_total} active={recipe.time_active}
              passiveLabel={recipe.time_passive_label} passiveTime={recipe.time_passive} />
          </div>
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: 6, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 14, paddingLeft: 94, animation: 'fadeIn 0.15s ease' }}>
          {/* Full description - only place it appears when expanded */}
          {recipe.description && (
            <p style={{
              fontSize: 14, color: C.text, lineHeight: 1.6, margin: '0 0 16px',
              fontFamily: SERIF, fontStyle: 'italic', maxWidth: 520,
            }}>&ldquo;{recipe.description}&rdquo;</p>
          )}

          {recipe.time_passive_label && recipe.time_passive && (
            <div style={{
              marginBottom: 14, padding: '8px 12px', background: C.accentBg,
              border: `1px solid ${C.accentMed}`, borderRadius: 2,
              fontSize: 12, color: C.accent, fontFamily: SANS,
            }}>+ {formatTime(recipe.time_passive)} {recipe.time_passive_label}</div>
          )}

          {/* Flat ingredient list */}
          {hasIngredients && ingredientItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase',
                letterSpacing: 1.5, margin: '0 0 8px', fontFamily: SANS,
                borderBottom: `1px solid ${C.rule}`, paddingBottom: 4,
              }}>Ingredients · serves {recipe.servings || 4}{recipe.servings_label ? ` ${recipe.servings_label}` : ''}</p>
              <div style={{ columns: 2, columnGap: 24 }}>
                {ingredientItems.map((item, i) => (
                  <p key={i} style={{ fontSize: 13, color: C.text, margin: '3px 0', fontFamily: SANS, lineHeight: 1.4, breakInside: 'avoid' }}>
                    {item.amount && <span style={{ fontWeight: 500 }}>{item.amount} {item.unit} </span>}
                    {item.name}
                    {item.notes && <span style={{ color: C.text3, fontSize: 12 }}> ({item.notes})</span>}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {recipe.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontFamily: MONO, color: C.text3, padding: '2px 8px',
                  background: C.cool, borderRadius: 2,
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {hasSteps ? (
              <button onClick={e => { e.stopPropagation(); onCookMode() }} style={{
                padding: '10px 24px', borderRadius: 2, border: 'none',
                background: C.text, color: C.bg,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
              }}>Cook this</button>
            ) : (
              <button disabled style={{
                padding: '10px 24px', borderRadius: 2, border: `1.5px solid ${C.ruleLight}`,
                background: 'transparent', color: C.text3,
                fontSize: 13, fontWeight: 500, fontFamily: SANS, cursor: 'default',
              }}>Steps coming soon</button>
            )}
            <button style={{
              padding: '10px 20px', borderRadius: 2,
              border: `1.5px solid ${C.rule}`, background: 'transparent',
              color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            }}>Save</button>
            <button style={{
              padding: '10px 20px', borderRadius: 2,
              border: `1.5px solid ${C.text}`, background: C.text,
              color: C.bg, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
            }}>Share</button>
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
  const [cookModeRecipe, setCookModeRecipe] = useState<Recipe | null>(null)
  const [timers, setTimers] = useState<Record<string, { active: boolean; total: number; remaining: number; label: string }>>({})

  // Timer tick
  useEffect(() => {
    const hasActive = Object.values(timers).some(t => t.active && t.remaining > 0)
    if (!hasActive) return
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => {
          if (next[k].active && next[k].remaining > 0) next[k] = { ...next[k], remaining: next[k].remaining - 1 }
        })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timers])

  const startTimer = (key: string, seconds: number, label: string) => setTimers(prev => ({ ...prev, [key]: { active: true, total: seconds, remaining: seconds, label } }))
  const cancelTimer = (key: string) => setTimers(prev => { const next = { ...prev }; delete next[key]; return next })

  // Responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('sort_order')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  // Fetch total count
  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'published')
      if (count) setTotalCount(count)
    }
    fetchCount()
  }, [])

  // Fetch recipes
  useEffect(() => {
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
  }, [activeCategory, searchQuery])

  const activeCategoryName = activeCategory === 'all' ? 'All Recipes' : categories.find(c => c.id === activeCategory)?.name || 'All Recipes'

  // Cook mode overlay
  if (cookModeRecipe) {
    return (
      <div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { box-sizing: border-box; } body { margin: 0; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
        <CookMode recipe={cookModeRecipe} onExit={() => setCookModeRecipe(null)} timers={timers} startTimer={startTimer} cancelTimer={cancelTimer} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; } body { margin: 0; background: ${C.bg}; }
        ::selection { background: rgba(200,74,42,0.15); color: ${C.text}; }
        input::placeholder { color: ${C.text3}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.rule}; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px clamp(16px,4vw,24px) 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>Recipe Index</h1>
              <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: '6px 0 0', letterSpacing: 0.3 }}>An open recipe commons. Free forever. No ads.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: SANS }}>
              <span style={{ color: C.text2, cursor: 'pointer' }}>about</span>
              <span style={{ color: C.text2, cursor: 'pointer' }}>contribute</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, fontFamily: MONO, color: C.text3, flexWrap: 'wrap' }}>
            <span>{totalCount} recipes</span><span>{categories.length} categories</span><span>updated daily</span>
          </div>
        </div>
      </header>

      {/* SEARCH */}
      <div style={{ borderBottom: `1px solid ${C.rule}`, background: searchFocused ? '#fff' : C.bg, transition: 'background 0.15s' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px clamp(16px,4vw,24px)' }}>
          <div style={{ position: 'relative' }}>
            <SearchIcon focused={searchFocused} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              placeholder="Search by recipe, ingredient, or cuisine..."
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                border: `1.5px solid ${searchFocused ? C.text : C.rule}`,
                borderRadius: 2, fontSize: 14, color: C.text, fontFamily: SANS, outline: 'none', background: 'transparent',
              }} />
          </div>
        </div>
      </div>

      {/* MOBILE PILLS */}
      {isMobile && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px clamp(16px,4vw,24px)', display: 'flex', gap: 4, overflowX: 'auto', borderBottom: `1px solid ${C.ruleLight}` }}>
          <button onClick={() => { setActiveCategory('all'); setExpandedId(null) }} style={{
            padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 2, cursor: 'pointer',
            fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === 'all' ? 600 : 400,
            background: activeCategory === 'all' ? C.text : 'transparent', color: activeCategory === 'all' ? C.bg : C.text3,
          }}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setExpandedId(null) }} style={{
              padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 2, cursor: 'pointer',
              fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400,
              background: activeCategory === cat.id ? C.text : 'transparent', color: activeCategory === cat.id ? C.bg : C.text3,
            }}>{cat.name}</button>
          ))}
        </div>
      )}

      {/* BODY */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>
        <div style={{ display: 'flex' }}>
          {/* Sidebar */}
          {!isMobile && (
            <div style={{ width: 210, flexShrink: 0, paddingTop: 20, paddingRight: 24, borderRight: `1px solid ${C.rule}`, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px', fontFamily: SANS }}>Categories</p>
              <button onClick={() => { setActiveCategory('all'); setExpandedId(null) }} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textAlign: 'left',
              }}>
                <span style={{ fontSize: 12.5, color: activeCategory === 'all' ? C.text : C.text2, fontWeight: activeCategory === 'all' ? 600 : 400, borderBottom: activeCategory === 'all' ? `1.5px solid ${C.text}` : '1.5px solid transparent', paddingBottom: 1 }}>All Recipes</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{totalCount}</span>
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setExpandedId(null) }} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textAlign: 'left',
                }}>
                  <span style={{ fontSize: 12.5, color: activeCategory === cat.id ? C.text : C.text2, fontWeight: activeCategory === cat.id ? 600 : 400, borderBottom: activeCategory === cat.id ? `1.5px solid ${C.text}` : '1.5px solid transparent', paddingBottom: 1 }}>{cat.name}</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{cat.recipe_count}</span>
                </button>
              ))}
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px', fontFamily: SANS }}>Index Points</p>
                <div style={{ fontSize: 11, color: C.text2, fontFamily: SANS, lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 1px' }}>+25 recipe submitted</p>
                  <p style={{ margin: '0 0 1px' }}>+10 photo added</p>
                  <p style={{ margin: '0 0 1px' }}>+5 helpful comment</p>
                  <p style={{ margin: '0 0 1px' }}>+3 substitution tip</p>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}` }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px', fontFamily: SANS }}>Trust Signal</p>
                <p style={{ fontSize: 10.5, color: C.text2, fontFamily: SANS, lineHeight: 1.5, margin: 0 }}>
                  <span style={{ fontWeight: 600, color: C.green }}>Repeat cooks</span> track how many people made a recipe more than once.
                </p>
              </div>
              <p style={{ fontSize: 10, color: C.text3, margin: '20px 0 0', fontFamily: SANS, lineHeight: 1.5 }}>Recipes are free to read, use, and share. Always.</p>
            </div>
          )}

          {/* Recipe list */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: isMobile ? 0 : 24, paddingTop: 16, paddingBottom: 60 }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1 }}>{activeCategoryName}</h2>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>
                  {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}{searchQuery && ` matching "${searchQuery}"`}
                </span>
              </div>
              <div style={{ height: 1.5, background: C.text, marginTop: 8 }} />
            </div>

            {loading && <div style={{ padding: '40px 0', textAlign: 'center' }}><p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>Loading recipes...</p></div>}
            {!loading && recipes.length === 0 && <div style={{ padding: '40px 0', textAlign: 'center' }}><p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>{searchQuery ? `No recipes found for "${searchQuery}".` : 'No recipes in this category yet.'}</p></div>}
            {!loading && recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe}
                isExpanded={expandedId === recipe.id}
                onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                onCookMode={() => setCookModeRecipe(recipe)} />
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index</p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>An open recipe commons. Recipes are free to read, use, and share. No ads. No paywalls. Community-curated. Always.</p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO, textAlign: isMobile ? 'left' : 'right' }}>
              <p style={{ margin: '0 0 4px' }}>{totalCount} recipes · {categories.length} categories</p>
              <p style={{ margin: '0 0 4px' }}>updated daily</p>
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }}>Contribute</span> · <span style={{ color: C.accent, cursor: 'pointer' }}>About</span></p>
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