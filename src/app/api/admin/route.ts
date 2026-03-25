import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, password } = body

  // Validate password
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  switch (action) {
    case 'auth':
      return NextResponse.json({ success: true })

    case 'update-image': {
      const { slug, image_url } = body
      const { error } = await supabaseAdmin.from('recipes').update({ image_url }).eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'delete-recipe': {
      const { slug } = body
      const { error } = await supabaseAdmin.from('recipes').delete().eq('slug', slug)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
