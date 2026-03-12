// ===== DESIGN TOKENS =====
// Centralized color palette and font stacks for RecDex.
// All page files import from here — change once, update everywhere.
// Colors resolve to CSS custom properties so dark/light mode works automatically.

export const C = {
  bg: 'var(--c-bg)',
  warm: 'var(--c-warm)',
  cool: 'var(--c-cool)',
  text: 'var(--c-text)',
  text2: 'var(--c-text2)',
  text3: 'var(--c-text3)',
  rule: 'var(--c-rule)',
  ruleLight: 'var(--c-ruleLight)',
  accent: 'var(--c-accent)',
  accentBg: 'var(--c-accentBg)',
  accentMed: 'var(--c-accentMed)',
  green: 'var(--c-green)',
  greenBg: 'var(--c-greenBg)',
  blue: 'var(--c-blue)',
  blueBg: 'var(--c-blueBg)',
  gold: 'var(--c-gold)',
  goldBg: 'var(--c-goldBg)',
  timerBg: 'var(--c-timerBg)',
  timerRing: 'var(--c-timerRing)',
  eggPoint: 'var(--c-eggPoint)',
}

export const SERIF = "'Young Serif', Georgia, serif"
export const SANS = "'Plus Jakarta Sans', system-ui, sans-serif"
export const MONO = "'JetBrains Mono', 'Courier New', monospace"
