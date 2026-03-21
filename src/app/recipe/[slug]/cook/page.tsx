'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import { getTipsForStep, type CookingTip } from '@/app/lib/cooking-tips'
import { scaleAmount, highlightVerbs, classifyStep, findPhaseBreaks, PHASE_META } from '@/app/lib/cook-utils'
import ThemeToggle from '@/app/components/ThemeToggle'

// Web Speech API types (not yet in all TS libs)
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
type SpeechRecognition = any
type SpeechRecognitionEvent = any
/* eslint-enable @typescript-eslint/no-explicit-any */

type IngredientItem = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredients = any[]

type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; difficulty: string
  time_total: number | null; servings: number | null
  ingredients: RawIngredients; steps: Step[]
  video_url?: string | null; submitted_by?: string | null; source_attribution?: string | null
  creator_name?: string | null; creator_url?: string | null
  image_url?: string | null
}

type SuggestedRecipe = { slug: string; title: string; image_url: string | null; cuisine: string | null; time_total: number | null }

// ─── Small helpers ───────────────────────────────────────────────────────

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

// ─── Egg dot (brand element) ─────────────────────────────────────────────

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// ─── Tip badge + popover ─────────────────────────────────────────────────

function TipBadge({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 12,
        border: `1px solid ${isOpen ? C.gold : C.ruleLight}`,
        background: isOpen ? C.goldBg : 'transparent',
        color: C.gold, fontSize: 10, fontWeight: 600,
        cursor: 'pointer', fontFamily: SANS,
        transition: 'all 0.15s',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" /><path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>
      Tip
    </button>
  )
}

function TipPopover({ tip, onClose }: { tip: CookingTip; onClose: () => void }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        marginTop: 10, padding: '14px 16px', borderRadius: 10,
        background: C.goldBg, border: `1.5px solid ${C.gold}`,
        animation: 'slideUp 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.gold, margin: 0, fontFamily: SANS }}>{tip.title}</p>
        <button onClick={e => { e.stopPropagation(); onClose() }} style={{
          background: 'none', border: 'none', color: C.text3, fontSize: 14,
          cursor: 'pointer', padding: '0 2px', lineHeight: 1,
        }}>×</button>
      </div>
      <p style={{ fontSize: 12, color: C.text, margin: 0, fontFamily: SANS, lineHeight: 1.6 }}>{tip.tip}</p>
    </div>
  )
}

// ─── Timer alert sound ───────────────────────────────────────────────────

function playTimerAlert() {
  try {
    const ctx = new AudioContext()
    const beep = (delay: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.15
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.12)
    }
    beep(0); beep(0.2); beep(0.4)
    setTimeout(() => ctx.close(), 1000)
  } catch { /* AudioContext may not be available */ }
  try { navigator.vibrate?.([200, 100, 200, 100, 200]) } catch { /* vibrate may not exist */ }
}

// ─── Inline timer component ─────────────────────────────────────────────

function InlineTimer({ minutes, label, timerKey, timers, onStart }: {
  minutes: number; label: string; timerKey: string
  timers: Record<string, { active: boolean; total: number; remaining: number; label: string }>
  onStart: (key: string, seconds: number, label: string) => void
}) {
  const t = timers[timerKey]
  const isActive = t && t.active
  const isFinished = t && t.active && t.remaining <= 0
  const isUrgent = t && t.active && t.remaining > 0 && t.remaining <= 10
  const isWarning = t && t.active && t.remaining > 10 && t.remaining <= 30
  const seconds = minutes * 60
  const ringColor = isFinished ? C.accent : isUrgent ? C.accent : isWarning ? C.gold : C.green
  if (isActive) {
    const pct = t.total > 0 ? ((t.total - t.remaining) / t.total) * 100 : 0
    return (
      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 6, background: isFinished ? C.accentBg : isUrgent ? C.accentBg : C.timerBg, border: `1.5px solid ${isFinished ? C.accentMed : isUrgent ? C.accent : isWarning ? C.gold : C.timerRing}`, display: 'flex', alignItems: 'center', gap: 12, animation: isUrgent ? 'pulse 0.6s ease infinite' : 'none' }}>
        <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="16" cy="16" r="13" fill="none" stroke={C.timerRing} strokeWidth="2" />
            <circle cx="16" cy="16" r="13" fill="none" stroke={ringColor} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 13}`} strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: isFinished ? C.accent : isUrgent ? C.accent : C.text, fontFamily: MONO }}>{isFinished ? '✓' : formatTimerDisplay(t.remaining)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: isFinished ? C.accent : isUrgent ? C.accent : C.text, margin: 0, fontFamily: SANS }}>{isFinished ? `${label} — Done!` : isUrgent ? `${label} — Almost!` : label}</p>
          <div style={{ height: 3, borderRadius: 2, background: C.timerRing, marginTop: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: ringColor, width: `${pct}%`, transition: 'width 0.5s ease' }} />
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

// ─── Egg confetti ────────────────────────────────────────────────────────

function EggConfetti() {
  const eggs = Array.from({ length: 28 }, (_, i) => {
    const isCracked = i % 5 === 0
    const colors = ['#F5E6D3', '#D4A574', '#E8956A', '#C4915E', '#F2D49B', '#E0C9A6', '#D9845B']
    const color = colors[i % colors.length]
    const left = Math.random() * 100
    const delay = Math.random() * 1.2
    const spin = 360 + Math.random() * 720
    const duration = 2.5 + Math.random() * 1.5
    const size = 10 + Math.random() * 8

    return (
      <div key={i} style={{
        position: 'absolute',
        left: `${left}%`,
        top: -20,
        width: size,
        height: size * 1.3,
        background: color,
        borderRadius: isCracked ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '50% 50% 50% 50% / 60% 60% 40% 40%',
        boxShadow: isCracked ? `inset 0 ${size * 0.3}px 0 ${size * 0.1}px rgba(0,0,0,0.12)` : 'none',
        animation: `eggFall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ['--egg-spin' as any]: `${spin}deg`,
      }} />
    )
  })

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {eggs}
    </div>
  )
}

