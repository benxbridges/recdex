import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/publish-recipe
 * Server-side recipe publish using service role key to bypass RLS.
 * Used by the /contribute page.
 */

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'

const supabaseWrite = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || ANON_KEY)

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('[publish-recipe] SUPABASE_SERVICE_KEY not set')
    return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
  }

  const body = await req.json()
  const { recipe, submission } = body

  if (!recipe?.slug || !recipe?.title) {
    return NextResponse.json({ error: 'slug and title required' }, { status: 400 })
  }

  const { error: insertError } = await supabaseWrite.from('recipes').insert({
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description || null,
    cuisine: recipe.cuisine || null,
    difficulty: recipe.difficulty || 'easy',
    time_total: recipe.time_total || null,
    time_active: recipe.time_active || null,
    servings: recipe.servings || null,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    tags: [],
    status: 'published',
    submitted_by: null,
    source: 'community',
    source_attribution: recipe.source_attribution || null,
    video_url: recipe.video_url || null,
    creator_name: recipe.creator_name || null,
    creator_url: recipe.creator_url || null,
    image_url: recipe.image_url || null,
  })

  if (insertError) {
    console.error('[publish-recipe] Insert error:', insertError)
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  // Log community submission (non-critical)
  if (submission) {
    try {
      await supabaseWrite.from('community_submissions').insert({
        url: submission.url || null,
        platform: submission.platform || null,
        title: submission.title || null,
        author_name: submission.author_name || null,
        author_url: submission.author_url || null,
        thumbnail_url: submission.thumbnail_url || null,
        display_name: submission.display_name || null,
        related_recipe_slug: recipe.slug,
      })
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ slug: recipe.slug })
}
