'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

const C = {
  bg: '#FEFDFB', warm: '#F5F2EC', cool: '#F8F6F1',
  text: '#1A1A18', text2: '#5C5647', text3: '#9C9585',
  rule: '#D4CDBE', ruleLight: '#E8E4DB',
  accent: '#C84A2A', accentBg: '#FDF3F0', accentMed: 'rgba(200,74,42,0.2)',
  green: '#4A6741', greenBg: '#F0F5EE',
  timerBg: '#FDF8F6', timerRing: 'rgba(200,74,42,0.15)',
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

type IngredientItem = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredients = any[]

type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; difficulty: string
  time_total: number | null; servings: number | null
  ingredients: RawIngredients; steps: Step[]
}

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

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// Inline timer
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
      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 6, background: isFinished ? C.accentBg : C.timerBg, border: `1.5px solid ${isFinished ? C.accentMed : C.timerRing}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="16" cy="16" r="13" fill="none" stroke={C.timerRing} strokeWidth="2" />
            <circle cx="16" cy="16" r="13" fill="none" stroke={isFinished ? C.accent : C.green} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 13}`} strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: isFinished ? C.accent : C.text, fontFamily: MONO }}>{isFinished ? '✓' : formatTimerDisplay(t.remaining)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: isFinished ? C.accent : C.text, margin: 0, fontFamily: SANS }}>{isFinished ? `${label} — Done!` : label}</p>
          <div style={{ height: 3, borderRadius: 2, background: C.timerRing, marginTop: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: isFinished ? C.accent : C.green, width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>
    )
  }
  return (
    <button onClick={e => { e.stopPropagation(); onStart(timerKey, seconds, label) }} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 6, border: `1.5px solid ${C.timerRing}`, background: C.timerBg, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M12 2v2" /></svg>
      Start timer · {formatTime(minutes)}
    </button>
  )
}

export default function CookModePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [timers, setTimers] = useState<Record<string, { active: boolean; total: number; remaining: number; label: string }>>({})
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true)
      const { data } = await supabase.from('recipes').select('*').eq('slug', slug).eq('status', 'published').single()
      if (data) setRecipe(data)
      setLoading(false)
    }
    if (slug) fetchRecipe()
  }, [slug])

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

  if (loading || !recipe) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: C.text3 }}>{loading ? 'Loading...' : 'Recipe not found'}</p>
      </div>
    )
  }

  const total = recipe.steps.length
  const ingredientItems = getIngredientItems(recipe.ingredients)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: '16px 24px 12px', borderBottom: `1.5px solid ${C.text}`, background: C.bg, flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push(`/recipe/${slug}`)} style={{ background: 'none', border: `1px solid ${C.rule}`, borderRadius: 4, padding: '6px 14px', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>← Exit</button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: 0, fontFamily: SANS }}>Cook Mode</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: '2px 0 0' }}>{recipe.title}</h2>
          </div>
          <button onClick={() => setShowIngredients(!showIngredients)} style={{ background: showIngredients ? C.text : 'none', border: `1px solid ${showIngredients ? C.text : C.rule}`, borderRadius: 4, padding: '6px 14px', color: showIngredients ? C.bg : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Ingredients</button>
        </div>
        {/* Progress bar */}
        <div style={{ maxWidth: 680, margin: '10px auto 0', display: 'flex', gap: 3 }}>
          {recipe.steps.map((_, i) => (
            <div key={i} onClick={() => setActiveStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: 'pointer', background: i < activeStep ? C.green : i === activeStep ? C.accent : C.ruleLight, transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Ingredients panel */}
      {showIngredients && ingredientItems.length > 0 && (
        <div style={{ padding: '16px 24px', background: C.warm, borderBottom: `1px solid ${C.rule}`, flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px', fontFamily: SANS }}>Ingredients · serves {recipe.servings || 4}</p>
            <div style={{ columns: 2, columnGap: 24 }}>
              {ingredientItems.map((item, i) => (
                <p key={i} style={{ fontSize: 13, color: C.text, margin: '3px 0', fontFamily: SANS, lineHeight: 1.5, breakInside: 'avoid' as const }}>
                  {item.amount && <span style={{ fontWeight: 600 }}>{item.amount} {item.unit} </span>}{item.name}
                  {item.notes && <span style={{ color: C.text3 }}> ({item.notes})</span>}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 100px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {recipe.steps.map((s, i) => {
            const isActive = i === activeStep, isCompleted = i < activeStep
            return (
              <div key={i} ref={el => { stepRefs.current[i] = el }} onClick={() => setActiveStep(i)}
                style={{ display: 'flex', gap: 14, padding: '16px 18px', marginBottom: 6, borderRadius: 6, cursor: 'pointer', background: isActive ? C.accentBg : 'transparent', borderLeft: isActive ? `3px solid ${C.accent}` : isCompleted ? `3px solid ${C.green}` : '3px solid transparent', transition: 'all 0.2s ease', opacity: isCompleted && !isActive ? 0.5 : 1 }}>
                <div style={{ width: 30, height: 30, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 13, fontWeight: 700, background: isCompleted ? C.greenBg : isActive ? C.accent : C.ruleLight, color: isCompleted ? C.green : isActive ? '#fff' : C.text3, transition: 'all 0.2s' }}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: isActive ? SERIF : SANS, fontSize: isActive ? 17 : 14, lineHeight: isActive ? 1.65 : 1.55, color: isCompleted ? C.text3 : C.text, margin: 0, fontWeight: 400 }}>{s.text}</p>
                  {s.timer_minutes && (isActive || timers[`${recipe.id}-${i}`]?.active) && (
                    <InlineTimer minutes={s.timer_minutes} label={`Step ${i + 1}`} timerKey={`${recipe.id}-${i}`} timers={timers} onStart={startTimer} />
                  )}
                </div>
              </div>
            )
          })}

          {/* Completion */}
          {activeStep >= total - 1 && (
            <div style={{ marginTop: 20, padding: 24, borderRadius: 8, background: C.greenBg, border: '1px solid #D5DDD2', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
              <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.green, margin: '0 0 6px' }}>All steps complete</p>
              <p style={{ fontSize: 13, color: C.text2, margin: '0 0 16px', fontFamily: SANS }}>Nice work. How did it turn out?</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => router.push(`/recipe/${slug}`)} style={{ padding: '11px 24px', borderRadius: 6, border: 'none', background: C.green, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Finish</button>
                <button onClick={() => router.push('/')} style={{ padding: '11px 24px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Back to home</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
