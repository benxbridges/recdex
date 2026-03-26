#!/usr/bin/env node
/**
 * Add sweet potato recipes to RecDex.
 * Run: node scripts/add-sweet-potato-recipes.mjs
 * Requires: SUPABASE_SERVICE_KEY in .env.local or environment
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const sb = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

const recipes = [
  {
    slug: 'miso-glazed-sweet-potatoes',
    title: 'Miso-Glazed Sweet Potatoes',
    description: 'Roasted sweet potato wedges with a caramelized white miso glaze — salty, sweet, and deeply savory. The kind of side dish that steals the show.',
    cuisine: 'Japanese-American',
    time_total: 45,
    time_active: 15,
    servings: 4,
    servings_label: 'servings',
    ingredients: [
      { name: 'Sweet potatoes', amount: '2', unit: 'lbs', group: null },
      { name: 'White miso paste', amount: '3', unit: 'tbsp', group: null },
      { name: 'Maple syrup', amount: '2', unit: 'tbsp', group: null },
      { name: 'Rice vinegar', amount: '1', unit: 'tbsp', group: null },
      { name: 'Sesame oil', amount: '1', unit: 'tbsp', group: null },
      { name: 'Neutral oil', amount: '2', unit: 'tbsp', group: null },
      { name: 'Garlic', amount: '3', unit: 'cloves', group: null },
      { name: 'Fresh ginger', amount: '1', unit: 'inch piece', group: null },
      { name: 'Toasted sesame seeds', amount: '1', unit: 'tbsp', group: null },
      { name: 'Scallions', amount: '3', unit: '', group: null },
    ],
    steps: [
      { step: 1, text: 'Preheat the oven to 425°F. Line a sheet pan with parchment paper.', timer_minutes: null },
      { step: 2, text: 'Peel the sweet potatoes and cut into 1-inch wedges. Toss with neutral oil and a generous pinch of salt. Spread in a single layer on the sheet pan.', timer_minutes: null },
      { step: 3, text: 'Roast until the bottoms are golden and caramelized, about 25 minutes, flipping halfway through.', timer_minutes: 25 },
      { step: 4, text: 'While the potatoes roast, whisk together the miso paste, maple syrup, rice vinegar, sesame oil, minced garlic, and grated ginger until smooth.', timer_minutes: null },
      { step: 5, text: 'Remove the potatoes from the oven and drizzle the miso glaze over top, tossing gently to coat. Return to the oven for 5 minutes until the glaze is bubbling and caramelized.', timer_minutes: 5 },
      { step: 6, text: 'Transfer to a serving plate. Top with toasted sesame seeds and thinly sliced scallions.', timer_minutes: null },
    ],
    tags: ['sweet potato', 'miso', 'vegetarian', 'side dish', 'roasted', 'Japanese'],
    source_attribution: 'Inspired by NYT Cooking',
  },
  {
    slug: 'sweet-potato-black-bean-tacos',
    title: 'Sweet Potato and Black Bean Tacos',
    description: 'Spiced roasted sweet potatoes and black beans piled into warm tortillas with a bright lime crema. Weeknight-fast, satisfying, entirely plant-based if you want it to be.',
    cuisine: 'Mexican',
    time_total: 35,
    time_active: 20,
    servings: 4,
    servings_label: 'servings (8 tacos)',
    ingredients: [
      { name: 'Sweet potatoes', amount: '1.5', unit: 'lbs', group: null },
      { name: 'Olive oil', amount: '2', unit: 'tbsp', group: null },
      { name: 'Cumin', amount: '1', unit: 'tsp', group: null },
      { name: 'Chili powder', amount: '1', unit: 'tsp', group: null },
      { name: 'Smoked paprika', amount: '½', unit: 'tsp', group: null },
      { name: 'Black beans', amount: '1', unit: '15-oz can', group: null },
      { name: 'Corn tortillas', amount: '8', unit: '', group: null },
      { name: 'Sour cream or Greek yogurt', amount: '½', unit: 'cup', group: null },
      { name: 'Lime', amount: '2', unit: '', group: null },
      { name: 'Fresh cilantro', amount: '½', unit: 'cup', group: null },
      { name: 'Red onion', amount: '½', unit: '', group: null },
      { name: 'Crumbled cotija cheese', amount: '¼', unit: 'cup', group: null },
    ],
    steps: [
      { step: 1, text: 'Preheat the oven to 425°F. Peel and dice the sweet potatoes into ½-inch cubes.', timer_minutes: null },
      { step: 2, text: 'Toss the sweet potatoes with olive oil, cumin, chili powder, smoked paprika, and salt. Spread on a sheet pan in a single layer and roast until tender and crisp at the edges, about 20 minutes.', timer_minutes: 20 },
      { step: 3, text: 'While the potatoes roast, drain and rinse the black beans. Warm them in a small pot over medium-low heat with a splash of water and a pinch of cumin.', timer_minutes: null },
      { step: 4, text: 'Make the lime crema: stir together sour cream, the juice of one lime, and a pinch of salt until smooth.', timer_minutes: null },
      { step: 5, text: 'Warm the tortillas in a dry skillet over medium-high heat, about 30 seconds per side until pliable and lightly charred.', timer_minutes: null },
      { step: 6, text: 'Build the tacos: layer black beans and roasted sweet potatoes in each tortilla. Top with lime crema, thinly sliced red onion, cilantro, cotija, and a squeeze of lime.', timer_minutes: null },
    ],
    tags: ['sweet potato', 'tacos', 'black beans', 'vegetarian', 'weeknight', 'Mexican'],
    source_attribution: 'Inspired by NYT Cooking',
  },
  {
    slug: 'hasselback-sweet-potatoes',
    title: 'Hasselback Sweet Potatoes with Honey Butter',
    description: 'Sweet potatoes sliced accordion-style and roasted until the edges fan out and crisp. Basted with honey butter halfway through — the combination of crispy, creamy, and sweet is hard to beat.',
    cuisine: 'American',
    time_total: 75,
    time_active: 15,
    servings: 4,
    servings_label: 'servings',
    ingredients: [
      { name: 'Medium sweet potatoes', amount: '4', unit: '', group: null },
      { name: 'Unsalted butter', amount: '4', unit: 'tbsp', group: null },
      { name: 'Honey', amount: '2', unit: 'tbsp', group: null },
      { name: 'Fresh thyme leaves', amount: '1', unit: 'tbsp', group: null },
      { name: 'Flaky sea salt', amount: '', unit: 'to taste', group: null },
      { name: 'Black pepper', amount: '', unit: 'to taste', group: null },
      { name: 'Olive oil', amount: '2', unit: 'tbsp', group: null },
      { name: 'Crème fraîche or sour cream', amount: '¼', unit: 'cup', group: null },
    ],
    steps: [
      { step: 1, text: 'Preheat the oven to 400°F. Scrub the sweet potatoes and pat dry.', timer_minutes: null },
      { step: 2, text: 'Place a sweet potato between two chopsticks or wooden spoons. Make thin crosswise cuts every ⅛ inch, slicing down until the knife hits the chopsticks — this keeps you from cutting all the way through. Repeat with each potato.', timer_minutes: null },
      { step: 3, text: 'Drizzle with olive oil, working it between the slits with your fingers. Season generously with salt and pepper. Place on a parchment-lined sheet pan.', timer_minutes: null },
      { step: 4, text: 'Roast for 40 minutes. The slits will start to fan open.', timer_minutes: 40 },
      { step: 5, text: 'While the potatoes roast, melt the butter in a small saucepan. Stir in the honey and thyme leaves.', timer_minutes: null },
      { step: 6, text: 'After 40 minutes, brush the honey-thyme butter generously over the potatoes, letting it drip between the slits. Return to the oven and roast for another 20 minutes until the edges are deeply caramelized and the centers are creamy.', timer_minutes: 20 },
      { step: 7, text: 'Serve hot with a dollop of crème fraîche and a final sprinkle of flaky salt.', timer_minutes: null },
    ],
    tags: ['sweet potato', 'hasselback', 'honey butter', 'side dish', 'vegetarian', 'holiday'],
    source_attribution: 'Inspired by NYT Cooking',
  },
  {
    slug: 'sweet-potato-cake-with-brown-butter-frosting',
    title: 'Sweet Potato Cake with Brown Butter Frosting',
    description: 'A warmly spiced, impossibly moist layer cake made with roasted sweet potato purée. The brown butter cream cheese frosting pushes it over the edge. This is the fall cake.',
    cuisine: 'American',
    time_total: 120,
    time_active: 45,
    servings: 12,
    servings_label: 'slices',
    ingredients: [
      { name: 'Sweet potatoes', amount: '1.5', unit: 'lbs' },
      { name: 'All-purpose flour', amount: '2¾', unit: 'cups' },
      { name: 'Baking powder', amount: '2', unit: 'tsp' },
      { name: 'Baking soda', amount: '1', unit: 'tsp' },
      { name: 'Cinnamon', amount: '2', unit: 'tsp' },
      { name: 'Ground ginger', amount: '1', unit: 'tsp' },
      { name: 'Nutmeg', amount: '½', unit: 'tsp' },
      { name: 'Fine sea salt', amount: '1', unit: 'tsp' },
      { name: 'Unsalted butter, softened', amount: '¾', unit: 'cup' },
      { name: 'Brown sugar', amount: '1½', unit: 'cups' },
      { name: 'Granulated sugar', amount: '½', unit: 'cup' },
      { name: 'Large eggs', amount: '4', unit: '' },
      { name: 'Vanilla extract', amount: '2', unit: 'tsp' },
      { name: 'Buttermilk', amount: '½', unit: 'cup' },
      { name: 'Unsalted butter (for frosting)', amount: '¾', unit: 'cup' },
      { name: 'Cream cheese, softened', amount: '8', unit: 'oz' },
      { name: 'Powdered sugar', amount: '3', unit: 'cups' },
      { name: 'Vanilla extract (for frosting)', amount: '1', unit: 'tsp' },
      { name: 'Pecans, toasted and chopped', amount: '½', unit: 'cup' },
    ],
    steps: [
      { step: 1, text: 'Preheat the oven to 400°F. Pierce the sweet potatoes several times with a fork and roast on a sheet pan until completely soft and collapsing, about 50 minutes. Let cool, then scoop out the flesh and mash until smooth — you need about 2 cups of purée.', timer_minutes: 50 },
      { step: 2, text: 'Reduce the oven to 350°F. Butter and flour two 9-inch round cake pans and line the bottoms with parchment.', timer_minutes: null },
      { step: 3, text: 'Whisk together the flour, baking powder, baking soda, cinnamon, ginger, nutmeg, and salt in a bowl.', timer_minutes: null },
      { step: 4, text: 'Beat the softened butter with both sugars on medium-high until pale and fluffy, about 4 minutes. Add the eggs one at a time, beating well after each. Mix in the vanilla and sweet potato purée until smooth.', timer_minutes: null },
      { step: 5, text: 'With the mixer on low, alternate adding the flour mixture and buttermilk in three additions, starting and ending with flour. Mix just until combined — don\'t overwork it.', timer_minutes: null },
      { step: 6, text: 'Divide the batter evenly between the prepared pans. Bake until a toothpick inserted in the center comes out clean, 30 to 35 minutes. Let cool in the pans for 10 minutes, then turn out onto wire racks to cool completely.', timer_minutes: 35 },
      { step: 7, text: 'Make the brown butter: melt ¾ cup butter in a saucepan over medium heat, swirling occasionally. Cook until the milk solids turn deep golden brown and it smells nutty, about 5 minutes. Pour into a heatproof bowl and refrigerate until solid but scoopable, about 45 minutes.', timer_minutes: 45 },
      { step: 8, text: 'Beat the chilled brown butter and cream cheese together until smooth. Add the powdered sugar one cup at a time, beating on low, then increase to medium-high until fluffy. Beat in the vanilla.', timer_minutes: null },
      { step: 9, text: 'Place one cake layer on a plate. Spread a generous layer of frosting on top. Set the second layer on and frost the top and sides. Scatter toasted pecans over the top.', timer_minutes: null },
    ],
    tags: ['sweet potato', 'cake', 'brown butter', 'cream cheese frosting', 'baking', 'fall', 'dessert'],
    source_attribution: 'Inspired by NYT Cooking',
  },
  {
    slug: 'crispy-smashed-sweet-potatoes',
    title: 'Crispy Smashed Sweet Potatoes',
    description: 'Boiled, smashed, and roasted at high heat until shatteringly crispy on the outside and creamy within. Finished with garlic-herb butter. Addictive barely covers it.',
    cuisine: 'American',
    time_total: 50,
    time_active: 15,
    servings: 4,
    servings_label: 'servings',
    ingredients: [
      { name: 'Small sweet potatoes', amount: '1.5', unit: 'lbs' },
      { name: 'Olive oil', amount: '3', unit: 'tbsp' },
      { name: 'Unsalted butter', amount: '3', unit: 'tbsp' },
      { name: 'Garlic', amount: '4', unit: 'cloves' },
      { name: 'Fresh rosemary', amount: '2', unit: 'sprigs' },
      { name: 'Fresh thyme', amount: '4', unit: 'sprigs' },
      { name: 'Flaky sea salt', amount: '', unit: 'to taste' },
      { name: 'Freshly cracked black pepper', amount: '', unit: 'to taste' },
      { name: 'Parmesan cheese, finely grated', amount: '¼', unit: 'cup' },
    ],
    steps: [
      { step: 1, text: 'Place the sweet potatoes (whole, unpeeled) in a large pot, cover with cold salted water, and bring to a boil. Cook until fork-tender but not falling apart, about 15 minutes depending on size. Drain well.', timer_minutes: 15 },
      { step: 2, text: 'Preheat the oven to 450°F. Generously oil a sheet pan with olive oil.', timer_minutes: null },
      { step: 3, text: 'Place the potatoes on the sheet pan and use the bottom of a glass or measuring cup to gently press each one until flattened to about ¾-inch thick. Drizzle with more olive oil and season with salt and pepper.', timer_minutes: null },
      { step: 4, text: 'Roast until the bottoms are deeply golden and crispy, about 20 minutes. Flip and roast another 10 minutes until both sides are crisp.', timer_minutes: 30 },
      { step: 5, text: 'While the potatoes finish, melt butter in a small pan over medium heat. Add thinly sliced garlic, rosemary, and thyme. Cook until the garlic is just golden and fragrant, about 2 minutes. Remove from heat.', timer_minutes: null },
      { step: 6, text: 'Spoon the garlic-herb butter over the hot smashed potatoes. Shower with grated Parmesan and a final hit of flaky salt.', timer_minutes: null },
    ],
    tags: ['sweet potato', 'crispy', 'smashed', 'side dish', 'vegetarian', 'garlic butter'],
    source_attribution: 'Inspired by NYT Cooking',
  },
]

async function main() {
  // Dedup check
  const { data: existing } = await sb.from('recipes').select('title').ilike('title', '%sweet potato%')
  const existingTitles = (existing || []).map(r => r.title.toLowerCase())

  let added = 0, skipped = 0
  for (const recipe of recipes) {
    if (existingTitles.some(t => t.includes(recipe.slug.replace(/-/g, ' ').slice(0, 15)))) {
      console.log(`⏭ Skipping "${recipe.title}" — similar recipe exists`)
      skipped++
      continue
    }

    const { error } = await sb.from('recipes').insert({
      ...recipe,
      difficulty: 'easy',
      status: 'published',
      source: 'community',
    })

    if (error) {
      console.error(`✗ Failed to insert "${recipe.title}":`, error.message)
    } else {
      console.log(`✓ Published "${recipe.title}"`)
      added++
    }
  }

  console.log(`\nDone: ${added} added, ${skipped} skipped`)
}

main().catch(console.error)