// ─── Floating timer panel ────────────────────────────────────────────────

function FloatingTimerPanel({ timers, onGoToStep }: {
  timers: Record<string, { active: boolean; total: number; remaining: number; label: string }>
  onGoToStep: (step: number) => void
}) {
  const activeTimers = Object.entries(timers).filter(([, t]) => t.active)
  const [minimized, setMinimized] = useState(false)

  if (activeTimers.length === 0) return null

  if (minimized) {
    // Show a small floating pill with timer count
    const urgentCount = activeTimers.filter(([, t]) => t.remaining > 0 && t.remaining <= 10).length
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 900,
          padding: '10px 16px', borderRadius: 24,
          background: urgentCount > 0 ? C.accent : C.text,
          color: '#fff', border: 'none',
          fontSize: 12, fontWeight: 700, fontFamily: SANS,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: urgentCount > 0 ? 'pulse 0.6s ease infinite' : 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /></svg>
        {activeTimers.length} timer{activeTimers.length > 1 ? 's' : ''}
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 900,
      width: 220, borderRadius: 14,
      background: C.bg, border: `1.5px solid ${C.rule}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      animation: 'slideUp 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${C.ruleLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, fontFamily: SANS }}>
          Timers
        </span>
        <button onClick={() => setMinimized(true)} style={{
          background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 12, padding: '0 2px',
        }}>—</button>
      </div>
      {/* Timer list */}
      <div style={{ padding: '8px 12px', maxHeight: 200, overflowY: 'auto' }}>
        {activeTimers.map(([key, timer]) => {
          const stepIndex = parseInt(key.split('-').pop() || '0')
          const isFinished = timer.remaining <= 0
          const isUrgent = timer.remaining > 0 && timer.remaining <= 10
          const pct = timer.total > 0 ? ((timer.total - timer.remaining) / timer.total) * 100 : 0
          return (
            <div
              key={key}
              onClick={() => onGoToStep(stepIndex)}
              style={{
                padding: '8px 0', cursor: 'pointer',
                borderBottom: `1px solid ${C.ruleLight}`,
                animation: isUrgent ? 'pulse 0.6s ease infinite' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isFinished ? C.green : isUrgent ? C.accent : C.text, fontFamily: SANS }}>
                  {timer.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: isFinished ? C.green : isUrgent ? C.accent : C.text }}>
                  {isFinished ? '✓' : formatTimerDisplay(timer.remaining)}
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: C.ruleLight, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: isFinished ? C.green : isUrgent ? C.accent : C.accent, width: `${pct}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Phase divider ───────────────────────────────────────────────────────

function PhaseDivider({ phase }: { phase: 'prep' | 'cook' | 'finish' }) {
  const meta = PHASE_META[phase]
  const icons = {
    prep: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
    cook: <><path d="M12 12c0-3 2.5-5 2.5-8" /><path d="M8 12c0-3 2.5-5 2.5-8" /><path d="M16 12c0-3 2.5-5 2.5-8" /><rect x="4" y="14" width="16" height="6" rx="1" /></>,
    finish: <><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></>,
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', margin: '8px 0',
    }}>
      <div style={{ height: 1, flex: 1, background: meta.color, opacity: 0.25 }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 12,
        background: meta.bg, border: `1px solid ${meta.color}30`,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icons[phase]}
        </svg>
        <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: SANS }}>
          {meta.label}
        </span>
      </div>
      <div style={{ height: 1, flex: 1, background: meta.color, opacity: 0.25 }} />
    </div>
  )
}

// ─── Inline step note ────────────────────────────────────────────────────

function StepNote({ stepIndex, slug }: { stepIndex: number; slug: string }) {
  const storageKey = `recdex-notes-${slug}`
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (saved[stepIndex]) setNote(saved[stepIndex])
    } catch { /* */ }
  }, [stepIndex, storageKey])

  const saveNote = (value: string) => {
    setNote(value)
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (value) saved[stepIndex] = value
      else delete saved[stepIndex]
      localStorage.setItem(storageKey, JSON.stringify(saved))
    } catch { /* */ }
  }

  if (!isOpen && !note) {
    return (
      <button
        onClick={e => { e.stopPropagation(); setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100) }}
        style={{
          marginTop: 8, padding: '4px 10px', borderRadius: 4,
          border: `1px dashed ${C.ruleLight}`, background: 'transparent',
          color: C.text3, fontSize: 10, cursor: 'pointer', fontFamily: SANS,
          display: 'flex', alignItems: 'center', gap: 4,
          opacity: 0.6, transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.6' }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        Add note
      </button>
    )
  }

  if (!isOpen && note) {
    return (
      <div
        onClick={e => { e.stopPropagation(); setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100) }}
        style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 6,
          background: C.goldBg, border: `1px solid ${C.gold}30`,
          fontSize: 11, color: C.text2, fontFamily: SANS, lineHeight: 1.5,
          cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 6,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        {note}
      </div>
    )
  }

  return (
    <div onClick={e => e.stopPropagation()} style={{ marginTop: 8, animation: 'slideUp 0.15s ease' }}>
      <textarea
        ref={inputRef}
        value={note}
        onChange={e => saveNote(e.target.value)}
        placeholder="Swapped an ingredient? Changed the time? Note it here..."
        style={{
          width: '100%', minHeight: 50, padding: '8px 10px', borderRadius: 6,
          border: `1.5px solid ${C.gold}50`, background: C.goldBg,
          fontSize: 11, fontFamily: SANS, color: C.text, lineHeight: 1.5,
          resize: 'vertical', outline: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = C.gold }}
        onBlur={e => { e.target.style.borderColor = `${C.gold}50` }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
        <button onClick={() => { saveNote(''); setIsOpen(false) }} style={{
          padding: '3px 8px', borderRadius: 4, border: 'none', background: 'transparent',
          color: C.text3, fontSize: 10, cursor: 'pointer', fontFamily: SANS,
        }}>Clear</button>
        <button onClick={() => setIsOpen(false)} style={{
          padding: '3px 10px', borderRadius: 4, border: 'none', background: C.gold,
          color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
        }}>Done</button>
      </div>
    </div>
  )
}

