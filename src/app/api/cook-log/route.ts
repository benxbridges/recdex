import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, clampString, safeHref } from '@/app/lib/security'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY!)
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'cook-log', 20, 60_000)
  if (rl) return rl

  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const recipe_slug = clampString(body.recipe_slug, 200)
  if (!recipe_slug) {
    return NextResponse.json({ error: 'recipe_slug required' }, { status: 400 })
  }

  const photoUrl = clampString(body.photo_url, 2048)
  const row: Record<string, unknown> = {
    recipe_slug,
    display_name: clampString(body.display_name, 80),
    note: clampString(body.note, 2000),
    with_who: clampString(body.with_who, 200),
    rating: typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5 ? body.rating : null,
    substitutions: clampString(body.substitutions, 1000),
    photo_url: photoUrl ? (safeHref(photoUrl) ?? null) : null,
    private: !!body.private,
  }
  const cooked_at = clampString(body.cooked_at, 64)
  if (cooked_at) row.cooked_at = cooked_at

  const { data, error } = await getSupabaseAdmin()
    .from('cook_logs')
    .insert(row)
    .select('id')
    .single()

  if (error) {
    console.error('[cook-log] insert error:', error)
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data?.id })
}
