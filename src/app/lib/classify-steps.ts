// ===== STEP PHASE CLASSIFICATION =====
// Classifies flat recipe steps into Prep / Cook / Finish sections
// using keyword heuristics + positional bias + monotonic enforcement.

export type CookingPhase = 'prep' | 'cook' | 'finish'

export type StepWithPhase = {
  step: number
  text: string
  timer_minutes: number | null
  phase?: CookingPhase
}

export type SectionedStep = StepWithPhase & {
  phase: CookingPhase
  originalIndex: number
}

export type StepSection = {
  phase: CookingPhase
  label: string
  steps: SectionedStep[]
}

// ===== KEYWORD LISTS =====
// Multi-word phrases first, then single words.
// All matched with word boundaries to avoid false positives (e.g. "reserve" ≠ "serve").

const PREP_KEYWORDS = [
  // Multi-word phrases (matched first, higher specificity)
  'bring to room temperature', 'whisk together', 'toss together',
  'stir together', 'mix together', 'combine the',
  'thinly slice', 'pat dry', 'set aside', 'cut into',
  'stir in', 'mix in', 'fold in',
  'wrap in plastic', 'wrap in cling', 'wrap tightly', 'wrap dough',
  'refrigerate until', 'refrigerate for', 'chill until', 'chill for',
  'transfer to the fridge', 'place in the fridge',
  'line a', 'line the', 'grease and flour', 'butter and flour',
  // Single words
  'chop', 'dice', 'mince', 'slice', 'peel', 'wash', 'rinse',
  'measure', 'combine', 'mix', 'whisk', 'knead', 'roll out',
  'prepare', 'preheat', 'marinate',
  'soak', 'season', 'coat', 'grease',
  'zest', 'trim', 'devein', 'deseed', 'julienne', 'grate',
  'crush', 'mash', 'sift', 'cream', 'proof', 'shape',
  'portion', 'dust', 'flour', 'refrigerate', 'chill', 'wrap',
  'roll',
]

const COOK_KEYWORDS = [
  // Multi-word phrases
  'cook until', 'cook for', 'add to the pan', 'add to the pot',
  'place in the oven', 'transfer to the oven', 'put in the oven',
  'deep fry', 'pan fry', 'stir-fry',
  'over medium', 'over high', 'over low',
  'bake for', 'bake until', 'roast for', 'roast until',
  'blind bake', 'par-bake',
  // Single words
  'heat', 'sauté', 'saute', 'boil', 'simmer', 'bake', 'roast',
  'fry', 'grill', 'braise', 'steam', 'stir', 'brown',
  'reduce', 'flip', 'blanch', 'poach', 'sear', 'deglaze',
  'toast', 'caramelize', 'broil', 'char',
]

const FINISH_KEYWORDS = [
  // Multi-word phrases
  'serve immediately', 'slice and serve', 'remove from heat and let',
  'cool completely', 'cool on a wire', 'cool in the pan',
  'sprinkle on top', 'finish with',
  'divide among', 'ladle into', 'pour over',
  'let rest', 'let cool', 'rest for',
  'transfer to a wire rack', 'transfer to a serving', 'transfer to a plate',
  'dust with powdered', 'dust with icing', 'unmold',
  // Single words
  'plate', 'serve', 'garnish', 'drizzle', 'top with',
  'enjoy', 'decorate', 'frost', 'glaze',
]

// Build regex patterns with word boundaries for accurate matching.
// Each pattern carries a weight: multi-word phrases score higher (3) than single words (2)
// to resolve conflicts like "stir together" (prep) vs "stir" (cook).
type WeightedPattern = { regex: RegExp; weight: number }

function buildWeightedPatterns(keywords: string[]): WeightedPattern[] {
  return keywords.map(kw => ({
    regex: new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
    weight: kw.includes(' ') ? 3 : 2,
  }))
}

