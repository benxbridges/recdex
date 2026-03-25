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
  'bring to room temperature', 'whisk together', 'toss together',
  'thinly slice', 'pat dry', 'set aside', 'cut into',
  'stir in', 'mix in', 'fold in',
  'chop', 'dice', 'mince', 'slice', 'peel', 'wash', 'rinse',
  'measure', 'combine', 'mix', 'whisk', 'knead', 'roll',
  'prepare', 'preheat', 'marinate',
  'soak', 'season', 'coat', 'line a', 'grease',
  'zest', 'trim', 'devein', 'deseed', 'julienne', 'grate',
  'crush', 'mash',
]

const COOK_KEYWORDS = [
  'cook until', 'cook for', 'add to the pan', 'add to the pot',
  'place in the oven', 'deep fry', 'pan fry', 'stir-fry',
  'over medium', 'over high', 'over low',
  'heat', 'sauté', 'saute', 'boil', 'simmer', 'bake', 'roast',
  'fry', 'grill', 'braise', 'steam', 'stir', 'brown',
  'reduce', 'flip', 'blanch', 'poach', 'sear', 'deglaze',
  'toast', 'caramelize', 'broil', 'char',
]

const FINISH_KEYWORDS = [
  'serve immediately', 'slice and serve', 'remove from heat and let',
  'cool completely', 'sprinkle on top', 'finish with',
  'divide among', 'ladle into', 'pour over',
  'let rest', 'let cool', 'rest for',
  'plate', 'serve', 'garnish', 'drizzle', 'top with',
  'enjoy', 'transfer to a serving',
]

// Build regex patterns with word boundaries for accurate matching
function buildPatterns(keywords: string[]): RegExp[] {
  return keywords.map(kw => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))
}

const PREP_PATTERNS = buildPatterns(PREP_KEYWORDS)
const COOK_PATTERNS = buildPatterns(COOK_KEYWORDS)
const FINISH_PATTERNS = buildPatterns(FINISH_KEYWORDS)

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

  for (const pat of PREP_PATTERNS) {
    if (pat.test(text)) prepScore += 2
  }
  for (const pat of COOK_PATTERNS) {
    if (pat.test(text)) cookScore += 2
  }
  for (const pat of FINISH_PATTERNS) {
    if (pat.test(text)) finishScore += 2
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
