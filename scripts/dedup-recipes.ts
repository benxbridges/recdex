/**
 * Deduplicate recipes in Supabase
 *
 * Finds duplicate recipes (same title, case-insensitive), keeps the oldest
 * one per group, and deletes the rest. If a newer duplicate has an image
 * but the oldest doesn't, copies image_url/photo_credit before deleting.
 *
 * Usage:
 *   npx tsx scripts/dedup-recipes.ts --dry-run   # preview changes
 *   npx tsx scripts/dedup-recipes.ts              # actually delete dupes
 *
 * Requires: SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Load env ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../../.env.local'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq)
        const val = trimmed.slice(eq + 1)
        if (!process.env[key]) process.env[key] = val
      }
      return
    }
  }
}

loadEnv()

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not found. Check .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const dryRun = process.argv.includes('--dry-run')

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (dryRun) {
    console.log('=== DRY RUN MODE — no changes will be made ===\n')
  }

  // Fetch all recipes
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, slug, title, image_url, photo_credit, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch recipes:', error.message)
    process.exit(1)
  }

  if (!recipes || recipes.length === 0) {
    console.log('No recipes found.')
    return
  }

  console.log(`Fetched ${recipes.length} recipes.\n`)

  // Group by case-insensitive title
  const titleGroups = new Map<string, typeof recipes>()
  for (const r of recipes) {
    const normalized = (r.title || '').toLowerCase().trim()
    if (!normalized) continue
    const group = titleGroups.get(normalized) || []
    group.push(r)
    titleGroups.set(normalized, group)
  }

  const dupeGroups = [...titleGroups.entries()].filter(([, group]) => group.length > 1)

  if (dupeGroups.length === 0) {
    console.log('No duplicates found. Database is clean!')
    return
  }

  let totalToDelete = 0
  let imagesPreserved = 0
  let deleted = 0

  for (const [title, group] of dupeGroups) {
    // Group is already sorted by created_at ascending (oldest first)
    const keeper = group[0]
    const toDelete = group.slice(1)
    totalToDelete += toDelete.length

    console.log(`\nDuplicate: "${title}" (${group.length} copies)`)
    console.log(`  KEEP:   id=${keeper.id}  slug=${keeper.slug}  created=${keeper.created_at?.slice(0, 10)}  image=${keeper.image_url ? 'yes' : 'no'}`)

    // Check if we need to preserve an image from a newer dupe
    if (!keeper.image_url) {
      const withImage = toDelete.find(r => !!r.image_url)
      if (withImage) {
        imagesPreserved++
        console.log(`  COPY IMAGE from id=${withImage.id}: ${withImage.image_url}`)
        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from('recipes')
            .update({
              image_url: withImage.image_url,
              photo_credit: withImage.photo_credit,
            })
            .eq('id', keeper.id)

          if (updateErr) {
            console.error(`    ERROR copying image: ${updateErr.message}`)
          } else {
            console.log(`    Image copied successfully.`)
          }
        }
      }
    }

    for (const r of toDelete) {
      console.log(`  DELETE: id=${r.id}  slug=${r.slug}  created=${r.created_at?.slice(0, 10)}  image=${r.image_url ? 'yes' : 'no'}`)
      if (!dryRun) {
        const { error: deleteErr } = await supabase
          .from('recipes')
          .delete()
          .eq('id', r.id)

        if (deleteErr) {
          console.error(`    ERROR deleting: ${deleteErr.message}`)
        } else {
          deleted++
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50))
  console.log(`Duplicate groups found: ${dupeGroups.length}`)
  console.log(`Recipes to delete: ${totalToDelete}`)
  console.log(`Images preserved from newer dupes: ${imagesPreserved}`)
  if (!dryRun) {
    console.log(`Actually deleted: ${deleted}`)
  } else {
    console.log(`(dry run — nothing was changed)`)
  }
  console.log()
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
