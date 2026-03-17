import { NextRequest, NextResponse } from 'next/server'

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

// ===== EXTRACTION PROMPT =====

const EXTRACTION_PROMPT = (platform: string, content: string) => `
You are extracting FACTUAL recipe information from social media content and rewriting it in clear, original instructional language. Here is text from a ${platform} ${platform === 'youtube' ? 'video (description and/or spoken transcript)' : 'caption'}:

---
${content.slice(0, 8000)}
---

Your task: Identify the factual elements of the recipe (ingredients, quantities, temperatures, times, and cooking techniques), then write the recipe in your own neutral, instructional voice.

CRITICAL COPYRIGHT RULES:
- Extract ONLY factual information: ingredient names, amounts, temperatures, cooking times, and techniques
- REWRITE all instructions entirely in your own words using plain, neutral instructional language
- NEVER copy or closely paraphrase the creator's distinctive phrasing, personality, stories, or creative descriptions
- The description field should be YOUR brief factual summary of the dish, not the creator's words
- Step text must be YOUR original instructional writing based on the cooking process described — not a transcription

Return a single JSON object with exactly these fields:
{
  "title": string (simple dish name — no clickbait, no creator's branding),
  "description": string (1-2 sentence FACTUAL description — what the dish is, key flavors, cuisine origin),
  "cuisine": string (e.g. "Italian", "Mexican", "American" — one word or short phrase),
  "difficulty": "easy" | "medium" | "advanced",
  "time_total": number (total minutes including passive time) | null,
  "time_active": number (active hands-on cooking time in minutes) | null,
  "servings": number | null,
  "ingredients": [{ "name": string, "amount": string, "unit": string, "notes": string }],
  "steps": [{ "step": number, "text": string, "timer_minutes": number | null, "phase": "prep" | "cook" | "finish", "tip": string | null }],
  "confidence": "high" | "medium" | "low"
}

Rules:
- "amount" must be a number string like "2" or "1/2" — never include the unit in amount
- "unit" is the measurement unit like "cups", "tbsp", "oz", "g" — or "" if none
- "notes" is optional info like "room temperature", "divided", "or to taste"
- Steps must be clear imperative sentences in neutral instructional tone, numbered from 1
- Write steps as you would for a general cooking reference — direct, concise, no personality or flair
- Classify each step's "phase" as:
  - "prep": ingredient preparation, preheating, mixing/combining before cooking, wrapping dough, refrigerating/chilling, sifting, creaming butter, proofing dough, shaping, lining/greasing pans
  - "cook": active cooking with heat — sautéing, baking, boiling, frying, roasting, blind baking, simmering, grilling
  - "finish": plating, garnishing, cooling on wire rack, resting, serving, frosting, glazing, dusting with powdered sugar, unmolding
- If a step involves a technique where a brief educational note would help a home cook, add a "tip" — a 1-2 sentence technique explanation in a warm, slightly conversational tone. Only add tips for steps where technique genuinely matters (e.g., searing, deglazing, resting meat). Most steps should have tip: null.
- confidence "high" = complete recipe with exact measurements, "medium" = most measurements present, "low" = reconstructed from transcript or minimal info

IMPORTANT — handling spoken transcripts:
- Transcripts often mention ingredients without exact amounts. DO YOUR BEST to extract a usable recipe anyway.
- If a speaker says "add some garlic" without an amount, use amount "" and unit "" with notes "to taste"
- If a speaker says "a couple tablespoons of oil", use amount "2" and unit "tbsp"
- If amounts are vague ("a good amount of cheese"), estimate a reasonable amount and add notes "adjust to taste"
- Infer steps from the natural flow of the cooking narration — combine related actions into clear steps
- Even low-confidence recipes are valuable. Only return { "error": "insufficient_content" } if the content has NOTHING to do with cooking or food.

- Return ONLY the JSON object with no markdown fences or extra text
`.trim()

// ===== ROUTE =====

export async function POST(req: NextRequest) {
  const { url, platform, authorName, authorUrl, oembedTitle, transcript } = await req.json()
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  // Gather content by platform
  let content = oembedTitle || ''
  let videoId: string | null = null
  let tiktokVideoId: string | null = null
  let instagramShortcode: string | null = null

  // Helper: fetch transcript from our unified endpoint (Supadata + fallback)
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

    // Try transcript (Supadata → direct YouTube fallback)
    let transcriptText = (transcript && typeof transcript === 'string') ? transcript : null
    if (!transcriptText && videoId) {
      transcriptText = await getTranscript({ videoId, platform: 'youtube' })
      if (transcriptText) console.log('[extract] Got YouTube transcript, length:', transcriptText.length)
    }

    // Build content: combine description + transcript for best results
    const parts: string[] = []
    if (oembedTitle) parts.push(oembedTitle)
    if (description) parts.push(description)
    if (transcriptText) parts.push(`[Spoken transcript from the video]\n${transcriptText.slice(0, 6000)}`)
    content = parts.join('\n\n').trim()
  } else if (platform === 'tiktok') {
    tiktokVideoId = extractTikTokVideoId(url)
    const caption = await fetchTikTokCaption(url)

    // Try Supadata transcript for TikTok (spoken words in the video)
    let transcriptText = (transcript && typeof transcript === 'string') ? transcript : null
    if (!transcriptText) {
      transcriptText = await getTranscript({ url, platform: 'tiktok' })
      if (transcriptText) console.log('[extract] Got TikTok transcript, length:', transcriptText.length)
    }

    const parts: string[] = []
    if (oembedTitle) parts.push(oembedTitle)
    if (caption) parts.push(caption)
    if (transcriptText) parts.push(`[Spoken transcript from the video]\n${transcriptText.slice(0, 6000)}`)
    content = parts.join('\n\n').trim()
  } else if (platform === 'instagram') {
    instagramShortcode = extractInstagramShortcode(url)
    // Instagram oEmbed is restricted — use what oembedTitle gives us
  }

  if (!content.trim()) {
    return NextResponse.json({ error: 'insufficient_content' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  // Call Claude
  try {
    console.log('[extract] platform:', platform, 'content length:', content.length)
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
        messages: [{ role: 'user', content: EXTRACTION_PROMPT(platform, content) }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[extract] Claude API error:', res.status, errBody)
      return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
    }

    const claudeData = await res.json()
    const text: string = claudeData.content?.[0]?.text || ''
    console.log('[extract] Claude response length:', text.length)

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const recipe = JSON.parse(cleaned)

    if (recipe.error) {
      return NextResponse.json({ error: recipe.error })
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
    })
  } catch {
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
