import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

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
  const body = await req.json()
  const { item_type, item_id, item_title, display_name, body: commentBody } = body
  if (!item_type || !item_id || !display_name || !commentBody?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('item_comments')
    .insert({
      item_type,
      item_id,
      item_title: item_title || null,
      display_name,
      body: commentBody.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
