'use client'

import { useState, useEffect } from 'react'
import { C, SERIF, SANS } from '@/app/lib/theme'

const STORAGE_KEY = 'recdex-cook-tutorial-seen'

// Hardcoded because CSS var() doesn't resolve in inline backgroundColor
const CARD_BG = { dark: '#292524', light: '#F0EDE8' }
const CARD_BORDER = { dark: '#3D3832', light: '#DDD8D0' }

type TutorialStep = {
  icon: string
  title: string
  body: string
}

const STEPS: TutorialStep[] = [
  {
    icon: '👆',
    title: 'Tap to advance',
    body: 'Tap any step to jump to it, or swipe through. Arrow keys work too.',
  },
  {
    icon: '🥬',
    title: 'Ingredient amounts',
    body: 'Toggle the ingredient panel to see amounts. Tap to check off as you go.',
  },
  {
    icon: '☀️',
    title: 'Screen stays on',
    body: "Your phone won't sleep while you cook. Hands-free, worry-free.",
  },
]

function getTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export default function CookModeTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true') {
        onComplete()
        return
      }
    } catch { /* private browsing */ }
    setTheme(getTheme())
    const timer = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  const dismiss = () => {
    setExiting(true)
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    setTimeout(onComplete, 250)
  }

  const advance = () => {
    if (isLast) {
      dismiss()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div
      onClick={advance}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 24px',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.25s ease',
        cursor: 'pointer',
      }}
    >
      <div
        key={step}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: CARD_BG[theme],
          borderRadius: 20,
          padding: '24px 22px 20px',
          maxWidth: 300,
          marginBottom: 80,
          width: '100%',
          textAlign: 'center',
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          border: `1px solid ${CARD_BORDER[theme]}`,
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 36, marginBottom: 10, lineHeight: 1 }}>
          {currentStep.icon}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: SERIF, fontSize: 20, fontWeight: 700,
          color: C.text, margin: '0 0 6px', letterSpacing: -0.5,
        }}>
          {currentStep.title}
        </h2>

        {/* Body */}
        <p style={{
          fontFamily: SANS, fontSize: 14, color: C.text2,
          lineHeight: 1.5, margin: '0 0 18px',
        }}>
          {currentStep.body}
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === step ? '#E87B5A' : CARD_BORDER[theme],
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={advance}
          style={{
            width: '100%', padding: '14px 24px',
            borderRadius: 12, border: 'none',
            backgroundColor: '#E87B5A', color: '#fff',
            fontSize: 15, fontWeight: 600, fontFamily: SANS,
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isLast ? "Let's cook" : 'Next'}
        </button>

        {/* Skip link */}
        {!isLast && (
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: C.text3, fontFamily: SANS,
              marginTop: 12, padding: '4px 8px',
            }}
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
