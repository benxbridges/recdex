/**
 * Audit recipe images using Claude Vision
 *
 * Sends batches of recipe images to Claude and asks it to identify
 * which photos don't match their recipe title.
 *
 * Usage:
 *   npx tsx scripts/audit-images.ts
 *   npx tsx scripts/audit-images.ts --fix  (also clears bad images)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!
const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
const shouldFix = process.argv.includes('--fix')
const BATCH_SIZE = 10 // images per Claude call (keep tokens reasonable)

type Recipe = { slug: string; title: string; image_url: string }

async function auditBatch(recipes: Recipe[]): Promise<string[]> {
  // Build content blocks: alternating image + text for each recipe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = []

  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i]
    // Use smaller image for cost savings
    const thumbUrl = r.image_url
      .replace(/w=\d+/, 'w=300')
      .replace(/q=\d+/, 'q=50')

    content.push({
      type: 'image',
      source: { type: 'url', url: thumbUrl },
    })
    content.push({
      type: 'text',
      text: `Image ${i + 1}: "${r.title}" (slug: ${r.slug})`,
    })
  }

  content.push({
    type: 'text',
    text: `You are auditing food photos for a recipe website. For each image above, determine if the photo is a REASONABLE match for the recipe title.

Rules:
- A photo of the correct dish (even if slightly different style) = PASS
- A photo of a completely different dish = FAIL
- A photo that's not food at all = FAIL
- A photo that shows a key ingredient but not the dish = FAIL
- Generic food photos that could be anything = FAIL
- If unsure, lean toward PASS

Respond with ONLY the slugs that FAIL, one per line. If all pass, respond with "ALL_PASS".`,
  })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`  API error: ${err.slice(0, 200)}`)
    return []
  }

  const data = await res.json()
  const reply = data.content?.[0]?.text || ''

  if (reply.trim() === 'ALL_PASS') return []

  // Parse out slugs from the response
  const failedSlugs = reply
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => recipes.some(r => line.includes(r.slug)))
    .map((line: string) => {
      const match = recipes.find(r => line.includes(r.slug))
      return match?.slug
    })
    .filter(Boolean) as string[]

  return failedSlugs
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('RecDex Image Audit')
  console.log('='.repeat(60))
  console.log(`Mode: ${shouldFix ? 'AUDIT + FIX (will clear bad images)' : 'AUDIT ONLY (dry run)'}`)

  // Fetch all recipes with Unsplash images
  const { data, error } = await sb
    .from('recipes')
    .select('slug, title, image_url')
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .like('image_url', '%images.unsplash.com%')
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Failed to fetch recipes:', error)
    return
  }

  console.log(`Recipes to audit: ${data.length}`)
  console.log('='.repeat(60) + '\n')

  const allFailed: { slug: string; title: string }[] = []

  // Process in batches
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE) as Recipe[]
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(data.length / BATCH_SIZE)

    console.log(`[Batch ${batchNum}/${totalBatches}] Auditing ${batch.length} images...`)
    console.log(`  ${batch.map(r => r.title).join(', ')}`)

    try {
      const failed = await auditBatch(batch)
      if (failed.length > 0) {
        const failedRecipes = batch.filter(r => failed.includes(r.slug))
        failedRecipes.forEach(r => {
          console.log(`  ❌ MISMATCH: "${r.title}"`)
          allFailed.push({ slug: r.slug, title: r.title })
        })
      } else {
        console.log(`  ✅ All passed`)
      }
    } catch (err) {
      console.error(`  Error:`, err instanceof Error ? err.message : err)
    }

    // Small delay between batches
    if (i + BATCH_SIZE < data.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('AUDIT COMPLETE')
  console.log('='.repeat(60))
  console.log(`Total audited: ${data.length}`)
  console.log(`Mismatches found: ${allFailed.length}`)

  if (allFailed.length > 0) {
    console.log('\nMismatched recipes:')
    allFailed.forEach(r => console.log(`  - ${r.title} (${r.slug})`))

    if (shouldFix) {
      console.log('\nClearing mismatched images...')
      for (const r of allFailed) {
        const { error } = await sb
          .from('recipes')
          .update({ image_url: null })
          .eq('slug', r.slug)
        console.log(`  ${r.slug}: ${error ? 'FAILED' : 'cleared'}`)
      }
      console.log('Done! Re-fetch images with the improved search query.')
    } else {
      console.log('\nRun with --fix to clear these images.')
    }
  }

  console.log()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
