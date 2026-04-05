import { NextRequest, NextResponse } from 'next/server'
import { searchPhotos, toImageData, extractDishQuery } from '@/app/lib/unsplash'

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get('q')
  if (!rawQuery) return NextResponse.json({ images: [] })

  const accessKey = req.nextUrl.searchParams.get('key') || process.env.UNSPLASH_ACCESS_KEY
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
