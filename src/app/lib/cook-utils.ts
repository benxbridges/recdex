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

// Number tokens that scaleAmount can handle: mixed fractions, plain fractions,
// decimals, whole+unicode fraction, bare unicode fraction, plain integers.
const STEP_NUM_RE = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\.\\d+|\\d+\\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\\d+)`

// Units that genuinely scale with servings. Excludes °F/°C, "minutes",
// "inch", and bare counts like "3 eggs" (no unit) — those don't belong here.
const STEP_SCALABLE_UNIT_RE = `(?:tbsp|tablespoons?|tsp|teaspoons?|cups?|oz|ounces?|lbs?|pounds?|grams?|g|kg|kilograms?|ml|milliliters?|l|liters?|litres?|pinch(?:es)?|dash(?:es)?|cans?|sticks?|cloves?)`

/**
 * Scale measurement amounts embedded in step prose.
 * "Add 1 tbsp honey" → "Add 2 tbsp honey" at 2x. Leaves bare numbers alone
 * ("3 eggs", "350°F", "10 minutes" don't get touched).
 */
export function scaleStepProse(text: string, factor: number): string {
  if (!text || factor === 1) return text
  const re = new RegExp(`(${STEP_NUM_RE})\\s+(${STEP_SCALABLE_UNIT_RE})\\b`, 'gi')
  return text.replace(re, (_full, num: string, unit: string) => {
    const scaled = scaleAmount(num.trim(), factor)
    return `${scaled} ${unit}`
  })
}

/**
 * Did the prose just before `pos` already include a measurement?
 * Used to decide whether to append "(2 tbsp)" after an ingredient name —
 * if the step already says "1 tbsp honey" we don't need to also annotate it.
 */
export function hasMeasurementBefore(text: string, pos: number): boolean {
  if (pos <= 0) return false
  const before = text.slice(Math.max(0, pos - 40), pos)
  const re = new RegExp(`(${STEP_NUM_RE})\\s+(${STEP_SCALABLE_UNIT_RE})\\s+(?:of\\s+)?$`, 'i')
  return re.test(before)
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
 * Highlight the first "core action sentence" — the first sentence containing
 * an action verb. Returns segments where that sentence is bold, rest is normal.
 */
export function highlightCoreSentence(text: string): TextSegment[] {
  // Split into sentences: on ". " followed by uppercase, or ".\n", or end
  const sentenceBreaks = text.split(/(?<=\.)\s+(?=[A-Z])/)

  for (let i = 0; i < sentenceBreaks.length; i++) {
    const sentence = sentenceBreaks[i]
    const words = sentence.toLowerCase().replace(/[^a-zà-ü\s-]/g, ' ').split(/\s+/)
    const hasAction = words.some(w => ACTION_VERBS.has(w))

    if (hasAction) {
      const segments: TextSegment[] = []
      // Everything before this sentence
      const before = sentenceBreaks.slice(0, i).join(' ')
      if (before) segments.push({ text: before + ' ', bold: false })
      // The action sentence itself
      segments.push({ text: sentence, bold: true })
      // Everything after
      const after = sentenceBreaks.slice(i + 1).join(' ')
      if (after) segments.push({ text: ' ' + after, bold: false })
      return segments
    }
  }

  // No action verb found — return all as normal
  return [{ text, bold: false }]
}

/**
 * Parse a free-form ingredient string like "1 cup all-purpose flour"
 * into structured { name, amount, unit, notes }. Tolerant of fractions,
 * ranges, and unicode fractions. Used by the "add missing ingredient"
 * feature in cook mode so users can quickly add what extraction missed.
 */
const INGREDIENT_UNITS = new Set([
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
  'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
  'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'litre', 'litres',
  'pinch', 'pinches', 'dash', 'dashes', 'handful', 'handfuls',
  'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
  'head', 'heads', 'stalk', 'stalks', 'leaf', 'leaves', 'sprig', 'sprigs',
  'bunch', 'bunches', 'can', 'cans', 'pkg', 'package', 'packages',
  'stick', 'sticks', 'bottle', 'bottles', 'jar', 'jars',
])

const UNIT_CANONICAL: Record<string, string> = {
  cup: 'cups', cups: 'cups',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lbs', lbs: 'lbs', pound: 'lbs', pounds: 'lbs',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'L', liter: 'L', liters: 'L', litre: 'L', litres: 'L',
}

export function parseIngredientString(raw: string): { name: string; amount: string; unit: string; notes: string } {
  const input = raw.trim()
  if (!input) return { name: '', amount: '', unit: '', notes: '' }

  // Strip trailing "(optional)" / ", optional" etc. into notes
  let notes = ''
  const parenMatch = input.match(/\(([^)]+)\)\s*$/)
  const stripped = parenMatch ? input.replace(parenMatch[0], '').trim() : input
  if (parenMatch) notes = parenMatch[1].trim()

  // Amount regex: unicode fraction, "1 1/2", "1/2", "1.5", "1-2", plain "1"
  const amountRe = /^((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:[\u00BC-\u00BE\u2150-\u215E])|(?:\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?))\b\s*/
  const amountMatch = stripped.match(amountRe)
  const amount = amountMatch ? amountMatch[1].replace(/\s+/g, ' ').trim() : ''
  const afterAmount = amountMatch ? stripped.slice(amountMatch[0].length).trim() : stripped

  // Unit is the first token if it's in the known list
  const tokens = afterAmount.split(/\s+/)
  let unit = ''
  let nameStart = 0
  if (tokens.length > 0) {
    const firstLower = tokens[0].toLowerCase().replace(/[.,;]/g, '')
    if (INGREDIENT_UNITS.has(firstLower)) {
      unit = UNIT_CANONICAL[firstLower] || firstLower
      nameStart = 1
    }
  }

  // "of" filler after unit ("2 cups of flour") — skip
  if (nameStart < tokens.length && tokens[nameStart]?.toLowerCase() === 'of') nameStart++

  const name = tokens.slice(nameStart).join(' ').trim()

  // If no amount and no unit, treat whole thing as name
  if (!amount && !unit) return { name: input, amount: '', unit: '', notes }

  return { name, amount, unit, notes }
}

/**
 * Parse a timer duration from step text — safety net for when the LLM missed it.
 *
 * Handles:
 *  - "bake 25 minutes", "25 min", "25-minute"
 *  - "simmer 10-15 minutes" → 12 (middle of range)
 *  - "about an hour" → 60, "a couple minutes" → 2
 *  - "4 minutes per side" (assumes 2 sides unless specified) → 8
 *  - "1 hr 30 min" → 90
 *  - Multiple durations in one step → returns the LONGEST
 *
 * Returns null if no duration is mentioned, so callers can distinguish
 * "no timer needed" from "timer was 0".
 */
const WORD_NUMBERS: Record<string, number> = {
  'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'couple': 2, 'few': 3, 'several': 4, 'half': 0.5,
}

function numFromWord(word: string): number | null {
  return WORD_NUMBERS[word.toLowerCase()] ?? null
}

export function parseTimerFromText(text: string): number | null {
  if (!text) return null
  // Strip constructs that would otherwise produce double-matches:
  // "half an hour" and "half hour" → replace with "__HALF_HOUR__" sentinel so
  // the word-number regex doesn't also catch the "an hour" inside.
  let lower = text.toLowerCase()
  let halfHourCount = 0
  lower = lower.replace(/\bhalf\s+(?:an?\s+)?hour\b/g, () => { halfHourCount++; return '__HALF_HOUR__' })

  const candidates: number[] = []
  if (halfHourCount > 0) candidates.push(30)

  // "X to Y minutes/hours", "X-Y min", "X–Y minutes"
  const rangeRe = /(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(hr|hrs|hour|hours|min|mins|minute|minutes|sec|secs|second|seconds)\b/g
  for (const m of lower.matchAll(rangeRe)) {
    const lo = parseFloat(m[1]), hi = parseFloat(m[2])
    const unit = m[3]
    const mid = (lo + hi) / 2
    const mins = unit.startsWith('h') ? mid * 60 : unit.startsWith('s') ? mid / 60 : mid
    candidates.push(mins)
  }

  // "X hr Y min" combined form
  const combinedRe = /(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours)\s*(?:and\s*)?(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)/g
  for (const m of lower.matchAll(combinedRe)) {
    candidates.push(parseFloat(m[1]) * 60 + parseFloat(m[2]))
  }

  // "X hours", "X minutes", "X seconds" (plain)
  const plainRe = /(?:^|[^\d.])(\d+(?:\.\d+)?)\s*(hr|hrs|hour|hours|min|mins|minute|minutes|sec|secs|second|seconds)\b/g
  for (const m of lower.matchAll(plainRe)) {
    const n = parseFloat(m[1])
    const unit = m[2]
    const mins = unit.startsWith('h') ? n * 60 : unit.startsWith('s') ? n / 60 : n
    candidates.push(mins)
  }

  // Word-number forms: "an hour", "a couple minutes"
  const wordRe = /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|couple|few|several)\s+(?:of\s+)?(hour|hours|min|mins|minute|minutes)\b/g
  for (const m of lower.matchAll(wordRe)) {
    const n = numFromWord(m[1])
    if (n === null) continue
    const unit = m[2]
    candidates.push(unit.startsWith('h') ? n * 60 : n)
  }

  // "a minute or two" → 2
  if (/\ba\s+minute\s+or\s+two\b/.test(lower)) candidates.push(2)

  // "per side" multiplier — if any time candidate exists AND "per side" in text
  // assume 2 sides unless a count is given
  if (/\bper\s+side\b/.test(lower) && candidates.length > 0) {
    const sidesMatch = lower.match(/(\d+)\s+sides?/)
    const sides = sidesMatch ? parseInt(sidesMatch[1], 10) : 2
    // Apply multiplier only to the first time we find (the "per side" time)
    const idx = candidates.length > 0 ? candidates.length - 1 : -1
    if (idx >= 0) candidates[idx] = candidates[idx] * sides
  }

  if (candidates.length === 0) return null
  // Return the longest candidate, rounded to nearest minute
  const longest = Math.max(...candidates)
  if (longest <= 0) return null
  return Math.round(longest)
}

/**
 * Given a step, return a timer value: prefer the recipe's declared timer,
 * fall back to regex-parsing the step text. Returns null only if both
 * sources agree there's no timer.
 */
export function resolveTimerMinutes(step: { text: string; timer_minutes?: number | null }): number | null {
  if (step.timer_minutes != null && step.timer_minutes > 0) return step.timer_minutes
  return parseTimerFromText(step.text)
}

/**
 * Does this step want the cook to wait overnight (or for many hours)?
 * Used to suppress useless 8-hour timers and to surface a "start the night
 * before" banner on the recipe.
 */
export function isOvernightStep(step: { text: string; timer_minutes?: number | null }): boolean {
  const text = step.text.toLowerCase()
  if (/\bover\s?night\b/.test(text)) return true
  if (/\b(?:8|10|12|24)\s*\+?\s*hours?\b/.test(text)) return true
  if (classifyStep(step.text) !== 'passive') return false
  const minutes = resolveTimerMinutes(step)
  return minutes !== null && minutes >= 240
}

export function recipeRequiresOvernight(steps: { text: string; timer_minutes?: number | null }[] | null | undefined): boolean {
  if (!steps) return false
  return steps.some(isOvernightStep)
}

/**
 * Phase labels and colors
 */
export const PHASE_META: Record<string, { label: string; color: string; bg: string }> = {
  prep: { label: 'Prep', color: '#7B93A8', bg: 'rgba(123, 147, 168, 0.08)' },
  cook: { label: 'Cook', color: '#C4652A', bg: 'rgba(196, 101, 42, 0.08)' },
  passive: { label: 'Waiting', color: '#7B93A8', bg: 'rgba(123, 147, 168, 0.06)' },
}
