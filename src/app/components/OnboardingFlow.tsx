'use client'

import { useState, useEffect } from 'react'
import { C, SERIF, SANS } from '@/app/lib/theme'

// ===== CONSTANTS =====
const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Thai', 'Indian', 'Japanese', 'Chinese',
  'Korean', 'French', 'Mediterranean', 'Middle Eastern', 'Vietnamese',
  'Ethiopian', 'Cajun', 'Caribbean', 'Greek', 'American',
]

// ===== TYPES =====
export type OnboardingProfile = {
  displayName: string
  frequency: string
  cuisines: string[]
  dietary: string[]
  goDish: string
  favRestaurantDish: string
  pantryItems: string[]
  onboardingComplete: boolean
}

type StepProps = {
  profile: OnboardingProfile
  setProfile: (fn: (p: OnboardingProfile) => OnboardingProfile) => void
}

// ===== STEP COMPONENTS =====
function StepName({ profile, setProfile }: StepProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
        Welcome to Recipe Index
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.text3, margin: '0 0 32px', lineHeight: 1.5 }}>
        Let&apos;s get you cooking. What should we call you?
      </p>
      <input
        type="text"
        value={profile.displayName}
        onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
        placeholder="Your name"
        autoFocus
        style={{
          width: '100%', maxWidth: 320, padding: '14px 18px', borderRadius: 10,
          border: `2px solid ${C.ruleLight}`, background: C.bg, color: C.text,
          fontFamily: SANS, fontSize: 17, textAlign: 'center', outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = C.accent}
        onBlur={e => e.currentTarget.style.borderColor = C.ruleLight}
      />
    </div>
  )
}

function StepCuisines({ profile, setProfile }: StepProps) {
  const toggleCuisine = (c: string) => {
    setProfile(p => ({
      ...p,
      cuisines: p.cuisines.includes(c) ? p.cuisines.filter(x => x !== c) : [...p.cuisines, c],
    }))
  }

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 6px', textAlign: 'center' }}>
        What do you like to cook?
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3, margin: '0 0 28px', textAlign: 'center' }}>
        Pick any cuisines you enjoy — we&apos;ll tailor your recipe feed.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {CUISINE_OPTIONS.map(c => {
          const active = profile.cuisines.includes(c)
          return (
            <button key={c} onClick={() => toggleCuisine(c)} style={{
              padding: '10px 18px', borderRadius: 20,
              border: `1.5px solid ${active ? C.accent : C.ruleLight}`,
              background: active ? C.accentBg : 'transparent',
              color: active ? C.accent : C.text2,
              fontFamily: SANS, fontSize: 14, fontWeight: active ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepDone({ profile }: { profile: OnboardingProfile }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
        You&apos;re all set, {profile.displayName}!
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.text3, margin: '0 0 24px', lineHeight: 1.5 }}>
        {profile.cuisines.length > 0
          ? `We'll surface great ${profile.cuisines.slice(0, 2).join(' and ')} recipes for you. Time to cook.`
          : 'Your kitchen is ready. Paste a recipe, browse the index, or scan a cookbook.'}
      </p>
    </div>
  )
}

// ===== MAIN COMPONENT =====
const TOTAL_STEPS = 3 // Name → Cuisines → Done

export default function OnboardingFlow({ onComplete }: { onComplete: (profile: OnboardingProfile) => void }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<OnboardingProfile>({
    displayName: '',
    frequency: '',
    cuisines: [],
    dietary: [],
    goDish: '',
    favRestaurantDish: '',
    pantryItems: [],
    onboardingComplete: false,
  })

  // Load existing partial profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recdex-profile')
      if (saved) {
        const parsed = JSON.parse(saved)
        setProfile(p => ({ ...p, displayName: parsed.displayName || '', ...parsed }))
      }
    } catch { /* ignore */ }
  }, [])

  const canAdvance = step === 0 ? profile.displayName.trim().length >= 1 : true
  const isLast = step === TOTAL_STEPS - 1

  const next = () => {
    if (isLast) {
      const final = { ...profile, onboardingComplete: true }
      try {
        const existing = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
        localStorage.setItem('recdex-profile', JSON.stringify({ ...existing, ...final }))
      } catch {
        localStorage.setItem('recdex-profile', JSON.stringify(final))
      }
      onComplete(final)
      return
    }
    setStep(s => s + 1)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px clamp(16px,5vw,40px)',
      overflow: 'auto',
    }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i <= step ? C.accent : C.ruleLight,
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ width: '100%', maxWidth: 480, minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {step === 0 && <StepName profile={profile} setProfile={setProfile} />}
        {step === 1 && <StepCuisines profile={profile} setProfile={setProfile} />}
        {step === 2 && <StepDone profile={profile} />}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, marginTop: 40, alignItems: 'center' }}>
        {step > 0 && !isLast && (
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.ruleLight}`,
            background: 'transparent', color: C.text3, fontFamily: SANS, fontSize: 14,
            cursor: 'pointer',
          }}>
            Back
          </button>
        )}

        <button
          onClick={next}
          disabled={!canAdvance}
          style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: canAdvance ? C.accent : C.ruleLight,
            color: canAdvance ? '#fff' : C.text3,
            fontFamily: SANS, fontSize: 15, fontWeight: 600,
            cursor: canAdvance ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {isLast ? 'Start Cooking' : step === 0 ? 'Next' : 'Done'}
        </button>
      </div>
    </div>
  )
}
