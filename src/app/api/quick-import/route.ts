import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, clampString } from '@/app/lib/security'

/**
 * POST /api/quick-import
 * One-click recipe import: fetches video content, extracts recipe via Claude,
 * saves to Supabase (using service role key), and returns the slug for cook mode.
 *
 * Body: { url: string, dishName?: string }
 * Returns: { slug: string, title: string, alreadyExists?: boolean } or { error: string }
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'

const supabaseRead = createClient(SUPABASE_URL, ANON_KEY)

function detectPlatform(url: string): 'youtube' | 'tiktok' | 'instagram' | 'other' {
  try {
    const h = new URL(url).hostname.toLowerCase()
    if (h === 'tiktok.com' || h.endsWith('.tiktok.com')) return 'tiktok'
    if (h === 'youtube.com' || h.endsWith('.youtube.com') || h === 'youtu.be') return 'youtube'
    if (h === 'instagram.com' || h.endsWith('.instagram.com')) return 'instagram'
  } catch { /* invalid */ }
  return 'other'
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'quick-import', 5, 60_000)
  if (rl) return rl

  const body = await req.json()
  const url = clampString(body.url, 2048) || ''
  const dishName = clampString(body.dishName, 200) || undefined
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  // Validate URL format
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'invalid_url_scheme' }, { status: 400 })
    }
  } catch { return NextResponse.json({ error: 'invalid_url' }, { status: 400 }) }

  const platform = detectPlatform(url)
  if (platform === 'other') {
    return NextResponse.json({ error: 'unsupported_platform' }, { status: 400 })
  }

  // Require service key for writes — don't silently fall back to anon
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('[quick-import] SUPABASE_SERVICE_KEY not set — cannot save recipes')
    return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
  }
  const supabaseWrite = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    // Step 1: Fetch oEmbed metadata
    // Use production URL to avoid Vercel Deployment Protection 401s on internal calls
    const origin = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
    let authorName: string | null = null
    let authorUrl: string | null = null
    let oembedTitle: string | null = null
    let thumbnailUrl: string | null = null

    // Step 1b: Check for duplicate by URL (before expensive extraction)
    const { data: existing } = await supabaseRead
      .from('recipes')
      .select('slug')
      .eq('video_url', url.trim())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        slug: existing[0].slug,
        title: dishName || 'Recipe',
        alreadyExists: true,
      })
    }

    try {
      const oRes = await fetch(`${origin}/api/oembed?url=${encodeURIComponent(url)}`)
      if (oRes.ok) {
        const oData = await oRes.json()
        authorName = oData.author_name || null
        authorUrl = oData.author_url || null
        oembedTitle = oData.title || null
        thumbnailUrl = oData.thumbnail_url || null
      }
    } catch { /* oembed optional */ }

    // Step 2: Extract recipe via existing extract-recipe endpoint
    const extractRes = await fetch(`${origin}/api/extract-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url, platform, authorName, authorUrl, oembedTitle,
      }),
    })

    if (!extractRes.ok) {
      return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
    }

    const extractData = await extractRes.json()
    if (extractData.error) {
      return NextResponse.json({ error: extractData.error }, { status: 422 })
    }

    const recipe = extractData.recipe
    if (!recipe || !recipe.title) {
      return NextResponse.json({ error: 'no_recipe_found' }, { status: 422 })
    }

    const confidence: 'high' | 'medium' | 'low' = recipe.confidence || 'low'

    // Low confidence = not reliable enough to auto-import
    if (confidence === 'low') {
      return NextResponse.json({ error: 'low_confidence', confidence }, { status: 422 })
    }

    // Step 3: Save to Supabase (using service role key to bypass RLS)
    const title = dishName || recipe.title
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

    const ingredients = (recipe.ingredients || []).map((i: { name: string; amount: string; unit: string; notes?: string }) => ({
      name: i.name?.trim() || '',
      amount: i.amount?.trim() || '',
      unit: i.unit?.trim() || '',
      notes: i.notes?.trim() || '',
    })).filter((i: { name: string }) => i.name)

    const steps = (recipe.steps || []).map((s: { step: number; text: string; timer_minutes?: number | null }, idx: number) => ({
      step: idx + 1,
      text: s.text?.trim() || '',
      timer_minutes: s.timer_minutes ?? null,
    })).filter((s: { text: string }) => s.text)

    const { error: insertError } = await supabaseWrite.from('recipes').insert({
      slug,
      title: title.trim(),
      description: recipe.description?.trim() || null,
      cuisine: recipe.cuisine?.trim() || null,
      difficulty: recipe.difficulty || 'easy',
      time_total: recipe.time_total || null,
      time_active: recipe.time_active || null,
      servings: recipe.servings || null,
      ingredients,
      steps,
      tags: [],
      status: 'published',
      submitted_by: null,
      source: 'community',
      source_attribution: 'RecDex Trending',
      video_url: url.trim(),
      creator_name: authorName,
      creator_url: authorUrl,
      image_url: thumbnailUrl,
    })

    if (insertError) {
      console.error('[quick-import] Supabase insert error:', insertError)
      return NextResponse.json({ error: 'save_failed' }, { status: 500 })
    }

    // Also log as community submission
    try {
      await supabaseWrite.from('community_submissions').insert({
        url: url.trim(),
        platform,
        title: oembedTitle || title.trim(),
        author_name: authorName,
        author_url: authorUrl,
        thumbnail_url: thumbnailUrl,
        display_name: 'RecDex Trending',
        related_recipe_slug: slug,
      })
    } catch { /* non-critical */ }

    console.log('[quick-import] Saved recipe:', slug, 'from', platform)

    return NextResponse.json({
      slug,
      title: title.trim(),
      alreadyExists: false,
      confidence,
    })
  } catch (err) {
    console.error('[quick-import] Error:', err)
    return NextResponse.json({ error: 'import_failed' }, { status: 500 })
  }
}
