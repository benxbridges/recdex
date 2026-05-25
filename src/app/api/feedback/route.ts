import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, clampString } from '@/app/lib/security'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY!)
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'feedback', 10, 60_000)
  if (rl) return rl

  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('[feedback] SUPABASE_SERVICE_KEY not set')
    return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const message = clampString(body.message, 5000)
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const row = {
    type: clampString(body.type, 32) || 'bug',
    message,
    url: clampString(body.url, 2048),
    user_agent: clampString(body.userAgent, 500),
    screen_size: clampString(body.screenSize, 32),
    user_name: clampString(body.userName, 100),
    created_at: clampString(body.timestamp, 64) || new Date().toISOString(),
  }

  const { error } = await getSupabaseAdmin().from('feedback').insert(row)
  if (error) {
    console.error('[feedback] insert error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
