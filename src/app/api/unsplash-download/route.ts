import { NextRequest, NextResponse } from 'next/server'
import { triggerDownload, triggerDownloadById } from '@/app/lib/unsplash'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const id = req.nextUrl.searchParams.get('id')
  if (!url && !id) return NextResponse.json({ error: 'Missing url or id' }, { status: 400 })
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 })
  if (url) {
    await triggerDownload(url, key)
  } else {
    await triggerDownloadById(id!, key)
  }
  return NextResponse.json({ ok: true })
}
