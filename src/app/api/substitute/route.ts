import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, clampString } from '@/app/lib/security'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

/**
 * Smart ingredient substitution via Claude.
 * Called when the local substitution database has no match.
 * Returns 1-3 context-aware substitution options.
 */
export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'substitute', 20, 60_000)
  if (rl) return rl

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const ingredient = clampString(body.ingredient, 200)
    const recipeTitle = clampString(body.recipeTitle, 200)
    const recipeCuisine = clampString(body.recipeCuisine, 100)
    const stepContext = clampString(body.stepContext, 500)
    const dietary: string[] = Array.isArray(body.dietary)
      ? body.dietary.filter((d: unknown): d is string => typeof d === 'string').slice(0, 10).map((d: string) => d.slice(0, 50))
      : []

    if (!ingredient) {
      return NextResponse.json({ error: 'ingredient is required' }, { status: 400 })
    }

    const dietaryNote = dietary?.length
      ? `The user has these dietary preferences: ${dietary.join(', ')}. Prioritize options that fit.`
      : ''

    const prompt = `You are a knowledgeable home cook helping someone mid-recipe. They need a substitution for "${ingredient}".

${recipeTitle ? `Recipe: ${recipeTitle}` : ''}
${recipeCuisine ? `Cuisine: ${recipeCuisine}` : ''}
${stepContext ? `Context: "${stepContext}"` : ''}
${dietaryNote}

Return 1-3 practical substitutions as JSON. Each must have:
- "name": the substitute ingredient
- "ratio": how much to use (e.g., "1:1" or "2 tbsp per 1 tbsp")
- "notes": a brief, practical tip (1 sentence max)

Only suggest substitutions that would actually work well in this recipe context. Be specific about ratios.

Return ONLY a JSON array, no markdown, no explanation:
[{"name": "...", "ratio": "...", "notes": "..."}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[substitute] Anthropic API error:', response.status, errorText)
      return NextResponse.json({ error: 'API error' }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse response' }, { status: 500 })
    }

    const subs = JSON.parse(jsonMatch[0])
    return NextResponse.json({ subs, source: 'ai' })
  } catch (err) {
    console.error('[substitute] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
