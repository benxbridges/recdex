'use client'

import { useState, useEffect, useRef } from 'react'
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
  timerBg: '#FDF8F6', timerRing: 'rgba(200,74,42,0.15)',
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

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
}

type Category = { id: string; name: string; recipe_count: number }

// ===== HELPERS =====
function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  if (!ingredients || ingredients.length === 0) return []
  if (ingredients[0]?.group) return ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  return ingredients as IngredientItem[]
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
}

function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60), s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    easy: { color: C.green, bg: C.greenBg }, medium: { color: C.gold, bg: C.goldBg }, hard: { color: C.accent, bg: C.accentBg },
  }
  const s = styles[difficulty] || styles.easy
  return <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.color, background: s.bg, padding: '2px 7px', borderRadius: 1, fontFamily: MONO }}>{difficulty}</span>
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

// ===== INLINE TIMER =====
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
      <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 2, background: isFinished ? C.accentBg : C.timerBg, border: `1.5px solid ${isFinished ? C.accentMed : C.timerRing}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, position: 'relative', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="14" cy="14" r="11" fill="none" stroke={C.timerRing} strokeWidth="2" />
            <circle cx="14" cy="14" r="11" fill="none" stroke={isFinished ? C.accent : C.green} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 11}`} strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: isFinished ? C.accent : C.text, fontFamily: MONO }}>{isFinished ? '✓' : formatTimerDisplay(t.remaining)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: isFinished ? C.accent : C.text, margin: 0, fontFamily: SANS }}>{isFinished ? `${label} — Done!` : label}</p>
          <div style={{ height: 2, borderRadius: 1, background: C.timerRing, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 1, background: isFinished ? C.accent : C.green, width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>
    )
  }
  return (
    <button onClick={e => { e.stopPropagation(); onStart(timerKey, seconds, label) }} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 2, border: `1.5px solid ${C.timerRing}`, background: C.timerBg, color: C.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M12 2v2" /></svg>
      Start timer · {formatTime(minutes)}
    </button>
  )
}

