import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, isAdminAuthenticated } from '@/app/lib/security'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

/**
 * Text-to-Speech via OpenAI's TTS API.
 * Returns an audio/mpeg stream for natural-sounding step narration.
 *
 * POST { text: string, voice?: string }
 * → audio/mpeg binary
 *
 * Voices: alloy, echo, fable, onyx, nova, shimmer
 * Default: "nova" — warm, clear, good for instructions
 */
export async function POST(req: NextRequest) {
  // Voice mode was removed — nothing in the app calls this. Keep the code in
  // case it's revived, but gate it behind admin auth so the public can't run up
  // OpenAI charges by hitting it directly. (Delete this route to remove it fully.)
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const rl = applyRateLimit(req, 'tts', 30, 60_000)
  if (rl) return rl

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  try {
    const { text, voice = 'nova' } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    // Cap at ~500 chars to control cost (one step should never be longer)
    const trimmed = text.slice(0, 500)

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: trimmed,
        voice,
        response_format: 'mp3',
        speed: 0.95, // slightly slower for cooking instructions
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[tts] OpenAI API error:', response.status, errorText)
      return NextResponse.json({ error: 'TTS API error' }, { status: 502 })
    }

    // Stream the audio back
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // cache for 24h — same step text = same audio
      },
    })
  } catch (err) {
    console.error('[tts] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
