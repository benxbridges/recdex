import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  applyRateLimit,
  attachAdminSessionCookie,
  clearAdminSessionCookie,
  isAdminAuthenticated,
  signAdminSession,
  verifyAdminPassword,
} from '@/app/lib/security'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || '')
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const action = typeof body.action === 'string' ? body.action : ''

  // ---------- auth + logout (no prior session required) ----------
  if (action === 'logout') {
    const res = NextResponse.json({ success: true })
    clearAdminSessionCookie(res)
    return res
  }

  if (action === 'auth') {
    const rl = applyRateLimit(req, 'admin-auth', 5, 60_000)
    if (rl) return rl

    if (!verifyAdminPassword(body.password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = signAdminSession()
    if (!token) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
    }
    const res = NextResponse.json({ success: true })
    attachAdminSessionCookie(res, token)
    return res
  }

  // ---------- all other actions require a valid session cookie ----------
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const slug = typeof body.slug === 'string' ? body.slug : ''
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  switch (action) {
    case 'update-image': {
      const image_url = typeof body.image_url === 'string' ? body.image_url : null
      if (!image_url || !/^https?:\/\//i.test(image_url)) {
        return NextResponse.json({ error: 'invalid image_url' }, { status: 400 })
      }
      const photo_credit = typeof body.photo_credit === 'string' ? body.photo_credit : null
      const update: Record<string, string | null> = { image_url }
      if (body.photo_credit !== undefined) update.photo_credit = photo_credit || null
      const { error } = await getSupabaseAdmin().from('recipes').update(update).eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'clear-image': {
      const { error } = await getSupabaseAdmin().from('recipes').update({ image_url: null }).eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'delete-recipe': {
      const { error } = await getSupabaseAdmin().from('recipes').delete().eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'publish-recipe': {
      const { error } = await getSupabaseAdmin().from('recipes').update({ status: 'published' }).eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'unpublish-recipe': {
      const { error } = await getSupabaseAdmin().from('recipes').update({ status: 'draft' }).eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'set-featured': {
      await getSupabaseAdmin().from('recipes').update({ featured: false }).eq('featured', true)
      const { error } = await getSupabaseAdmin().from('recipes').update({ featured: true }).eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

// Allow the admin client to check whether an existing cookie still works.
export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminAuthenticated(req) })
}
