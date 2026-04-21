// ============================================================================
// JSON-LD schema.org/Recipe extraction
// ----------------------------------------------------------------------------
// Nearly every major recipe site (NYT Cooking, Bon Appétit, Serious Eats,
// Food52, King Arthur, Smitten Kitchen, most WordPress food blogs) publishes
// schema.org/Recipe structured data as JSON-LD in the HTML. This is the
// source of truth for the recipe — using it directly eliminates the class of
// "ingredient got dropped" bugs that arise when Claude has to re-parse stripped
// HTML text.
// ----------------------------------------------------------------------------

export type JsonLdRecipe = {
  name: string
  description: string | null
  cuisine: string | null
  author: string | null
  yield: string | number | null
  totalMinutes: number | null
  prepMinutes: number | null
  cookMinutes: number | null
  ingredients: string[]
  steps: string[]
  image: string | null
}

// Parse ISO 8601 duration like "PT1H30M" → 90 minutes
function parseDuration(s: unknown): number | null {
  if (typeof s !== 'string') return null
  const m = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i)
  if (!m) return null
  const h = parseInt(m[1] || '0', 10)
  const min = parseInt(m[2] || '0', 10)
  const sec = parseInt(m[3] || '0', 10)
  const total = h * 60 + min + Math.round(sec / 60)
  return total > 0 ? total : null
}

// Strip HTML tags + decode common entities from instruction text
function cleanText(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type Unknown = Record<string, unknown>

function asArray<T = unknown>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[]
  if (x === undefined || x === null) return []
  return [x as T]
}

function typeMatches(value: unknown, target: string): boolean {
  if (typeof value === 'string') return value.toLowerCase() === target.toLowerCase()
  if (Array.isArray(value)) return value.some(v => typeof v === 'string' && v.toLowerCase() === target.toLowerCase())
  return false
}

// Flatten @graph / nested structures to find a Recipe node
function findRecipeNode(node: unknown): Unknown | null {
  if (!node || typeof node !== 'object') return null
  const obj = node as Unknown
  if (typeMatches(obj['@type'], 'Recipe')) return obj

  // @graph is an array of nodes, one of which is the Recipe
  if (Array.isArray(obj['@graph'])) {
    for (const child of obj['@graph']) {
      const found = findRecipeNode(child)
      if (found) return found
    }
  }

  // Some sites nest under "mainEntity"
  if (obj.mainEntity) {
    const found = findRecipeNode(obj.mainEntity)
    if (found) return found
  }

  // If this node is itself an array of nodes
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findRecipeNode(child)
      if (found) return found
    }
  }

  return null
}

function parseInstructions(raw: unknown): string[] {
  const out: string[] = []
  const walk = (x: unknown) => {
    if (!x) return
    if (typeof x === 'string') {
      // Some sites pack multiple steps as numbered paragraphs in one string
      const text = cleanText(x)
      if (text) out.push(text)
      return
    }
    if (Array.isArray(x)) { x.forEach(walk); return }
    if (typeof x !== 'object') return
    const o = x as Unknown
    // HowToStep
    if (typeMatches(o['@type'], 'HowToStep')) {
      const text = cleanText(o.text || o.name)
      if (text) out.push(text)
      return
    }
    // HowToSection: has itemListElement: HowToStep[]
    if (typeMatches(o['@type'], 'HowToSection')) {
      walk(o.itemListElement)
      return
    }
    // Fallback: look for text or name
    const text = cleanText(o.text || o.name || o.description)
    if (text) out.push(text)
  }
  walk(raw)
  return out
}

function parseIngredients(raw: unknown): string[] {
  const out: string[] = []
  const walk = (x: unknown) => {
    if (!x) return
    if (typeof x === 'string') {
      const s = cleanText(x)
      if (s) out.push(s)
      return
    }
    if (Array.isArray(x)) { x.forEach(walk); return }
  }
  walk(raw)
  return out
}

function parseAuthor(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw.trim() || null
  if (Array.isArray(raw)) {
    for (const a of raw) {
      const name = parseAuthor(a)
      if (name) return name
    }
    return null
  }
  if (typeof raw === 'object') {
    const n = (raw as Unknown).name
    return typeof n === 'string' ? n.trim() || null : null
  }
  return null
}

function parseYield(raw: unknown): string | number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') return raw.trim() || null
  if (Array.isArray(raw)) {
    for (const v of raw) {
      const parsed = parseYield(v)
      if (parsed !== null) return parsed
    }
  }
  return null
}

function parseImage(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) {
    for (const v of raw) {
      const s = parseImage(v)
      if (s) return s
    }
    return null
  }
  if (typeof raw === 'object') {
    const url = (raw as Unknown).url
    if (typeof url === 'string') return url
  }
  return null
}

function parseCuisine(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw.trim() || null
  if (Array.isArray(raw)) {
    for (const v of raw) {
      const s = parseCuisine(v)
      if (s) return s
    }
  }
  return null
}

/**
 * Extract a schema.org/Recipe from an HTML document.
 * Returns null if no valid Recipe JSON-LD block is found.
 */
export function extractJsonLdRecipe(html: string): JsonLdRecipe | null {
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(html)) !== null) {
    const raw = match[1].trim()
    if (!raw) continue
    let parsed: unknown
    try {
      // Some pages HTML-escape quotes inside JSON-LD; attempt direct parse first
      parsed = JSON.parse(raw)
    } catch {
      // Try removing common junk (trailing commas, stray newlines)
      try {
        const cleaned = raw.replace(/,(\s*[}\]])/g, '$1')
        parsed = JSON.parse(cleaned)
      } catch {
        continue
      }
    }

    const recipeNode = findRecipeNode(parsed)
    if (!recipeNode) continue

    const ingredients = parseIngredients(recipeNode.recipeIngredient || recipeNode.ingredients)
    const steps = parseInstructions(recipeNode.recipeInstructions)

    // Must have at least some ingredients and steps to be usable
    if (ingredients.length === 0 || steps.length === 0) continue

    const name = cleanText(recipeNode.name) || cleanText(recipeNode.headline)
    if (!name) continue

    return {
      name,
      description: cleanText(recipeNode.description) || null,
      cuisine: parseCuisine(recipeNode.recipeCuisine),
      author: parseAuthor(recipeNode.author),
      yield: parseYield(recipeNode.recipeYield),
      totalMinutes: parseDuration(recipeNode.totalTime),
      prepMinutes: parseDuration(recipeNode.prepTime),
      cookMinutes: parseDuration(recipeNode.cookTime),
      ingredients,
      steps,
      image: parseImage(recipeNode.image),
    }
  }

  return null
}

/**
 * Coerce a recipeYield string like "4 servings" or "Serves 6" to a number.
 * Returns null if no number found.
 */
export function yieldToNumber(y: string | number | null): number | null {
  if (y === null) return null
  if (typeof y === 'number') return y
  const m = y.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}
