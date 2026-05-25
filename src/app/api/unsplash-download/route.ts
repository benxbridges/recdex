import { NextRequest, NextResponse } from 'next/server'
import { triggerDownload, triggerDownloadById } from '@/app/lib/unsplash'
import { applyRateLimit } from '@/app/lib/security'

export async function GET(req: NextRequest) {
  const rl = applyRateLimit(req, 'unsplash-download', 30, 60_000)
  if (rl) return rl

  const url = req.nextUrl.searchParams.get('url')
  const id = req.nextUrl.searchParams.get('id')
  if (!url && !id) return NextResponse.json({ error: 'Missing url or id' }, { status: 400 })

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  if (id) {
    // Reject anything that isn't a plain Unsplash photo id (alphanumeric, dash, underscore).
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(id)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
    }
    await triggerDownloadById(id, key)
    return NextResponse.json({ ok: true })
  }

  // triggerDownload now refuses non-api.unsplash.com hosts to prevent
  // exfiltrating the access key via Authorization header to an attacker-chosen host.
  await triggerDownload(url!, key)
  return NextResponse.json({ ok: true })
}
