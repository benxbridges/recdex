#!/usr/bin/env node
/**
 * Add NYT Lemon Layer Cake to RecDex.
 * Run: node scripts/add-lemon-cake.mjs
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
  slug: 'lemon-layer-cake-with-cream-cheese-frosting',
  title: 'Lemon Layer Cake with Cream Cheese Frosting',
  description: 'A towering three-layer lemon cake soaked with lemon syrup and covered in tangy cream cheese frosting. The reverse-creaming method keeps it impossibly tender — this is the birthday cake to end all birthday cakes.',
  cuisine: 'American',
  time_total: 120,
  time_active: 45,
  servings: 12,
  servings_label: 'slices',
  source_attribution: 'Adapted from NYT Cooking',
  ingredients: [
    { name: 'Unsalted butter, softened', amount: '¾', unit: 'cup', group: 'Cake and Lemon Syrup' },
    { name: 'All-purpose flour', amount: '3', unit: 'cups', group: 'Cake and Lemon Syrup' },
    { name: 'Granulated sugar', amount: '2', unit: 'cups', group: 'Cake and Lemon Syrup' },
    { name: 'Medium lemons', amount: '3', unit: '', group: 'Cake and Lemon Syrup' },
    { name: 'Whole milk', amount: '1½', unit: 'cups', group: 'Cake and Lemon Syrup' },
    { name: 'Baking powder', amount: '2', unit: 'tsp', group: 'Cake and Lemon Syrup' },
    { name: 'Baking soda', amount: '½', unit: 'tsp', group: 'Cake and Lemon Syrup' },
    { name: 'Kosher salt', amount: '1½', unit: 'tsp', group: 'Cake and Lemon Syrup' },
    { name: 'Neutral oil', amount: '¼', unit: 'cup', group: 'Cake and Lemon Syrup' },
    { name: 'Large eggs, at room temperature', amount: '4', unit: '', group: 'Cake and Lemon Syrup' },
    { name: 'Lemon extract (optional)', amount: '1', unit: 'tbsp', group: 'Cake and Lemon Syrup' },
    { name: 'Powdered sugar, sifted', amount: '2', unit: 'cups', group: 'Frosting' },
    { name: 'Unsalted butter, softened but cool', amount: '1', unit: 'cup', group: 'Frosting' },
    { name: 'Cream cheese, softened but cool', amount: '16', unit: 'oz', group: 'Frosting' },
    { name: 'Lemon zest', amount: '1', unit: 'lemon', group: 'Frosting' },
    { name: 'Fresh lemon juice', amount: '1', unit: 'tbsp', group: 'Frosting' },
  ],
  steps: [
    { step: 1, text: 'Preheat the oven to 325°F. Butter three 8-inch round cake pans, line each with parchment, butter the parchment, and dust with flour, tapping out the excess.', timer_minutes: null },
    { step: 2, text: 'Add 1¾ cups of the granulated sugar to the bowl of a stand mixer fitted with the paddle. Zest all 3 lemons directly into the sugar. Use your fingers to rub the zest into the sugar until it looks moist and sandy — this is what releases all those lemon oils.', timer_minutes: null },
    { step: 3, text: 'Juice the zested lemons into a small bowl. Transfer ¼ cup of juice to a large measuring cup and stir in the milk. Let it sit while you prepare the rest of the cake, reserving the remaining juice for the lemon syrup. The lemon juice will thicken and curdle the milk — that\'s exactly what you want.', timer_minutes: null },
    { step: 4, text: 'To the bowl with the lemon sugar, add the flour, baking powder, baking soda, and salt. Mix on low to combine. Add the softened butter all at once and mix on low until evenly distributed and the mixture looks sandy. A few larger lumps of butter are fine.', timer_minutes: null },
    { step: 5, text: 'Add the oil, eggs, and lemon extract (if using) to the measuring cup with the milk mixture and stir with a fork to combine. With the mixer on low, slowly stream in the milk mixture. When the batter is moistened, stop the mixer and scrape the bottom and sides of the bowl to catch any dry pockets. Mix on medium for 1 minute more.', timer_minutes: null },
    { step: 6, text: 'Divide the batter evenly among the prepared pans — about 2 heaping cups per pan. Spread evenly and tap the pans on the counter to release any large air bubbles.', timer_minutes: null },
    { step: 7, text: 'Bake until the cakes are slightly risen and a toothpick inserted in the center comes out clean, 20 to 25 minutes. The edges will have a bit of color but the tops will still be quite pale.', timer_minutes: 22 },
    { step: 8, text: 'Set the pans on a wire rack and let the cakes cool for about 15 minutes. Run a thin knife along the edges and carefully turn the cakes out onto the rack to cool completely. You may need to tap the pans gently to release them.', timer_minutes: 15 },
    { step: 9, text: 'While the cakes cool, make the syrup: measure ¼ cup lemon juice from the remaining reserved juice. Combine the juice and the remaining ¼ cup sugar in a small saucepan and bring to a boil over medium-high, stirring occasionally. Cook until the sugar has dissolved, then pour into a heat-safe container to cool.', timer_minutes: null },
    { step: 10, text: 'Make the frosting: add the powdered sugar and butter to the stand mixer fitted with the paddle and mix on medium until well combined. Add the cream cheese and mix until just combined and fluffy — don\'t overmix or it will thin out. Stream in a bit of the remaining lemon juice if needed to make a fluffy, spreadable frosting.', timer_minutes: null },
    { step: 11, text: 'Assemble the cake: place one layer top side up on a serving plate. Brush with lemon syrup, then spread about ¾ cup frosting over the top. Place the second layer top side down, press gently, brush with syrup, and spread another ¾ cup frosting. Brush the top of the final layer with syrup and place it top side down. Cover the top and sides with a thin crumb coat of frosting, leaving about 1½ cups in the bowl. Refrigerate until the frosting is firm, about 20 minutes.', timer_minutes: 20 },
    { step: 12, text: 'Spread the remaining frosting over the top and sides of the cake. Decorate with lemon slices if desired. Use a clean, hot, dry knife for the tidiest slices. The cake keeps at room temperature, loosely covered, for up to 4 days.', timer_minutes: null },
  ],
  tags: ['lemon', 'cake', 'cream cheese frosting', 'layer cake', 'baking', 'birthday', 'dessert'],
  difficulty: 'easy',
  status: 'published',
  source: 'community',
}

async function main() {
  // Dedup check
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

main().catch(console.error)
