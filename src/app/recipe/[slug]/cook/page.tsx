'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

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

function capitalizeIngredient(name: string): string {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  let items: IngredientItem[] = []
  if (!ingredients || ingredients.length === 0) return items
  if (ingredients[0]?.group) items = ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  else items = ingredients as IngredientItem[]
  return items.map(item => ({ ...item, name: capitalizeIngredient(item.name) }))
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
  const [isMobile, setIsMobile] = useState(false)
  const [showIngredientsMobile, setShowIngredientsMobile] = useState(false)
  const [timers, setTimers] = useState<Record<string, { active: boolean; total: number; remaining: number; label: string }>>({})
  const [cookRating, setCookRating] = useState<string | null>(null)
  const [substitutions, setSubstitutions] = useState('')
  const [tip, setTip] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const goToStep = useCallback((step: number) => {
    setActiveStep(step)
    // Scroll the step into view
    setTimeout(() => {
      stepRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: C.text3 }}>Loading...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ fontSize: 16, color: C.text2, fontFamily: SERIF }}>Recipe not found</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>← Back to home</button>
      </div>
    )
  }

  if (!recipe.steps || recipe.steps.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ fontSize: 16, color: C.text2, fontFamily: SERIF }}>Steps coming soon for this recipe</p>
        <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>Check back later — we&apos;re still working on it.</p>
        <button onClick={() => router.push(`/recipe/${slug}`)} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>← Back to recipe</button>
      </div>
    )
  }

  const total = recipe.steps.length
  const ingredientItems = getIngredientItems(recipe.ingredients)
  const isLastStep = activeStep >= total - 1

  // Dock magnification: compute scale for each step based on distance from active
  function getStepScale(index: number): { scale: number; opacity: number; fontSize: number; padding: string } {
    const distance = Math.abs(index - activeStep)
    if (distance === 0) return { scale: 1, opacity: 1, fontSize: 18, padding: '24px 22px' }
    if (distance === 1) return { scale: 0.95, opacity: 0.7, fontSize: 14, padding: '14px 18px' }
    return { scale: 0.9, opacity: 0.45, fontSize: 13, padding: '10px 18px' }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: '14px 24px 10px', borderBottom: `1.5px solid ${C.text}`, background: C.bg, flexShrink: 0 }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push(`/recipe/${slug}`)} style={{ background: 'none', border: `1px solid ${C.rule}`, borderRadius: 6, padding: '6px 14px', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>← Exit</button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: 0, fontFamily: SANS }}>Cook Mode</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.text, margin: '2px 0 0' }}>
              {recipe.title}<EggDot size={6} />
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile && ingredientItems.length > 0 && (
              <button onClick={() => setShowIngredientsMobile(!showIngredientsMobile)} style={{ background: showIngredientsMobile ? C.text : 'none', border: `1px solid ${showIngredientsMobile ? C.text : C.rule}`, borderRadius: 6, padding: '6px 14px', color: showIngredientsMobile ? C.bg : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>
                Ingredients
              </button>
            )}
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>
              {activeStep + 1}/{total}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ maxWidth: 1060, margin: '10px auto 0', display: 'flex', gap: 3 }}>
          {recipe.steps.map((_, i) => (
            <div key={i} onClick={() => goToStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: 'pointer', background: i < activeStep ? C.green : i === activeStep ? C.accent : C.ruleLight, transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Mobile ingredients panel */}
      {isMobile && showIngredientsMobile && ingredientItems.length > 0 && (
        <div style={{ padding: '14px 24px', background: C.warm, borderBottom: `1px solid ${C.rule}`, flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px', fontFamily: SANS }}>Ingredients · serves {recipe.servings || 4}</p>
          <div style={{ columns: 2, columnGap: 20 }}>
            {ingredientItems.map((item, i) => (
              <p key={i} style={{ fontSize: 12, color: C.text, margin: '2px 0', fontFamily: SANS, lineHeight: 1.5, breakInside: 'avoid' as const }}>
                {item.name}
                {item.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {item.amount}{item.unit ? ` ${item.unit}` : ''}</span>}
                {item.notes && <span style={{ color: C.text3 }}> ({item.notes})</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT: Ingredients sidebar + Steps */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Ingredients sidebar (desktop only) */}
        {!isMobile && ingredientItems.length > 0 && (
          <div style={{
            width: 260, flexShrink: 0, borderRight: `1px solid ${C.rule}`,
            overflowY: 'auto', padding: '24px 24px 40px',
            background: C.warm,
          }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 4px', fontFamily: SANS }}>Ingredients</p>
            <p style={{ fontSize: 10, fontFamily: MONO, color: C.text3, margin: '0 0 14px' }}>serves {recipe.servings || 4}</p>
            <div style={{ height: 1, background: C.rule, marginBottom: 14 }} />
            {ingredientItems.map((item, i) => (
              <p key={i} style={{ fontSize: 13, color: C.text, margin: '6px 0', fontFamily: SANS, lineHeight: 1.55 }}>
                {item.name}
                {item.amount && <span style={{ color: C.text3, fontWeight: 400 }}> / {item.amount}{item.unit ? ` ${item.unit}` : ''}</span>}
                {item.notes && <span style={{ color: C.text3, fontSize: 12 }}> ({item.notes})</span>}
              </p>
            ))}
          </div>
        )}

        {/* Steps area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 20px 120px' : '28px 40px 120px' }}>
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            {recipe.steps.map((s, i) => {
              const isActive = i === activeStep
              const isCompleted = i < activeStep
              const { opacity, fontSize, padding } = getStepScale(i)

              return (
                <div
                  key={i}
                  ref={el => { stepRefs.current[i] = el }}
                  onClick={() => goToStep(i)}
                  style={{
                    padding,
                    marginBottom: isActive ? 8 : 4,
                    borderRadius: isActive ? 10 : 6,
                    cursor: 'pointer',
                    background: isActive ? C.accentBg : 'transparent',
                    border: isActive ? `1.5px solid ${C.accentMed}` : '1.5px solid transparent',
                    opacity,
                    transform: `scale(${isActive ? 1 : getStepScale(i).scale})`,
                    transformOrigin: 'left center',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Step number + text */}
                  <div style={{ display: 'flex', gap: isActive ? 16 : 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: isActive ? 36 : 28, height: isActive ? 36 : 28,
                      borderRadius: isActive ? 8 : 4, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: MONO, fontSize: isActive ? 15 : 12, fontWeight: 700,
                      background: isCompleted ? C.greenBg : isActive ? C.accent : C.ruleLight,
                      color: isCompleted ? C.green : isActive ? '#fff' : C.text3,
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: isActive ? SERIF : SANS,
                        fontSize,
                        lineHeight: isActive ? 1.7 : 1.55,
                        color: isCompleted ? C.text3 : C.text,
                        margin: 0, fontWeight: 400,
                        transition: 'font-size 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}>
                        {s.text}
                      </p>

                      {/* Timer (show on active step, or if a timer is running) */}
                      {s.timer_minutes && (isActive || timers[`${recipe.id}-${i}`]?.active) && (
                        <InlineTimer minutes={s.timer_minutes} label={`Step ${i + 1}`} timerKey={`${recipe.id}-${i}`} timers={timers} onStart={startTimer} />
                      )}

                      {/* Next step button — only on the active step */}
                      {isActive && (
                        <div style={{ marginTop: 16, animation: 'slideUp 0.25s ease 0.1s both' }}>
                          {!isLastStep ? (
                            <button onClick={e => { e.stopPropagation(); goToStep(activeStep + 1) }} style={{
                              padding: '11px 28px', borderRadius: 6, border: 'none',
                              background: C.text, color: C.bg,
                              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                              display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              Next step
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                            </button>
                          ) : (
                            <button onClick={e => { e.stopPropagation(); goToStep(activeStep + 1) }} style={{
                              padding: '11px 28px', borderRadius: 6, border: 'none',
                              background: C.green, color: '#fff',
                              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                              display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              Finish cooking
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Completion — feedback flow */}
            {activeStep >= total && (
              <div style={{ marginTop: 20, animation: 'slideUp 0.3s ease' }}>

                {!feedbackSubmitted ? (
                  <div style={{ borderRadius: 10, border: `1px solid ${C.rule}`, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '24px 28px 20px', background: C.greenBg, borderBottom: `1px solid #D5DDD2` }}>
                      <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.green, margin: '0 0 4px' }}>Nice work!</p>
                      <p style={{ fontSize: 13, color: C.text2, margin: 0, fontFamily: SANS, lineHeight: 1.5 }}>You just cooked {recipe.title}. Help the community by sharing how it went.</p>
                    </div>

                    {/* How did it turn out? */}
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px', fontFamily: SANS }}>How did it turn out?</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { key: 'amazing', emoji: '🤩', label: 'Amazing' },
                          { key: 'good', emoji: '😊', label: 'Good' },
                          { key: 'ok', emoji: '😐', label: 'Just ok' },
                          { key: 'tricky', emoji: '😅', label: 'Tricky' },
                        ].map(r => (
                          <button key={r.key} onClick={() => setCookRating(r.key)} style={{
                            padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: SANS,
                            fontSize: 13, fontWeight: 500,
                            border: `1.5px solid ${cookRating === r.key ? C.green : C.ruleLight}`,
                            background: cookRating === r.key ? C.greenBg : 'transparent',
                            color: cookRating === r.key ? C.green : C.text2,
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <span style={{ fontSize: 16 }}>{r.emoji}</span> {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Substitutions */}
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontFamily: SANS }}>Substitute anything?</p>
                      <p style={{ fontSize: 12, color: C.text3, margin: '0 0 10px', fontFamily: SANS, lineHeight: 1.5 }}>Swapped an ingredient or changed a quantity? Let others know.</p>
                      <textarea
                        value={substitutions}
                        onChange={e => setSubstitutions(e.target.value)}
                        placeholder="e.g. Used rigatoni instead of spaghetti, added a pinch of chili flakes..."
                        style={{
                          width: '100%', minHeight: 70, padding: '10px 14px', borderRadius: 6,
                          border: `1.5px solid ${C.ruleLight}`, background: C.bg, resize: 'vertical',
                          fontSize: 13, fontFamily: SANS, color: C.text, lineHeight: 1.5,
                          outline: 'none',
                        }}
                        onFocus={e => { e.target.style.borderColor = C.rule }}
                        onBlur={e => { e.target.style.borderColor = C.ruleLight }}
                      />
                    </div>

                    {/* Tip for next cook */}
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontFamily: SANS }}>Tip for the next cook?</p>
                      <textarea
                        value={tip}
                        onChange={e => setTip(e.target.value)}
                        placeholder="e.g. Take it off heat before adding the cheese — it makes all the difference."
                        style={{
                          width: '100%', minHeight: 60, padding: '10px 14px', borderRadius: 6,
                          border: `1.5px solid ${C.ruleLight}`, background: C.bg, resize: 'vertical',
                          fontSize: 13, fontFamily: SANS, color: C.text, lineHeight: 1.5,
                          outline: 'none',
                        }}
                        onFocus={e => { e.target.style.borderColor = C.rule }}
                        onBlur={e => { e.target.style.borderColor = C.ruleLight }}
                      />
                    </div>

                    {/* Submit + skip */}
                    <div style={{ padding: '20px 28px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={async () => {
                        // Persist cook event to localStorage
                        const cookEvent = {
                          recipeId: recipe.id, recipeSlug: recipe.slug, recipeTitle: recipe.title,
                          cookedAt: Date.now(),
                          ...(cookRating && { rating: cookRating }),
                          ...(substitutions && { substitutions }),
                          ...(tip && { tip }),
                        }
                        const existing = JSON.parse(localStorage.getItem('recdex-cooked') || '[]')
                        existing.unshift(cookEvent)
                        localStorage.setItem('recdex-cooked', JSON.stringify(existing))

                        // Auto-post tip/substitution as a public comment if user has a display name
                        const profile = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
                        const displayName = profile.displayName
                        if (displayName && (tip || substitutions)) {
                          const parts: string[] = []
                          if (substitutions) parts.push(`🔄 Substitution: ${substitutions}`)
                          if (tip) parts.push(`💡 Tip: ${tip}`)
                          const body = parts.join('\n\n')
                          await supabase.from('comments').insert({
                            recipe_id: recipe.id,
                            display_name: displayName,
                            body,
                            rating: cookRating || null,
                          })
                        }

                        setFeedbackSubmitted(true)
                      }} style={{
                        padding: '11px 28px', borderRadius: 6, border: 'none',
                        background: (cookRating || substitutions || tip) ? C.green : C.ruleLight,
                        color: (cookRating || substitutions || tip) ? '#fff' : C.text3,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                        transition: 'all 0.15s',
                      }}>
                        {(substitutions || tip) ? 'Submit & mark as cooked' : 'Mark as cooked'}
                      </button>
                      <button onClick={() => {
                        // Still record the cook, just without feedback
                        const cookEvent = {
                          recipeId: recipe.id, recipeSlug: recipe.slug, recipeTitle: recipe.title,
                          cookedAt: Date.now(),
                        }
                        const existing = JSON.parse(localStorage.getItem('recdex-cooked') || '[]')
                        existing.unshift(cookEvent)
                        localStorage.setItem('recdex-cooked', JSON.stringify(existing))
                        setFeedbackSubmitted(true)
                      }} style={{
                        padding: '11px 16px', borderRadius: 6, border: 'none',
                        background: 'transparent', color: C.text3,
                        fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                      }}>
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Thank you state */
                  <div style={{ borderRadius: 10, background: C.greenBg, border: '1px solid #D5DDD2', padding: 28, textAlign: 'center' }}>
                    <p style={{ fontSize: 28, margin: '0 0 6px' }}>🎉</p>
                    <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.green, margin: '0 0 4px' }}>
                      {(substitutions || tip) ? 'Thanks for contributing!' : 'Cooked!'}
                    </p>
                    <p style={{ fontSize: 13, color: C.text2, margin: '0 0 20px', fontFamily: SANS, lineHeight: 1.5 }}>
                      {(substitutions || tip)
                        ? (() => {
                            const profile = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
                            return profile.displayName
                              ? 'Your notes have been shared as a Community Note on this recipe.'
                              : 'Your notes will help other cooks with this recipe.'
                          })()
                        : `${recipe.title} is now in your cook history.`}
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => router.push(`/recipe/${slug}`)} style={{ padding: '11px 24px', borderRadius: 6, border: 'none', background: C.green, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>Back to recipe</button>
                      <button onClick={() => router.push('/')} style={{ padding: '11px 24px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Home</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
