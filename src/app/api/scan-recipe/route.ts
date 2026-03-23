import { NextRequest, NextResponse } from 'next/server'

const SCAN_PROMPT = `You are extracting a recipe from a photograph of a cookbook page. Analyze the image carefully and extract all recipe information visible.

Return a single JSON object with exactly these fields:
{
  "title": string (the recipe title as written),
  "description": string (1-2 sentence factual description of the dish),
  "cuisine": string (e.g. "Italian", "Mexican", "American"),
  "difficulty": "easy" | "medium" | "advanced",
  "servings": number | null,
  "prep_time": number | null (minutes),
  "cook_time": number | null (minutes),
  "time_total": number | null (prep + cook in minutes),
  "source_author": string | null (author name if visible),
  "source_book": string | null (book title if visible),
  "ingredients": [{ "name": string, "amount": string, "unit": string, "notes": string }],
  "steps": [{ "step": number, "text": string, "timer_minutes": number | null, "phase": "prep" | "cook" | "finish" }],
  "raw_text": string (the full text as read from the image, preserving original wording)
}

Rules:
- "amount" must be a number string like "2" or "1/2" — never include the unit in amount
- "unit" is the measurement like "cups", "tbsp", "oz", "g" — or "" if none (e.g. "3 eggs")
- "notes" is optional info like "room temperature", "divided", "finely chopped"
- Steps must be clear imperative sentences, numbered from 1
- Classify each step's "phase": "prep" for preparation before cooking, "cook" for active heat/cooking, "finish" for plating/garnishing/serving
- If a step mentions a specific time (e.g. "bake for 25 minutes"), set timer_minutes to that value
- For raw_text, transcribe the recipe text as closely as possible from the image
- If the image does not contain a recipe, return { "error": "no_recipe_found" }

Return ONLY the JSON object with no markdown fences or extra text.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  let body: { image: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const { image } = body
  if (!image) {
    return NextResponse.json({ error: 'image_required' }, { status: 400 })
  }

  // Extract media type and base64 data
  // Accept both raw base64 and data URI format
  let mediaType = 'image/jpeg'
  let base64Data = image

  if (image.startsWith('data:')) {
    const match = image.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
    if (match) {
      mediaType = match[1]
      base64Data = match[2]
    } else {
      return NextResponse.json({ error: 'invalid_image_format' }, { status: 400 })
    }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: SCAN_PROMPT,
            },
          ],
        }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[scan] Claude API error:', res.status, errBody)
      return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
    }

    const claudeData = await res.json()
    const text: string = claudeData.content?.[0]?.text || ''

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error })
    }

    // Separate raw_text from recipe data
    const { raw_text, ...recipe } = parsed

    return NextResponse.json({ recipe, raw_text: raw_text || '' })
  } catch (err) {
    console.error('[scan] Extraction error:', err)
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
