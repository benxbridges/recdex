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
 * Classify whether a recipe step is "prep" or "cook".
 *
 * Simple rule: **cook = involves heat**. Everything else is prep.
 * - "Boil water" → cook (heat)
 * - "Cook pasta then drain" → cook (heat)
 * - "Whisk eggs in a bowl" → prep (no heat)
 * - "Season chicken and set aside" → prep (no heat)
 * - "Preheat the oven" → prep (setup for heat, not cooking yet)
 * - "Serve with garnish" → prep (no heat — we don't use 'finish')
 */
const PASSIVE_PATTERNS = [
  // "let it rest/sit/cool/stand/rise/chill/marinate/set/firm/refrigerate/soak/thaw/drain"
  /\blet\s+(it\s+)?(rest|sit|cool|stand|rise|chill|marinate|set|firm|refrigerate|soak|thaw|drain)\b/i,
  // "refrigerate/chill/freeze/cool/marinate/rest/soak for/until/overnight"
  /\b(refrigerate|chill|freeze|cool|marinate|rest|soak)\s+(for|until|overnight)\b/i,
  // "set aside for"
  /\bset aside for\b/i,
  // "allow to cool/rest/rise/set/firm"
  /\ballow to\s+(cool|rest|rise|set|firm)\b/i,
  // "cover and let/leave/refrigerate/chill/rest"
  /\bcover and\s+(let|leave|refrigerate|chill|rest)\b/i,
  // "wait/waiting for/until"
  /\b(wait|waiting)\s+(for|until)\b/i,
]

const HEAT_PATTERNS = [
  // Direct heat verbs — if the step says "cook", "bake", "fry", etc., it's cook
  // Excludes "warm" and "brown" when used as adjectives (warm milk, brown sugar)
  /\b(heat|cook|bake|roast|grill|fry|sauté|saute|sear|broil|braise|simmer|boil|steam|poach|toast|caramelize|reduce|deglaze|stir-fry|flambe|flambé|smoke|blanch|melt|char)\b/i,
  /\bbrown\b(?!\s+(sugar|butter|rice|bread|bag|paper|gravy|sauce|onion|mustard|ale|stock|broth))/i,
  /\bwarm\b(?!\s+(water|milk|place|spot|towel|broth|stock|tortillas?|noodles?|liquid))/i,
  // Equipment that ALWAYS implies heat (oven, stove, burner, flame) + time context
  // Excludes pan/pot/skillet/wok — those are just containers, and "cool in pan" is not cooking
  /\b(oven|stove|burner|flame)\b.*\b(minutes?|hours?|until)\b/i,
  // Explicit oven/grill transfers
  /\b(transfer to|place in|put in)\b.*\b(oven|grill|smoker|hot)\b/i,
]

export function classifyStep(text: string): 'prep' | 'cook' | 'passive' {
  // Passive first — waiting steps take priority over heat detection
  // (e.g. "let cool" should be passive, not cook)
  for (const p of PASSIVE_PATTERNS) {
    if (p.test(text)) return 'passive'
  }
  // If any heat verb or heat-context pattern matches → cook
  for (const p of HEAT_PATTERNS) {
    if (p.test(text)) return 'cook'
  }
  // Everything else is prep — chopping, mixing, seasoning, serving, plating
  return 'prep'
}

/**
 * Find prep→cook transition points.
 *
 * Only shows a divider when there are 2+ consecutive prep steps at the start,
 * followed by a cook step. This tells the user: "get all this ready, then
 * you'll start cooking."
 *
 * No "finish" dividers — too precious and recipe-specific.
 * No dividers for short recipes (< 4 steps) or all-cook recipes.
 */
export function findPhaseBreaks(steps: { text: string }[]): { index: number; fromPhase: string; toPhase: string }[] {
  if (steps.length < 4) return []

  const phases = steps.map(s => classifyStep(s.text))

  // Find where the initial prep section ends (passive counts as non-cook too)
  let prepEndIndex = 0
  while (prepEndIndex < phases.length && (phases[prepEndIndex] === 'prep' || phases[prepEndIndex] === 'passive')) {
    prepEndIndex++
  }

  // Only show if there are 2+ prep steps at the start, followed by cook
  if (prepEndIndex >= 2 && prepEndIndex < phases.length) {
    return [{ index: prepEndIndex, fromPhase: 'prep', toPhase: 'cook' }]
  }

  return []
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
export const PHASE_META: Record<string, { label: string; color: string; bg: string }> = {
  prep: { label: 'Prep', color: '#7B93A8', bg: 'rgba(123, 147, 168, 0.08)' },
  cook: { label: 'Cook', color: '#C4652A', bg: 'rgba(196, 101, 42, 0.08)' },
  passive: { label: 'Waiting', color: '#7B93A8', bg: 'rgba(123, 147, 168, 0.06)' },
}
