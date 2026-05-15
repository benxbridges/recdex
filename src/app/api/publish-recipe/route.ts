import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchPhotos, toImageData, triggerDownload } from '@/app/lib/unsplash'
import { applyRateLimit, clampString, safeHref } from '@/app/lib/security'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'

// Use service role key for writes to bypass RLS — lazy init to avoid build-time crash
function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY!)
}

async function fetchUnsplashImage(query: string): Promise<{ url: string; credit: string; creditUrl: string; photoUrl: string; unsplashId: string; downloadLocation: string } | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return null

  try {
    const photos = await searchPhotos(query, accessKey, 1)
    const photo = photos[0]
    if (!photo?.urls?.regular) return null
    const data = toImageData(photo)
    return { url: data.url, credit: data.credit, creditUrl: data.creditUrl, photoUrl: data.photoUrl, unsplashId: data.unsplashId, downloadLocation: data.downloadLocation }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'publish-recipe', 10, 60_000)
  if (rl) return rl

  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('[publish-recipe] SUPABASE_SERVICE_KEY not set')
    return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { recipe, submission } = body

  if (!recipe?.slug || !recipe?.title) {
    return NextResponse.json({ error: 'slug and title required' }, { status: 400 })
  }

  // Length caps + URL sanitization so attacker-controlled fields can't smuggle
  // javascript: URLs or unbounded text into the public DB.
  recipe.slug = clampString(recipe.slug, 200) || recipe.slug
  recipe.title = clampString(recipe.title, 300)
  if (!recipe.title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  recipe.description = clampString(recipe.description, 2000)
  recipe.summary = clampString(recipe.summary, 1000)
  recipe.source_attribution = clampString(recipe.source_attribution, 200)
  recipe.creator_name = clampString(recipe.creator_name, 200)
  if (recipe.image_url) recipe.image_url = safeHref(String(recipe.image_url)) ?? null
  if (recipe.source_url) recipe.source_url = safeHref(String(recipe.source_url)) ?? null
  if (recipe.video_url) recipe.video_url = safeHref(String(recipe.video_url)) ?? null
  if (recipe.creator_url) recipe.creator_url = safeHref(String(recipe.creator_url)) ?? null
  if (recipe.photographer_url) recipe.photographer_url = safeHref(String(recipe.photographer_url)) ?? null
  if (recipe.unsplash_photo_url) recipe.unsplash_photo_url = safeHref(String(recipe.unsplash_photo_url)) ?? null

  // Dedup check — skip if slug already exists
  const { data: existing } = await getSupabaseAdmin().from('recipes').select('slug').eq('slug', recipe.slug).single()
  if (existing) {
    return NextResponse.json({ success: true, slug: recipe.slug, skipped: true })
  }

  // If no image_url provided, try fetching one from Unsplash
  let imageUrl = recipe.image_url || null
  let photoCredit = recipe.photo_credit || null
  let photographerUrl = recipe.photographer_url || null
  let unsplashPhotoUrl = recipe.unsplash_photo_url || null
  let unsplashId = recipe.unsplash_id || null
  let downloadLocation = recipe.download_location || null
  if (!imageUrl) {
    const unsplash = await fetchUnsplashImage(recipe.title)
    if (unsplash) {
      imageUrl = unsplash.url
      photoCredit = unsplash.credit
      photographerUrl = unsplash.creditUrl
      unsplashPhotoUrl = unsplash.photoUrl
      unsplashId = unsplash.unsplashId
      downloadLocation = unsplash.downloadLocation
    }
  }

  const { error: insertError } = await getSupabaseAdmin().from('recipes').insert({
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description || null,
    summary: recipe.summary || null,
    cuisine: recipe.cuisine || null,
    difficulty: recipe.difficulty || 'easy',
    time_total: recipe.time_total || null,
    time_active: recipe.time_active || null,
    servings: recipe.servings || null,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    tags: [],
    status: recipe.status === 'draft' ? 'draft' : 'published',
    submitted_by: null,
    source: 'community',
    source_attribution: recipe.source_attribution || null,
    source_url: recipe.source_url || null,
    video_url: recipe.video_url || null,
    creator_name: recipe.creator_name || null,
    creator_url: recipe.creator_url || null,
    image_url: imageUrl,
    photo_credit: photoCredit,
    photographer_url: photographerUrl,
    unsplash_photo_url: unsplashPhotoUrl,
    unsplash_id: unsplashId,
    download_location: downloadLocation,
  })

  if (insertError) {
    console.error('[publish-recipe] Insert error:', insertError)
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  // Trigger Unsplash download event (required by API guidelines)
  if (downloadLocation) {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (accessKey) triggerDownload(downloadLocation, accessKey)
  }

  // Insert community submission record if provided
  if (submission?.url) {
    try {
      await getSupabaseAdmin().from('community_submissions').insert({
        url: submission.url,
        platform: submission.platform || null,
        title: submission.title || null,
        author_name: submission.author_name || null,
        author_url: submission.author_url || null,
        thumbnail_url: submission.thumbnail_url || null,
        display_name: submission.display_name || null,
        status: 'active',
        related_recipe_slug: recipe.slug,
      })
    } catch {
      // Non-critical: recipe is already saved
    }
  }

  return NextResponse.json({ success: true, slug: recipe.slug })
}
