'use client'

import { useState, useEffect } from 'react'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

// ===== CONSTANTS =====
const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Thai', 'Indian', 'Japanese', 'Chinese',
  'Korean', 'French', 'Mediterranean', 'Middle Eastern', 'Vietnamese',
  'Ethiopian', 'Cajun', 'Caribbean', 'Greek', 'American',
]

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Keto', 'Paleo', 'None',
]

const FREQUENCY_OPTIONS = [
  { value: 'rarely', label: 'Rarely', desc: 'A few times a month' },
  { value: 'sometimes', label: 'A few times a week', desc: 'I keep it casual' },
  { value: 'daily', label: 'Almost daily', desc: 'Cooking is my thing' },
]

const PANTRY_STAPLES: Record<string, string[]> = {
  'Basics': ['Salt', 'Pepper', 'Olive oil', 'Butter', 'Garlic', 'Onions', 'Eggs', 'Flour', 'Sugar'],
  'Proteins': ['Chicken', 'Ground beef', 'Tofu', 'Salmon', 'Shrimp', 'Pork', 'Turkey'],
  'Pantry': ['Rice', 'Pasta', 'Canned tomatoes', 'Soy sauce', 'Honey', 'Chicken broth', 'Coconut milk', 'Hot sauce'],
  'Produce': ['Lemons', 'Tomatoes', 'Spinach', 'Bell peppers', 'Ginger', 'Cilantro', 'Avocado'],
}

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
      <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
        Welcome to RecDex
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.text3, margin: '0 0 32px', lineHeight: 1.5 }}>
        Your recipe discovery starts here. What should we call you?
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

function StepTaste({ profile, setProfile }: StepProps) {
  const toggleCuisine = (c: string) => {
    setProfile(p => ({
      ...p,
      cuisines: p.cuisines.includes(c) ? p.cuisines.filter(x => x !== c) : [...p.cuisines, c],
    }))
  }
  const toggleDietary = (d: string) => {
    if (d === 'None') {
      setProfile(p => ({ ...p, dietary: p.dietary.includes('None') ? [] : ['None'] }))
      return
    }
    setProfile(p => ({
      ...p,
      dietary: p.dietary.includes(d) ? p.dietary.filter(x => x !== d) : [...p.dietary.filter(x => x !== 'None'), d],
    }))
  }

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 6px', textAlign: 'center' }}>
        Your taste profile
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3, margin: '0 0 28px', textAlign: 'center' }}>
        This helps us surface recipes you&apos;ll love.
      </p>

      {/* Cooking frequency */}
      <label style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 10 }}>
        How often do you cook?
      </label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {FREQUENCY_OPTIONS.map(f => {
          const active = profile.frequency === f.value
          return (
            <button key={f.value} onClick={() => setProfile(p => ({ ...p, frequency: f.value }))} style={{
              flex: 1, minWidth: 100, padding: '12px 10px', borderRadius: 10,
              border: `2px solid ${active ? C.accent : C.ruleLight}`,
              background: active ? C.accentBg : 'transparent', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.15s',
            }}>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: active ? C.accent : C.text }}>{f.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.text3, marginTop: 2 }}>{f.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Cuisines */}
      <label style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 10 }}>
        Pick cuisines you love
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {CUISINE_OPTIONS.map(c => {
          const active = profile.cuisines.includes(c)
          return (
            <button key={c} onClick={() => toggleCuisine(c)} style={{
              padding: '8px 16px', borderRadius: 20,
              border: `1.5px solid ${active ? C.accent : C.ruleLight}`,
              background: active ? C.accentBg : 'transparent',
              color: active ? C.accent : C.text2,
              fontFamily: SANS, fontSize: 13, fontWeight: active ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {c}
            </button>
          )
        })}
      </div>

      {/* Dietary */}
      <label style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 10 }}>
        Any dietary preferences?
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {DIETARY_OPTIONS.map(d => {
          const active = profile.dietary.includes(d)
          return (
            <button key={d} onClick={() => toggleDietary(d)} style={{
              padding: '8px 16px', borderRadius: 20,
              border: `1.5px solid ${active ? C.green : C.ruleLight}`,
              background: active ? C.greenBg : 'transparent',
              color: active ? C.green : C.text2,
              fontFamily: SANS, fontSize: 13, fontWeight: active ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepDishes({ profile, setProfile }: StepProps) {
  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 6px', textAlign: 'center' }}>
        Your favorite dishes
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3, margin: '0 0 32px', textAlign: 'center' }}>
        We&apos;ll use these to find recipes you&apos;ll want to try.
      </p>

      <label style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 8 }}>
        What&apos;s your go-to dish to cook?
      </label>
      <input
        type="text"
        value={profile.goDish}
        onChange={e => setProfile(p => ({ ...p, goDish: e.target.value }))}
        placeholder="e.g. Spaghetti carbonara, Stir fry..."
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 10,
          border: `2px solid ${C.ruleLight}`, background: C.bg, color: C.text,
          fontFamily: SANS, fontSize: 15, outline: 'none', marginBottom: 28,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = C.accent}
        onBlur={e => e.currentTarget.style.borderColor = C.ruleLight}
      />

      <label style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 8 }}>
        Favorite dish at a restaurant?
      </label>
      <input
        type="text"
        value={profile.favRestaurantDish}
        onChange={e => setProfile(p => ({ ...p, favRestaurantDish: e.target.value }))}
        placeholder="e.g. Pad Thai, Chicken tikka masala..."
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 10,
          border: `2px solid ${C.ruleLight}`, background: C.bg, color: C.text,
          fontFamily: SANS, fontSize: 15, outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = C.accent}
        onBlur={e => e.currentTarget.style.borderColor = C.ruleLight}
      />
    </div>
  )
}

