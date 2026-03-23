import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'recipe-images'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { slug, imageBase64, mimeType } = await req.json()

    if (!slug || !imageBase64) {
      return NextResponse.json({ error: 'slug and imageBase64 required' }, { status: 400 })
    }

    // Determine file extension from mime type
    const ext = mimeType?.includes('png') ? 'png' : 'jpg'
    const filePath = `${slug}.${ext}`

    // Decode base64 to buffer
    const buffer = Buffer.from(imageBase64, 'base64')

    // Upload to Supabase Storage (upsert to allow regeneration)
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = getSupabaseAdmin().storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    // Update recipe record with new image URL
    const { error: updateError } = await getSupabaseAdmin()
      .from('recipes')
      .update({ image_url: publicUrl })
      .eq('slug', slug)

    if (updateError) {
      console.error('Recipe update error:', updateError)
      // Image uploaded successfully but DB update failed — still return URL
    }

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      updated: !updateError,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