const PREP_PATTERNS = buildWeightedPatterns(PREP_KEYWORDS)
const COOK_PATTERNS = buildWeightedPatterns(COOK_KEYWORDS)
const FINISH_PATTERNS = buildWeightedPatterns(FINISH_KEYWORDS)

const PHASE_ORDER: CookingPhase[] = ['prep', 'cook', 'finish']
const PHASE_LABELS: Record<CookingPhase, string> = {
  prep: 'Prep',
  cook: 'Cook',
  finish: 'Finish',
}

// ===== SCORING =====

function scorePhase(text: string, index: number, total: number): CookingPhase {
  let prepScore = 0
  let cookScore = 0
  let finishScore = 0

  for (const { regex, weight } of PREP_PATTERNS) {
    if (regex.test(text)) prepScore += weight
  }
  for (const { regex, weight } of COOK_PATTERNS) {
    if (regex.test(text)) cookScore += weight
  }
  for (const { regex, weight } of FINISH_PATTERNS) {
    if (regex.test(text)) finishScore += weight
  }

  // Positional bias
  const position = index / Math.max(total - 1, 1)
  if (position <= 0.3) prepScore += 1      // first 30%
  if (position >= 0.8) finishScore += 1     // last 20%

  // Default to cook if no strong signal
  if (prepScore === 0 && cookScore === 0 && finishScore === 0) {
    cookScore = 1
  }

  // Cook wins ties — it's the most common phase and safest default
  if (cookScore >= prepScore && cookScore >= finishScore) return 'cook'
  if (prepScore > cookScore && prepScore >= finishScore) return 'prep'
  return 'finish'
}

// ===== MAIN CLASSIFIER =====

export function classifySteps(steps: StepWithPhase[]): StepSection[] {
  if (!steps || steps.length === 0) return []

  // ≤2 steps: skip sectioning
  if (steps.length <= 2) {
    return [{
      phase: 'cook',
      label: 'Cook',
      steps: steps.map((s, i) => ({ ...s, phase: 'cook' as CookingPhase, originalIndex: i })),
    }]
  }

  // Score each step
  const scored: SectionedStep[] = steps.map((s, i) => ({
    ...s,
    originalIndex: i,
    phase: s.phase || scorePhase(s.text, i, steps.length),
  }))

  // Monotonic enforcement: once we advance, never go back
  let maxPhaseIndex = 0
  for (const step of scored) {
    const phaseIdx = PHASE_ORDER.indexOf(step.phase)
    if (phaseIdx < maxPhaseIndex) {
      // Phase went backwards — keep at current max
      step.phase = PHASE_ORDER[maxPhaseIndex]
    } else {
      maxPhaseIndex = phaseIdx
    }
  }

  // Group into sections, omitting empty ones
  const sections: StepSection[] = []
  let currentPhase: CookingPhase | null = null
  let currentSteps: SectionedStep[] = []

  for (const step of scored) {
    if (step.phase !== currentPhase) {
      if (currentPhase !== null && currentSteps.length > 0) {
        sections.push({
          phase: currentPhase,
          label: PHASE_LABELS[currentPhase],
          steps: currentSteps,
        })
      }
      currentPhase = step.phase
      currentSteps = [step]
    } else {
      currentSteps.push(step)
    }
  }

  // Push last section
  if (currentPhase !== null && currentSteps.length > 0) {
    sections.push({
      phase: currentPhase,
      label: PHASE_LABELS[currentPhase],
      steps: currentSteps,
    })
  }

  return sections
}

// Get the phase color token name from theme
export function phaseColor(phase: CookingPhase): { color: string; bg: string } {
  switch (phase) {
    case 'prep': return { color: 'var(--c-blue)', bg: 'var(--c-blueBg)' }
    case 'cook': return { color: 'var(--c-accent)', bg: 'var(--c-accentBg)' }
    case 'finish': return { color: 'var(--c-green)', bg: 'var(--c-greenBg)' }
  }
}