function StepPantry({ profile, setProfile }: StepProps) {
  const toggleItem = (item: string) => {
    setProfile(p => ({
      ...p,
      pantryItems: p.pantryItems.includes(item)
        ? p.pantryItems.filter(x => x !== item)
        : [...p.pantryItems, item],
    }))
  }

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 6px', textAlign: 'center' }}>
        Stock your pantry
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3, margin: '0 0 8px', textAlign: 'center' }}>
        Tap what&apos;s always in your kitchen. We&apos;ll find recipes that match.
      </p>
      <p style={{ fontFamily: MONO, fontSize: 11, color: C.accent, margin: '0 0 28px', textAlign: 'center', fontWeight: 600 }}>
        {profile.pantryItems.length} items selected
      </p>

      {Object.entries(PANTRY_STAPLES).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text3, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {category}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map(item => {
              const active = profile.pantryItems.includes(item)
              return (
                <button key={item} onClick={() => toggleItem(item)} style={{
                  padding: '7px 14px', borderRadius: 18,
                  border: `1.5px solid ${active ? C.green : C.ruleLight}`,
                  background: active ? C.greenBg : 'transparent',
                  color: active ? C.green : C.text2,
                  fontFamily: SANS, fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {active ? '✓ ' : ''}{item}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function StepDone({ profile }: { profile: OnboardingProfile }) {
  const summaryParts: string[] = []
  if (profile.frequency) summaryParts.push(profile.frequency === 'daily' ? 'daily cook' : profile.frequency === 'sometimes' ? 'casual cook' : 'occasional cook')
  if (profile.cuisines.length) summaryParts.push(`loves ${profile.cuisines.slice(0, 3).join(', ')}`)
  if (profile.goDish) summaryParts.push(`go-to: ${profile.goDish}`)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
        You&apos;re all set, {profile.displayName}!
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.text3, margin: '0 0 24px', lineHeight: 1.5 }}>
        We&apos;ve personalized your feed. Dive in and discover something delicious.
      </p>
      {summaryParts.length > 0 && (
        <div style={{
          display: 'inline-block', padding: '12px 20px', borderRadius: 12,
          background: C.accentBg, border: `1px solid ${C.ruleLight}`,
        }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: C.accent, margin: 0, fontWeight: 600 }}>
            {summaryParts.join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}

// ===== MAIN COMPONENT =====
const TOTAL_STEPS = 5

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
      // Merge with existing profile data (preserving bio, socials, etc.)
      try {
        const existing = JSON.parse(localStorage.getItem('recdex-profile') || '{}')
        localStorage.setItem('recdex-profile', JSON.stringify({ ...existing, ...final }))
      } catch {
        localStorage.setItem('recdex-profile', JSON.stringify(final))
      }
      // Sync pantry items to recdex-pantry (used by the pantry page)
      if (final.pantryItems.length > 0) {
        try {
          const existingPantry: { id: string; name: string; category: string; addedAt: number }[] = JSON.parse(localStorage.getItem('recdex-pantry') || '[]')
          const existingNames = new Set(existingPantry.map(p => p.name.toLowerCase()))
          const categoryMap: Record<string, string> = {
            'Salt': 'spices', 'Pepper': 'spices', 'Garlic': 'produce', 'Onions': 'produce',
            'Olive oil': 'oils', 'Butter': 'dairy', 'Eggs': 'dairy', 'Flour': 'baking', 'Sugar': 'baking',
            'Chicken': 'protein', 'Ground beef': 'protein', 'Tofu': 'protein', 'Salmon': 'protein',
            'Shrimp': 'protein', 'Pork': 'protein', 'Turkey': 'protein',
            'Rice': 'grains', 'Pasta': 'grains', 'Canned tomatoes': 'canned', 'Soy sauce': 'condiments',
            'Honey': 'condiments', 'Chicken broth': 'canned', 'Coconut milk': 'canned', 'Hot sauce': 'condiments',
            'Lemons': 'produce', 'Tomatoes': 'produce', 'Spinach': 'produce', 'Bell peppers': 'produce',
            'Ginger': 'produce', 'Cilantro': 'produce', 'Avocado': 'produce',
          }
          const newItems = final.pantryItems
            .filter(name => !existingNames.has(name.toLowerCase()))
            .map(name => ({
              id: crypto.randomUUID(),
              name,
              category: categoryMap[name] || 'other',
              addedAt: Date.now(),
            }))
          if (newItems.length > 0) {
            localStorage.setItem('recdex-pantry', JSON.stringify([...existingPantry, ...newItems]))
          }
        } catch { /* ignore */ }
      }
      onComplete(final)
      return
    }
    setStep(s => s + 1)
  }

  const skip = () => {
    if (isLast) {
      next()
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
        {step === 1 && <StepTaste profile={profile} setProfile={setProfile} />}
        {step === 2 && <StepDishes profile={profile} setProfile={setProfile} />}
        {step === 3 && <StepPantry profile={profile} setProfile={setProfile} />}
        {step === 4 && <StepDone profile={profile} />}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 40, alignItems: 'center' }}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.ruleLight}`,
            background: 'transparent', color: C.text3, fontFamily: SANS, fontSize: 14,
            cursor: 'pointer',
          }}>
            Back
          </button>
        )}

        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button onClick={skip} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'transparent', color: C.text3, fontFamily: SANS, fontSize: 14,
            cursor: 'pointer', textDecoration: 'underline',
          }}>
            Skip
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
          {isLast ? 'Start Cooking' : step === 0 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  )
}
