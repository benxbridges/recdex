'use client'

import { C, MONO } from '@/app/lib/theme'

// ===== EGG SYSTEM (shared between profile + leaderboard) =====
export const EGG_TIERS = [
  { name: 'Home Cook', min: 0, color: C.text3 },
  { name: 'Line Cook', min: 25, color: C.gold },
  { name: 'Sous Chef', min: 100, color: C.green },
  { name: 'Chef', min: 500, color: C.blue },
  { name: 'Executive Chef', min: 2000, color: C.accent },
]

export function getEggTier(eggs: number) {
  let tier = EGG_TIERS[0]
  for (const t of EGG_TIERS) {
    if (eggs >= t.min) tier = t
  }
  return tier
}

export function EggBadge({ eggs, size = 11 }: { eggs: number; size?: number }) {
  const tier = getEggTier(eggs)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 5px 1px 3px', borderRadius: 7,
      background: `${tier.color}15`,
    }}>
      <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 12 16" fill="none">
        <path d="M6 0.5C4.2 0.5 1 4.5 1 9.5C1 12.5 3.2 15 6 15C8.8 15 11 12.5 11 9.5C11 4.5 7.8 0.5 6 0.5Z"
          fill={tier.color} />
        <ellipse cx="4.5" cy="8.5" rx="1.5" ry="2" fill="white" opacity="0.25" />
      </svg>
      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: tier.color, lineHeight: 1 }}>
        {eggs}
      </span>
    </span>
  )
}

export function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}
