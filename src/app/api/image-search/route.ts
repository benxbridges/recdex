import { NextRequest, NextResponse } from 'next/server'

// Connectors / articles — stripped entirely (carry no visual meaning)
const CONNECTORS = new Set([
  // Italian
  'al', 'alla', 'alle', 'allo', 'ai', 'agli', 'di', 'del', 'della',
  'delle', 'dello', 'dei', 'degli', 'e',
  // French
  'au', 'aux', 'du', 'des', 'la', 'le', 'les', 'et', 'à',
  // Spanish
  'el', 'los', 'las', 'del', 'y',
  // English
  'the', 'a', 'an',
])

// Junk adjectives that don't change what the dish LOOKS like
const JUNK_MODIFIERS = new Set([
  'quick', 'easy', 'best', 'classic', 'simple', 'perfect', 'ultimate',
  'homemade', 'one', 'no', 'our', 'favorite', 'favourite', 'traditional',
  'authentic', 'real', 'proper', 'basic', 'everyday',
])

// Words that split "main dish" from "accompaniments"
// We keep both sides, but the main dish gets quoted for priority
const SPLIT_WORDS = new Set([
  'with', 'and', 'over', 'on', 'in', 'con', 'de', 'en',
])

/**
 * Build a food-photography-optimized search query from a recipe title.
 *
 * Strategy:
 * 1. Strip junk adjectives (easy, classic, best) — don't change the photo
 * 2. Strip connectors/articles (al, della, au, the) — noise for search
 * 3. Translate common foreign ingredient words to English
 * 4. Split at "with/and/over" → quote the main dish for priority, keep accompaniments
 * 5. Append "food dish" to anchor toward food photography
 *
 * Examples:
 *   "Risotto al Limone"                                  → "risotto lemon food dish"
 *   "Crème Brûlée au Chocolat"                           → "creme brulee chocolate food dish"
 *   "Slow-Roasted Chicken Thighs with Lemon and Olives"  → "slow roasted chicken thighs lemon olives food dish"
 *   "Classic Chocolate Chip Cookies"                      → "chocolate chip cookies food dish"
 *   "Pasta alla Norma"                                    → "pasta norma food dish"
 *   "Sheet Pan Salmon"                                    → "sheet pan salmon food dish"
 *   "Chicken Tikka Masala"                                → "chicken tikka masala food dish"
 */

// Common foreign food words → English (helps Unsplash find the right photos)
const TRANSLATIONS: Record<string, string> = {
  'limone': 'lemon', 'cioccolato': 'chocolate', 'chocolat': 'chocolate',
  'pollo': 'chicken', 'pesce': 'fish', 'carne': 'meat', 'funghi': 'mushroom',
  'pomodoro': 'tomato', 'formaggio': 'cheese', 'aglio': 'garlic',
  'cipolla': 'onion', 'patate': 'potato', 'verdure': 'vegetables',
  'poulet': 'chicken', 'boeuf': 'beef', 'poisson': 'fish',
  'citron': 'lemon', 'fromage': 'cheese', 'champignons': 'mushroom',
  'tomate': 'tomato', 'pommes': 'apple', 'cerises': 'cherry',
  'fraises': 'strawberry', 'pomme': 'apple', 'noci': 'walnut',
  'nocciole': 'hazelnut', 'pistacchio': 'pistachio', 'mandorle': 'almond',
}

function extractDishQuery(title: string): string {
  const cleaned = title
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/-/g, ' ')
    .toLowerCase()
    .trim()

  const words = cleaned.split(/\s+/)

  // 1. Remove junk modifiers and connectors, translate foreign words
  const meaningful: string[] = []
  for (const word of words) {
    if (JUNK_MODIFIERS.has(word)) continue
    if (CONNECTORS.has(word)) continue
    meaningful.push(TRANSLATIONS[word] || word)
  }

  if (meaningful.length === 0) return `${title} food dish`

  // 2. Find split point (with/and/over) to identify main dish vs accompaniments
  let splitIdx = -1
  for (let i = 0; i < meaningful.length; i++) {
    if (SPLIT_WORDS.has(meaningful[i])) {
      splitIdx = i
      break
    }
  }

  let query: string
  if (splitIdx > 0) {
    // Main dish gets priority, accompaniments follow
    const mainDish = meaningful.slice(0, splitIdx).join(' ')
    const extras = meaningful.slice(splitIdx + 1).filter(w => !SPLIT_WORDS.has(w)).join(' ')
    query = `${mainDish} ${extras}`.trim()
  } else {
    query = meaningful.join(' ')
  }

  // 3. Cap total length — too many words dilutes search
  const finalWords = query.split(/\s+/).slice(0, 6)
  return `${finalWords.join(' ')} food dish`
}

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get('q')
  if (!rawQuery) return NextResponse.json({ images: [] })

  const accessKey = req.nextUrl.searchParams.get('key') || process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.warn('[image-search] UNSPLASH_ACCESS_KEY not set')
    return NextResponse.json({ images: [], error: 'no_key' })
  }

  // Use smart extraction unless the query looks like it's already manual (short / user-typed)
  const query = rawQuery.split(/\s+/).length <= 2 ? rawQuery : extractDishQuery(rawQuery)

  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', '6')
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('content_filter', 'high')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })

    if (!res.ok) return NextResponse.json({ images: [] })

    const data = await res.json()
    const images = (data.results || []).map((photo: { urls: { regular: string; small: string }; user: { name: string } }) => ({
      url: photo.urls.regular,
      thumb: photo.urls.small,
      credit: photo.user.name,
    }))

    return NextResponse.json({ images, query }) // return processed query for debugging
  } catch {
    return NextResponse.json({ images: [] })
  }
}
