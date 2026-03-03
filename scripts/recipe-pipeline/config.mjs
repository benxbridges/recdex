/**
 * config.mjs — Shared configuration for the recipe data pipeline
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY   — Required for Stage 2 (synthesis) and Stage 3 (validation)
 *   SPOONACULAR_API_KEY — Required for Stage 1 (sourcing from recipe APIs)
 *   UNSPLASH_ACCESS_KEY — Optional override (defaults to embedded key)
 */

import { createClient } from '@supabase/supabase-js'

// --- Supabase ---
export const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- API Keys ---
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
export const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || ''
export const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'JAdfIXIUipAqYws7sEKcAlQ1jf3frDUWTOT6ncLRXsQ'

// --- Confidence scoring weights ---
export const CONFIDENCE_WEIGHTS = {
  sourceCount: 0.25,        // How many independent sources confirm this recipe
  ratioPlausibility: 0.25,  // Are ingredient ratios within sane bounds
  techniqueValidity: 0.20,  // Do cooking methods match the ingredients
  completeness: 0.15,       // All schema fields populated, steps sequential
  nutritionalSanity: 0.15,  // Rough caloric estimate is plausible for the dish type
}

// --- Thresholds ---
export const MIN_CONFIDENCE_TO_PUBLISH = 70  // Recipes below this stay in 'draft'
export const MIN_SOURCES_FOR_HIGH_CONFIDENCE = 3
export const MAX_SOURCES_SCORED = 10  // Cap for source count scoring (10+ = perfect score)

// --- Unsplash (enhanced) ---
export const UNSPLASH_MIN_LIKES = 15      // Stricter than v2 (was 10)
export const UNSPLASH_MIN_WIDTH = 1800    // Stricter than v2 (was 1500)
export const UNSPLASH_RATE_LIMIT_MS = 1200

// --- Pipeline data paths ---
export const DATA_DIR = new URL('./pipeline-data/', import.meta.url).pathname
export const SOURCED_DIR = `${DATA_DIR}sourced/`
export const SYNTHESIZED_DIR = `${DATA_DIR}synthesized/`
export const VALIDATED_DIR = `${DATA_DIR}validated/`
export const PUBLISHED_DIR = `${DATA_DIR}published/`

// --- Brand voice prompt ---
export const BRAND_VOICE_SYSTEM = `You are a recipe writer for Recdex, a modern recipe platform.

Your writing style:
- Concise and practical — every word earns its place
- Warm but not cutesy. Confident but not preachy
- Written for home cooks who take cooking seriously but don't take themselves seriously
- Instructions are clear, sequential, and action-oriented
- Use specific sensory cues ("until the onions are translucent and fragrant, about 3 minutes") instead of vague ones ("cook until done")
- Include timing estimates in steps where helpful
- Avoid filler phrases like "In a large bowl" when context is obvious
- Never use "Enjoy!" or "Serve and enjoy!" — end with the final practical step
- Keep descriptions to 1-2 sentences: what the dish IS and what makes this version worth making

Your output must conform exactly to this JSON schema for ingredients and steps.`

// --- Helpers ---
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function parseArgs(argv) {
  const args = argv.slice(2)
  const flags = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      // Check if next arg is a value (not another flag)
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1]
        i++
      } else {
        flags[key] = true
      }
    } else {
      // Positional args stored as _positional
      flags._positional = flags._positional || []
      flags._positional.push(args[i])
    }
  }
  return flags
}
