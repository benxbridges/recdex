#!/usr/bin/env node
/**
 * auto-import.mjs — Fully automated recipe import for GitHub Actions
 *
 * Generates 25 new recipes per run using Claude, deduplicates against Supabase,
 * fetches Unsplash images, and publishes directly to the recipes table.
 *
 * Required env vars:
 *   SUPABASE_SERVICE_KEY  — Write access (bypasses RLS)
 *   ANTHROPIC_API_KEY     — Claude API for recipe generation
 *   UNSPLASH_ACCESS_KEY   — Image search (falls back to embedded key)
 *
 * Usage:
 *   node scripts/recipe-pipeline/auto-import.mjs
 *   node scripts/recipe-pipeline/auto-import.mjs --count 10
 *   node scripts/recipe-pipeline/auto-import.mjs --genre "Italian"
 *   node scripts/recipe-pipeline/auto-import.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js'

// ─── Config ────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const RECIPES_PER_RUN = 25
const UNSPLASH_RATE_LIMIT_MS = 1200

// ─── Genre rotation ────────────────────────────────────────────────────────

const GENRES = [
  'weeknight dinners',
  'baking and pastry',
  'Italian',
  'French',
  'Mexican',
  'Indian',
  'East Asian',
  'Middle Eastern',
  'African and Caribbean',
  'BBQ and grilling',
  'soups and stews',
  'breakfast and brunch',
  'vegetarian',
  'seafood',
]

function pickGenre() {
  // Use day-of-year to rotate deterministically, so each run on a different
  // day (or hour) picks a different genre. Multiple runs on the same day
  // will use the same genre, but that's fine — dedup prevents duplicates.
  const now = new Date()
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / 86400000
  )
  const hourSlot = Math.floor(now.getHours() / 4) // 6 slots per day
  const idx = (dayOfYear * 6 + hourSlot) % GENRES.length
  return GENRES[idx]
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const flags = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1]
        i++
      } else {
        flags[key] = true
      }
    }
  }
  return flags
}

// ─── Dedup ─────────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function isNearMatch(a, b) {
  const na = normalizeTitle(a)
  const nb = normalizeTitle(b)
  if (na === nb) return true
  // One contains the other (e.g. "Classic Tiramisu" vs "Tiramisu")
  if (na.includes(nb) || nb.includes(na)) return true
  // Check word overlap — if 80%+ of words match, it's a near-match
  const wordsA = na.split(' ')
  const wordsB = nb.split(' ')
  const shorter = wordsA.length < wordsB.length ? wordsA : wordsB
  const longer = wordsA.length >= wordsB.length ? wordsA : wordsB
  const overlap = shorter.filter((w) => longer.includes(w)).length
  return overlap / shorter.length >= 0.8
}

// ─── Claude API ────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt, apiKey, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 16000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (res.status === 429 || res.status >= 500) {
        const wait = Math.pow(2, attempt + 1) * 1000
        console.log(`  ⚠ API ${res.status}, retrying in ${wait / 1000}s...`)
        await sleep(wait)
        continue
      }

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Claude API error ${res.status}: ${body}`)
      }

      const data = await res.json()
      return data.content[0].text
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(Math.pow(2, attempt + 1) * 1000)
    }
  }
}

// ─── Unsplash ──────────────────────────────────────────────────────────────

async function fetchUnsplashImage(query, accessKey) {
  if (!accessKey) return null
  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', `${query} food`)
    url.searchParams.set('per_page', '3')
    url.searchParams.set('orientation', 'landscape')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })
    if (!res.ok) return null

    const data = await res.json()
    // Pick best photo: prefer ones with decent likes and resolution
    const photos = (data?.results || []).filter(
      (p) => p.width >= 1800 && (p.likes || 0) >= 5
    )
    const photo = photos[0] || data?.results?.[0]
    if (!photo?.urls?.regular) return null
    return { url: photo.urls.regular, credit: photo.user?.name || '' }
  } catch {
    return null
  }
}

// ─── Recipe generation prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a recipe writer for RecDex, a modern recipe platform.

Your writing style:
- Concise and practical — every word earns its place
- Warm but not cutesy. Confident but not preachy
- Instructions are clear, sequential, and action-oriented
- Use specific sensory cues ("until the onions are translucent and fragrant, about 3 minutes")
- Include timing estimates in steps where helpful
- Never use "Enjoy!" or "Serve and enjoy!" — end with the final practical step
- Descriptions: 1-2 sentences — what the dish IS and what makes this version worth making
- NEVER include publication names in titles (no "BA's Classic Minestrone" — just "Classic Minestrone")
- Credit the original source/author in source_attribution

You output ONLY valid JSON arrays. No markdown, no code fences, no explanation.`

function buildGenerationPrompt(genre, count, existingTitles) {
  const titleSample = existingTitles.slice(0, 80).join(', ')

  return `Generate exactly ${count} unique, high-quality recipes in the genre: "${genre}".

IMPORTANT — These titles ALREADY EXIST in our database. Do NOT generate any recipe with the same or very similar name:
${titleSample}

For each recipe, output a JSON object with these exact fields:
{
  "title": "Clean dish name — no publication names, no 'Best Ever' prefixes",
  "slug": "lowercase-hyphenated-url-safe",
  "description": "1-2 sentences. What it is + what makes this version worth making.",
  "cuisine": "Capitalize first letter. Use specific cuisines (e.g. 'Sichuan' not 'Chinese' when appropriate)",
  "time_total": "Human-readable: '25 min', '1 hr 30 min', '3 hrs'",
  "time_active": "Active hands-on time, same format",
  "servings": 4,
  "servings_label": "servings",
  "source_attribution": "Inspired by [original author/source]",
  "ingredients": [
    { "name": "ingredient name", "amount": "2", "unit": "cups", "group": "optional group name" }
  ],
  "steps": [
    { "step": 1, "text": "Action-oriented instruction with sensory cues and timing." }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
1. Every recipe must be a real, well-known dish with accurate ingredient ratios and techniques
2. Vary complexity — mix quick weeknight meals with longer weekend projects
3. Ingredients must have specific amounts and units (never "some" or "to taste" for main ingredients; "to taste" is OK for salt/pepper)
4. Steps must be sequential, clear, and include timing cues
5. Tags should include cuisine, meal type, key ingredients, and cooking method
6. Source real recipes from quality sources (Serious Eats, NYT Cooking, Bon Appétit, Food52, Kenji Lopez-Alt, etc.) and credit them
7. NEVER copy text verbatim — rewrite everything in RecDex voice
8. Double-check ingredient amounts are realistic (e.g., 2 cups flour + 1 cup butter for shortbread, not 1 tbsp butter)

Output a JSON array of ${count} recipe objects. Nothing else.`
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const count = parseInt(flags.count || RECIPES_PER_RUN, 10)
  const genre = flags.genre || pickGenre()

  // Validate env
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || 'JAdfIXIUipAqYws7sEKcAlQ1jf3frDUWTOT6ncLRXsQ'

  if (!serviceKey) {
    console.error('ERROR: SUPABASE_SERVICE_KEY not set')
    process.exit(1)
  }
  if (!anthropicKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, serviceKey)

  console.log(`\n🍳 RecDex Auto-Import`)
  console.log(`   Genre: ${genre}`)
  console.log(`   Count: ${count}`)
  console.log(`   Mode:  ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // ── Step 1: Fetch all existing titles for dedup ──
  console.log('📋 Fetching existing recipes for dedup check...')
  const allTitles = []
  const allSlugs = new Set()
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('recipes')
      .select('title, slug')
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('Supabase query error:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    for (const r of data) {
      allTitles.push(r.title)
      allSlugs.add(r.slug)
    }
    from += PAGE
    if (data.length < PAGE) break
  }
  console.log(`   Found ${allTitles.length} existing recipes\n`)

  // ── Step 2: Generate recipes with Claude ──
  console.log('🤖 Generating recipes with Claude...')
  const prompt = buildGenerationPrompt(genre, count, allTitles)
  const raw = await callClaude(SYSTEM_PROMPT, prompt, anthropicKey)

  // Parse JSON — handle potential markdown fences
  let recipes
  try {
    const cleaned = raw.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim()
    recipes = JSON.parse(cleaned)
  } catch (parseErr) {
    console.error('Failed to parse Claude response as JSON:')
    console.error(raw.slice(0, 500))
    process.exit(1)
  }

  if (!Array.isArray(recipes)) {
    console.error('Claude response is not an array')
    process.exit(1)
  }

  console.log(`   Generated ${recipes.length} recipes\n`)

  // ── Step 3: Dedup, validate, publish ──
  let published = 0
  let skipped = 0
  let errors = 0
  const results = []

  for (const recipe of recipes) {
    const title = recipe.title || 'Untitled'
    const slug = recipe.slug || slugify(title)

    // Dedup: exact slug match
    if (allSlugs.has(slug)) {
      console.log(`  ⊘ SKIP (slug exists): "${title}"`)
      skipped++
      continue
    }

    // Dedup: near-match title check
    const nearMatch = allTitles.find((t) => isNearMatch(t, title))
    if (nearMatch) {
      console.log(`  ⊘ SKIP (near-match "${nearMatch}"): "${title}"`)
      skipped++
      continue
    }

    // Validate required fields
    if (!recipe.ingredients?.length || !recipe.steps?.length) {
      console.log(`  ✗ SKIP (missing ingredients/steps): "${title}"`)
      skipped++
      continue
    }

    // Fetch Unsplash image
    let imageUrl = null
    let photoCredit = null
    if (!dryRun) {
      const img = await fetchUnsplashImage(title, unsplashKey)
      if (img) {
        imageUrl = img.url
        photoCredit = img.credit
      }
      await sleep(UNSPLASH_RATE_LIMIT_MS)
    }

    // Prepare record
    const record = {
      slug,
      title,
      description: recipe.description || null,
      cuisine: recipe.cuisine || null,
      difficulty: 'medium',
      time_total: recipe.time_total || null,
      time_active: recipe.time_active || null,
      servings: recipe.servings || null,
      servings_label: recipe.servings_label || 'servings',
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      tags: recipe.tags || [],
      status: 'published',
      source: 'auto-import',
      source_attribution: recipe.source_attribution || null,
      source_url: recipe.source_url || null,
      image_url: imageUrl,
      photo_credit: photoCredit,
    }

    if (dryRun) {
      console.log(`  [dry-run] Would publish: "${title}" (${slug})`)
      published++
      continue
    }

    // Insert to Supabase
    const { error: insertErr } = await supabase.from('recipes').insert(record)
    if (insertErr) {
      // Might be a slug collision from a concurrent run
      if (insertErr.message?.includes('duplicate')) {
        console.log(`  ⊘ SKIP (duplicate slug on insert): "${title}"`)
        skipped++
      } else {
        console.log(`  ✗ ERROR: "${title}" — ${insertErr.message}`)
        errors++
      }
      continue
    }

    console.log(`  ✓ Published: "${title}" (${slug})`)
    published++
    allTitles.push(title)
    allSlugs.add(slug)
    results.push({ title, slug })
  }

  // ── Summary ──
  console.log(`\n─── Import Summary ───`)
  console.log(`Genre:     ${genre}`)
  console.log(`Published: ${published}`)
  console.log(`Skipped:   ${skipped}`)
  console.log(`Errors:    ${errors}`)
  console.log(`Total:     ${recipes.length}`)

  if (results.length > 0) {
    console.log(`\nNew recipes:`)
    for (const r of results) {
      console.log(`  • ${r.title} → /${r.slug}`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
