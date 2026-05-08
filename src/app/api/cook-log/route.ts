import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    'https://zacwsrcdvpglrcvirlng.supabase.co',
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { recipe_slug, display_name, note, with_who, rating, substitutions, photo_url, cooked_at, private: isPrivate } = body

  if (!recipe_slug) {
    return NextResponse.json({ error: 'recipe_slug required' }, { status: 400 })
  }

  const row: Record<string, unknown> = {
    recipe_slug,
    display_name: display_name?.trim() || null,
    note: note?.trim() || null,
    with_who: with_who?.trim() || null,
    rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : null,
    substitutions: substitutions?.trim() || null,
    photo_url: photo_url?.trim() || null,
    private: !!isPrivate,
  }
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
