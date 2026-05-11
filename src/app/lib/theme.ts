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

// ===== LAYOUT TOKENS =====
// Single mobile breakpoint across the app. Pages currently mix 700/768/820;
// 768 matches Tailwind/Bootstrap `md` and iPad portrait.
export const MOBILE_BREAKPOINT = 768

// Modal backdrop — dark wash that reads on both light and dark themes.
export const BACKDROP = 'rgba(26, 26, 24, 0.5)'

// Spacing scale for new components. Existing pages use ad-hoc values;
// new component primitives should pull from here.
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

// Border radius scale.
export const RADIUS = { sm: 4, md: 8, lg: 12, pill: 999 } as const
