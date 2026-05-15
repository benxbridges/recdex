import { NextRequest, NextResponse } from 'next/server'
import { searchPhotos, toImageData, extractDishQuery } from '@/app/lib/unsplash'
import { applyRateLimit } from '@/app/lib/security'

export async function GET(req: NextRequest) {
  const rl = applyRateLimit(req, 'image-search', 30, 60_000)
  if (rl) return rl

  const rawQuery = req.nextUrl.searchParams.get('q')
  if (!rawQuery) return NextResponse.json({ images: [] })

  // Use the server's configured key only — never trust a key from the query
  // string. Accepting `?key=` lets clients drain or probe arbitrary Unsplash keys.
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.warn('[image-search] UNSPLASH_ACCESS_KEY not set')
    return NextResponse.json({ images: [], error: 'no_key' })
  }

  // Use smart extraction unless the query looks like it's already manual (short / user-typed)
  const query = rawQuery.split(/\s+/).length <= 2 ? rawQuery : extractDishQuery(rawQuery)

  try {
    const photos = await searchPhotos(query, accessKey)
    const images = photos.map(toImageData)
    return NextResponse.json({ images, query }) // return processed query for debugging
  } catch {
    return NextResponse.json({ images: [] })
  }
}
