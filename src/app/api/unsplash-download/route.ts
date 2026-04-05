import { NextRequest, NextResponse } from 'next/server'
import { triggerDownload } from '@/app/lib/unsplash'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 })
  await triggerDownload(id, key)
  return NextResponse.json({ ok: true })
}
