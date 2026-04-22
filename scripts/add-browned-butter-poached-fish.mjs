#!/usr/bin/env node
/**
 * Add Alison Roman's Browned Butter Poached Fish with Mussels to RecDex,
 * and set it as Tonight's Pick (featured).
 * Run: node --env-file=.env.local scripts/add-browned-butter-poached-fish.mjs
 * Requires: SUPABASE_SERVICE_KEY in .env.local or environment
 */

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

const recipe = {
  slug: 'browned-butter-poached-fish-with-mussels',
  title: 'Browned Butter Poached Fish with Mussels',
  description: 'A 25-minute skillet stew leaning toward bouillabaisse: flaky white fish and mussels poached in a wine-spiked browned butter broth with soft, golden lemon slices. Serve with thick bread and aioli for dunking.',
  cuisine: 'French',
  time_total: 25,
  time_active: 25,
  servings: 4,
  servings_label: 'servings',
  source_attribution: 'Adapted from Alison Roman',
  ingredients: [
    { name: 'Lemon, halved crosswise, seeds removed', amount: '1', unit: '' },
    { name: 'Unsalted butter', amount: '6', unit: 'tbsp' },
    { name: 'Olive oil', amount: '2', unit: 'tbsp' },
    { name: 'Garlic cloves, thinly sliced', amount: '4', unit: '' },
    { name: 'Dry white wine', amount: '1½', unit: 'cups' },
    { name: 'Thyme sprigs (optional)', amount: 'A few', unit: '' },
    { name: 'Kosher salt and freshly ground black pepper', amount: '', unit: '' },
    { name: 'Skinless white fish fillets, such as fluke, flounder, sole or cod', amount: '1', unit: 'lb' },
    { name: 'Mussels, tiny beards removed', amount: '2', unit: 'lbs' },
    { name: 'Dill, parsley or chives, coarsely chopped, for serving', amount: '', unit: '' },
    { name: 'Thick-cut bread, for serving', amount: '', unit: '' },
    { name: 'Aioli, for serving', amount: '', unit: '' },
  ],
  steps: [
    { step: 1, text: 'Thinly slice half the lemon and set the other half aside for juicing later.', timer_minutes: null },
    { step: 2, text: 'Heat the butter in a large skillet over medium-high. Once it melts and starts to foam, add the olive oil to keep it from burning. Add the garlic and lemon slices and season with salt and pepper. Cook, swirling the skillet occasionally, until the garlic and lemons are softened and starting to brown, 3 to 5 minutes.', timer_minutes: 4 },
    { step: 3, text: 'Add the wine and thyme (if using) and let it simmer until reduced by about half, 2 to 3 minutes.', timer_minutes: 3 },
    { step: 4, text: 'Add 2 cups of water and season with salt and pepper. Bring to a simmer, then gently nestle in the fish and mussels. Season the fish with salt and pepper and reduce the heat to medium. Cover with a lid — or a sheet tray if nothing fits.', timer_minutes: null },
    { step: 5, text: 'Cook, shaking the skillet occasionally, until the fish is just cooked through and the mussels have fully opened, 3 to 4 minutes. Discard any mussels that stay shut.', timer_minutes: 4 },
    { step: 6, text: 'Remove from the heat and squeeze some of the reserved lemon over everything. Taste the broth and adjust with more salt, pepper, and lemon as you like.', timer_minutes: null },
    { step: 7, text: 'Scatter the herbs over the top and serve with a bowl of aioli and plenty of thick bread for sopping up the broth.', timer_minutes: null },
  ],
  tags: ['fish', 'mussels', 'seafood', 'stew', 'bouillabaisse', 'brown butter', 'one-pan', 'skillet', 'weeknight', 'quick', 'dinner', 'alison roman'],
  difficulty: 'easy',
  status: 'published',
  source: 'community',
}

async function main() {
  const { data: existing } = await sb.from('recipes').select('slug').eq('slug', recipe.slug).maybeSingle()
  if (existing) {
    console.log(`⏭ Already exists: "${recipe.title}"`)
  } else {
    const { error } = await sb.from('recipes').insert(recipe)
    if (error) {
      console.error(`✗ Insert failed:`, error.message)
      process.exit(1)
    }
    console.log(`✓ Published: "${recipe.title}"`)
    console.log(`  → /recipe/${recipe.slug}`)
    console.log(`  → /recipe/${recipe.slug}/cook`)
  }

  // Set as Tonight's Pick: clear all existing featured flags, then set this one.
  const { error: clearErr } = await sb.from('recipes').update({ featured: false }).eq('featured', true)
  if (clearErr) {
    console.error(`✗ Clearing previous featured failed:`, clearErr.message)
    process.exit(1)
  }
  const { error: setErr } = await sb.from('recipes').update({ featured: true }).eq('slug', recipe.slug)
  if (setErr) {
    console.error(`✗ Setting featured failed:`, setErr.message)
    process.exit(1)
  }
  console.log(`★ Featured as Tonight's Pick`)
}

main().catch(console.error)
