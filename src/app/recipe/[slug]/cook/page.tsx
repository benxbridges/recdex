'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import { getTipsForStep } from '@/app/lib/cooking-tips'
import { scaleAmount, classifyStep, findPhaseBreaks, PHASE_META, resolveTimerMinutes, parseIngredientString } from '@/app/lib/cook-utils'
import { toJpeg } from 'html-to-image'
import { findSubstitutions, type SubOption } from '@/app/lib/substitutions'
import ThemeToggle from '@/app/components/ThemeToggle'
import CookModeTutorial from '@/app/components/CookModeTutorial'

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
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  const m = Math.floor(seconds / 60), s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Egg dot (brand element) ─────────────────────────────────────────────

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// ─── Timer alert engine ─────────────────────────────────────────────────
// Strategy:
//   1. Web Audio: schedule beeps ahead of time via ctx.currentTime offsets.
//      This survives tab backgrounding because Web Audio's scheduler runs
//      independent of setInterval/setTimeout throttling.
//   2. Notification API: request permission on first timer, fire a system
//      notification at the target time (works when tab isn't focused).
//   3. Service worker: when available (PWA installed), post the schedule to
//      the SW so showNotification fires even on locked screens.
//   4. Vibration as a haptic add-on.
//
// AudioContext creation is lazy and unlocked on first user gesture so iOS
// Safari doesn't block the first alert.

let sharedAudioCtx: AudioContext | null = null
let audioUnlocked = false

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedAudioCtx) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return null
      sharedAudioCtx = new Ctx()
    } catch { return null }
  }
  return sharedAudioCtx
}

function unlockAudio() {
  if (audioUnlocked) return
  const ctx = getAudioCtx()
  if (!ctx) return
  try {
    // iOS requires resuming the context inside a user gesture
    if (ctx.state === 'suspended') ctx.resume()
    // Play a silent buffer to fully unlock
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    audioUnlocked = true
  } catch { /* ignore */ }
}

// Schedule a 3-beep alert at a specific AudioContext time (seconds from now).
// Survives tab backgrounding.
function scheduleBeeps(offsetSeconds: number) {
  const ctx = getAudioCtx()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* ignore */ })
    const startAt = Math.max(ctx.currentTime, ctx.currentTime + offsetSeconds)
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      const t = startAt + i * 0.25
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      osc.start(t)
      osc.stop(t + 0.2)
    }
  } catch { /* ignore */ }
}

function playBeepsNow() {
  scheduleBeeps(0)
  try { navigator.vibrate?.([200, 100, 200, 100, 200]) } catch { /* ignore */ }
}

// System notification — works across tab-switch, backgrounded tabs, and
// (with service worker) locked screens.
let notifPermissionRequested = false
async function ensureNotifPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  if (notifPermissionRequested) return Notification.permission
  notifPermissionRequested = true
  try { return await Notification.requestPermission() } catch { return 'denied' }
}

async function fireNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    // Prefer service worker notifications (work on locked screens when
    // installed as PWA). Fall back to direct Notification constructor.
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: 'recdex-timer',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        requireInteraction: true,
      })
      return
    }
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag: 'recdex-timer' })
  } catch { /* ignore */ }
}

// Post a message to the service worker to schedule a notification at a wall-
// clock timestamp. Survives page close / screen lock when PWA is installed.
function scheduleSwNotification(fireAt: number, title: string, body: string) {
  if (typeof window === 'undefined') return
  try {
    navigator.serviceWorker?.ready.then(reg => {
      reg.active?.postMessage({
        type: 'recdex-timer-schedule',
        fireAt, title, body,
      })
    }).catch(() => { /* ignore */ })
  } catch { /* ignore */ }
}

function cancelSwNotification(key: string) {
  try {
    navigator.serviceWorker?.ready.then(reg => {
      reg.active?.postMessage({ type: 'recdex-timer-cancel', key })
    }).catch(() => { /* ignore */ })
  } catch { /* ignore */ }
}

// ─── Inline timer component ─────────────────────────────────────────────

