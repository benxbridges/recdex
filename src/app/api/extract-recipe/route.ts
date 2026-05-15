import { NextRequest, NextResponse } from 'next/server'
import { extractJsonLdRecipe, yieldToNumber, type JsonLdRecipe } from '@/app/lib/json-ld-recipe'
import { applyRateLimit, isUnsafeFetchTarget } from '@/app/lib/security'

// ===== PLATFORM HELPERS =====

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('?')[0]
    if (parsed.hostname.includes('youtube.com')) {
      return (
        parsed.searchParams.get('v') ||
        parsed.pathname.split('/').filter(Boolean).pop() ||
        null
      )
    }
  } catch { /* invalid URL */ }
  return null
}

function extractTikTokVideoId(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/video\/(\d+)/)
    return match?.[1] || null
  } catch { return null }
}

function extractInstagramShortcode(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
    return match?.[1] || null
  } catch { return null }
}

// ===== WEB PAGE SCRAPER =====

type FetchedPage = {
  text: string
  author: string | null
  jsonLd: JsonLdRecipe | null
}

async function fetchWebPage(url: string): Promise<FetchedPage | null> {
  // SSRF protection: never let user URLs hit private IP ranges, localhost, or
  // cloud metadata services. This must run after URL parsing in the caller too.
  if (await isUnsafeFetchTarget(url)) {
    console.warn('[extract] blocked unsafe fetch target')
    return null
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecDex/1.0; +https://recipeindex.org)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()

    // 1) Try JSON-LD first — the source of truth when present
    const jsonLd = extractJsonLdRecipe(html)

    // 2) Extract author (in case JSON-LD missed it)
    let author: string | null = jsonLd?.author || null
    if (!author) {
      const authorMeta = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']author["']/i)
      if (authorMeta) author = authorMeta[1]
      if (!author) {
        const siteNameMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
        if (siteNameMatch) author = siteNameMatch[1]
      }
    }

    // 3) Strip HTML for Claude fallback (only matters when JSON-LD missing)
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#\d+;/g, '')
      .replace(/&\w+;/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Much larger window — modern Claude handles it easily and long blog posts
    // are the #1 source of "ingredients got chopped" bugs.
    if (text.length > 60000) text = text.slice(0, 60000)
    if (text.length < 50 && !jsonLd) return null
    return { text, author, jsonLd }
  } catch (err) {
    console.log('[extract] Web page fetch failed:', err)
    return null
  }
}

// ===== CONTENT FETCHERS =====

async function fetchYouTubeContent(url: string): Promise<{ videoId: string | null; description: string | null }> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return { videoId: null, description: null }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return { videoId, description: null }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { videoId, description: null }
    const data = await res.json()
    const description = data.items?.[0]?.snippet?.description || null
    return { videoId, description }
  } catch {
    return { videoId, description: null }
  }
}

async function fetchTikTokCaption(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.title || null
  } catch { return null }
}

// ===== SHARED RULES USED IN EVERY EXTRACTION =====

const TIMER_RULES = `
TIMER EXTRACTION — CRITICAL. For each step, set "timer_minutes" to a number representing the cooking time that step requires. A missed timer means a burnt meal.
- "Bake for 25 minutes" → 25
- "Simmer 10-15 minutes" → 12 (middle of range; prefer middle for ranges)
- "About an hour" → 60
- "Cook until golden, ~5 min" → 5
- "5 minutes per side, 4 sides" → 20 (multiply)
- "4 minutes per side" (assume 2 sides unless specified) → 8
- "A few minutes" → 3
- "Couple minutes" → 2
- Steps with multiple times ("sauté 3 min, then simmer 10 min") → use the LONGEST time: 10
- Steps with no time ("chop the onion", "season to taste", "plate and serve") → null
- NEVER return null for a step that mentions any cooking duration.`

const INGREDIENT_RULES = `
INGREDIENT CAPTURE — CRITICAL. Every ingredient from the source MUST appear in your output. A missed ingredient means a broken recipe.
- If the source groups ingredients under headers ("For the sauce:", "For the dough:", "Garnish:"), FLATTEN them all into one flat list. Put the group name in the ingredient's "notes" field (e.g. notes: "for the sauce").
- Include every seasoning, garnish, and "to taste" item — salt, pepper, oil for frying, etc.
- "amount" must be a number string like "2" or "1/2" — never include the unit in amount. Empty string "" if no amount given.
- "unit" is the measurement unit ("cups", "tbsp", "tsp", "oz", "g", "lb", "ml", "L", "sprigs", "bunch", "leaves", "cloves", "stalks", "slices", "pieces", "heads", "whole", "large", "medium", "small", "pinch"). PRESERVE the unit from the source.
- "notes" is optional info: "room temperature", "divided", "or to taste", "fresh", "dried", "finely chopped", or the group header if from a grouped list.

SELF-CHECK: Before returning, count the ingredients in the source. Your output MUST have at least that many.`

