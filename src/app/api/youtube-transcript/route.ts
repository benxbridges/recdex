import { NextRequest, NextResponse } from 'next/server'

/**
 * Fetches YouTube auto-generated captions for a video.
 * Uses the innertube API with visitor data from the video page.
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

  // Fetch the video page to extract auth context
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': UA },
  })
  if (!pageRes.ok) return null
  const html = await pageRes.text()

  // Extract required context from the page
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1]
  if (!apiKey) return null

  const visitorData = html.match(/"VISITOR_DATA":"([^"]+)"/)?.[1] || ''
  const clientVersion = html.match(/"clientVersion":"([^"]+)"/)?.[1] || '2.20250301.00.00'

  // Get cookies from page response
  const cookies: string[] = []
  if (pageRes.headers.getSetCookie) {
    for (const c of pageRes.headers.getSetCookie()) {
      cookies.push(c.split(';')[0])
    }
  }
  const cookieStr = cookies.join('; ')

  // Find transcript continuation params from ytInitialData
  const dataMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/)
  if (!dataMatch) return null

  let transcriptParams: string | null = null
  try {
    const data = JSON.parse(dataMatch[1])
    for (const panel of data?.engagementPanels || []) {
      const params = panel?.engagementPanelSectionListRenderer?.content
        ?.continuationItemRenderer?.continuationEndpoint
        ?.getTranscriptEndpoint?.params
      if (params) { transcriptParams = params; break }
    }
  } catch { /* parse error */ }

  if (!transcriptParams) return null

  // Call innertube get_transcript endpoint
  const res = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA,
      'Cookie': cookieStr,
      'Origin': 'https://www.youtube.com',
      'Referer': `https://www.youtube.com/watch?v=${videoId}`,
      ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}),
    },
    body: JSON.stringify({
      context: {
        client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US', visitorData },
      },
      params: transcriptParams,
    }),
  })

  if (!res.ok) return null
  const result = await res.json()

  // Extract transcript text from the response
  try {
    for (const action of result?.actions || []) {
      const renderer = action?.updateEngagementPanelAction?.content?.transcriptRenderer
      const segments = renderer?.content?.transcriptSearchPanelRenderer
        ?.body?.transcriptSegmentListRenderer?.initialSegments
      if (segments) {
        const text = segments
          .map((s: Record<string, unknown>) => {
            const seg = s as { transcriptSegmentRenderer?: { snippet?: { runs?: Array<{ text: string }> } } }
            return seg?.transcriptSegmentRenderer?.snippet?.runs?.map(r => r.text).join('') || ''
          })
          .filter(Boolean)
          .join(' ')
        return text || null
      }
    }
  } catch { /* parse error */ }

  return null
}
