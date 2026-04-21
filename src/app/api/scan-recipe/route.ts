import { NextRequest, NextResponse } from 'next/server'

const SCAN_PROMPT = `You are extracting a recipe from photograph(s) of a cookbook page. Analyze every image carefully and extract ALL recipe information visible across ALL images. Cookbook recipes often span two facing pages — if multiple images are provided, treat them as a single continuous recipe.

CRITICAL RULES:

INGREDIENT CAPTURE — every ingredient visible in the photo(s) MUST appear in your output. A missed ingredient means a broken recipe.
- If ingredients are grouped under headers ("For the sauce:", "For the dough:", "Garnish:"), FLATTEN them all into one flat list. Put the group name in the ingredient's "notes" field (e.g. notes: "for the sauce").
- Include every seasoning, garnish, and "to taste" item.
- "amount" must be a number string like "2" or "1/2" — never include the unit in amount.
- "unit" is the measurement ("cups", "tbsp", "tsp", "oz", "g", "lb", "ml", "L", "sprigs", "cloves", "slices", "pieces", "whole", "pinch", etc.). Empty string "" if no unit (e.g. "3 eggs" → amount "3", unit "").
- "notes" is optional info like "room temperature", "divided", "finely chopped", or the group header.

SELF-CHECK before returning: count every bullet/dash/line in the ingredient list in the photo. Your output MUST have at least that many ingredients.

TIMER EXTRACTION — for each step, set "timer_minutes" to a number representing the cooking time that step requires. A missed timer means a burnt meal.
- "Bake for 25 minutes" → 25
- "Simmer 10-15 minutes" → 12 (middle of range)
- "About an hour" → 60
- "Cook until golden, ~5 min" → 5
- "4 minutes per side" (assume 2 sides unless specified) → 8
- Steps with multiple times → use the LONGEST time
- Steps with no specific time ("chop the onion", "plate") → null
- NEVER return null for a step that mentions any cooking duration.

Return a single JSON object with exactly these fields:
{
  "title": string (the recipe title as written),
  "description": string (1-2 sentence factual description of the dish in your own words),
  "cuisine": string (e.g. "Italian", "Mexican", "American"),
  "difficulty": "easy" | "medium" | "advanced",
  "servings": number | null,
  "prep_time": number | null (minutes),
  "cook_time": number | null (minutes),
  "time_total": number | null (prep + cook in minutes),
  "source_author": string | null (author name if visible),
  "source_book": string | null (book title if visible),
  "ingredients": [{ "name": string, "amount": string, "unit": string, "notes": string }],
  "steps": [{ "step": number, "text": string, "timer_minutes": number | null, "phase": "prep" | "cook" }],
  "raw_text": string (the full recipe text as read from the image(s), preserving original wording)
}

- Steps must be clear imperative sentences, numbered from 1
- "phase": "prep" (no heat) or "cook" (active heat)
- For raw_text, transcribe as closely as possible from the image(s)
- If the images do not contain a recipe, return { "error": "no_recipe_found" }

Return ONLY the JSON object with no markdown fences or extra text.`

type ClaudeResult = { ok: true; data: unknown } | { ok: false; error: string }

async function callClaude(images: { mediaType: string; data: string }[], apiKey: string): Promise<ClaudeResult> {
  try {
    const content: unknown[] = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    }))
    content.push({ type: 'text', text: SCAN_PROMPT })

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
        messages: [{ role: 'user', content }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[scan] Claude API error:', res.status, errBody)
      return { ok: false, error: 'api_error' }
    }

    const claudeData = await res.json()
    const text: string = claudeData.content?.[0]?.text || ''
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    try {
      return { ok: true, data: JSON.parse(cleaned) }
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try { return { ok: true, data: JSON.parse(match[0]) } } catch { /* fall through */ }
      }
      return { ok: false, error: 'parse_error' }
    }
  } catch (err) {
    console.error('[scan] Network error:', err)
    return { ok: false, error: 'network_error' }
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  let body: { image?: string; images?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  // Accept either single `image` (legacy) or `images: string[]` (multi-page)
  const rawImages: string[] = body.images && Array.isArray(body.images) && body.images.length > 0
    ? body.images
    : body.image
      ? [body.image]
      : []

  if (rawImages.length === 0) {
    return NextResponse.json({ error: 'image_required' }, { status: 400 })
  }
  if (rawImages.length > 4) {
    return NextResponse.json({ error: 'too_many_images' }, { status: 400 })
  }

  const parsedImages = rawImages.map(image => {
    let mediaType = 'image/jpeg'
    let base64Data = image
    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
      if (match) {
        mediaType = match[1]
        base64Data = match[2]
      }
    }
    return { mediaType, data: base64Data }
  })

  console.log('[scan] Processing', parsedImages.length, 'image(s), total size:',
    Math.round(parsedImages.reduce((s, i) => s + i.data.length, 0) / 1024), 'KB')

  let result = await callClaude(parsedImages, apiKey)
  if (!result.ok && (result.error === 'parse_error' || result.error === 'api_error')) {
    console.log('[scan] First attempt failed:', result.error, '— retrying once')
    result = await callClaude(parsedImages, apiKey)
  }

  if (!result.ok) {
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }

  const parsed = result.data as Record<string, unknown>
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error })
  }

  const { raw_text, ...recipe } = parsed
  return NextResponse.json({ recipe, raw_text: raw_text || '' })
}
