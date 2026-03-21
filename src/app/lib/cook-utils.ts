// ===== COOK MODE UTILITIES =====
// Shared helpers for the cook mode experience.

/**
 * Scale an ingredient amount string by a multiplier.
 * Handles fractions (½, ¾, 1/2), ranges (2-3), and decimals.
 * Returns the scaled string, preserving the original format where possible.
 */
export function scaleAmount(amount: string, factor: number): string {
  if (!amount || factor === 1) return amount

  // Unicode fraction map
  const FRACTIONS: Record<string, number> = {
    '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 1/6, '⅚': 5/6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  }

  // Reverse map: decimal → unicode fraction (for display)
  const TO_FRACTION: Record<string, string> = {}
  for (const [frac, val] of Object.entries(FRACTIONS)) {
    TO_FRACTION[(val as number).toFixed(4)] = frac
  }

  function formatNumber(n: number): string {
    // Try to express as whole + unicode fraction
    const whole = Math.floor(n)
    const remainder = n - whole
    if (remainder < 0.01) return whole.toString()

    const fracKey = remainder.toFixed(4)
    const fracChar = TO_FRACTION[fracKey]
    if (fracChar) return whole > 0 ? `${whole}${fracChar}` : fracChar

    // Close-enough fraction matching (within 5%)
    for (const [fracChar, fracVal] of Object.entries(FRACTIONS)) {
      if (Math.abs(remainder - fracVal) < 0.05) {
        return whole > 0 ? `${whole}${fracChar}` : fracChar
      }
    }

    // Fall back to decimal
    if (n === Math.round(n)) return n.toString()
    return Number(n.toFixed(2)).toString()
  }

  function scaleToken(token: string): string {
    // Range: "2-3" or "2 to 3"
    const rangeMatch = token.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/)
    if (rangeMatch) {
      const lo = parseFloat(rangeMatch[1]) * factor
      const hi = parseFloat(rangeMatch[2]) * factor
      return `${formatNumber(lo)}-${formatNumber(hi)}`
    }

    // Mixed number: "1 ½" or "2½"
    for (const [frac, val] of Object.entries(FRACTIONS)) {
      if (token.includes(frac)) {
        const before = token.replace(frac, '').trim()
        const wholeNum = before ? parseFloat(before) : 0
        if (!isNaN(wholeNum)) {
          return formatNumber((wholeNum + val) * factor)
        }
      }
    }

    // Slash fraction: "1/2", "3/4"
    const slashMatch = token.match(/^(\d+)\s*\/\s*(\d+)$/)
    if (slashMatch) {
      const val = parseInt(slashMatch[1]) / parseInt(slashMatch[2])
      return formatNumber(val * factor)
    }

    // Mixed: "1 1/2"
    const mixedMatch = token.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
    if (mixedMatch) {
      const val = parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3])
      return formatNumber(val * factor)
    }

    // Plain number
    const num = parseFloat(token)
    if (!isNaN(num) && token.match(/^\d+(\.\d+)?$/)) {
      return formatNumber(num * factor)
    }

    return token
  }

  return scaleToken(amount.trim())
}

/**
 * Classify whether a recipe step is "prep" or "cook" phase.
 * Returns 'prep' for setup/chopping/measuring, 'cook' for heat-based steps.
 */
const PREP_PATTERNS = [
  /\b(chop|dice|mince|slice|julienne|peel|trim|wash|rinse|drain)\b/i,
  /\b(combine|mix|toss|whisk|stir together|blend)\b.*\b(bowl|container|dish)\b/i,
  /\b(measure|weigh|prepare|set aside|gather|arrange)\b/i,
  /\b(marinate|season|coat|rub|dress)\b/i,
  /\b(preheat)\b/i,
  /\b(line|grease|spray)\b.*\b(pan|sheet|baking|dish)\b/i,
]

const COOK_PATTERNS = [
  /\b(heat|warm|cook|bake|roast|grill|fry|sauté|saute|sear|broil|braise|simmer|boil|steam|poach|toast|brown|caramelize|reduce|deglaze|stir-fry)\b/i,
  /\b(oven|stove|burner|flame|grill|skillet|pot|pan)\b.*\b(minutes?|hours?|until)\b/i,
  /\b(transfer to|place in|put in)\b.*\b(oven|grill|smoker)\b/i,
]

