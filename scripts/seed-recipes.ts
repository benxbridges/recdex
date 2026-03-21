/**
 * Seed script: Import recipes from curated URL list
 *
 * Usage:
 *   npx tsx scripts/seed-recipes.ts
 *   npx tsx scripts/seed-recipes.ts --start=50 --limit=10
 *   npx tsx scripts/seed-recipes.ts --dry-run --limit=5
 *
 * Requires env vars: ANTHROPIC_API_KEY, SUPABASE_SERVICE_KEY
 * Optional: UNSPLASH_ACCESS_KEY (skipped during bulk import by default)
 */

import { RECIPE_URLS } from './recipe-urls'

const API_BASE = process.env.API_BASE || 'http://localhost:3000'
const DELAY_MS = 4000 // Delay between API calls (rate limiting + server stability)

// Parse CLI args
const args = process.argv.slice(2)
const getArg = (name: string): string | undefined => {
  const arg = args.find(a => a.startsWith(`--${name}=`))
  return arg?.split('=')[1]
}
const startIndex = parseInt(getArg('start') || '0', 10)
const limit = parseInt(getArg('limit') || String(RECIPE_URLS.length), 10)
const dryRun = args.includes('--dry-run')
const skipImages = !args.includes('--with-images') // Skip Unsplash by default

function slugify(title: string): string {
  const hash = Math.random().toString(36).substring(2, 10)
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60) + '-' + hash
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function extractRecipe(url: string, retries = 2): Promise<{ recipe: Record<string, unknown>; author: string | null } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`  [extract] Retry ${attempt}/${retries}...`)
        await sleep(5000)
      }

      const res = await fetch(`${API_BASE}/api/extract-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          platform: 'web',
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error(`  [extract] HTTP ${res.status}: ${text.slice(0, 200)}`)
        if (attempt < retries) continue
        return null
      }

      const data = await res.json()
      if (data.error) {
        console.error(`  [extract] Error: ${data.error}`)
        return null // Don't retry content errors (404, insufficient_content)
      }

      // API returns { recipe: {...}, authorName: "..." }
      const recipeData = data.recipe || data
      return {
        recipe: recipeData,
        author: data.authorName || recipeData.authorName || null,
      }
    } catch (err) {
      console.error(`  [extract] Exception:`, err instanceof Error ? err.message : err)
      if (attempt === retries) return null
    }
  }
  return null
}

async function publishRecipe(
  extracted: Record<string, unknown>,
  sourceUrl: string,
  source: string,
  author: string | null
): Promise<{ success: boolean; skipped?: boolean; slug?: string }> {
  const title = extracted.title as string
  const slug = slugify(title)
  const hostname = new URL(sourceUrl).hostname.replace('www.', '')

  const recipe = {
    slug,
    title,
    description: extracted.description || null,
    cuisine: extracted.cuisine || null,
    difficulty: extracted.difficulty || 'easy',
    time_total: extracted.time_total || null,
    time_active: extracted.time_active || null,
    servings: extracted.servings || null,
    ingredients: extracted.ingredients || [],
    steps: extracted.steps || [],
    image_url: skipImages ? null : undefined, // null = skip Unsplash, undefined = let API fetch
    source_url: sourceUrl,
    source_attribution: hostname,
    creator_name: author || null,
  }

  try {
    const res = await fetch(`${API_BASE}/api/publish-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`  [publish] HTTP ${res.status}: ${text.slice(0, 200)}`)
      return { success: false }
    }

    const data = await res.json()
    return { success: data.success, skipped: data.skipped, slug: data.slug || slug }
  } catch (err) {
    console.error(`  [publish] Exception:`, err instanceof Error ? err.message : err)
    return { success: false }
  }
}

async function main() {
  const urls = RECIPE_URLS.slice(startIndex, startIndex + limit)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`RecDex Seed Import`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Source: ${urls.length} URLs (index ${startIndex} to ${startIndex + urls.length - 1})`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (extract only)' : 'LIVE (extract + publish)'}`)
  console.log(`Images: ${skipImages ? 'Skipped (run fetch-images.ts later)' : 'Enabled'}`)
  console.log(`API: ${API_BASE}`)
  console.log(`${'='.repeat(60)}\n`)

  const results = { success: 0, failed: 0, skipped: 0 }
  const failures: { index: number; url: string; reason: string }[] = []

  for (let i = 0; i < urls.length; i++) {
    const entry = urls[i]
    const globalIndex = startIndex + i
    const progress = `[${globalIndex + 1}/${startIndex + urls.length}]`

    console.log(`${progress} ${entry.source.toUpperCase()} | ${entry.category} | ${entry.url.slice(0, 80)}...`)

    // Extract
    const extracted = await extractRecipe(entry.url)
    if (!extracted) {
      console.log(`  FAILED: extraction failed\n`)
      results.failed++
      failures.push({ index: globalIndex, url: entry.url, reason: 'extraction_failed' })
      await sleep(DELAY_MS)
      continue
    }

    const title = extracted.recipe.title as string
    console.log(`  Title: "${title}"`)
    console.log(`  Author: ${extracted.author || 'unknown'}`)
    console.log(`  Confidence: ${extracted.recipe.confidence || 'unknown'}`)

    if (dryRun) {
      const ingredients = (extracted.recipe.ingredients as unknown[])?.length || 0
      const steps = (extracted.recipe.steps as unknown[])?.length || 0
      console.log(`  Ingredients: ${ingredients}, Steps: ${steps}`)
      console.log(`  DRY RUN — not publishing\n`)
      results.success++
      await sleep(DELAY_MS)
      continue
    }

    // Publish
    const result = await publishRecipe(extracted.recipe, entry.url, entry.source, extracted.author)
    if (result.skipped) {
      console.log(`  SKIPPED: slug already exists\n`)
      results.skipped++
    } else if (result.success) {
      console.log(`  PUBLISHED: /recipe/${result.slug}\n`)
      results.success++
    } else {
      console.log(`  FAILED: publish failed\n`)
      results.failed++
      failures.push({ index: globalIndex, url: entry.url, reason: 'publish_failed' })
    }

    await sleep(DELAY_MS)
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`IMPORT COMPLETE`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Success: ${results.success}`)
  console.log(`Skipped: ${results.skipped}`)
  console.log(`Failed:  ${results.failed}`)

  if (failures.length > 0) {
    console.log(`\nFailed URLs:`)
    failures.forEach(f => console.log(`  [${f.index}] ${f.reason}: ${f.url}`))
  }

  if (!dryRun && skipImages) {
    console.log(`\nNext step: Run 'npx tsx scripts/fetch-images.ts' to backfill images from Unsplash`)
  }

  console.log()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