// ===== COOK MODE =====
function CookMode({ recipe, onExit, timers, startTimer }: {
  recipe: Recipe; onExit: () => void
  timers: Record<string, { active: boolean; total: number; remaining: number; label: string }>
  startTimer: (key: string, seconds: number, label: string) => void
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const total = recipe.steps.length
  const ingredientItems = getIngredientItems(recipe.ingredients)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`@keyframes cookModeIn{from{opacity:0;transform:translateY(30px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes backdropIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: 'backdropIn 0.25s ease' }} onClick={onExit} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 680, maxHeight: '88vh', background: C.bg, borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'cookModeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1.5px solid ${C.rule}`, background: C.bg, flexShrink: 0, borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onExit} style={{ background: 'none', border: `1px solid ${C.rule}`, borderRadius: 2, padding: '5px 12px', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>← Exit</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: 0, fontFamily: SANS }}>Cook Mode</p>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '2px 0 0' }}>{recipe.title}</h2>
            </div>
            <button onClick={() => setShowIngredients(!showIngredients)} style={{ background: showIngredients ? C.text : 'none', border: `1px solid ${showIngredients ? C.text : C.rule}`, borderRadius: 2, padding: '5px 12px', color: showIngredients ? C.bg : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Ingredients</button>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
            {recipe.steps.map((_, i) => (
              <div key={i} onClick={() => setActiveStep(i)} style={{ flex: 1, height: 4, borderRadius: 1, cursor: 'pointer', background: i < activeStep ? C.green : i === activeStep ? C.accent : C.ruleLight, transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
        {/* Ingredients panel */}
        {showIngredients && ingredientItems.length > 0 && (
          <div style={{ padding: '14px 20px', background: C.warm, borderBottom: `1px solid ${C.rule}`, flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px', fontFamily: SANS }}>Ingredients · serves {recipe.servings || 4}</p>
            <div style={{ columns: 2, columnGap: 20 }}>
              {ingredientItems.map((item, i) => (
                <p key={i} style={{ fontSize: 12, color: C.text, margin: '2px 0', fontFamily: SANS, lineHeight: 1.4, breakInside: 'avoid' as const }}>
                  {item.amount && <span style={{ fontWeight: 500 }}>{item.amount} {item.unit} </span>}{item.name}
                  {item.notes && <span style={{ color: C.text3 }}> ({item.notes})</span>}
                </p>
              ))}
            </div>
          </div>
        )}
        {/* Steps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px' }}>
            {recipe.steps.map((s, i) => {
              const isActive = i === activeStep, isCompleted = i < activeStep
              return (
                <div key={i} ref={el => { stepRefs.current[i] = el }} onClick={() => setActiveStep(i)}
                  style={{ display: 'flex', gap: 14, padding: '14px 16px', marginBottom: 4, borderRadius: 2, cursor: 'pointer', background: isActive ? C.accentBg : 'transparent', borderLeft: isActive ? `3px solid ${C.accent}` : isCompleted ? `3px solid ${C.green}` : '3px solid transparent', transition: 'all 0.2s ease', opacity: isCompleted && !isActive ? 0.55 : 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 12, fontWeight: 700, background: isCompleted ? C.greenBg : isActive ? C.accent : C.ruleLight, color: isCompleted ? C.green : isActive ? '#fff' : C.text3, transition: 'all 0.2s' }}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: isActive ? SERIF : SANS, fontSize: isActive ? 16 : 13.5, lineHeight: isActive ? 1.6 : 1.5, color: isCompleted ? C.text3 : C.text, margin: 0, fontWeight: 400 }}>{s.text}</p>
                    {s.timer_minutes && (isActive || timers[`${recipe.id}-${i}`]?.active) && (
                      <InlineTimer minutes={s.timer_minutes} label={`Step ${i + 1}`} timerKey={`${recipe.id}-${i}`} timers={timers} onStart={startTimer} />
                    )}
                  </div>
                </div>
              )
            })}
            {activeStep >= total - 1 && (
              <div style={{ marginTop: 16, padding: 20, borderRadius: 8, background: C.greenBg, border: '1px solid #D5DDD2', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
                <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.green, margin: '0 0 4px' }}>All steps complete</p>
                <p style={{ fontSize: 12, color: C.text2, margin: '0 0 14px', fontFamily: SANS }}>Nice work. How did it turn out?</p>
                <button onClick={onExit} style={{ padding: '10px 28px', borderRadius: 6, border: 'none', background: C.green, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Finish & close</button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

// ===== RECIPE CARD (Browse view) =====
function RecipeCard({ recipe, isExpanded, onToggle, onCookMode }: {
  recipe: Recipe; isExpanded: boolean; onToggle: () => void; onCookMode: () => void
}) {
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0
  const hasSteps = recipe.steps && recipe.steps.length > 0
  const ingredientItems = getIngredientItems(recipe.ingredients)
  return (
    <div style={{ borderBottom: `1px solid ${C.rule}`, padding: '14px 0' }}>
      <div style={{ display: 'flex', gap: 14, cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ width: 80, height: 56, borderRadius: 2, overflow: 'hidden', flexShrink: 0, background: C.warm, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {recipe.image_url ? <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <span style={{ fontSize: 22, opacity: 0.4 }}>🍽</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 16.5, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.25 }}>{recipe.title}</h3>
            <span style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>{recipe.cuisine}</span>
          </div>
          {!isExpanded && recipe.description && (
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.45, margin: '3px 0 0', fontFamily: SANS, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{recipe.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            <span style={{ color: C.rule, fontSize: 11 }}>|</span>
            <TimeDisplay total={recipe.time_total} active={recipe.time_active} passiveLabel={recipe.time_passive_label} passiveTime={recipe.time_passive} />
          </div>
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 6, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M6 9l6 6 6-6" /></svg>
      </div>
      {isExpanded && (
        <div style={{ marginTop: 14, paddingLeft: 94, animation: 'fadeIn 0.15s ease' }}>
          {recipe.description && <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, margin: '0 0 16px', fontFamily: SERIF, fontStyle: 'italic', maxWidth: 520 }}>&ldquo;{recipe.description}&rdquo;</p>}
          {recipe.time_passive_label && recipe.time_passive && (
            <div style={{ marginBottom: 14, padding: '8px 12px', background: C.accentBg, border: `1px solid ${C.accentMed}`, borderRadius: 2, fontSize: 12, color: C.accent, fontFamily: SANS }}>+ {formatTime(recipe.time_passive)} {recipe.time_passive_label}</div>
          )}
          {hasIngredients && ingredientItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px', fontFamily: SANS, borderBottom: `1px solid ${C.rule}`, paddingBottom: 4 }}>Ingredients · serves {recipe.servings || 4}{recipe.servings_label ? ` ${recipe.servings_label}` : ''}</p>
              <div style={{ columns: 2, columnGap: 24 }}>
                {ingredientItems.map((item, i) => (
                  <p key={i} style={{ fontSize: 13, color: C.text, margin: '3px 0', fontFamily: SANS, lineHeight: 1.4, breakInside: 'avoid' as const }}>
                    {item.amount && <span style={{ fontWeight: 500 }}>{item.amount} {item.unit} </span>}{item.name}
                    {item.notes && <span style={{ color: C.text3, fontSize: 12 }}> ({item.notes})</span>}
                  </p>
                ))}
              </div>
            </div>
          )}
          {recipe.tags && recipe.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {recipe.tags.map(tag => <span key={tag} style={{ fontSize: 10, fontFamily: MONO, color: C.text3, padding: '2px 8px', background: C.cool, borderRadius: 2 }}>{tag}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {hasSteps ? (
              <button onClick={e => { e.stopPropagation(); onCookMode() }} style={{ padding: '10px 24px', borderRadius: 2, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Cook this</button>
            ) : (
              <button disabled style={{ padding: '10px 24px', borderRadius: 2, border: `1.5px solid ${C.ruleLight}`, background: 'transparent', color: C.text3, fontSize: 13, fontWeight: 500, fontFamily: SANS, cursor: 'default' }}>Steps coming soon</button>
            )}
            <button style={{ padding: '10px 20px', borderRadius: 2, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Save</button>
            <button style={{ padding: '10px 20px', borderRadius: 2, border: `1.5px solid ${C.text}`, background: C.text, color: C.bg, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Share</button>
          </div>
        </div>
      )}
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
  const [view, setView] = useState<'home' | 'browse'>('home')
  const [rotdSaved, setRotdSaved] = useState(false)

  // Featured recipe slugs
  const FEATURED_SLUGS = ['cacio-e-pepe', 'shakshouka', 'pad-thai', 'chicken-tikka-masala', 'chocolate-chip-cookies', 'carbonara']
  const QUICK_SLUGS = ['guacamole', 'hummus', 'scrambled-eggs', 'aglio-e-olio', 'fried-rice', 'pesto-alla-genovese']

  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])
  const [quickRecipes, setQuickRecipes] = useState<Recipe[]>([])
  const [rotdRecipe, setRotdRecipe] = useState<Recipe | null>(null)

  // Timer tick
  useEffect(() => {
    const hasActive = Object.values(timers).some(t => t.active && t.remaining > 0)
    if (!hasActive) return
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => { if (next[k].active && next[k].remaining > 0) next[k] = { ...next[k], remaining: next[k].remaining - 1 } })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timers])

  const startTimer = (key: string, seconds: number, label: string) => setTimers(prev => ({ ...prev, [key]: { active: true, total: seconds, remaining: seconds, label } }))
  const cancelTimer = (key: string) => setTimers(prev => { const next = { ...prev }; delete next[key]; return next })

  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 700); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  useEffect(() => { supabase.from('categories').select('*').order('sort_order').then(({ data }) => { if (data) setCategories(data) }) }, [])
  useEffect(() => { supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'published').then(({ count }) => { if (count) setTotalCount(count) }) }, [])

  // Fetch homepage data
  useEffect(() => {
    async function fetchHomepage() {
      const { data: feat } = await supabase.from('recipes').select('*').in('slug', FEATURED_SLUGS).eq('status', 'published')
      if (feat) {
        setFeaturedRecipes(feat.filter(r => r.slug !== 'cacio-e-pepe'))
        setRotdRecipe(feat.find(r => r.slug === 'cacio-e-pepe') || feat[0])
      }
      const { data: quick } = await supabase.from('recipes').select('*').in('slug', QUICK_SLUGS).eq('status', 'published')
      if (quick) setQuickRecipes(quick)
    }
    fetchHomepage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Switch to browse when searching
  useEffect(() => { if (searchQuery.trim()) setView('browse') }, [searchQuery])

  const activeCategoryName = activeCategory === 'all' ? 'All Recipes' : categories.find(c => c.id === activeCategory)?.name || 'All Recipes'

  // Cook mode is now an overlay, rendered at the bottom of the component

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}input::placeholder{color:${C.text3}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.rule}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => { setView('home'); setSearchQuery(''); setActiveCategory('all') }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 11, color: C.text3, margin: '4px 0 0', letterSpacing: 0.3 }}>An open recipe commons</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, fontFamily: SANS }}>
              <span style={{ color: C.text2, cursor: 'pointer' }}>about</span>
              <span style={{ color: C.text2, cursor: 'pointer' }}>contribute</span>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: C.text2 }}>
                <RecipeBoxIcon /><span style={{ fontSize: 11, fontWeight: 500 }}>My Box</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div style={{ borderBottom: `1px solid ${C.ruleLight}`, padding: '10px clamp(16px,4vw,24px)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: SANS, flexShrink: 0 }}>Live</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, animation: 'pulse 2s ease infinite' }} />
          <CookedRecentlyFeed />
        </div>
      </div>

      {/* SEARCH HERO */}
      <div style={{ background: C.warm, borderBottom: `1px solid ${C.rule}`, padding: '32px clamp(16px,4vw,24px) 28px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>What do you want to cook?</p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, marginBottom: 18 }}>{totalCount} recipes · No life stories · Just food</p>
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? C.text : C.text3} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.15s' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              placeholder="Search by recipe, ingredient, or cuisine..."
              style={{ width: '100%', padding: '14px 18px 14px 46px', border: `2px solid ${searchFocused ? C.text : C.rule}`, borderRadius: 3, fontSize: 15, color: C.text, fontFamily: SANS, outline: 'none', background: '#fff', boxShadow: searchFocused ? '0 2px 12px rgba(0,0,0,0.06)' : 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['pasta', 'chicken', 'vegetarian', 'under 30 min', 'baking'].map(tag => (
              <button key={tag} onClick={() => setSearchQuery(tag)} style={{ padding: '4px 12px', borderRadius: 2, border: `1px solid ${C.rule}`, background: 'transparent', color: C.text3, fontSize: 11, fontFamily: SANS, cursor: 'pointer' }}>{tag}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== HOME VIEW ===== */}
      {view === 'home' && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

          {/* RECIPE OF THE DAY */}
          {rotdRecipe && (
            <section style={{ paddingTop: 28, paddingBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
                  <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Recipe of the Day</h2>
                </div>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>FEB 24</span>
              </div>
              <div style={{ display: 'flex', gap: 28, cursor: 'pointer', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 380px', aspectRatio: '16/10', borderRadius: 4, overflow: 'hidden', background: C.warm, minHeight: 220 }}>
                  {rotdRecipe.image_url && <img src={rotdRecipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <DifficultyBadge difficulty={rotdRecipe.difficulty} />
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(rotdRecipe.time_total)}</span>
                    <span style={{ color: C.rule }}>·</span>
                    <span style={{ fontSize: 11, fontFamily: SANS, color: C.text3 }}>{rotdRecipe.cuisine}</span>
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 8 }}>{rotdRecipe.title}</h3>
                  <p style={{ fontFamily: SERIF, fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 12, maxWidth: 360 }}>{rotdRecipe.description}</p>
                  {TIPS[rotdRecipe.slug] && (
                    <div style={{ padding: '8px 12px', background: C.cool, borderRadius: 2, borderLeft: `3px solid ${C.accent}`, marginBottom: 14 }}>
                      <p style={{ fontSize: 12, color: C.text, fontFamily: SANS, lineHeight: 1.5, margin: 0 }}>
                        <span style={{ fontWeight: 600, color: C.accent }}>@{TIPS[rotdRecipe.slug].user}</span> {TIPS[rotdRecipe.slug].text}
                      </p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCookModeRecipe(rotdRecipe)} style={{ padding: '10px 24px', borderRadius: 2, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Cook this</button>
                    <button onClick={() => setRotdSaved(!rotdSaved)} style={{ padding: '10px 16px', borderRadius: 2, border: `1.5px solid ${rotdSaved ? C.green : C.rule}`, background: rotdSaved ? C.greenBg : 'transparent', color: rotdSaved ? C.green : C.text3, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={rotdSaved ? C.green : 'none'} stroke={rotdSaved ? C.green : 'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      {rotdSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div style={{ height: 1, background: C.rule }} />

          {/* COMMUNITY PICKS */}
          <section style={{ paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Community picks</h2>
              <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>WHAT COOKS ARE LOVING</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {featuredRecipes.slice(0, 4).map((r, i) => (
                <div key={r.id} style={{ cursor: 'pointer', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }} onClick={() => { setView('browse'); setExpandedId(r.id) }}>
                  <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', background: C.warm, border: `1px solid ${C.ruleLight}`, marginBottom: 8 }}>
                    {r.image_url ? <img src={r.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 32, opacity: 0.3 }}>🍽</span></div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <DifficultyBadge difficulty={r.difficulty} />
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(r.time_total)}</span>
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.25 }}>{r.title}</h3>
                  {TIPS[r.slug] && (
                    <div style={{ padding: '6px 10px', background: C.cool, borderRadius: 2, borderLeft: `2px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, color: C.text2, fontFamily: SANS, lineHeight: 1.4, margin: 0 }}>
                        <span style={{ fontWeight: 600, color: C.text3 }}>@{TIPS[r.slug].user}</span> {TIPS[r.slug].text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 1, background: C.rule }} />

          {/* QUICK MEALS */}
          <section style={{ paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Under 30 minutes</h2>
              <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>QUICK MEALS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {quickRecipes.map((r, i) => (
                <div key={r.id} style={{ cursor: 'pointer', animation: `fadeIn 0.3s ease ${i * 0.04}s both` }} onClick={() => { setView('browse'); setExpandedId(r.id) }}>
                  <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 3, overflow: 'hidden', background: C.warm, border: `1px solid ${C.ruleLight}`, marginBottom: 6 }}>
                    {r.image_url ? <img src={r.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 20, opacity: 0.3 }}>🍽</span></div>}
                  </div>
                  <h3 style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{r.title}</h3>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{formatTime(r.time_total)}</span>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 1, background: C.rule }} />

          {/* BROWSE BY CUISINE */}
          <section style={{ paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Browse by cuisine</h2>
              <button onClick={() => setView('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500 }}>Browse all {totalCount} recipes →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {categories.slice(0, 12).map((cat, i) => (
                <div key={cat.id} style={{ cursor: 'pointer', animation: `fadeIn 0.3s ease ${i * 0.03}s both` }} onClick={() => { setActiveCategory(cat.id); setView('browse') }}>
                  <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 3, overflow: 'hidden', position: 'relative', background: C.text }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10 }}>
                      <h3 style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 1 }}>{cat.name}</h3>
                      <span style={{ fontSize: 10, fontFamily: MONO, color: 'rgba(255,255,255,0.7)' }}>{cat.recipe_count} recipes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MISSION */}
          <div style={{ padding: '28px 32px', borderRadius: 4, background: C.warm, border: `1px solid ${C.rule}`, marginBottom: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>Recipes belong to everyone</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 14px' }}>Recipe Index is a free, ad-free, open commons for cooking knowledge. Built by cooks, for cooks.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button style={{ padding: '9px 20px', borderRadius: 2, border: 'none', background: C.text, color: C.bg, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>Contribute a recipe</button>
              <button style={{ padding: '9px 20px', borderRadius: 2, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Learn more</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BROWSE VIEW ===== */}
      {view === 'browse' && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>
          {/* Back to home */}
          <div style={{ padding: '12px 0' }}>
            <button onClick={() => { setView('home'); setSearchQuery(''); setActiveCategory('all') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: SANS, color: C.accent, fontWeight: 500 }}>← Back to home</button>
          </div>
          {isMobile && (
            <div style={{ display: 'flex', gap: 4, paddingBottom: 12, overflowX: 'auto', borderBottom: `1px solid ${C.ruleLight}` }}>
              <button onClick={() => { setActiveCategory('all'); setExpandedId(null) }} style={{ padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === 'all' ? 600 : 400, background: activeCategory === 'all' ? C.text : 'transparent', color: activeCategory === 'all' ? C.bg : C.text3 }}>All</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setExpandedId(null) }} style={{ padding: '5px 12px', whiteSpace: 'nowrap', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400, background: activeCategory === cat.id ? C.text : 'transparent', color: activeCategory === cat.id ? C.bg : C.text3 }}>{cat.name}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex' }}>
            {!isMobile && (
              <div style={{ width: 210, flexShrink: 0, paddingTop: 8, paddingRight: 24, borderRight: `1px solid ${C.rule}`, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px', fontFamily: SANS }}>Categories</p>
                <button onClick={() => { setActiveCategory('all'); setExpandedId(null) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textAlign: 'left' }}>
                  <span style={{ fontSize: 12.5, color: activeCategory === 'all' ? C.text : C.text2, fontWeight: activeCategory === 'all' ? 600 : 400, borderBottom: activeCategory === 'all' ? `1.5px solid ${C.text}` : '1.5px solid transparent', paddingBottom: 1 }}>All Recipes</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{totalCount}</span>
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setExpandedId(null) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textAlign: 'left' }}>
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
                <div style={{ height: 1.5, background: C.text, marginTop: 8 }} />
              </div>
              {loading && <div style={{ padding: '40px 0', textAlign: 'center' }}><p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>Loading recipes...</p></div>}
              {!loading && recipes.length === 0 && <div style={{ padding: '40px 0', textAlign: 'center' }}><p style={{ fontSize: 14, color: C.text3, fontFamily: SANS }}>{searchQuery ? `No recipes found for "${searchQuery}".` : 'No recipes in this category yet.'}</p></div>}
              {!loading && recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} isExpanded={expandedId === recipe.id} onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)} onCookMode={() => setCookModeRecipe(recipe)} />
              ))}
            </div>
          </div>
        </div>
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
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }}>Contribute</span> · <span style={{ color: C.accent, cursor: 'pointer' }}>About</span></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>© 2026 RecDex · Public Benefit Corporation</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>

      {/* COOK MODE OVERLAY */}
      {cookModeRecipe && <CookMode recipe={cookModeRecipe} onExit={() => setCookModeRecipe(null)} timers={timers} startTimer={startTimer} />}
    </div>
  )
}