// ===== CLAUDE FALLBACK PROMPT (used when JSON-LD not available) =====

const EXTRACTION_PROMPT = (platform: string, content: string) => `
You are extracting FACTUAL recipe information from ${platform === 'web' ? 'a recipe web page' : 'social media content'} and rewriting it in clear, original instructional language. Here is text from ${platform === 'web' ? 'a cooking website' : `a ${platform} ${platform === 'youtube' ? 'video (description and/or spoken transcript)' : 'caption'}`}:

---
${content.slice(0, 40000)}
---

Your task: Identify every factual element of the recipe (ingredients, quantities, temperatures, times, techniques), then write the recipe in your own neutral, instructional voice.

CRITICAL COPYRIGHT RULES:
- Extract ONLY factual information: ingredient names, amounts, temperatures, cooking times, and techniques
- REWRITE all instructions entirely in your own words in plain, neutral instructional language
- NEVER copy or closely paraphrase the creator's distinctive phrasing, personality, stories, or creative descriptions
- The description field should be YOUR brief factual summary of the dish
- Step text must be YOUR original instructional writing — not a transcription

Return a single JSON object with exactly these fields:
{
  "title": string (simple dish name — NEVER include publication names like "BA's", "Bon Appétit", "NYT", "Serious Eats", "Food52", "Epicurious", or creator names like "Claire Saffitz's", "J. Kenji's" etc. Just the dish itself, e.g. "Classic Minestrone" not "BA's Classic Minestrone"),
  "description": string (1-2 sentence FACTUAL description — what the dish is, key flavors, cuisine origin),
  "cuisine": string (e.g. "Italian", "Mexican", "American"),
  "difficulty": "easy" | "medium" | "advanced",
  "time_total": number (ACTIVE cooking minutes — exclude passive waits like overnight chilling) | null,
  "time_active": number (hands-on cooking minutes) | null,
  "servings": number | null,
  "ingredients": [{ "name": string, "amount": string, "unit": string, "notes": string }],
  "steps": [{ "step": number, "text": string, "timer_minutes": number | null, "phase": "prep" | "cook", "tip": string | null }],
  "summary": string (SKELETAL cooking arc — 3-5 short phrases, comma-separated, under 20 words total. Collapse related actions into a single phase and use broad ingredient labels ("aromatics", "the meat", "sauce base"). No measurements, no technique explanations, no specific times. Think: if you were sketching the recipe on a napkin. Examples: "Season and sear chicken, add lemon and dates, braise until tender." / "Bloom aromatics, simmer tomatoes and sauces, add beans, finish with poached eggs." / "Whip cream and sugar, fold in yolks, freeze overnight."),
  "confidence": "high" | "medium" | "low"
}

${INGREDIENT_RULES}

${TIMER_RULES}

Step rules:
- Clear imperative sentences in neutral instructional tone, numbered from 1
- Classify each step's "phase" as ONLY "prep" or "cook":
  - "prep" = anything before heat: measuring, chopping, mixing dry ingredients, assembling, preheating, chilling, plating, garnishing, serving
  - "cook" = any step involving active heat: sautéing, baking, boiling, frying, searing, roasting, simmering, broiling
- If a step's technique would benefit a home cook, add a "tip" — a 1-2 sentence explanation in a warm, slightly conversational tone. Only for steps where technique genuinely matters (searing, deglazing, resting meat). Most steps should have tip: null.

confidence "high" = complete recipe with exact measurements, "medium" = most measurements present, "low" = reconstructed from transcript or minimal info
IMPORTANT: time_total should be the PRACTICAL cooking time a home cook cares about — exclude overnight chilling, multi-hour marinating, dough rising, etc.

IMPORTANT — handling spoken transcripts:
- Transcripts often mention ingredients without exact amounts. DO YOUR BEST anyway.
- If a speaker says "add some garlic" without amount, use amount "" and unit "" with notes "to taste"
- If "a couple tablespoons of oil", use amount "2" and unit "tbsp"
- If vague ("a good amount of cheese"), estimate a reasonable amount and add notes "adjust to taste"
- Only return { "error": "insufficient_content" } if the content has NOTHING to do with cooking or food.

Return ONLY the JSON object with no markdown fences or extra text.
`.trim()

// ===== JSON-LD STRUCTURED PROMPT (used when JSON-LD IS available) =====
// Claude's job is narrower: parse already-complete ingredient strings + rewrite
// steps in brand voice + extract timer_minutes. Ingredient list is source of truth.

