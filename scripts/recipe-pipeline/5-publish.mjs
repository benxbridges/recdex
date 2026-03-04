/**
 * Stage 5: Publish to Supabase
 *
 * Takes validated recipes that pass the confidence threshold and pushes them
 * to the Supabase `recipes` table. Recipes below the threshold are flagged
 * for manual review — they do NOT get published automatically.
 *
 * Behavior:
 *   - Upserts by slug (existing recipes are updated, new ones are inserted)
 *   - Strips internal pipeline metadata (_pipeline, _validation, _imageMetadata)
 *   - Sets status to 'published' for recipes above threshold
 *   - Sets status to 'draft' for recipes below threshold
 *   - Generates a publish report in pipeline-data/published/
 *
 * Usage:
 *   node 5-publish.mjs                           # Publish all validated recipes above threshold
 *   node 5-publish.mjs --include-drafts          # Also push drafts (as status='draft')
 *   node 5-publish.mjs --slug chicken-parmesan   # Publish one recipe
 *   node 5-publish.mjs --dry-run                 # Preview without writing to DB
 *   node 5-publish.mjs --force                   # Publish even below threshold
 *
 * Input:  pipeline-data/validated/{slug}.json
 * Output: Supabase recipes table + pipeline-data/published/{slug}.json
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs'
import {
  supabase, VALIDATED_DIR, PUBLISHED_DIR, MIN_CONFIDENCE_TO_PUBLISH, parseArgs
} from './config.mjs'

// --- Strip pipeline internals, prepare for Supabase ---

function prepareForPublish(recipe) {
  const {
    _pipeline, _validation, _imageMetadata, _needsManualSourcing, _suggestedSearches,
    ...recipeData
  } = recipe

  // For recipes exported from Supabase via Stage 0, restore preserved fields
  const existing = recipeData._existing || {}

  // Ensure all required fields have valid values
  return {
    slug: recipeData.slug,
    title: recipeData.title,
    description: recipeData.description || null,
    cuisine: recipeData.cuisine || null,
    difficulty: recipeData.difficulty || 'medium',
    time_total: recipeData.time_total || null,
    time_active: recipeData.time_active || existing.time_active || null,
    time_passive: recipeData.time_passive || existing.time_passive || null,
    time_passive_label: recipeData.time_passive_label || existing.time_passive_label || null,
    image_url: recipeData.image_url || existing.image_url || null,
    servings: recipeData.servings || null,
    servings_label: recipeData.servings_label || existing.servings_label || null,
    tags: recipeData.tags || existing.tags || [],
    ingredients: recipeData.ingredients || [],
    steps: recipeData.steps || [],
    // Preserve category and source classification for existing recipes
    ...(existing.category_id ? { category_id: existing.category_id } : {}),
    ...(existing.submitted_by ? { submitted_by: existing.submitted_by } : {}),
  }
}

// --- Main ---

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const includeDrafts = flags['include-drafts'] || false
  const force = flags['force'] || false
  const targetSlug = flags.slug || null

  // Find validated files
  let files
  if (targetSlug) {
    const path = `${VALIDATED_DIR}${targetSlug}.json`
    if (!existsSync(path)) {
      console.error(`Validated file not found: ${path}`)
      process.exit(1)
    }
    files = [path]
  } else {
    files = readdirSync(VALIDATED_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => `${VALIDATED_DIR}${f}`)
  }

  console.log(`🚀 Stage 5: Publish to Supabase`)
  console.log(`   Files: ${files.length}`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   Threshold: ${MIN_CONFIDENCE_TO_PUBLISH}/100`)
  console.log(`   Include drafts: ${includeDrafts}`)
  console.log(`   Force: ${force}`)
  console.log()

  let published = 0, drafted = 0, skipped = 0, errors = 0
  const report = { publishedAt: new Date().toISOString(), recipes: [] }

  for (const filePath of files) {
    const recipe = JSON.parse(readFileSync(filePath, 'utf-8'))
    const confidence = recipe._validation?.confidence || 0
    const validationFlags = recipe._validation?.flags || []

    console.log(`→ "${recipe.title}" (confidence: ${confidence}/100)`)

    // Determine status
    let status
    if (force || confidence >= MIN_CONFIDENCE_TO_PUBLISH) {
      status = 'published'
    } else {
      status = 'draft'
      if (!includeDrafts) {
        console.log(`  ⊘ Below threshold (${confidence} < ${MIN_CONFIDENCE_TO_PUBLISH}), skipping`)
        console.log(`    Flags: ${validationFlags.join(', ') || 'none'}`)
        skipped++
        report.recipes.push({
          slug: recipe.slug,
          title: recipe.title,
          confidence,
          status: 'skipped',
          flags: validationFlags,
        })
        continue
      }
    }

    const prepared = prepareForPublish(recipe)
    prepared.status = status

    if (!dryRun) {
      // Upsert by slug — update existing or insert new
      const { data, error } = await supabase
        .from('recipes')
        .upsert(prepared, { onConflict: 'slug' })
        .select('id, slug')

      if (error) {
        console.log(`  ✗ DB error: ${error.message}`)
        errors++
        report.recipes.push({
          slug: recipe.slug,
          title: recipe.title,
          confidence,
          status: 'error',
          error: error.message,
        })
        continue
      }

      console.log(`  ✓ ${status.toUpperCase()} — ${data?.[0]?.id || 'upserted'}`)
    } else {
      console.log(`  [dry-run] Would ${status}: ${recipe.slug}`)
    }

    // Save publish record
    const publishRecord = {
      ...prepared,
      _publishMeta: {
        publishedAt: new Date().toISOString(),
        confidence,
        status,
        flags: validationFlags,
        sourceCount: recipe._pipeline?.sourceCount || 0,
      },
    }

    if (!dryRun) {
      writeFileSync(
        `${PUBLISHED_DIR}${recipe.slug}.json`,
        JSON.stringify(publishRecord, null, 2)
      )
    }

    if (status === 'published') published++
    else drafted++

    report.recipes.push({
      slug: recipe.slug,
      title: recipe.title,
      confidence,
      status,
      flags: validationFlags,
    })
  }

  // Write summary report
  report.summary = { published, drafted, skipped, errors, total: files.length }
  if (!dryRun) {
    const reportPath = `${PUBLISHED_DIR}_report-${Date.now()}.json`
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\nReport saved: ${reportPath}`)
  }

  console.log(`\n--- Stage 5 Summary ---`)
  console.log(`Published: ${published}`)
  console.log(`Drafted:   ${drafted}`)
  console.log(`Skipped:   ${skipped}`)
  console.log(`Errors:    ${errors}`)
  console.log(`Total:     ${files.length}`)

  if (skipped > 0) {
    console.log(`\n💡 ${skipped} recipes below confidence threshold.`)
    console.log(`   Use --include-drafts to push as drafts, or --force to publish anyway.`)
    console.log(`   Run Stage 3 with --with-llm --verbose for detailed diagnostics.`)
  }
}

main().catch(console.error)