export function classifyStep(text: string): 'prep' | 'cook' | 'finish' {
  // "Serve", "garnish and serve", "let rest then serve" → finish
  // Must be the PRIMARY action, not incidental ("transfer to a plate" is NOT finish)
  if (/\b(serve\b|garnish and serve|let (it )?rest)\b/i.test(text) && !/\b(cook|heat|bake|roast|sear|simmer|boil|fry)\b/i.test(text)) {
    return 'finish'
  }

  let prepScore = 0
  let cookScore = 0

  for (const p of PREP_PATTERNS) {
    if (p.test(text)) prepScore++
  }
  for (const p of COOK_PATTERNS) {
    if (p.test(text)) cookScore++
  }

  if (cookScore > prepScore) return 'cook'
  if (prepScore > 0) return 'prep'
  return 'cook' // default to cook if ambiguous
}

/**
 * Find the phase transition points in recipe steps.
 * Only shows meaningful transitions: prep→cook and cook→finish.
 * Ignores single-step "flickers" (e.g., one prep step among cook steps).
 */
export function findPhaseBreaks(steps: { text: string }[]): { index: number; fromPhase: string; toPhase: string }[] {
  if (steps.length < 3) return [] // too short to have meaningful phases

  const phases = steps.map(s => classifyStep(s.text))
  const breaks: { index: number; fromPhase: string; toPhase: string }[] = []

  // Smooth single-step outliers (e.g., cook-prep-cook → cook-cook-cook)
  const smoothed = [...phases]
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] !== smoothed[i - 1] && smoothed[i] !== smoothed[i + 1]) {
      smoothed[i] = smoothed[i - 1] // absorb into surrounding phase
    }
  }

  // Only emit meaningful transitions (prep→cook, cook→finish, prep→finish)
  let currentPhase = smoothed[0]
  for (let i = 1; i < smoothed.length; i++) {
    if (smoothed[i] !== currentPhase) {
      // Only show forward transitions (prep→cook→finish), not backward
      const order = { prep: 0, cook: 1, finish: 2 }
      if (order[smoothed[i]] > order[currentPhase]) {
        breaks.push({ index: i, fromPhase: currentPhase, toPhase: smoothed[i] })
      }
      currentPhase = smoothed[i]
    }
  }

  return breaks
}

/**
 * Highlight action verbs in step text by wrapping them in <strong> tags.
 * Returns an array of { text, bold } segments for rendering.
 */
const ACTION_VERBS = new Set([
  'heat', 'cook', 'bake', 'roast', 'grill', 'fry', 'sauté', 'saute', 'sear',
  'broil', 'braise', 'simmer', 'boil', 'steam', 'poach', 'toast', 'brown',
  'caramelize', 'reduce', 'deglaze', 'stir-fry', 'whisk', 'fold', 'stir',
  'mix', 'combine', 'blend', 'toss', 'chop', 'dice', 'mince', 'slice',
  'julienne', 'peel', 'trim', 'drain', 'strain', 'season', 'marinate',
  'knead', 'roll', 'shape', 'score', 'brush', 'glaze', 'blanch', 'emulsify',
  'flambe', 'flambé', 'smother', 'brûlée', 'temper', 'proof', 'ferment',
  'smoke', 'cure', 'pickle', 'brine', 'rest', 'plate', 'garnish', 'serve',
  'transfer', 'flip', 'remove', 'add', 'pour', 'drizzle', 'sprinkle',
  'spread', 'layer', 'arrange', 'cover', 'uncover', 'strain', 'melt',
  'cream', 'beat', 'whip', 'sift', 'dissolve',
])

export type TextSegment = { text: string; bold: boolean }

export function highlightVerbs(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  // Split on word boundaries, preserving the separators
  const words = text.split(/(\s+|[,;.!?()]+)/)

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-zà-ü-]/g, '')
    if (clean && ACTION_VERBS.has(clean)) {
      segments.push({ text: word, bold: true })
    } else {
      // Merge with previous non-bold segment if possible
      if (segments.length > 0 && !segments[segments.length - 1].bold) {
        segments[segments.length - 1].text += word
      } else {
        segments.push({ text: word, bold: false })
      }
    }
  }

  return segments
}

/**
 * Phase labels and colors
 */
export const PHASE_META = {
  prep: { label: 'Prep', color: '#7B93A8', bg: 'rgba(123, 147, 168, 0.08)' },
  cook: { label: 'Cook', color: '#C4652A', bg: 'rgba(196, 101, 42, 0.08)' },
  finish: { label: 'Finish', color: '#6B8E5A', bg: 'rgba(107, 142, 90, 0.08)' },
}
