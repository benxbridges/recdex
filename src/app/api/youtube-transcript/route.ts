import { NextRequest, NextResponse } from 'next/server'

/**
 * YouTube transcript endpoint.
 *
 * YouTube aggressively blocks server-side transcript access (timedtext API
 * returns empty bodies, innertube returns 400). This route attempts extraction
 * but gracefully degrades — the contribute page has a paste-text fallback
 * for videos where server-side access fails.
 *
 * POST { videoId: string }
 * Returns { transcript: string } or { error: string }
 */
export async function POST(req: NextRequest) {
  const { videoId } = await req.json()
  if (!videoId || typeof videoId !== 'string' || videoId.length > 20) {
    return NextResponse.json({ error: 'invalid videoId' }, { status: 400 })
  }

  try {
    const transcript = await fetchTranscript(videoId)
    if (transcript) {
      return NextResponse.json({ transcript })
    }
    return NextResponse.json({ error: 'no_captions' })
  } catch {
    return NextResponse.json({ error: 'transcript_failed' }, { status: 500 })
  }
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

  // Fetch the video page to find caption track URLs
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  })
  if (!pageRes.ok) return null
  const html = await pageRes.text()

  // Extract caption track URL from playerResponse
  const match = html.match(/"captionTracks":\[(.*?)\]/)
  if (!match) return null

  let tracks: Array<{ baseUrl?: string; languageCode?: string }> = []
  try { tracks = JSON.parse('[' + match[1] + ']') } catch { return null }

  // Prefer English, fall back to first available
  const track = tracks.find(t => t.languageCode === 'en') || tracks[0]
  if (!track?.baseUrl) return null

  // Get cookies from page response for authentication
  const cookies: string[] = []
  if (pageRes.headers.getSetCookie) {
    for (const c of pageRes.headers.getSetCookie()) cookies.push(c.split(';')[0])
  }

  // Try fetching the timedtext XML (YouTube often blocks this server-side)
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

  // Parse XML captions: <text start="1.23" dur="2.0">caption text</text>
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
}
