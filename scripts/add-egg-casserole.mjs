#!/usr/bin/env node
/**
 * Add Scrambled Egg Casserole to RecDex.
 * Run: node scripts/add-egg-casserole.mjs
 * Requires: SUPABASE_SERVICE_KEY in .env.local or environment
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const sb = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

const recipe = {
  slug: 'scrambled-egg-casserole',
  title: 'Scrambled Egg Casserole',
  description: 'A make-ahead brunch showstopper — soft-scrambled eggs layered with sautéed mushrooms, ham, and a from-scratch cheese sauce, topped with buttery breadcrumbs and baked until golden. Assemble the night before, bake in the morning.',
  cuisine: 'American',
  time_total: 60,
  time_active: 45,
  time_passive: 480,
  time_passive_label: 'overnight chill',
  servings: 10,
  servings_label: 'servings',
  source_attribution: 'Adapted from Southern Living, 1980',
  ingredients: [
    { name: 'cubed ham or Canadian bacon', amount: '1', unit: 'cup', group: 'Casserole' },
    { name: 'chopped green onion', amount: '¼', unit: 'cup', group: 'Casserole' },
    { name: 'butter', amount: '3', unit: 'tbsp', group: 'Casserole' },
    { name: 'eggs, beaten well', amount: '12', unit: '', group: 'Casserole' },
    { name: 'fresh mushrooms, sliced', amount: '8', unit: 'oz', group: 'Casserole' },
    { name: 'melted butter', amount: '¼', unit: 'cup', group: 'Topping' },
    { name: 'fresh breadcrumbs', amount: '2¼', unit: 'cups', group: 'Topping' },
    { name: 'paprika', amount: '', unit: '', group: 'Topping' },
    { name: 'butter', amount: '2', unit: 'tbsp', group: 'Cheese Sauce' },
    { name: 'flour', amount: '2½', unit: 'tbsp', group: 'Cheese Sauce' },
    { name: 'milk', amount: '2', unit: 'cups', group: 'Cheese Sauce' },
    { name: 'salt', amount: '½', unit: 'tsp', group: 'Cheese Sauce' },
    { name: 'pepper', amount: '1', unit: 'dash', group: 'Cheese Sauce' },
    { name: 'shredded sharp cheddar cheese', amount: '1', unit: 'cup', group: 'Cheese Sauce' },
  ],
  steps: [
    { step: 1, text: 'Make the cheese sauce: melt 2 tablespoons butter in a saucepan over medium heat. Blend in flour and cook the roux for about 2 minutes, stirring constantly. Gradually add milk, whisking until smooth. Cook over medium heat until thickened, stirring constantly. Season with salt and pepper, then add the shredded cheddar and stir until melted and smooth. Set aside with plastic wrap pressed directly on the surface to prevent a skin from forming.', timer_minutes: null },
    { step: 2, text: 'Sauté the mushrooms in 1 tablespoon butter over medium-high heat until the liquid is released and evaporated, about 3 minutes. Transfer to a plate and set aside.', timer_minutes: 3 },
    { step: 3, text: 'Add the remaining 2 tablespoons butter to the skillet. Sauté the ham and green onions until the onions are tender, about 2 minutes.', timer_minutes: null },
    { step: 4, text: 'Add the beaten eggs to the skillet and cook over medium-high heat, stirring gently to form large, soft curds. When the eggs are just set, fold in the sautéed mushrooms and cheese sauce until evenly combined.', timer_minutes: null },
    { step: 5, text: 'Spoon the egg mixture into a greased 13x9x2-inch baking pan, spreading evenly.', timer_minutes: null },
    { step: 6, text: 'Combine the melted butter and breadcrumbs, mixing well. Spread the breadcrumb mixture evenly over the eggs. Sprinkle with paprika.', timer_minutes: null },
    { step: 7, text: 'Cover the casserole tightly and refrigerate overnight.', timer_minutes: null },
    { step: 8, text: 'When ready to bake, preheat the oven to 350°F. Uncover the casserole and bake for 30 minutes, or until heated through and the top is golden.', timer_minutes: 30 },
  ],
  tags: ['brunch', 'casserole', 'eggs', 'make-ahead', 'cheese', 'breakfast', 'ham', 'mushrooms'],
  difficulty: 'easy',
  status: 'published',
  source: 'community',
}

async function main() {
  const { data: existing } = await sb.from('recipes').select('slug').eq('slug', recipe.slug).single()
  if (existing) {
    console.log(`⏭ Already exists: "${recipe.title}"`)
    return
  }

  const { error } = await sb.from('recipes').insert(recipe)
  if (error) {
    console.error(`✗ Failed:`, error.message)
    process.exit(1)
  }
  console.log(`✓ Published: "${recipe.title}"`)
  console.log(`  → /recipe/${recipe.slug}`)
  console.log(`  → /recipe/${recipe.slug}/cook`)
}

main()
