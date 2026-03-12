import { NextRequest, NextResponse } from 'next/server'

/**
 * Unified transcript endpoint — works for YouTube AND TikTok.
 * Uses Supadata API (supadata.ai) for reliable server-side transcript extraction.
 * Falls back to direct YouTube caption scraping if Supadata is unavailable.
 *
 * POST { videoId?: string, url?: string, platform?: string }
 * Returns { transcript: string } or { error: string }
 */
export async function POST(req: NextRequest) {
  const { videoId, url, platform } = await req.json()

  // Build the video URL for Supadata
  let videoUrl: string | null = null
  if (url) {
    videoUrl = url
  } else if (videoId) {
    videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'videoId or url required' }, { status: 400 })
  }

  try {
    // Try Supadata first (works for both YouTube and TikTok)
    const supadataKey = process.env.SUPADATA_API_KEY
    if (supadataKey) {
      const transcript = await fetchFromSupadata(videoUrl, supadataKey)
      if (transcript) {
        console.log(`[transcript] Supadata success for ${platform || 'unknown'}, length: ${transcript.length}`)
        return NextResponse.json({ transcript })
      }
      console.log(`[transcript] Supadata returned no transcript for ${videoUrl}`)
    }

    // Fallback: direct YouTube caption scraping (only works sometimes)
    if (videoId && (!platform || platform === 'youtube')) {
      const transcript = await fetchYouTubeDirect(videoId)
      if (transcript) {
        console.log(`[transcript] Direct YouTube scrape success, length: ${transcript.length}`)
        return NextResponse.json({ transcript })
      }
    }

    return NextResponse.json({ error: 'no_captions' })
  } catch (err) {
    console.error('[transcript] Error:', err)
    return NextResponse.json({ error: 'transcript_failed' }, { status: 500 })
  }
}

// ===== SUPADATA =====

async function fetchFromSupadata(videoUrl: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}`,
      { headers: { 'x-api-key': apiKey } }
    )

    if (!res.ok) {
      console.log('[transcript] Supadata status:', res.status)
      return null
    }

    const data = await res.json()
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      return null
    }

    return data.content
      .map((seg: { text: string }) => seg.text)
      .join(' ')
      .trim() || null
  } catch (err) {
    console.log('[transcript] Supadata fetch error:', err)
    return null
  }
}

// ===== DIRECT YOUTUBE FALLBACK =====

async function fetchYouTubeDirect(videoId: string): Promise<string | null> {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    })
    if (!pageRes.ok) return null
    const html = await pageRes.text()

    const match = html.match(/"captionTracks":\[(.*?)\]/)
    if (!match) return null

    let tracks: Array<{ baseUrl?: string; languageCode?: string }> = []
    try { tracks = JSON.parse('[' + match[1] + ']') } catch { return null }

    const track = tracks.find(t => t.languageCode === 'en') || tracks[0]
    if (!track?.baseUrl) return null

    const cookies: string[] = []
    if (pageRes.headers.getSetCookie) {
      for (const c of pageRes.headers.getSetCookie()) cookies.push(c.split(';')[0])
    }

    const captionRes = await fetch(track.baseUrl, {
      headers: {
        'User-Agent': UA,
        'Cookie': cookies.join('; '),
        'Referer': `https://www.youtube.com/watch?v=${videoId}`,
      },
    })

    if (!captionRes.ok) return null
    const xml = await captionRes.text()
    if (!xml || xml.length < 10) return null

    const texts: string[] = []
    const regex = /<text[^>]*>(.*?)<\/text>/g
    let m: RegExpExecArray | null
    while ((m = regex.exec(xml)) !== null) {
      const decoded = m[1]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n/g, ' ')
      if (decoded.trim()) texts.push(decoded.trim())
    }

    return texts.length > 0 ? texts.join(' ') : null
  } catch {
    return null
  }
}
