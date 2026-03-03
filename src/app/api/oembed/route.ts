import { NextRequest, NextResponse } from 'next/server'

const OEMBED_ENDPOINTS: Record<string, string> = {
  tiktok: 'https://www.tiktok.com/oembed',
  youtube: 'https://www.youtube.com/oembed',
}

function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('tiktok.com')) return 'tiktok'
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube'
  } catch { /* invalid URL */ }
  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url parameter required' }, { status: 400 })

  const platform = detectPlatform(url)
  if (!platform || !OEMBED_ENDPOINTS[platform]) {
    return NextResponse.json({ error: 'unsupported platform for oEmbed' }, { status: 400 })
  }

  try {
    const endpoint = `${OEMBED_ENDPOINTS[platform]}?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(endpoint, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'oEmbed request failed' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch oEmbed data' }, { status: 500 })
  }
}