// ─── Voice control + TTS ─────────────────────────────────────────────────

function useVoiceControl(
  recipe: Recipe | null,
  activeStep: number,
  totalSteps: number,
  goToStep: (step: number) => void,
  startTimer: (key: string, seconds: number, label: string) => void,
  timers: Record<string, { active: boolean; total: number; remaining: number; label: string }>,
) {
  const [isListening, setIsListening] = useState(false)
  const [lastHeard, setLastHeard] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isSpeakingRef = useRef(false)
  const isListeningRef = useRef(false)

  // Check if browser supports speech recognition
  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 0.8
    // Prefer a natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google') || v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred
    isSpeakingRef.current = true
    utterance.onend = () => { isSpeakingRef.current = false }
    window.speechSynthesis.speak(utterance)
  }, [])

  const readCurrentStep = useCallback(() => {
    if (!recipe || activeStep >= totalSteps) return
    const step = recipe.steps[activeStep]
    speak(`Step ${activeStep + 1}. ${step.text}`)
  }, [recipe, activeStep, totalSteps, speak])

  const handleCommand = useCallback((transcript: string) => {
    const cmd = transcript.toLowerCase().trim()
    setLastHeard(cmd)

    // Clear the display after 3 seconds
    setTimeout(() => setLastHeard(''), 3000)

    if (/\b(next|forward|continue)\b/.test(cmd)) {
      if (activeStep < totalSteps) goToStep(activeStep + 1)
      return
    }
    if (/\b(back|previous|go back)\b/.test(cmd)) {
      if (activeStep > 0) goToStep(activeStep - 1)
      return
    }
    if (/\b(read|repeat|what('s| is| does)? (the |this )?step)\b/.test(cmd)) {
      readCurrentStep()
      return
    }
    if (/\b(start|begin)\b.*\btimer\b|\btimer\b.*\b(start|begin|go)\b/.test(cmd)) {
      if (recipe) {
        const step = recipe.steps[activeStep]
        if (step?.timer_minutes) {
          const timerKey = `${recipe.id}-${activeStep}`
          if (!timers[timerKey]?.active) {
            startTimer(timerKey, step.timer_minutes * 60, `Step ${activeStep + 1}`)
          }
        }
      }
      return
    }
    // Go to specific step: "go to step 3"
    const stepMatch = cmd.match(/\b(?:go to |step )\s*(\d+)\b/)
    if (stepMatch) {
      const target = parseInt(stepMatch[1]) - 1
      if (target >= 0 && target < totalSteps) goToStep(target)
      return
    }
    if (/\b(ingredients|what do i need)\b/.test(cmd)) {
      if (recipe) {
        const items = getIngredientItems(recipe.ingredients)
        const list = items.slice(0, 5).map(i => `${i.amount || ''} ${i.unit || ''} ${i.name}`.trim()).join(', ')
        speak(`You need: ${list}${items.length > 5 ? ` and ${items.length - 5} more ingredients` : ''}`)
      }
      return
    }
    if (/\b(stop listening|mute|quiet)\b/.test(cmd)) {
      recognitionRef.current?.stop()
      setIsListening(false)
      isListeningRef.current = false
      return
    }
  }, [activeStep, totalSteps, goToStep, readCurrentStep, recipe, startTimer, timers, speak])

  const toggleListening = useCallback(() => {
    if (!isSupported) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      isListeningRef.current = false
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        handleCommand(last[0].transcript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening (use ref to avoid stale closure)
      if (isListeningRef.current) {
        try { recognition.start() } catch { setIsListening(false); isListeningRef.current = false }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    isListeningRef.current = true
  }, [isSupported, isListening, handleCommand])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  return { isListening, isSupported, toggleListening, speak, readCurrentStep, lastHeard, isSpeaking: isSpeakingRef }
}

// ─── Photo capture component ────────────────────────────────────────────

function PhotoCapture({ recipeSlug, recipeTitle }: { recipeSlug: string; recipeTitle: string }) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing photo
  useEffect(() => {
    try {
      const photos = JSON.parse(localStorage.getItem('recdex-cook-photos') || '{}')
      if (photos[recipeSlug]) setPhoto(photos[recipeSlug])
    } catch { /* */ }
  }, [recipeSlug])

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // Resize to save localStorage space (max 400px wide)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 400
        const scale = Math.min(1, maxW / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resized = canvas.toDataURL('image/jpeg', 0.8)
        setPhoto(resized)
        try {
          const photos = JSON.parse(localStorage.getItem('recdex-cook-photos') || '{}')
          photos[recipeSlug] = resized
          localStorage.setItem('recdex-cook-photos', JSON.stringify(photos))
          setSaved(true)
        } catch { /* localStorage full — gracefully ignore */ }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  if (photo) {
    return (
      <div style={{ marginTop: 16, animation: 'slideUp 0.2s ease' }}>
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.rule}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={recipeTitle} style={{ width: '100%', display: 'block', borderRadius: 10 }} />
          {saved && (
            <div style={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              padding: '6px 14px', borderRadius: 16, background: 'rgba(0,0,0,0.7)',
              color: '#fff', fontSize: 11, fontFamily: SANS, fontWeight: 500,
            }}>
              Saved to your cook history
            </div>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            marginTop: 8, padding: '6px 12px', borderRadius: 6,
            border: `1px solid ${C.ruleLight}`, background: 'transparent',
            color: C.text3, fontSize: 11, cursor: 'pointer', fontFamily: SANS,
          }}
        >
          Retake photo
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '100%', padding: '16px 20px', borderRadius: 10,
          border: `2px dashed ${C.ruleLight}`, background: 'transparent',
          color: C.text2, cursor: 'pointer', fontFamily: SANS,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentBg }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.ruleLight; e.currentTarget.style.background = 'transparent' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <circle cx="12" cy="13" r="4" />
          <path d="M8 2h8l2 4H6l2-4z" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Snap a photo of your dish</span>
        <span style={{ fontSize: 11, color: C.text3 }}>Share what you made with the community</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
    </div>
  )
}

// ─── Servings scaler control ─────────────────────────────────────────────

function ServingsScaler({ original, current, onChange }: {
  original: number; current: number; onChange: (n: number) => void
}) {
  const isScaled = current !== original
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        style={{
          width: 22, height: 22, borderRadius: '50%', border: `1px solid ${C.ruleLight}`,
          background: 'transparent', color: C.text2, fontSize: 14, fontWeight: 700,
          cursor: current <= 1 ? 'default' : 'pointer', opacity: current <= 1 ? 0.3 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: SANS, lineHeight: 1, padding: 0,
        }}
        disabled={current <= 1}
      >−</button>
      <span style={{
        fontSize: 12, fontFamily: MONO, fontWeight: 600,
        color: isScaled ? C.accent : C.text2,
        minWidth: 50, textAlign: 'center',
      }}>
        {current} {current === 1 ? 'serving' : 'servings'}
      </span>
      <button
        onClick={() => onChange(current + 1)}
        style={{
          width: 22, height: 22, borderRadius: '50%', border: `1px solid ${C.ruleLight}`,
          background: 'transparent', color: C.text2, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: SANS, lineHeight: 1, padding: 0,
        }}
      >+</button>
      {isScaled && (
        <button
          onClick={() => onChange(original)}
          style={{
            padding: '2px 6px', borderRadius: 4, border: 'none',
            background: C.accentBg, color: C.accent, fontSize: 9,
            fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
          }}
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COOK MODE PAGE
// ═══════════════════════════════════════════════════════════════════════════

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
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({})
  const [timerAlerts, setTimerAlerts] = useState<{ key: string; label: string }[]>([])
  const [openTip, setOpenTip] = useState<string | null>(null)
  const [autoShownTips] = useState<Set<string>>(() => new Set())
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([])
  const [servings, setServings] = useState<number>(4)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isScrollingRef = useRef(false)

  // ─── Servings scaler state ───────────────────────────────────────────
  const originalServings = recipe?.servings || 4
  const scaleFactor = servings / originalServings

  // Initialize servings from recipe
  useEffect(() => {
    if (recipe?.servings) setServings(recipe.servings)
  }, [recipe?.servings])

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = { ...prev, [index]: !prev[index] }
      try { localStorage.setItem(`recdex-checked-${slug}`, JSON.stringify(next)) } catch { /* */ }
      return next
    })
  }
  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length

  // Load persisted ingredient checks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`recdex-checked-${slug}`)
      if (saved) setCheckedIngredients(JSON.parse(saved))
    } catch { /* */ }
  }, [slug])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('recipes').select('*').eq('slug', slug).eq('status', 'published').single()
        if (error) throw error
        if (data) setRecipe(data)
      } catch (err) {
        console.error('[cook] Failed to load recipe:', err)
      }
      setLoading(false)
    }
    if (slug) fetchRecipe()
  }, [slug])

  // Fetch recipe suggestions for completion screen
  useEffect(() => {
    if (!recipe) return
    async function fetchSuggestions() {
      try {
        const { data } = await supabase
          .from('recipes')
          .select('slug, title, image_url, cuisine, time_total')
          .eq('status', 'published')
          .neq('slug', slug)
          .limit(6)

        if (data && data.length > 0) {
          const sameCuisine = data.filter(r => r.cuisine === recipe?.cuisine)
          const others = data.filter(r => r.cuisine !== recipe?.cuisine)
          const sorted = [...sameCuisine, ...others].slice(0, 3)
          setSuggestions(sorted)
        }
      } catch { /* ignore */ }
    }
    fetchSuggestions()
  }, [recipe, slug])

  // Timer tick with completion detection
  useEffect(() => {
    const hasActive = Object.values(timers).some(t => t.active && t.remaining > 0)
    if (!hasActive) return
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => {
          if (next[k].active && next[k].remaining > 0) {
            const newRemaining = next[k].remaining - 1
            next[k] = { ...next[k], remaining: newRemaining }
            if (newRemaining === 0) {
              setTimerAlerts(alerts => [...alerts, { key: k, label: next[k].label }])
              playTimerAlert()
            }
          }
        })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timers])

  // Auto-show cooking tips on first visit to a step
  useEffect(() => {
    if (!recipe) return
    const step = recipe.steps[activeStep]
    if (!step) return
    const stepTip = getTipsForStep(step.text)
    if (stepTip && !autoShownTips.has(stepTip.id)) {
      autoShownTips.add(stepTip.id)
      setOpenTip(stepTip.id)
    }
  }, [activeStep, recipe, autoShownTips])

  const startTimer = useCallback((key: string, seconds: number, label: string) => {
    setTimers(prev => ({ ...prev, [key]: { active: true, total: seconds, remaining: seconds, label } }))
  }, [])

  const goToStep = useCallback((step: number) => {
    setActiveStep(step)
    setOpenTip(null)
    isScrollingRef.current = true
    setTimeout(() => {
      stepRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => { isScrollingRef.current = false }, 600)
    }, 50)
  }, [])

  // Scroll-based active step detection
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !recipe) return

    const handleScroll = () => {
      if (isScrollingRef.current) return
      const containerRect = container.getBoundingClientRect()
      const centerY = containerRect.top + containerRect.height / 2

      let closestIndex = 0
      let closestDistance = Infinity

      stepRefs.current.forEach((ref, i) => {
        if (!ref) return
        const rect = ref.getBoundingClientRect()
        const stepCenter = rect.top + rect.height / 2
        const distance = Math.abs(stepCenter - centerY)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      })

      if (closestIndex !== activeStep && closestIndex < recipe.steps.length) {
        setActiveStep(closestIndex)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [recipe, activeStep])

  // Screen wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen')
        }
      } catch { /* Not critical */ }
    }
    requestWakeLock()
    const handleVisibility = () => { if (document.visibilityState === 'visible') requestWakeLock() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => { wakeLock?.release(); document.removeEventListener('visibilitychange', handleVisibility) }
  }, [])

  // Voice control hook
  const voice = useVoiceControl(recipe, activeStep, recipe?.steps?.length || 0, goToStep, startTimer, timers)

  // Keyboard shortcuts: ←/→ for steps, Space for timer, R for read
  useEffect(() => {
    if (!recipe) return
    const total = recipe.steps.length
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' && activeStep < total) {
        goToStep(activeStep + 1)
      } else if (e.key === 'ArrowLeft' && activeStep > 0) {
        goToStep(activeStep - 1)
      } else if (e.key === ' ' && activeStep < total) {
        e.preventDefault()
        const currentStep = recipe.steps[activeStep]
        if (currentStep?.timer_minutes) {
          const timerKey = `${recipe.id}-${activeStep}`
          if (!timers[timerKey]?.active) {
            startTimer(timerKey, currentStep.timer_minutes * 60, `Step ${activeStep + 1}`)
          }
        }
      } else if (e.key === 'r' || e.key === 'R') {
        voice.readCurrentStep()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeStep, recipe, timers, goToStep, startTimer, voice])

  // ─── Loading / error states ──────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 22, height: 22, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <span style={{ fontSize: 13, color: C.text3 }}>Loading cook mode</span>
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
        <p style={{ fontSize: 16, color: C.text2, fontFamily: SERIF }}>No steps available for this recipe</p>
        <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS }}>This recipe doesn&apos;t have step-by-step instructions yet.</p>
        <button onClick={() => router.push(`/recipe/${slug}`)} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>← Back to recipe</button>
      </div>
    )
  }

  const total = recipe.steps.length
  const ingredientItems = getIngredientItems(recipe.ingredients)
  const isLastStep = activeStep >= total - 1

  // Compute which ingredients are mentioned in the active step
  const activeStepText = (recipe.steps[activeStep]?.text || '').toLowerCase()
  const highlightedIngredients = new Set<number>(
    ingredientItems.map((item, i) => ({ name: item.name.toLowerCase(), i }))
      .filter(({ name }) => name.length > 2 && activeStepText.includes(name))
      .map(({ i }) => i)
  )

  // Phase breaks for prep/cook/finish dividers
  const phaseBreaks = findPhaseBreaks(recipe.steps)
  const phaseBreakIndices = new Map(phaseBreaks.map(b => [b.index, b.toPhase as 'prep' | 'cook' | 'finish']))

  // Dock magnification: compute style for each step
  function getStepStyle(index: number) {
    const distance = Math.abs(index - activeStep)
    const isActive = distance === 0
    const isCompleted = index < activeStep

    let fontSize: number, padding: string, opacity: number, borderColor: string, bg: string
    let numberSize: number, numberFontSize: number, numberBorderRadius: number
    let lineHeight: number, fontFamily: string

    if (isActive) {
      fontSize = isMobile ? 17 : 20
      padding = isMobile ? '24px 20px' : '28px 24px'
      opacity = 1
      borderColor = C.accentMed
      bg = C.accentBg
      numberSize = isMobile ? 34 : 38
      numberFontSize = 15
      numberBorderRadius = 8
      lineHeight = 1.7
      fontFamily = SERIF
    } else if (distance === 1) {
      fontSize = isMobile ? 14 : 15
      padding = isMobile ? '14px 16px' : '16px 20px'
      opacity = 0.8
      borderColor = C.rule
      bg = 'transparent'
      numberSize = 26
      numberFontSize = 11
      numberBorderRadius = 5
      lineHeight = 1.55
      fontFamily = SANS
    } else if (distance === 2) {
      fontSize = isMobile ? 13 : 14
      padding = isMobile ? '10px 16px' : '12px 20px'
      opacity = 0.55
      borderColor = C.ruleLight
      bg = 'transparent'
      numberSize = 22
      numberFontSize = 10
      numberBorderRadius = 4
      lineHeight = 1.5
      fontFamily = SANS
    } else {
      fontSize = isMobile ? 12 : 13
      padding = isMobile ? '8px 16px' : '10px 20px'
      opacity = 0.35
      borderColor = C.ruleLight
      bg = 'transparent'
      numberSize = 20
      numberFontSize = 9
      numberBorderRadius = 4
      lineHeight = 1.45
      fontFamily = SANS
    }

    return {
      fontSize, padding, opacity, borderColor, bg,
      numberSize, numberFontSize, numberBorderRadius,
      lineHeight, fontFamily, isActive, isCompleted,
    }
  }

  // ─── Render step text with bold action verbs ─────────────────────────
  function renderStepText(text: string, isActive: boolean) {
    if (!isActive) return text
    const segments = highlightVerbs(text)
    return segments.map((seg, i) =>
      seg.bold
        ? <strong key={i} style={{ fontWeight: 700, color: C.accent }}>{seg.text}</strong>
        : <span key={i}>{seg.text}</span>
    )
  }

  // ─── Ingredient rendering helper (with scaling) ──────────────────────
  function renderIngredient(item: IngredientItem, i: number, options: { fontSize: number; showHighlight: boolean }) {
    const isHighlighted = options.showHighlight && highlightedIngredients.has(i) && !checkedIngredients[i]
    const scaledAmount = item.amount ? scaleAmount(item.amount, scaleFactor) : ''
    const isScaled = scaleFactor !== 1

    return (
      <p key={i} onClick={() => toggleIngredient(i)} style={{
        fontSize: options.fontSize, color: checkedIngredients[i] ? C.text3 : C.text, margin: '4px 0', fontFamily: SANS, lineHeight: 1.55,
        cursor: 'pointer', userSelect: 'none' as const,
        textDecoration: checkedIngredients[i] ? 'line-through' : 'none',
        opacity: checkedIngredients[i] ? 0.45 : 1,
        background: isHighlighted ? C.accentBg : 'transparent',
        fontWeight: isHighlighted ? 600 : 400,
        padding: '2px 6px', borderRadius: 4, marginLeft: -6,
        transition: 'all 0.25s ease',
      }}>
        {scaledAmount && (
          <span style={{ fontWeight: isHighlighted ? 600 : 400, color: isScaled ? C.accent : undefined }}>
            {scaledAmount}{item.unit ? ` ${item.unit}` : ''}{' '}
          </span>
        )}
        {item.name}
        {item.notes && <span style={{ color: C.text3, fontSize: options.fontSize - 1 }}> ({item.notes})</span>}
      </p>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes eggFall{0%{transform:translateY(-20vh) rotate(0deg);opacity:1}70%{opacity:1}100%{transform:translateY(105vh) rotate(var(--egg-spin,720deg));opacity:0}}
        @keyframes eggWobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(196,101,42,0.4)}50%{box-shadow:0 0 0 8px rgba(196,101,42,0)}}
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
            {recipe.creator_name && (
              <span style={{ fontSize: 10, fontFamily: SANS, color: C.text3 }}>
                Recipe by{' '}
                {recipe.creator_url ? (
                  <a href={recipe.creator_url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                    {recipe.creator_name}
                  </a>
                ) : (
                  <span style={{ color: C.text2, fontWeight: 600 }}>{recipe.creator_name}</span>
                )}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Voice control button */}
            {voice.isSupported && (
              <button
                onClick={voice.toggleListening}
                title={voice.isListening ? 'Stop voice control' : 'Start voice control (say "next", "back", "read step", "start timer")'}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: voice.isListening ? C.accent : 'transparent',
                  color: voice.isListening ? '#fff' : C.text3,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: voice.isListening ? 'micPulse 1.5s ease infinite' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="2" width="6" height="11" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <path d="M12 19v3" />
                </svg>
              </button>
            )}
            {/* Read step aloud button */}
            <button
              onClick={voice.readCurrentStep}
              title="Read current step aloud (R)"
              style={{
                width: 32, height: 32, borderRadius: '50%', border: `1px solid ${C.ruleLight}`,
                background: 'transparent', color: C.text3,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
            {isMobile && ingredientItems.length > 0 && (
              <button onClick={() => setShowIngredientsMobile(!showIngredientsMobile)} style={{ background: showIngredientsMobile ? C.text : 'none', border: `1px solid ${showIngredientsMobile ? C.text : C.rule}`, borderRadius: 6, padding: '6px 14px', color: showIngredientsMobile ? C.bg : C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>
                Ingredients
              </button>
            )}
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>
              {activeStep + 1}/{total}
            </span>
            <ThemeToggle />
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ maxWidth: 1060, margin: '10px auto 0', display: 'flex', gap: 3 }}>
          {recipe.steps.map((_, i) => (
            <div key={i} onClick={() => goToStep(i)} style={{
              flex: 1, height: 4, borderRadius: 2, cursor: 'pointer',
              background: i < activeStep ? C.green : i === activeStep ? C.accent : C.ruleLight,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Voice command heard indicator */}
        {voice.lastHeard && (
          <div style={{
            maxWidth: 1060, margin: '6px auto 0', padding: '3px 10px', borderRadius: 4,
            background: C.accentBg, fontSize: 10, color: C.accent, fontFamily: MONO,
            animation: 'fadeIn 0.15s ease', textAlign: 'center',
          }}>
            Heard: &ldquo;{voice.lastHeard}&rdquo;
          </div>
        )}
      </div>

      {/* Active timer strip (compact, top) */}
      {(() => {
        const activeTimers = Object.entries(timers).filter(([, t]) => t.active && t.remaining > 0)
        if (activeTimers.length === 0) return null
        return (
          <div style={{ padding: '6px 24px', background: C.warm, borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 4 }}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /></svg>
            {activeTimers.map(([key, timer]) => {
              const stepIndex = parseInt(key.split('-').pop() || '0')
              return (
                <button key={key} onClick={() => goToStep(stepIndex)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 4,
                  border: `1px solid ${C.accentMed}`, background: C.accentBg, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: MONO,
                }}>
                  <span style={{ fontSize: 9, color: C.accent }}>Step {stepIndex + 1}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{formatTimerDisplay(timer.remaining)}</span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Timer completion alerts */}
      {timerAlerts.length > 0 && (
        <div style={{ padding: '0 24px', flexShrink: 0 }}>
          {timerAlerts.map((alert, i) => {
            const stepIndex = parseInt(alert.key.split('-').pop() || '0')
            return (
              <div key={`${alert.key}-${i}`} style={{
                padding: '8px 14px', marginTop: 6, background: C.accentBg, border: `1.5px solid ${C.accent}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, animation: 'slideUp 0.2s ease',
              }}>
                <span style={{ fontSize: 14 }}>✓</span>
                <span style={{ flex: 1, fontSize: 12, fontFamily: SANS, color: C.text }}>{alert.label} timer is done!</span>
                <button onClick={() => { goToStep(stepIndex); setTimerAlerts(a => a.filter((_, j) => j !== i)) }} style={{
                  padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.accent}`, background: 'transparent',
                  color: C.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                }}>Go to step</button>
                <button onClick={() => setTimerAlerts(a => a.filter((_, j) => j !== i))} style={{
                  padding: '4px 8px', borderRadius: 4, border: 'none', background: 'transparent',
                  color: C.text3, fontSize: 14, cursor: 'pointer',
                }}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile ingredients panel */}
      {isMobile && showIngredientsMobile && ingredientItems.length > 0 && (
        <div style={{ padding: '14px 24px', background: C.warm, borderBottom: `1px solid ${C.rule}`, flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0, fontFamily: SANS }}>Ingredients</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {checkedCount > 0 && <span style={{ fontSize: 9, fontFamily: MONO, color: C.accent }}>{checkedCount}/{ingredientItems.length} used</span>}
              <ServingsScaler original={originalServings} current={servings} onChange={setServings} />
            </div>
          </div>
          <div style={{ columns: 2, columnGap: 20 }}>
            {ingredientItems.map((item, i) => renderIngredient(item, i, { fontSize: 12, showHighlight: false }))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT: Steps + Ingredients sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Steps area — scrollable with dock magnification */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 20px 120px' : '28px 40px 120px' }}>
          <div style={{ maxWidth: 620, margin: '0 auto' }}>

            {/* Initial phase label */}
            {recipe.steps.length > 0 && (
              <PhaseDivider phase={classifyStep(recipe.steps[0].text) as 'prep' | 'cook' | 'finish'} />
            )}

            {recipe.steps.map((step, i) => {
              const style = getStepStyle(i)
              const showPhaseDivider = phaseBreakIndices.has(i)
              const newPhase = phaseBreakIndices.get(i)

              return (
                <div key={i}>
                  {/* Phase transition divider */}
                  {showPhaseDivider && newPhase && <PhaseDivider phase={newPhase} />}

                  <div
                    ref={el => { stepRefs.current[i] = el }}
                    onClick={() => goToStep(i)}
                    style={{
                      padding: style.padding,
                      marginBottom: style.isActive ? 8 : 4,
                      borderRadius: style.isActive ? 10 : 6,
                      cursor: 'pointer',
                      background: style.bg,
                      border: `${style.isActive ? '1.5px' : '1px'} solid ${style.borderColor}`,
                      opacity: style.opacity,
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Step number + text + tip */}
                    <div style={{ display: 'flex', gap: style.isActive ? 16 : 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: style.numberSize, height: style.numberSize,
                        borderRadius: style.numberBorderRadius, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: MONO, fontSize: style.numberFontSize, fontWeight: 700,
                        background: style.isCompleted ? C.greenBg : style.isActive ? C.accent : C.ruleLight,
                        color: style.isCompleted ? C.green : style.isActive ? '#fff' : C.text3,
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}>
                        {style.isCompleted ? '✓' : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: style.fontFamily,
                          fontSize: style.fontSize,
                          lineHeight: style.lineHeight,
                          color: style.isCompleted ? C.text3 : C.text,
                          margin: 0, fontWeight: 400,
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}>
                          {renderStepText(step.text, style.isActive)}
                        </p>

                        {/* Timer */}
                        {step.timer_minutes && (style.isActive || timers[`${recipe.id}-${i}`]?.active) && (
                          <InlineTimer minutes={step.timer_minutes} label={`Step ${i + 1}`} timerKey={`${recipe.id}-${i}`} timers={timers} onStart={startTimer} />
                        )}

                        {/* Inline step note (active step only) */}
                        {style.isActive && <StepNote stepIndex={i} slug={slug} />}

                        {/* Navigation buttons */}
                        {style.isActive && (
                          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', animation: 'slideUp 0.25s ease 0.1s both' }}>
                            {activeStep > 0 && (
                              <button onClick={e => { e.stopPropagation(); goToStep(activeStep - 1) }} style={{
                                padding: '11px 18px', borderRadius: 6,
                                border: `1.5px solid ${C.rule}`, background: 'transparent',
                                color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                                Back
                              </button>
                            )}
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
                              <button onClick={e => { e.stopPropagation(); goToStep(total) }} style={{
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
                      {/* Cooking technique tip badge */}
                      {(() => {
                        const stepTip = getTipsForStep(step.text)
                        if (!stepTip) return null
                        return (
                          <div style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: style.isActive ? 4 : 2 }}>
                            <TipBadge isOpen={openTip === stepTip.id} onToggle={() => setOpenTip(openTip === stepTip.id ? null : stepTip.id)} />
                          </div>
                        )
                      })()}
                    </div>
                    {/* Tip popover */}
                    {(() => {
                      const stepTip = getTipsForStep(step.text)
                      if (!stepTip || openTip !== stepTip.id) return null
                      return <TipPopover tip={stepTip} onClose={() => setOpenTip(null)} />
                    })()}
                  </div>
                </div>
              )
            })}

            {/* Completion — egg confetti + photo + feedback + suggestions */}
            {activeStep >= total && (
              <div style={{ marginTop: 20, animation: 'slideUp 0.3s ease' }}>
                <EggConfetti />

                {!feedbackSubmitted ? (
                  <div style={{ borderRadius: 10, border: `1px solid ${C.rule}`, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '24px 28px 20px', background: C.greenBg, borderBottom: `1px solid #D5DDD2` }}>
                      <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.green, margin: '0 0 4px' }}>Nice work!</p>
                      <p style={{ fontSize: 13, color: C.text2, margin: 0, fontFamily: SANS, lineHeight: 1.5 }}>You just cooked {recipe.title}. Help the community by sharing how it went.</p>
                    </div>

                    {/* Photo capture */}
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontFamily: SANS }}>Show off your dish</p>
                      <PhotoCapture recipeSlug={slug} recipeTitle={recipe.title} />
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
                    <div style={{ padding: '20px 28px', textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: C.text3, margin: '0 0 12px', fontFamily: SANS, fontStyle: 'italic' }}>Community tips help other cooks nail this recipe.</p>
                      <button onClick={async () => {
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
                        width: '100%', padding: '13px 28px', borderRadius: 6, border: 'none',
                        background: (cookRating || substitutions || tip) ? C.green : C.ruleLight,
                        color: (cookRating || substitutions || tip) ? '#fff' : C.text3,
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                        transition: 'all 0.15s',
                      }}>
                        {(substitutions || tip) ? 'Submit & mark as cooked' : 'Mark as cooked'}
                      </button>
                      <p onClick={() => {
                        const cookEvent = {
                          recipeId: recipe.id, recipeSlug: recipe.slug, recipeTitle: recipe.title,
                          cookedAt: Date.now(),
                        }
                        const existing = JSON.parse(localStorage.getItem('recdex-cooked') || '[]')
                        existing.unshift(cookEvent)
                        localStorage.setItem('recdex-cooked', JSON.stringify(existing))
                        setFeedbackSubmitted(true)
                      }} style={{
                        marginTop: 12, fontSize: 11, color: C.text3, cursor: 'pointer', fontFamily: SANS,
                        textDecoration: 'underline', textDecorationColor: C.ruleLight, textUnderlineOffset: 3,
                      }}>
                        Just mark as cooked, skip feedback
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Thank you state + suggestions */
                  <div style={{ animation: 'slideUp 0.3s ease' }}>
                    <div style={{ borderRadius: 10, background: C.greenBg, border: '1px solid #D5DDD2', padding: 28, textAlign: 'center', marginBottom: 24 }}>
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

                    {/* Recipe suggestions */}
                    {suggestions.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px', fontFamily: SANS }}>Cook something else?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                          {suggestions.map(s => (
                            <button
                              key={s.slug}
                              onClick={() => router.push(`/recipe/${s.slug}/cook`)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 14px', borderRadius: 8,
                                border: `1px solid ${C.rule}`, background: C.warm,
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentBg }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.background = C.warm }}
                            >
                              {s.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                              )}
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 2px', fontFamily: SANS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                                <p style={{ fontSize: 11, color: C.text3, margin: 0, fontFamily: SANS }}>
                                  {[s.cuisine, s.time_total ? formatTime(s.time_total) : null].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ingredients sidebar (desktop only, RIGHT side) */}
        {!isMobile && ingredientItems.length > 0 && (
          <div style={{
            width: 260, flexShrink: 0, borderLeft: `1px solid ${C.rule}`,
            overflowY: 'auto', padding: '24px 24px 40px',
            background: C.warm,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0, fontFamily: SANS }}>Ingredients</p>
              {checkedCount > 0 && <span style={{ fontSize: 9, fontFamily: MONO, color: C.accent }}>{checkedCount}/{ingredientItems.length}</span>}
            </div>

            {/* Servings scaler */}
            <div style={{ margin: '6px 0 14px' }}>
              <ServingsScaler original={originalServings} current={servings} onChange={setServings} />
            </div>

            <div style={{ height: 1, background: C.rule, marginBottom: 14 }} />
            {ingredientItems.map((item, i) => renderIngredient(item, i, { fontSize: 13, showHighlight: true }))}
          </div>
        )}
      </div>

      {/* Floating timer panel */}
      <FloatingTimerPanel timers={timers} onGoToStep={goToStep} />
    </div>
  )
}
