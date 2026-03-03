/**
 * run-pipeline.mjs — Orchestrator for the full recipe data pipeline
 *
 * Runs all 5 stages in sequence for a set of recipe names.
 * Each stage is independently re-runnable — if a stage fails, fix the issue
 * and re-run just that stage, then continue from where you left off.
 *
 * Usage:
 *   # Full pipeline for specific recipes
 *   SPOONACULAR_API_KEY=xxx ANTHROPIC_API_KEY=xxx node run-pipeline.mjs "chicken parmesan" "pad thai"
 *
 *   # From a file of recipe names (one per line)
 *   SPOONACULAR_API_KEY=xxx ANTHROPIC_API_KEY=xxx node run-pipeline.mjs --from-file recipes.txt
 *
 *   # Run specific stages only
 *   node run-pipeline.mjs --stage 3                         # Just validation
 *   node run-pipeline.mjs --stage 4 --from-db               # Just images, from Supabase
 *   ANTHROPIC_API_KEY=xxx node run-pipeline.mjs --stage 3 --with-llm  # Validation + LLM
 *
 *   # Options
 *   node run-pipeline.mjs --dry-run "recipe name"           # Preview all stages
 *   node run-pipeline.mjs --verbose "recipe name"           # Detailed output
 *
 * Environment variables:
 *   SPOONACULAR_API_KEY  — Required for Stage 1
 *   ANTHROPIC_API_KEY    — Required for Stages 2, 3 (with --with-llm)
 *   UNSPLASH_ACCESS_KEY  — Optional (has default)
 *
 * Pipeline stages:
 *   1. Source    — Aggregate from real recipe APIs/databases
 *   2. Synthesize — Rewrite in Recdex brand voice via Claude
 *   3. Validate  — Multi-factor confidence scoring + optional LLM proofreading
 *   4. Images    — Enhanced Unsplash search with quality scoring
 *   5. Publish   — Push to Supabase with confidence-gated status
 */

import { execFileSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { parseArgs } from './config.mjs'

const STAGES = [
  { num: 1, name: 'Source Recipes', script: '1-source-recipes.mjs', needsKey: 'SPOONACULAR_API_KEY' },
  { num: 2, name: 'Synthesize', script: '2-synthesize.mjs', needsKey: 'ANTHROPIC_API_KEY' },
  { num: 3, name: 'Validate & Score', script: '3-validate.mjs', needsKey: null },
  { num: 4, name: 'Fetch Images', script: '4-fetch-images.mjs', needsKey: null },
  { num: 5, name: 'Publish', script: '5-publish.mjs', needsKey: null },
]

function runStage(stage, extraArgs = []) {
  const scriptPath = new URL(`./${stage.script}`, import.meta.url).pathname
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  STAGE ${stage.num}: ${stage.name}`)
  console.log(`${'='.repeat(60)}\n`)

  if (stage.needsKey && !process.env[stage.needsKey]) {
    console.log(`⚠ Skipping: ${stage.needsKey} not set`)
    return false
  }

  try {
    execFileSync('node', [scriptPath, ...extraArgs], {
      stdio: 'inherit',
      env: process.env,
    })
    return true
  } catch (err) {
    console.error(`\n✗ Stage ${stage.num} failed: ${err.message}`)
    return false
  }
}

function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const verbose = flags.verbose || false
  const withLlm = flags['with-llm'] || false
  const fromDb = flags['from-db'] || false
  const targetStage = flags.stage ? parseInt(flags.stage) : null
  const fromFile = flags['from-file'] || null

  // Get recipe names
  let recipeNames = flags._positional || []
  if (fromFile) {
    if (!existsSync(fromFile)) {
      console.error(`File not found: ${fromFile}`)
      process.exit(1)
    }
    recipeNames = readFileSync(fromFile, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean)
  }

  console.log(`🍳 Recdex Recipe Pipeline`)
  console.log(`${'─'.repeat(40)}`)
  console.log(`  Recipes:  ${recipeNames.length || '(from pipeline-data)'}`)
  console.log(`  Stage:    ${targetStage || 'all (1–5)'}`)
  console.log(`  Dry run:  ${dryRun}`)
  console.log(`  LLM:      ${withLlm}`)
  console.log(`  Verbose:  ${verbose}`)

  // Check required API keys
  const missing = []
  if (!process.env.SPOONACULAR_API_KEY && (!targetStage || targetStage === 1)) {
    missing.push('SPOONACULAR_API_KEY (Stage 1)')
  }
  if (!process.env.ANTHROPIC_API_KEY && (!targetStage || targetStage === 2 || (targetStage === 3 && withLlm))) {
    missing.push('ANTHROPIC_API_KEY (Stage 2/3)')
  }
  if (missing.length > 0) {
    console.log(`\n⚠ Missing environment variables:`)
    missing.forEach(k => console.log(`    ${k}`))
    if (!targetStage) {
      console.log(`\n  Stages requiring missing keys will be skipped.`)
      console.log(`  Use --stage N to run a specific stage.\n`)
    }
  }

  const stagesToRun = targetStage
    ? STAGES.filter(s => s.num === targetStage)
    : STAGES

  if (stagesToRun.length === 0) {
    console.error(`Invalid stage: ${targetStage}. Must be 1-5.`)
    process.exit(1)
  }

  const startTime = Date.now()
  const results = []

  for (const stage of stagesToRun) {
    // Build stage-specific args
    const args = []

    if (dryRun) args.push('--dry-run')
    if (verbose) args.push('--verbose')

    // Stage-specific args
    if (stage.num === 1) {
      // Stage 1 takes recipe names as positional args
      if (fromFile) {
        args.push('--from-file', fromFile)
      } else if (recipeNames.length > 0) {
        args.push(...recipeNames)
      } else {
        console.log(`\n⚠ Stage 1 needs recipe names. Skipping.`)
        results.push({ stage: stage.num, success: false, reason: 'no recipes specified' })
        continue
      }
    }

    if (stage.num === 3 && withLlm) args.push('--with-llm')
    if (stage.num === 4 && fromDb) args.push('--from-db')

    const success = runStage(stage, args)
    results.push({ stage: stage.num, success })

    if (!success && !targetStage) {
      console.log(`\n⚠ Stage ${stage.num} failed. Subsequent stages may not have data to process.`)
      console.log(`  Fix the issue and re-run: node run-pipeline.mjs --stage ${stage.num} ...`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  PIPELINE COMPLETE — ${elapsed}s`)
  console.log(`${'='.repeat(60)}`)
  for (const r of results) {
    const icon = r.success ? '✓' : '✗'
    const stage = STAGES.find(s => s.num === r.stage)
    console.log(`  ${icon} Stage ${r.stage}: ${stage.name}${r.reason ? ` (${r.reason})` : ''}`)
  }
}

main()
