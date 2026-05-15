import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, isAdminAuthenticated } from '@/app/lib/security'

// ===== CONFIG =====
// Supports two providers: Gemini (Google) and Replicate (Flux)
// Set GEMINI_API_KEY for Google, REPLICATE_API_TOKEN for Flux
// If both are set, Gemini is used by default (pass ?provider=replicate to override)

const GEMINI_MODEL = 'gemini-2.5-flash-image'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const REPLICATE_MODEL = 'black-forest-labs/flux-1.1-pro'

// ===== PROMPT =====
// Variety pools — each generation picks randomly to avoid samey results
const ANGLES = [
  'tight close-up from directly above, filling the entire frame',
  'intimate close-up at a 15-degree angle, cropped tight on the dish',
  'close macro-style shot at 25 degrees, showing texture detail',
  'tight 30-degree overhead, dish takes up 85% of the frame',
]

const SURFACES = [
  'dark walnut cutting board',
  'weathered grey oak table',
  'black slate surface',
  'warm terracotta tile',
  'white marble countertop with subtle grey veining',
  'raw concrete surface',
  'aged butcher block',
]

const LIGHTING = [
  'warm golden side lighting through a kitchen window, late afternoon',
  'bright soft morning light from above-left, clean and fresh',
  'moody directional light from a single window, slight shadows',
  'diffused overcast daylight, even and gentle',
  'warm tungsten glow mixed with soft window light',
]

const CAMERAS = [
  'shot on Canon EOS R5 with 50mm f/1.4 lens',
  'captured with Hasselblad X2D, 85mm f/1.8',
  'shot on Fujifilm X-T5 with 56mm f/1.2, slightly warm film tones',
  'captured on Sony A7IV with 90mm macro lens',
]

const ACCENTS = [
  'a few scattered crumbs and a linen napkin edge barely in frame',
  'a single sprig of fresh herb resting on the rim',
  'steam rising gently from the surface',
  'a drizzle of olive oil catching the light',
  'tiny droplets of condensation on a glass just out of focus in the background',
  'nothing else — just the dish, stark and beautiful',
  'a torn piece of crusty bread at the edge of frame',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildPrompt(title: string, ingredients: string[], cuisine?: string): string {
  const ingredientList = ingredients.slice(0, 6).join(', ')
  const cuisineHint = cuisine ? ` (${cuisine} cuisine)` : ''

  return `Photorealistic food photograph of ${title}${cuisineHint}. ${pick(ANGLES)}, on a ${pick(SURFACES)}. Key ingredients visible: ${ingredientList}. ${pick(LIGHTING)}, ${pick(CAMERAS)}, shallow depth of field. ${pick(ACCENTS)}. The food looks freshly made, appetizing, with real texture — not glossy or artificial. Editorial quality like Bon Appetit magazine. Photorealistic, 8K.`
}

// ===== GEMINI PROVIDER =====
async function generateWithGemini(prompt: string): Promise<{ image: string; mimeType: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find(
    (p: { inlineData?: { mimeType: string; data: string } }) =>
      p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData) {
    throw new Error('No image in Gemini response')
  }

  return {
    image: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  }
}

// ===== REPLICATE PROVIDER (Flux) =====
async function generateWithReplicate(prompt: string): Promise<{ image: string; mimeType: string }> {
  const apiToken = process.env.REPLICATE_API_TOKEN
  if (!apiToken) throw new Error('REPLICATE_API_TOKEN not configured')

  // Create prediction
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: REPLICATE_MODEL,
      input: {
        prompt,
        aspect_ratio: '4:3',
        output_format: 'jpg',
        output_quality: 90,
      },
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error('Replicate create error:', err)
    throw new Error(`Replicate API error: ${createRes.status}`)
  }

  let prediction = await createRes.json()

  // Poll for completion (max 60s)
  const startTime = Date.now()
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    if (Date.now() - startTime > 60000) throw new Error('Image generation timed out')
    await new Promise(r => setTimeout(r, 2000))

    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
    })
    prediction = await pollRes.json()
  }

  if (prediction.status === 'failed') {
    throw new Error(prediction.error || 'Replicate generation failed')
  }

  // Get image URL from output
  const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  if (!imageUrl) throw new Error('No image URL in Replicate response')

  // Fetch image and convert to base64
  const imgRes = await fetch(imageUrl)
  const imgBuffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(imgBuffer).toString('base64')

  return {
    image: base64,
    mimeType: 'image/jpeg',
  }
}

// ===== HANDLER =====
export async function POST(req: NextRequest) {
  // Image generation is paid + slow; admin-only by default. Loosen if/when needed.
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const rl = applyRateLimit(req, 'generate-image', 10, 60_000)
  if (rl) return rl

  try {
    const body = await req.json()
    const { title, ingredients, cuisine, provider: requestedProvider } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const prompt = buildPrompt(title, ingredients || [], cuisine)

    // Determine provider
    const provider = requestedProvider || (process.env.REPLICATE_API_TOKEN ? 'replicate' : 'gemini')

    let result: { image: string; mimeType: string }

    if (provider === 'replicate') {
      result = await generateWithReplicate(prompt)
    } else {
      result = await generateWithGemini(prompt)
    }

    return NextResponse.json({
      image: result.image,
      mimeType: result.mimeType,
      provider,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 502 }
    )
  }
}