const JSONLD_PROMPT = (recipe: JsonLdRecipe) => `
I have extracted structured recipe data from a website's JSON-LD (schema.org/Recipe). Your job is to parse the ingredient strings into structured fields, rewrite the steps in clear neutral instructional voice, and extract cooking timers.

SOURCE DATA (authoritative — the ingredient and step counts are the ground truth):

TITLE: ${recipe.name}
${recipe.description ? `DESCRIPTION (for reference, rewrite in your own words): ${recipe.description}` : ''}
${recipe.cuisine ? `CUISINE: ${recipe.cuisine}` : ''}
${recipe.yield !== null ? `YIELD: ${recipe.yield}` : ''}
${recipe.totalMinutes !== null ? `TOTAL TIME: ${recipe.totalMinutes} minutes` : ''}
${recipe.prepMinutes !== null ? `PREP TIME: ${recipe.prepMinutes} minutes` : ''}
${recipe.cookMinutes !== null ? `COOK TIME: ${recipe.cookMinutes} minutes` : ''}

INGREDIENTS (${recipe.ingredients.length} total — output MUST have exactly this many):
${recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

STEPS (${recipe.steps.length} total — output MUST have exactly this many):
${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

COPYRIGHT: Rewrite each step entirely in your own neutral instructional words. Do not copy distinctive phrasing. The description field should be your own factual summary.

Return a single JSON object with exactly these fields:
{
  "title": string (simple dish name — strip publication/creator prefixes like "BA's", "NYT", "Claire Saffitz's"),
  "description": string (1-2 sentence factual description in your own words),
  "cuisine": string,
  "difficulty": "easy" | "medium" | "advanced",
  "time_total": number | null,
  "time_active": number | null,
  "servings": number | null,
  "ingredients": [{ "name": string, "amount": string, "unit": string, "notes": string }],
  "steps": [{ "step": number, "text": string, "timer_minutes": number | null, "phase": "prep" | "cook", "tip": string | null }],
  "summary": string (SKELETAL cooking arc — 3-5 comma-separated phrases, under 20 words, broad ingredient labels, no measurements or technique. e.g. "Season and sear chicken, add lemon and dates, braise until tender."),
  "confidence": "high"
}

${INGREDIENT_RULES}

${TIMER_RULES}

Step rules:
- You MUST produce exactly ${recipe.steps.length} steps in your output, one per source step.
- Rewrite each in clear imperative sentences, neutral instructional tone, numbered from 1.
- "phase": "prep" (no heat) or "cook" (active heat).
- "tip": optional 1-2 sentence technique note for steps where it genuinely helps. Most should be null.

time_total should be practical cooking time — exclude overnight chilling/marinating. Use the TOTAL TIME from source data as a starting point.

Return ONLY the JSON object with no markdown fences or extra text.
`.trim()

// ===== CLAUDE CALL + RETRY =====

type ClaudeResult = { ok: true; data: unknown } | { ok: false; error: string }

async function callClaude(prompt: string, apiKey: string): Promise<ClaudeResult> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[extract] Claude API error:', res.status, errBody)
      return { ok: false, error: 'api_error' }
    }

    const claudeData = await res.json()
    const text: string = claudeData.content?.[0]?.text || ''
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    try {
      return { ok: true, data: JSON.parse(cleaned) }
    } catch {
      // Retry-friendly path: try to extract first JSON object from response
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try { return { ok: true, data: JSON.parse(match[0]) } } catch { /* fall through */ }
      }
      return { ok: false, error: 'parse_error' }
    }
  } catch (err) {
    console.error('[extract] Claude call threw:', err)
    return { ok: false, error: 'network_error' }
  }
}

async function extractWithRetry(prompt: string, apiKey: string): Promise<unknown | null> {
  let result = await callClaude(prompt, apiKey)
  if (result.ok) return result.data
  // Retry once on parse failure (network errors usually won't recover in 1s)
  if (result.error === 'parse_error' || result.error === 'api_error') {
    console.log('[extract] First attempt failed:', result.error, '— retrying once')
    result = await callClaude(prompt, apiKey)
    if (result.ok) return result.data
  }
  return null
}

