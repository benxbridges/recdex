import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticated, applyRateLimit } from '@/app/lib/security'

const BUCKET = 'recipe-images'
const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,199}$/

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // Image upload upserts into the recipe-images bucket and updates DB. Admin-only.
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const rl = applyRateLimit(req, 'upload-recipe-image', 30, 60_000)
  if (rl) return rl

  try {
    const { slug, imageBase64, mimeType } = await req.json()

    if (!slug || typeof slug !== 'string' || !SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'invalid slug' }, { status: 400 })
    }
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
    }
    const mime = typeof mimeType === 'string' && ALLOWED_MIME.has(mimeType) ? mimeType : 'image/jpeg'

    // Determine file extension from mime type
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
    const filePath = `${slug}.${ext}`

    // Decode base64 to buffer; cap size to prevent storage abuse.
    const buffer = Buffer.from(imageBase64, 'base64')
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'image_too_large_or_empty' }, { status: 413 })
    }

    // Upload to Supabase Storage (upsert to allow regeneration)
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: mime,
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
