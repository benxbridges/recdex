import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { applyRateLimit, clampString } from '@/app/lib/security'

// GET /api/comments?item_type=xxx&item_id=yyy
export async function GET(req: NextRequest) {
  const itemType = req.nextUrl.searchParams.get('item_type')
  const itemId = req.nextUrl.searchParams.get('item_id')
  if (!itemType || !itemId) return NextResponse.json({ error: 'Missing item_type or item_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('item_comments')
    .select('*')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/comments  { item_type, item_id, item_title, display_name, body }
export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, 'comments', 10, 60_000)
  if (rl) return rl

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const item_type = clampString(body.item_type, 32)
  const item_id = clampString(body.item_id, 200)
  const display_name = clampString(body.display_name, 80)
  const commentBody = clampString(body.body, 2000)
  if (!item_type || !item_id || !display_name || !commentBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('item_comments')
    .insert({
      item_type,
      item_id,
      item_title: clampString(body.item_title, 300),
      display_name,
      body: commentBody,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