function InlineTimer({ minutes, label, timerKey, timers, onStart }: {
  minutes: number; label: string; timerKey: string
  timers: Record<string, { active: boolean; total: number; remaining: number; startedAt: number; label: string }>
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

// ─── Custom timer dialog ────────────────────────────────────────────────
// "Oh, I want to brown this 3 min" — users need a way to start an ad-hoc
// timer mid-cook that isn't tied to a specific recipe step.

function CustomTimerDialog({ onClose, onStart }: {
  onClose: () => void
  onStart: (seconds: number, label: string) => void
}) {
  const [minutes, setMinutes] = useState('5')
  const [seconds, setSeconds] = useState('0')
  const [label, setLabel] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  const submit = () => {
    const m = parseInt(minutes) || 0
    const s = parseInt(seconds) || 0
    const total = m * 60 + s
    if (total <= 0) return
    onStart(total, label.trim() || `${m > 0 ? `${m}m` : ''}${s > 0 ? ` ${s}s` : ''}`.trim())
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 990, animation: 'fadeIn 0.15s ease',
      }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 991, width: 'min(340px, 92vw)', borderRadius: 14,
        background: C.bg, border: `1.5px solid ${C.rule}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)', padding: 20, animation: 'slideUp 0.2s ease',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, fontFamily: SANS, margin: '0 0 14px' }}>
          Start a timer
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>Minutes</label>
            <input
              ref={inputRef}
              type="number" inputMode="numeric" min="0" value={minutes}
              onChange={e => setMinutes(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{ width: '100%', padding: '8px 10px', fontFamily: MONO, fontSize: 16, border: `1.5px solid ${C.ruleLight}`, borderRadius: 6, background: C.cool, color: C.text, outline: 'none', marginTop: 4 }}
            />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 20, color: C.text3, paddingBottom: 8 }}>:</span>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>Seconds</label>
            <input
              type="number" inputMode="numeric" min="0" max="59" value={seconds}
              onChange={e => setSeconds(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{ width: '100%', padding: '8px 10px', fontFamily: MONO, fontSize: 16, border: `1.5px solid ${C.ruleLight}`, borderRadius: 6, background: C.cool, color: C.text, outline: 'none', marginTop: 4 }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>Label (optional)</label>
          <input
            type="text" value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="e.g. Rest steak, Brown butter"
            style={{ width: '100%', padding: '8px 10px', fontFamily: SANS, fontSize: 13, border: `1.5px solid ${C.ruleLight}`, borderRadius: 6, background: C.cool, color: C.text, outline: 'none', marginTop: 4, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', borderRadius: 6, border: `1.5px solid ${C.ruleLight}`,
            background: 'transparent', color: C.text2, fontSize: 13, fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={submit} style={{
            flex: 2, padding: '9px', borderRadius: 6, border: 'none',
            background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: 'pointer',
          }}>Start →</button>
        </div>
      </div>
    </>
  )
}

// ─── Floating timer panel ────────────────────────────────────────────────

function FloatingTimerPanel({ timers, onGoToStep, onStartCustom }: {
  timers: Record<string, { active: boolean; total: number; remaining: number; startedAt: number; label: string }>
  onGoToStep: (step: number) => void
  onStartCustom: (seconds: number, label: string) => void
}) {
  const activeTimers = Object.entries(timers).filter(([, t]) => t.active)
  const [minimized, setMinimized] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  // Always-visible FAB when no timers are running — lets users start an ad-hoc timer
  if (activeTimers.length === 0) {
    return (
      <>
        <button
          onClick={() => setShowCustom(true)}
          title="Start a timer"
          aria-label="Start a timer"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 900,
            width: 48, height: 48, borderRadius: 24,
            background: C.text, color: '#fff', border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M12 2v2" /></svg>
        </button>
        {showCustom && <CustomTimerDialog onClose={() => setShowCustom(false)} onStart={onStartCustom} />}
      </>
    )
  }

  if (minimized) {
    // Show a small floating pill with timer count
    const urgentCount = activeTimers.filter(([, t]) => t.remaining > 0 && t.remaining <= 10).length
    return (
      <>
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
        {showCustom && <CustomTimerDialog onClose={() => setShowCustom(false)} onStart={onStartCustom} />}
      </>
    )
  }

  return (
    <>
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 900,
      width: 240, borderRadius: 14,
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
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setShowCustom(true)} title="Start a custom timer" style={{
            background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: SANS, padding: '0 4px',
          }}>+ New</button>
          <button onClick={() => setMinimized(true)} style={{
            background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 12, padding: '0 2px',
          }}>—</button>
        </div>
      </div>
      {/* Timer list */}
      <div style={{ padding: '8px 12px', maxHeight: 200, overflowY: 'auto' }}>
        {activeTimers.map(([key, timer]) => {
          const stepIndex = key.startsWith('custom-') ? -1 : parseInt(key.split('-').pop() || '0')
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
    {showCustom && <CustomTimerDialog onClose={() => setShowCustom(false)} onStart={onStartCustom} />}
    </>
  )
}

// ─── Add-missing-ingredient row ─────────────────────────────────────────
// Closes the loop when extraction dropped something: users can type an
// ingredient like "1 cup flour" and we'll parse + persist it.

function AddIngredientRow({ onAdd }: { onAdd: (raw: string) => void }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30) }, [open])

  const submit = () => {
    const v = value.trim()
    if (!v) { setOpen(false); return }
    onAdd(v)
    setValue('')
    // Keep open so users can add several in a row
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        marginTop: 6, padding: '5px 10px', borderRadius: 4,
        border: `1px dashed ${C.ruleLight}`, background: 'transparent',
        color: C.text3, fontSize: 11, cursor: 'pointer', fontFamily: SANS,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>+ Add missing ingredient</button>
    )
  }

  return (
    <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setOpen(false); setValue('') }
        }}
        placeholder='e.g. "1 cup flour" or "salt to taste"'
        style={{
          flex: 1, padding: '6px 10px', fontFamily: SANS, fontSize: 12,
          border: `1.5px solid ${C.accent}`, borderRadius: 4,
          background: C.cool, color: C.text, outline: 'none',
        }}
      />
      <button onClick={submit} style={{
        padding: '6px 10px', borderRadius: 4, border: 'none',
        background: C.accent, color: '#fff', fontSize: 11, fontWeight: 700,
        fontFamily: SANS, cursor: 'pointer',
      }}>Add</button>
      <button onClick={() => { setOpen(false); setValue('') }} style={{
        padding: '6px 8px', borderRadius: 4, border: 'none',
        background: 'transparent', color: C.text3, fontSize: 14,
        cursor: 'pointer',
      }}>×</button>
    </div>
  )
}

// ─── Phase divider ───────────────────────────────────────────────────────

function PhaseDivider({ phase }: { phase: 'prep' | 'cook' | 'passive' }) {
  const meta = PHASE_META[phase]
  const icons: Record<string, React.ReactNode> = {
    prep: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
    cook: <><path d="M12 12c0-3 2.5-5 2.5-8" /><path d="M8 12c0-3 2.5-5 2.5-8" /><path d="M16 12c0-3 2.5-5 2.5-8" /><rect x="4" y="14" width="16" height="6" rx="1" /></>,
    passive: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
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

// ─── Substitution card ───────────────────────────────────────────────────

function SubstitutionCard({ ingredientName, recipeName, recipeCuisine, stepText, onApply, onClose }: {
  ingredientName: string
  recipeName: string
  recipeCuisine: string | null
  stepText: string
  onApply: (original: string, replacement: string, ratio: string) => void
  onClose: () => void
}) {
  const [subs, setSubs] = useState<SubOption[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'local' | 'ai'>('local')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    // Try local database first
    const localMatch = findSubstitutions(ingredientName)
    if (localMatch) {
      setSubs(localMatch.subs)
      setSource('local')
      return
    }

    // Fall back to API
    setLoading(true)
    fetch('/api/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredient: ingredientName,
        recipeTitle: recipeName,
        recipeCuisine: recipeCuisine,
        stepContext: stepText,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.subs) {
          setSubs(data.subs)
          setSource('ai')
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false))
  }, [ingredientName, recipeName, recipeCuisine, stepText])

  const visibleSubs = showAll ? subs : subs.slice(0, 2)

  return (
    <div onClick={e => e.stopPropagation()} style={{
      padding: '16px 16px 12px', borderRadius: 12,
      background: C.warm, border: `1.5px solid ${C.accentMed}`,
      animation: 'slideUp 0.15s ease',
      marginTop: 8, marginBottom: 6,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: SANS }}>
            Swap {ingredientName}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close substitution panel" style={{
          background: 'none', border: 'none', color: C.text3, fontSize: 20,
          cursor: 'pointer', padding: 4, lineHeight: 1,
          minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent', borderRadius: '50%',
        }}>×</button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <div style={{ width: 14, height: 14, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: 11, color: C.text3, fontFamily: SANS }}>Finding substitutions...</span>
        </div>
      )}

      {/* Options */}
      {!loading && subs.length === 0 && (
        <p style={{ fontSize: 11, color: C.text3, margin: 0, fontFamily: SANS }}>
          No common substitutions found for this ingredient.
        </p>
      )}

      {visibleSubs.map((sub, i) => (
        <button key={i} onClick={() => onApply(ingredientName, sub.name, sub.ratio)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 14px', borderRadius: 10, textAlign: 'left',
          border: `1px solid ${C.ruleLight}`, marginBottom: 8,
          background: C.bg, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: 'border-color 0.15s',
          minHeight: 48,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.ruleLight }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: SANS }}>{sub.name}</span>
              <span style={{ fontSize: 10, color: C.accent, fontFamily: MONO, fontWeight: 600 }}>{sub.ratio}</span>
            </div>
            {sub.notes && (
              <p style={{ fontSize: 11, color: C.text3, margin: '3px 0 0', fontFamily: SANS, lineHeight: 1.4 }}>{sub.notes}</p>
            )}
            {sub.tags && sub.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                {sub.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                    background: C.greenBg, color: C.green, fontFamily: SANS, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: SANS,
            flexShrink: 0, padding: '6px 10px', borderRadius: 6,
            background: C.accentBg, whiteSpace: 'nowrap',
          }}>
            Use →
          </span>
        </button>
      ))}

      {/* Show more / source */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        {subs.length > 2 && !showAll && (
          <button onClick={() => setShowAll(true)} style={{
            background: 'none', border: 'none', color: C.accent, fontSize: 11,
            fontWeight: 600, cursor: 'pointer', fontFamily: SANS, padding: '6px 0',
            minHeight: 36, WebkitTapHighlightColor: 'transparent',
          }}>+{subs.length - 2} more options</button>
        )}
        {subs.length > 0 && (
          <span style={{ fontSize: 9, color: C.text3, fontFamily: SANS, opacity: 0.6, marginLeft: 'auto', padding: '6px 0' }}>
            {source === 'ai' ? 'AI suggestion' : 'Common sub'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Swap banner (shows above active step when swaps are active) ─────────

function SwapBanner({ swaps, onRemove }: {
  swaps: Record<number, { original: string; replacement: string; ratio: string }>
  onRemove: (index: number) => void
}) {
  const entries = Object.entries(swaps)
  if (entries.length === 0) return null

  return (
    <div style={{
      padding: '8px 16px', background: C.goldBg, borderBottom: `1px solid ${C.gold}30`,
      display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      flexShrink: 0, animation: 'fadeIn 0.15s ease',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
      {entries.map(([idx, swap]) => (
        <span key={idx} style={{
          fontSize: 11, fontFamily: SANS, color: C.text2,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 6, background: C.bg,
          border: `1px solid ${C.gold}30`,
        }}>
          <s style={{ color: C.text3, fontSize: 10 }}>{swap.original}</s>
          <span style={{ color: C.gold, fontSize: 10 }}>→</span>
          <strong style={{ color: C.text, fontWeight: 600 }}>{swap.replacement}</strong>
          <button onClick={() => onRemove(Number(idx))} style={{
            background: 'none', border: 'none', color: C.text3, cursor: 'pointer',
            fontSize: 16, padding: '0 2px', lineHeight: 1, marginLeft: 4,
            minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </span>
      ))}
    </div>
  )
}

// ─── Share Card — HTML/DOM-rendered with html-to-image export ─────────────

function ShareCard({ photo, recipeTitle, recipeSlug }: {
  photo: string; recipeTitle: string; recipeSlug: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    const recipeUrl = `https://www.recipeindex.org/recipe/${recipeSlug}`
    try {
      let shareData: { title: string; text: string; url: string; files?: File[] } = {
        title: `I made ${recipeTitle}!`,
        text: `I just made ${recipeTitle}! Try it yourself:`,
        url: recipeUrl,
      }

      // Generate card image from DOM
      if (cardRef.current) {
        try {
          const dataUrl = await toJpeg(cardRef.current, { quality: 0.92, pixelRatio: 2 })
          const blob = await fetch(dataUrl).then(r => r.blob())
          const file = new File([blob], 'my-cook.jpg', { type: 'image/jpeg' })
          if (navigator.canShare?.({ files: [file] })) {
            shareData = { ...shareData, files: [file] }
          }
        } catch { /* fall back to text-only share */ }
      }

      await navigator.share(shareData)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      const smsBody = encodeURIComponent(`I just made ${recipeTitle}! Try it yourself: ${recipeUrl}`)
      window.open(`sms:?&body=${smsBody}`, '_self')
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Visible card preview */}
      <div ref={cardRef} style={{
        display: 'flex', borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${C.rule}`, background: C.warm,
        aspectRatio: '3 / 2',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={recipeTitle} style={{ width: '48%', objectFit: 'cover', flexShrink: 0 }} />
        <div style={{
          flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', minWidth: 0,
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 6px', fontFamily: SANS }}>
            I just cooked
          </p>
          <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 12px', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
            {recipeTitle}<EggDot size={5} />
          </h3>
          <div style={{ width: 36, height: 1.5, background: C.rule, marginBottom: 12 }} />
          <p style={{ fontSize: 12, color: C.text2, margin: '0 0 4px', fontFamily: SANS, lineHeight: 1.4 }}>
            Try it yourself on
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.accent, margin: 0, fontFamily: SANS }}>
            RecipeIndex<EggDot size={4} />
          </p>
          <p style={{ fontSize: 9, color: C.text3, margin: '12px 0 0', fontFamily: MONO, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            recipeindex.org/recipe/{recipeSlug}
          </p>
        </div>
      </div>

      {/* Share button */}
      <button onClick={handleShare} style={{
        width: '100%', marginTop: 12, padding: '14px 20px', borderRadius: 8,
        border: 'none', background: '#34C759', color: '#fff',
        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Text this to a friend
      </button>
    </div>
  )
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
    setSaved(false)

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
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
        } catch { /* localStorage full */ }
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

        {/* Share card with branded image */}
        <ShareCard photo={photo} recipeTitle={recipeTitle} recipeSlug={recipeSlug} />

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
        <span style={{ fontSize: 11, color: C.text3 }}>Share what you made with a friend</span>
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
  const [timers, setTimers] = useState<Record<string, { active: boolean; total: number; remaining: number; startedAt: number; label: string }>>({})
  const [cookRating, setCookRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [substitutions, setSubstitutions] = useState('')
  const [tip, setTip] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({})
  const [timerAlerts, setTimerAlerts] = useState<{ key: string; label: string }[]>([])
  const [openTip, setOpenTip] = useState<string | null>(null)
  const [autoShownTips] = useState<Set<string>>(() => new Set())
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([])
  const [activeSwaps, setActiveSwaps] = useState<Record<number, { original: string; replacement: string; ratio: string }>>({})
  const [openSwapIndex, setOpenSwapIndex] = useState<number | null>(null)
  const [showAmounts, setShowAmounts] = useState(false)
  const [servings, setServings] = useState<number>(4)
  const [tutorialDone, setTutorialDone] = useState(false)
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

  const applySwap = (index: number, original: string, replacement: string, ratio: string) => {
    setActiveSwaps(prev => {
      const next = { ...prev, [index]: { original, replacement, ratio } }
      try { localStorage.setItem(`recdex-swaps-${slug}`, JSON.stringify(next)) } catch { /* */ }
      return next
    })
    setOpenSwapIndex(null)
  }

  const removeSwap = (index: number) => {
    setActiveSwaps(prev => {
      const next = { ...prev }
      delete next[index]
      try { localStorage.setItem(`recdex-swaps-${slug}`, JSON.stringify(next)) } catch { /* */ }
      return next
    })
  }

  // Load persisted ingredient checks + swaps
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`recdex-checked-${slug}`)
      if (saved) setCheckedIngredients(JSON.parse(saved))
    } catch { /* */ }
    try {
      const savedSwaps = localStorage.getItem(`recdex-swaps-${slug}`)
      if (savedSwaps) setActiveSwaps(JSON.parse(savedSwaps))
    } catch { /* */ }
  }, [slug])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Keep screen on during cook mode via Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Wake lock request failed (e.g., low battery, tab not visible)
      }
    }

    requestWakeLock()

    // Re-acquire wake lock when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      wakeLock?.release()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true)

      // Backfill timer_minutes from step text for any step where it's missing.
      // This is the safety net that catches recipes saved before timer_rules
      // were hardened, or recipes where the LLM missed a timer.
      const enrichSteps = (r: Recipe): Recipe => ({
        ...r,
        steps: r.steps.map(s => ({
          ...s,
          timer_minutes: s.timer_minutes ?? resolveTimerMinutes(s),
        })),
      })

      // Check sessionStorage for temporary scanned recipes (e.g. from /scan)
      if (slug === 'temp-scan') {
        try {
          const stored = sessionStorage.getItem('recdex-temp-recipe')
          if (stored) {
            const parsed = JSON.parse(stored)
            setRecipe(enrichSteps(parsed))
            setLoading(false)
            return
          }
        } catch {
          console.error('[cook] Failed to load temp recipe from sessionStorage')
        }
      }

      try {
        const { data, error } = await supabase.from('recipes').select('*').eq('slug', slug).eq('status', 'published').single()
        if (error) throw error
        if (data) setRecipe(enrichSteps(data))
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

  // Timer tick with completion detection — uses Date.now() so it survives background tabs
  useEffect(() => {
    const hasActive = Object.values(timers).some(t => t.active && t.remaining > 0)
    if (!hasActive) return

    const recalcTimers = () => {
      setTimers(prev => {
        const next = { ...prev }
        let changed = false
        Object.keys(next).forEach(k => {
          if (next[k].active && next[k].remaining > 0) {
            const elapsed = Math.floor((Date.now() - next[k].startedAt) / 1000)
            const newRemaining = Math.max(0, next[k].total - elapsed)
            if (newRemaining !== next[k].remaining) {
              changed = true
              next[k] = { ...next[k], remaining: newRemaining }
              if (newRemaining === 0) {
                setTimerAlerts(alerts => [...alerts, { key: k, label: next[k].label }])
                // Beeps were already scheduled at timer start via Web Audio.
                // Play again now for foreground reinforcement + vibration.
                playBeepsNow()
                fireNotification('Timer done!', `${next[k].label} is ready.`)
              }
            }
          }
        })
        return changed ? next : prev
      })
    }

    const interval = setInterval(recalcTimers, 1000)
    // Recalculate immediately when user returns to the tab
    const handleVisibility = () => { if (document.visibilityState === 'visible') recalcTimers() }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
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
    // Unlock audio on this user gesture (idempotent)
    unlockAudio()
    // Schedule beeps to fire at T+seconds via Web Audio — this survives
    // tab backgrounding because Web Audio runs independent of setInterval.
    scheduleBeeps(seconds)
    // Kick off notification permission (first time only) then schedule a
    // system notification via setTimeout — works while tab is backgrounded.
    const fireAt = Date.now() + seconds * 1000
    ensureNotifPermission().then(p => {
      if (p === 'granted') {
        // Direct page setTimeout (used while tab is active / backgrounded)
        window.setTimeout(() => fireNotification('Timer done!', `${label} is ready.`), seconds * 1000)
        // And offload to the service worker (fires on locked screen when PWA installed)
        scheduleSwNotification(fireAt, 'Timer done!', `${label} is ready.`)
      }
    })
    setTimers(prev => ({ ...prev, [key]: { active: true, total: seconds, remaining: seconds, startedAt: Date.now(), label } }))
  }, [])

  const replayAlert = useCallback(() => {
    unlockAudio()
    playBeepsNow()
  }, [])

  // Append an ingredient the user typed in to the recipe, locally and in DB.
  // Handles both grouped and flat ingredient shapes.
  const addIngredient = useCallback((raw: string) => {
    if (!recipe || !raw.trim()) return
    const parsed = parseIngredientString(raw)
    if (!parsed.name) return
    const newIng: IngredientItem = parsed
    let updated: RawIngredients
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && recipe.ingredients[0]?.group) {
      // Grouped shape — append to an "Additional" group (or create one)
      const hasAdditional = recipe.ingredients.some((g: { group: string }) => g.group === 'Additional')
      updated = hasAdditional
        ? recipe.ingredients.map((g: { group: string; items: IngredientItem[] }) =>
            g.group === 'Additional' ? { ...g, items: [...g.items, newIng] } : g)
        : [...recipe.ingredients, { group: 'Additional', items: [newIng] }]
    } else {
      updated = [...(recipe.ingredients as IngredientItem[] || []), newIng]
    }
    const next = { ...recipe, ingredients: updated }
    setRecipe(next)
    // Persist
    if (slug === 'temp-scan') {
      try { sessionStorage.setItem('recdex-temp-recipe', JSON.stringify(next)) } catch { /* storage full */ }
    } else if (recipe.id && recipe.id !== 'temp-cook') {
      supabase.from('recipes').update({ ingredients: updated }).eq('slug', slug)
        .then(({ error }) => { if (error) console.error('[cook] ingredient save failed:', error) })
    }
  }, [recipe, slug])

  const dismissAlert = useCallback((key: string, index: number) => {
    cancelSwNotification(key)
    setTimerAlerts(a => a.filter((_, j) => j !== index))
  }, [])

  // Unlock AudioContext on first user gesture anywhere on the page —
  // iOS Safari otherwise blocks the first timer beep
  useEffect(() => {
    const handler = () => unlockAudio()
    window.addEventListener('pointerdown', handler, { once: true, passive: true })
    window.addEventListener('keydown', handler, { once: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])

  const goToStep = useCallback((step: number) => {
    // Guard: stepRefs access is optional-chained, but activeStep going
    // out-of-range still breaks UI. Callers pass -1 for custom timers.
    if (step < 0) return
    setActiveStep(step)
    setOpenTip(null)
    isScrollingRef.current = true
    // Initial scroll, then re-center after content renders (tips, buttons change height)
    setTimeout(() => {
      stepRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        stepRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { isScrollingRef.current = false }, 600)
      }, 350)
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

  // Keyboard shortcuts: ←/→ for steps, Space for timer
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
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeStep, recipe, timers, goToStep, startTimer])

  // ─── Build ingredient amount lookup for inline annotations ──────────
  // (Must be before early returns to maintain hooks order)
  const ingredientAmountMap = useMemo(() => {
    if (!recipe || !showAmounts) return new Map<string, string>()
    const items = getIngredientItems(recipe.ingredients)
    const map = new Map<string, string>()
    // Prefixes to strip for matching (ingredient says "Large egg yolks", step says "egg yolks")
    const STRIP_PREFIX = /^(large|small|medium|fresh|dried|frozen|whole|unsalted|salted|extra-virgin|extra virgin|pure|raw|organic|ground|crushed|minced|chopped|diced|sliced|grated|shredded|packed|loosely packed|thinly sliced|finely|coarsely|freshly)\s+/i
    for (const item of items) {
      if (!item.name || !item.amount) continue
      const scaled = scaleAmount(item.amount, scaleFactor)
      const label = [scaled, item.unit].filter(Boolean).join(' ')
      if (!label) continue
      const rawName = item.name.toLowerCase()
      map.set(rawName, label)
      // Also add stripped version for fuzzy matching
      const stripped = rawName.replace(STRIP_PREFIX, '').replace(STRIP_PREFIX, '') // double-pass for "freshly ground"
      if (stripped !== rawName && stripped.length > 2) {
        map.set(stripped, label)
      }
    }
    return map
  }, [recipe, showAmounts, scaleFactor])

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
  const phaseBreakIndices = new Map(phaseBreaks.map(b => [b.index, b.toPhase as 'prep' | 'cook' | 'passive']))

  // Dock magnification: compute style for each step
  function getStepStyle(index: number) {
    const distance = Math.abs(index - activeStep)
    const isActive = distance === 0
    const isCompleted = index < activeStep

    let fontSize: number, padding: string, opacity: number, borderColor: string, bg: string
    let numberSize: number, numberFontSize: number, numberBorderRadius: number
    let lineHeight: number, fontFamily: string

    const stepPhase = recipe?.steps[index] ? classifyStep(recipe.steps[index].text) : 'prep'
    const isPassive = stepPhase === 'passive'

    if (isActive) {
      fontSize = isMobile ? 17 : 20
      padding = isMobile ? '24px 20px' : '28px 24px'
      opacity = 1
      borderColor = isPassive ? `${PHASE_META.passive.color}40` : C.accentMed
      bg = isPassive ? PHASE_META.passive.bg : C.accentBg
      numberSize = isMobile ? 34 : 38
      numberFontSize = 15
      numberBorderRadius = 8
      lineHeight = 1.7
      fontFamily = SERIF
    } else if (distance === 1) {
      fontSize = isMobile ? 15 : 16
      padding = isMobile ? '14px 16px' : '16px 20px'
      opacity = 0.85
      borderColor = C.rule
      bg = 'transparent'
      numberSize = 26
      numberFontSize = 11
      numberBorderRadius = 5
      lineHeight = 1.55
      fontFamily = SANS
    } else if (distance === 2) {
      fontSize = isMobile ? 14 : 15
      padding = isMobile ? '10px 16px' : '12px 20px'
      opacity = 0.7
      borderColor = C.ruleLight
      bg = 'transparent'
      numberSize = 22
      numberFontSize = 10
      numberBorderRadius = 4
      lineHeight = 1.5
      fontFamily = SANS
    } else {
      fontSize = isMobile ? 13 : 14
      padding = isMobile ? '8px 16px' : '10px 20px'
      opacity = 0.55
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

  // ─── Render step text with optional inline ingredient amounts ────
  function renderStepText(text: string, isActive: boolean) {
    if (!isActive || !showAmounts || ingredientAmountMap.size === 0) return text

    // Scan text for ingredient names and inject bold amounts inline
    const parts: React.ReactNode[] = []
    let remaining = text
    let keyIdx = 0
    const sortedNames = [...ingredientAmountMap.keys()].sort((a, b) => b.length - a.length)

    while (remaining.length > 0) {
      let earliestMatch: { pos: number; name: string; matchLen: number } | null = null
      for (const name of sortedNames) {
        if (name.length <= 2) continue
        const pos = remaining.toLowerCase().indexOf(name)
        if (pos !== -1 && (!earliestMatch || pos < earliestMatch.pos)) {
          earliestMatch = { pos, name, matchLen: name.length }
        }
      }
      if (!earliestMatch) {
        parts.push(<span key={keyIdx++}>{remaining}</span>)
        break
      }
      if (earliestMatch.pos > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, earliestMatch.pos)}</span>)
      }
      const matchedText = remaining.slice(earliestMatch.pos, earliestMatch.pos + earliestMatch.matchLen)
      const amount = ingredientAmountMap.get(earliestMatch.name)!
      parts.push(
        <span key={keyIdx++}>
          {matchedText}<span style={{ fontWeight: 700, color: C.text2, whiteSpace: 'nowrap' }}> ({amount})</span>
        </span>
      )
      remaining = remaining.slice(earliestMatch.pos + earliestMatch.matchLen)
      sortedNames.splice(sortedNames.indexOf(earliestMatch.name), 1)
    }
    return <>{parts}</>
  }

  // ─── Ingredient rendering helper (with scaling) ──────────────────────
  function renderIngredient(item: IngredientItem, i: number, options: { fontSize: number; showHighlight: boolean }) {
    const isHighlighted = options.showHighlight && highlightedIngredients.has(i) && !checkedIngredients[i]
    const scaledAmount = item.amount ? scaleAmount(item.amount, scaleFactor) : ''
    const isScaled = scaleFactor !== 1
    const swap = activeSwaps[i]
    const isSwapOpen = openSwapIndex === i

    return (
      <div key={i}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          margin: '1px 0',
        }}>
          <p onClick={() => toggleIngredient(i)} style={{
            flex: 1, fontSize: options.fontSize, color: checkedIngredients[i] ? C.text3 : C.text, margin: 0, fontFamily: SANS, lineHeight: 1.55,
            cursor: 'pointer', userSelect: 'none' as const,
            textDecoration: checkedIngredients[i] ? 'line-through' : 'none',
            opacity: checkedIngredients[i] ? 0.45 : 1,
            background: isHighlighted ? C.accentBg : 'transparent',
            fontWeight: isHighlighted ? 600 : 400,
            padding: '6px 8px', borderRadius: 6, marginLeft: -8,
            transition: 'all 0.25s ease',
          }}>
            {scaledAmount && (
              <span style={{ fontWeight: isHighlighted ? 600 : 400, color: isScaled ? C.accent : undefined }}>
                {scaledAmount}{item.unit ? ` ${item.unit} ` : ' '}
              </span>
            )}
            {swap ? (
              <>
                <s style={{ color: C.text3, textDecoration: 'line-through', fontWeight: 400 }}>{item.name}</s>
                {' '}
                <span style={{ color: C.gold, fontWeight: 600 }}>{swap.replacement}</span>
              </>
            ) : (
              item.name
            )}
            {item.notes && <span style={{ color: C.text3, fontSize: options.fontSize - 1 }}> ({item.notes})</span>}
          </p>
          {/* Swap button — circular refresh/swap icon */}
          <button
            onClick={e => { e.stopPropagation(); setOpenSwapIndex(isSwapOpen ? null : i) }}
            title={swap ? 'Change substitution' : `Swap ${item.name}`}
            aria-label={swap ? `Change ${item.name} substitution` : `Find substitute for ${item.name}`}
            style={{
              width: 32, height: 32, minWidth: 32, borderRadius: '50%', border: 'none',
              background: swap ? C.goldBg : isSwapOpen ? C.accentBg : 'transparent',
              color: swap ? C.gold : isSwapOpen ? C.accent : C.text3,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: swap || isSwapOpen ? 1 : 0.5, transition: 'all 0.15s',
              flexShrink: 0, padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; if (!swap && !isSwapOpen) e.currentTarget.style.background = C.accentBg }}
            onMouseLeave={e => { if (!swap && !isSwapOpen) { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent' } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>
        </div>
        {/* Substitution card */}
        {isSwapOpen && recipe && (
          <SubstitutionCard
            ingredientName={item.name}
            recipeName={recipe.title}
            recipeCuisine={recipe.cuisine}
            stepText={recipe.steps[activeStep]?.text || ''}
            onApply={(original, replacement, ratio) => applySwap(i, original, replacement, ratio)}
            onClose={() => setOpenSwapIndex(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes eggFall{0%{transform:translateY(-20vh) rotate(0deg);opacity:1}70%{opacity:1}100%{transform:translateY(105vh) rotate(var(--egg-spin,720deg));opacity:0}}
        @keyframes eggWobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}

      `}</style>

      {/* First-time tutorial overlay */}
      {!tutorialDone && <CookModeTutorial onComplete={() => setTutorialDone(true)} />}

      {/* HEADER */}
      <div style={{ padding: isMobile ? '10px 14px 8px' : '14px 24px 10px', borderBottom: `1.5px solid ${C.text}`, background: C.bg, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          {/* Row 1: back + centered title + step counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 6 : 12 }}>
            <button onClick={() => router.push(`/recipe/${slug}`)} style={{
              background: 'none', border: 'none', color: C.text2, fontSize: 18,
              cursor: 'pointer', padding: isMobile ? '4px 6px' : '6px 14px', flexShrink: 0, width: 40, textAlign: 'left' as const,
              ...(isMobile ? {} : { border: `1px solid ${C.rule}`, borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: SANS, width: 'auto' }),
            }}>{isMobile ? '←' : '← Exit'}</button>

            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              {!isMobile && <p style={{ fontSize: 9, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, margin: 0, fontFamily: SANS }}>Cook Mode</p>}
              <h2 style={{
                fontFamily: SERIF, fontSize: isMobile ? 14 : 17, fontWeight: 600, color: C.text,
                margin: '1px 0 0', lineHeight: 1.15,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
              }}>
                {recipe.title}<EggDot size={5} />
              </h2>
            </div>

            <div style={{ width: 40, flexShrink: 0, textAlign: 'right' as const }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{activeStep + 1}/{total}</span>
              {!isMobile && <ThemeToggle />}
            </div>
          </div>

          {/* Row 2: centered measurement toggle + ingredients button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setShowAmounts(!showAmounts)}
              style={{
                padding: '4px 12px', borderRadius: 16,
                border: `1px solid ${showAmounts ? C.gold : C.ruleLight}`,
                background: showAmounts ? C.goldBg : 'transparent',
                color: showAmounts ? C.gold : C.text3,
                fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2h8l-1 16H9L8 2z" /><path d="M12 6h4" /><path d="M11.5 10h4" /><path d="M11 14h3" />
                <path d="M7 22h10" /><path d="M9 18h6" />
              </svg>
              Amounts
            </button>
            {isMobile && ingredientItems.length > 0 && (
              <button onClick={() => setShowIngredientsMobile(!showIngredientsMobile)} style={{
                padding: '4px 12px', borderRadius: 16,
                background: showIngredientsMobile ? C.accent : 'transparent',
                border: `1px solid ${showIngredientsMobile ? C.accent : C.ruleLight}`,
                color: showIngredientsMobile ? '#fff' : C.text3,
                fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Ingredients
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 8, display: 'flex', gap: 3 }}>
            {recipe.steps.map((_, i) => (
              <div key={i} onClick={() => goToStep(i)} style={{
                flex: 1, height: 4, borderRadius: 2, cursor: 'pointer',
                background: i < activeStep ? C.green : i === activeStep ? C.accent : C.ruleLight,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

        </div>
      </div>

      {/* Active timer strip (compact, top) */}
      {(() => {
        const activeTimers = Object.entries(timers).filter(([, t]) => t.active && t.remaining > 0)
        if (activeTimers.length === 0) return null
        return (
          <div style={{ padding: '6px 24px', background: C.warm, borderBottom: `1px solid ${C.ruleLight}`, display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, animation: 'fadeIn 0.15s ease' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 4 }}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /></svg>
            {activeTimers.map(([key, timer]) => {
              const isCustom = key.startsWith('custom-')
              const stepIndex = isCustom ? -1 : parseInt(key.split('-').pop() || '0')
              return (
                <button key={key} onClick={() => goToStep(stepIndex)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 4,
                  border: `1px solid ${C.accentMed}`, background: C.accentBg, cursor: isCustom ? 'default' : 'pointer', whiteSpace: 'nowrap' as const, fontFamily: MONO,
                }}>
                  <span style={{ fontSize: 9, color: C.accent }}>{isCustom ? timer.label : `Step ${stepIndex + 1}`}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{formatTimerDisplay(timer.remaining)}</span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Active substitution banner */}
      <SwapBanner swaps={activeSwaps} onRemove={removeSwap} />

      {/* Timer completion alerts */}
      {timerAlerts.length > 0 && (
        <div style={{ padding: '0 24px', flexShrink: 0 }}>
          {timerAlerts.map((alert, i) => {
            const isCustom = alert.key.startsWith('custom-')
            const stepIndex = isCustom ? -1 : parseInt(alert.key.split('-').pop() || '0')
            return (
              <div key={`${alert.key}-${i}`} style={{
                padding: '8px 14px', marginTop: 6, background: C.accentBg, border: `1.5px solid ${C.accent}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, animation: 'slideUp 0.2s ease',
              }}>
                <span style={{ fontSize: 14 }}>✓</span>
                <span style={{ flex: 1, fontSize: 12, fontFamily: SANS, color: C.text }}>{alert.label} timer is done!</span>
                <button onClick={replayAlert} title="Replay alert" style={{
                  padding: '4px 8px', borderRadius: 4, border: `1px solid ${C.accent}`, background: 'transparent',
                  color: C.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                  Replay
                </button>
                {!isCustom && (
                  <button onClick={() => { goToStep(stepIndex); dismissAlert(alert.key, i) }} style={{
                    padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.accent}`, background: 'transparent',
                    color: C.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                  }}>Go to step</button>
                )}
                <button onClick={() => dismissAlert(alert.key, i)} style={{
                  padding: '4px 8px', borderRadius: 4, border: 'none', background: 'transparent',
                  color: C.text3, fontSize: 14, cursor: 'pointer',
                }}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Ingredients overlay — fixed, drops from top */}
      {showIngredientsMobile && ingredientItems.length > 0 && (
        <>
          <div onClick={() => setShowIngredientsMobile(false)} style={{
            position: 'fixed', inset: 0, zIndex: 199,
            background: 'rgba(0,0,0,0.3)', animation: 'fadeIn 0.15s ease',
          }} />
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
            padding: '14px 16px 20px', background: C.bg,
            borderBottom: `1.5px solid ${C.rule}`,
            maxHeight: '60vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: 'slideDown 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0, fontFamily: SANS }}>Ingredients</p>
                {checkedCount > 0 && (
                  <span style={{ fontSize: 9, fontFamily: MONO, color: C.accent, padding: '1px 6px', borderRadius: 8, background: C.accentBg }}>
                    {checkedCount}/{ingredientItems.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ServingsScaler original={originalServings} current={servings} onChange={setServings} />
                <button onClick={() => setShowIngredientsMobile(false)} style={{
                  background: 'none', border: 'none', color: C.text3, fontSize: 18, cursor: 'pointer', padding: '2px 6px',
                }}>×</button>
              </div>
            </div>
            <div>
              {ingredientItems.map((item, i) => renderIngredient(item, i, { fontSize: 13, showHighlight: false }))}
              <AddIngredientRow onAdd={addIngredient} />
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT: Steps + Ingredients sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Steps area — scrollable with dock magnification */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 20px 120px' : '28px 40px 120px' }}>
          <div style={{ maxWidth: 620, margin: '0 auto' }}>

            {/* Initial phase label — only show if the recipe starts with prep (and has a prep→cook transition) */}
            {recipe.steps.length > 0 && phaseBreakIndices.size > 0 && classifyStep(recipe.steps[0].text) === 'prep' && (
              <PhaseDivider phase="prep" />
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
                        background: style.isCompleted ? C.greenBg : style.isActive ? (classifyStep(step.text) === 'passive' ? PHASE_META.passive.color : C.accent) : C.ruleLight,
                        color: style.isCompleted ? C.green : style.isActive ? '#fff' : C.text3,
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}>
                        {style.isCompleted ? '✓' : classifyStep(step.text) === 'passive' && style.isActive ? '⏳' : i + 1}
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

                        {/* Passive step hint */}
                        {style.isActive && classifyStep(step.text) === 'passive' && (
                          <p style={{ fontSize: 11, color: PHASE_META.passive.color, margin: '10px 0 0', fontFamily: SANS, fontStyle: 'italic' }}>
                            Waiting step — {step.timer_minutes ? 'start the timer and move on when ready.' : 'come back when this is done.'}
                          </p>
                        )}

                        {/* Timer */}
                        {step.timer_minutes && (style.isActive || timers[`${recipe.id}-${i}`]?.active) && (
                          <InlineTimer minutes={step.timer_minutes} label={`Step ${i + 1}`} timerKey={`${recipe.id}-${i}`} timers={timers} onStart={startTimer} />
                        )}

                        {/* Cooking tip — auto-show title, expandable */}
                        {style.isActive && (() => {
                          const stepTip = getTipsForStep(step.text)
                          if (!stepTip) return null
                          const isExpanded = openTip === stepTip.id
                          return (
                            <div onClick={e => e.stopPropagation()} style={{
                              marginTop: 14, padding: '10px 14px', borderRadius: 8,
                              background: C.goldBg, border: `1px solid ${C.gold}30`,
                              animation: 'fadeIn 0.2s ease',
                            }}>
                              <div
                                onClick={() => setOpenTip(isExpanded ? null : stepTip.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <path d="M9 18h6" /><path d="M10 22h4" />
                                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                                </svg>
                                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.gold, fontFamily: SANS }}>{stepTip.title}</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round"
                                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </div>
                              {isExpanded && (
                                <p style={{ fontSize: 12, color: C.text, margin: '8px 0 0', fontFamily: SANS, lineHeight: 1.6, paddingLeft: 22 }}>
                                  {stepTip.tip}
                                </p>
                              )}
                            </div>
                          )
                        })()}

                        {/* Navigation buttons — consistent sizing */}
                        {style.isActive && (
                          <div style={{ marginTop: 16, display: 'flex', gap: 8, animation: 'slideUp 0.25s ease 0.1s both' }}>
                            {activeStep > 0 && (
                              <button onClick={e => { e.stopPropagation(); goToStep(activeStep - 1) }} style={{
                                flex: 1, padding: '12px 16px', borderRadius: 6,
                                border: `1.5px solid ${C.rule}`, background: 'transparent',
                                color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                                Back
                              </button>
                            )}
                            {!isLastStep ? (
                              <button onClick={e => { e.stopPropagation(); goToStep(activeStep + 1) }} style={{
                                flex: 1, padding: '12px 16px', borderRadius: 6, border: 'none',
                                background: C.text, color: C.bg,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              }}>
                                Next step
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                              </button>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); goToStep(total) }} style={{
                                flex: 1, padding: '12px 16px', borderRadius: 6, border: 'none',
                                background: C.green, color: '#fff',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              }}>
                                Finish cooking
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Inline step note — below navigation */}
                        {style.isActive && <StepNote stepIndex={i} slug={slug} />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Completion — egg confetti + photo + feedback + suggestions */}
            {activeStep >= total && (
              <div style={{ marginTop: 20, animation: 'slideUp 0.3s ease' }}>
                <EggConfetti />

                {/* Cooking Recap Card */}
                {(() => {
                  // Cook count: read existing history before current cook is added
                  const existingCooks = JSON.parse(localStorage.getItem('recdex-cooked') || '[]')
                  const cookNumber = existingCooks.length + 1
                  const ordinal = (n: number) => {
                    if (n === 1) return '1st'
                    if (n === 2) return '2nd'
                    if (n === 3) return '3rd'
                    if (n <= 10) return `${n}th`
                    return String(n)
                  }
                  const cookCountText = cookNumber <= 10
                    ? `This is your ${ordinal(cookNumber)} recipe on RecDex`
                    : `You've cooked ${cookNumber} recipes on RecDex`

                  // Techniques: scan all steps for tips
                  const uniqueTips: string[] = []
                  const seenIds = new Set<string>()
                  for (const step of recipe.steps) {
                    const tip = getTipsForStep(step.text)
                    if (tip && !seenIds.has(tip.id)) {
                      seenIds.add(tip.id)
                      uniqueTips.push(tip.title)
                      if (uniqueTips.length >= 5) break
                    }
                  }

                  return (
                    <div style={{
                      background: C.warm,
                      border: `1px solid ${C.ruleLight}`,
                      borderRadius: 10,
                      padding: '20px 24px',
                      marginBottom: 16,
                      animation: 'slideUp 0.3s ease 0.2s both',
                    }}>
                      {/* Cook count */}
                      <p style={{
                        fontFamily: SERIF,
                        fontSize: 18,
                        fontWeight: 600,
                        color: C.text,
                        margin: '0 0 4px',
                      }}>
                        {cookCountText}
                      </p>

                      {/* Total time */}
                      {recipe.time_total ? (
                        <p style={{
                          fontFamily: SANS,
                          fontSize: 13,
                          color: C.text2,
                          margin: uniqueTips.length > 0 ? '0 0 14px' : 0,
                        }}>
                          Total cook time: {formatTime(recipe.time_total)}
                        </p>
                      ) : uniqueTips.length > 0 ? <div style={{ marginBottom: 10 }} /> : null}

                      {/* Techniques practiced */}
                      {uniqueTips.length > 0 && (
                        <div>
                          <p style={{
                            fontFamily: SANS,
                            fontSize: 11,
                            fontWeight: 600,
                            color: C.text3,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            margin: '0 0 8px',
                          }}>
                            Techniques in this cook
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {uniqueTips.map(title => (
                              <span key={title} style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 12,
                                background: C.goldBg,
                                color: C.gold,
                                fontSize: 11,
                                fontWeight: 600,
                                fontFamily: SANS,
                              }}>
                                {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

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

                    {/* How did it turn out? — Egg rating */}
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.ruleLight}` }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px', fontFamily: SANS }}>How would you rate this recipe?</p>
                      <div
                        style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map(n => {
                          const filled = hoverRating ? n <= hoverRating : cookRating ? n <= cookRating : false
                          return (
                            <button
                              key={n}
                              onClick={() => setCookRating(n)}
                              onMouseEnter={() => setHoverRating(n)}
                              style={{
                                width: 24, height: 30, border: 'none', cursor: 'pointer', padding: 0,
                                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                                background: filled ? C.accent : C.ruleLight,
                                transition: 'background 0.15s, transform 0.1s',
                                transform: filled ? 'scale(1.1)' : 'scale(1)',
                              }}
                              aria-label={`Rate ${n} out of 5`}
                            />
                          )
                        })}
                        {cookRating && (
                          <span style={{ fontSize: 12, fontFamily: MONO, color: C.text3, marginLeft: 4 }}>{cookRating}/5</span>
                        )}
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
                        const NUMERIC_TO_LEGACY: Record<number, string> = { 5: 'amazing', 4: 'good', 3: 'ok', 2: 'tricky', 1: 'tricky' }
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
                        if (displayName && (tip || substitutions || cookRating)) {
                          const parts: string[] = []
                          if (substitutions) parts.push(`🔄 Substitution: ${substitutions}`)
                          if (tip) parts.push(`💡 Tip: ${tip}`)
                          const body = parts.join('\n\n')
                          await supabase.from('comments').insert({
                            recipe_id: recipe.id,
                            display_name: displayName,
                            body: body || '(rated)',
                            rating: cookRating ? NUMERIC_TO_LEGACY[cookRating] : null,
                            rating_numeric: cookRating || null,
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
                      {/* Share with a friend */}
                      <button
                        onClick={async () => {
                          const recipeUrl = `https://www.recipeindex.org/recipe/${slug}`
                          const shareText = `I just made ${recipe.title}! Try it yourself:`
                          try {
                            await navigator.share({ title: `I made ${recipe.title}!`, text: shareText, url: recipeUrl })
                          } catch (err) {
                            if ((err as Error)?.name === 'AbortError') return
                            const smsBody = encodeURIComponent(`${shareText} ${recipeUrl}`)
                            window.open(`sms:?&body=${smsBody}`, '_self')
                          }
                        }}
                        style={{
                          width: '100%', maxWidth: 280, margin: '0 auto 16px', padding: '13px 24px', borderRadius: 8,
                          border: 'none', background: '#34C759', color: '#fff',
                          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share recipe with a friend
                      </button>
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
                              onClick={() => { window.location.href = `/recipe/${s.slug}/cook` }}
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
            <AddIngredientRow onAdd={addIngredient} />
          </div>
        )}
      </div>

      {/* Floating timer panel */}
      <FloatingTimerPanel
        timers={timers}
        onGoToStep={goToStep}
        onStartCustom={(secs, label) => startTimer(`custom-${Date.now()}`, secs, label || 'Timer')}
      />
    </div>
  )
}