// ===== ROUTE =====

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'extract-recipe', 15, 60_000)
  if (rl) return rl

  const reqBody = await req.json()
  const url: unknown = reqBody.url
  const platform: string = typeof reqBody.platform === 'string' ? reqBody.platform : ''
  const authorUrl: string | null = reqBody.authorUrl ?? null
  const oembedTitle: string | null = reqBody.oembedTitle ?? null
  const transcript: string | null = reqBody.transcript ?? null
  let authorName: string | null = reqBody.authorName ?? null
  if (!url || typeof url !== 'string') return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (url.length > 2048) return NextResponse.json({ error: 'url_too_long' }, { status: 400 })
  const urlStr: string = url
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'invalid_url_scheme' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  let content = oembedTitle || ''
  let videoId: string | null = null
  let tiktokVideoId: string | null = null
  let instagramShortcode: string | null = null
  let jsonLdRecipe: JsonLdRecipe | null = null
  let sourceImage: string | null = null

  async function getTranscript(opts: { videoId?: string; url?: string; platform?: string }): Promise<string | null> {
    try {
      const origin = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'
      const tRes = await fetch(`${origin}/api/youtube-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
      const tData = await tRes.json()
      return tData.transcript || null
    } catch (err) {
      console.log('[extract] Transcript fetch failed:', err)
      return null
    }
  }

  if (platform === 'youtube') {
    const { videoId: yt, description } = await fetchYouTubeContent(url)
    videoId = yt
    let transcriptText = (transcript && typeof transcript === 'string') ? transcript : null
    if (!transcriptText && videoId) {
      transcriptText = await getTranscript({ videoId, platform: 'youtube' })
      if (transcriptText) console.log('[extract] Got YouTube transcript, length:', transcriptText.length)
    }
    const parts: string[] = []
    if (oembedTitle) parts.push(oembedTitle)
    if (description) parts.push(description)
    if (transcriptText) parts.push(`[Spoken transcript from the video]\n${transcriptText.slice(0, 20000)}`)
    content = parts.join('\n\n').trim()
  } else if (platform === 'tiktok') {
    tiktokVideoId = extractTikTokVideoId(url)
    const caption = await fetchTikTokCaption(url)
    let transcriptText = (transcript && typeof transcript === 'string') ? transcript : null
    if (!transcriptText) {
      transcriptText = await getTranscript({ url, platform: 'tiktok' })
      if (transcriptText) console.log('[extract] Got TikTok transcript, length:', transcriptText.length)
    }
    const parts: string[] = []
    if (oembedTitle) parts.push(oembedTitle)
    if (caption) parts.push(caption)
    if (transcriptText) parts.push(`[Spoken transcript from the video]\n${transcriptText.slice(0, 20000)}`)
    content = parts.join('\n\n').trim()
  } else if (platform === 'instagram') {
    instagramShortcode = extractInstagramShortcode(url)
  } else if (platform === 'web') {
    const pageData = await fetchWebPage(url)
    if (pageData) {
      console.log('[extract] Got web page. jsonLd:', !!pageData.jsonLd, 'text length:', pageData.text.length, 'author:', pageData.author)
      content = pageData.text
      jsonLdRecipe = pageData.jsonLd
      if (pageData.jsonLd?.image) sourceImage = pageData.jsonLd.image
      if (!authorName && pageData.author) authorName = pageData.author
    }
  }

  if (!content.trim() && !jsonLdRecipe) {
    return NextResponse.json({ error: 'insufficient_content' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  try {
    // Prefer JSON-LD path when available — far more reliable
    const prompt = jsonLdRecipe
      ? JSONLD_PROMPT(jsonLdRecipe)
      : EXTRACTION_PROMPT(platform, content)

    console.log('[extract] path:', jsonLdRecipe ? 'json-ld' : 'html-scrape', 'platform:', platform, 'content length:', content.length)

    const data = await extractWithRetry(prompt, apiKey)
    if (!data) {
      return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
    }

    const recipe = data as Record<string, unknown>
    if (recipe.error) {
      return NextResponse.json({ error: recipe.error })
    }

    // Backfill servings/times from JSON-LD if Claude missed them
    if (jsonLdRecipe) {
      if (recipe.servings == null) {
        const n = yieldToNumber(jsonLdRecipe.yield)
        if (n !== null) recipe.servings = n
      }
      if (recipe.time_total == null && jsonLdRecipe.totalMinutes !== null) {
        recipe.time_total = jsonLdRecipe.totalMinutes
      }
      if (recipe.time_active == null) {
        const active = (jsonLdRecipe.prepMinutes || 0) + (jsonLdRecipe.cookMinutes || 0)
        if (active > 0) recipe.time_active = active
      }
    }

    // Attach embed info
    if (platform === 'youtube' && videoId) {
      recipe.videoId = videoId
      recipe.embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`
    } else if (platform === 'tiktok' && tiktokVideoId) {
      recipe.videoId = tiktokVideoId
      recipe.embedUrl = `https://www.tiktok.com/embed/v2/${tiktokVideoId}`
    } else if (platform === 'instagram' && instagramShortcode) {
      recipe.videoId = instagramShortcode
      recipe.embedUrl = `https://www.instagram.com/p/${instagramShortcode}/embed/`
    }

    return NextResponse.json({
      recipe,
      authorName: authorName || null,
      authorUrl: authorUrl || null,
      platform,
      sourceImage,
      jsonLd: !!jsonLdRecipe,
    })
  } catch (err) {
    console.error('[extract] Unhandled error:', err)
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
