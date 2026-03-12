import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

/**
 * Fetches YouTube auto-generated captions for a video.
 * Uses the youtube-transcript package for reliable extraction.
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
    console.log('[transcript] Fetching transcript for:', videoId)
    const items = await YoutubeTranscript.fetchTranscript(videoId)

    if (!items || items.length === 0) {
      console.log('[transcript] No captions found for:', videoId)
      return NextResponse.json({ error: 'no_captions' })
    }

    const transcript = items.map(i => i.text).join(' ')
    console.log('[transcript] Got transcript, length:', transcript.length)
    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('[transcript] Error:', err)
    return NextResponse.json({ error: 'transcript_failed' }, { status: 500 })
  }
}
