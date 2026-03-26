/**
 * Batch import: 10 Breakfast & Brunch recipes
 * Run: node scripts/recipe-pipeline/import-batch-breakfast-brunch.mjs
 *
 * Genre rotation: Breakfast & Brunch
 * Sources: Bon Appétit, NYT Cooking, Serious Eats, Food52, Epicurious, Claire Saffitz, Smitten Kitchen
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY is required. Set it in .env.local or pass as env var.')
  process.exit(1)
}

const supabaseRead = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseWrite = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || 'JAdfIXIUipAqYws7sEKcAlQ1jf3frDUWTOT6ncLRXsQ'

// --- Unsplash image fetch ---
async function fetchImage(query) {
  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', `${query} food`)
    url.searchParams.set('per_page', '1')
    url.searchParams.set('orientation', 'landscape')
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const photo = data?.results?.[0]
    if (!photo?.urls?.regular) return null
    return { url: photo.urls.regular, credit: photo.user?.name || '' }
  } catch { return null }
}

// --- Dedup helpers ---
function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function isNearMatch(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const strip = s => s.replace(/^(classic|easy|best|simple|traditional|authentic|homemade)\s+/i, '')
  if (strip(na) === strip(nb)) return true
  return false
}

// --- The 10 recipes ---
const recipes = [
  {
    title: "Dutch Baby Pancake",
    slug: "dutch-baby-pancake",
    description: "A dramatic, puffy oven pancake that deflates into buttery, custardy folds. Five minutes of active work for a showstopper breakfast.",
    cuisine: "American",
    time_total: "25 min",
    time_active: "5 min",
    time_passive: "20 min",
    time_passive_label: "baking",
    servings: "2",
    servings_label: "servings",
    source_attribution: "Inspired by NYT Cooking",
    tags: ["pancake", "breakfast", "brunch", "dutch baby", "oven", "quick"],
    ingredients: [
      { name: "eggs", amount: "3", unit: "large" },
      { name: "whole milk", amount: "2/3", unit: "cup" },
      { name: "all-purpose flour", amount: "2/3", unit: "cup" },
      { name: "sugar", amount: "1", unit: "tbsp" },
      { name: "vanilla extract", amount: "1", unit: "tsp" },
      { name: "salt", amount: "1/4", unit: "tsp" },
      { name: "nutmeg", amount: "1/8", unit: "tsp" },
      { name: "unsalted butter", amount: "3", unit: "tbsp" },
      { name: "lemon juice", amount: "1", unit: "tbsp" },
      { name: "powdered sugar", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Place a 10-inch cast-iron skillet in the oven and preheat to 425°F." },
      { step: 2, text: "Blend eggs, milk, flour, sugar, vanilla, salt, and nutmeg in a blender until completely smooth, about 30 seconds." },
      { step: 3, text: "Carefully remove the hot skillet from the oven. Add butter and swirl until melted and coating the bottom and sides." },
      { step: 4, text: "Pour the batter into the center of the hot skillet. Return to the oven and bake until puffed and deeply golden at the edges, 18–22 minutes. Do not open the oven during baking." },
      { step: 5, text: "Squeeze lemon juice over the top, dust with powdered sugar, and bring to the table immediately — it deflates fast, and that's half the fun." }
    ]
  },
  {
    title: "Ricotta Toast with Honey and Walnuts",
    slug: "ricotta-toast-honey-walnuts",
    description: "Thick-cut sourdough piled with creamy ricotta, drizzled with honey, and scattered with toasted walnuts. More composed than it has any right to be for a 10-minute breakfast.",
    cuisine: "Italian",
    time_total: "10 min",
    time_active: "10 min",
    servings: "2",
    servings_label: "servings",
    source_attribution: "Inspired by Bon Appétit",
    tags: ["toast", "ricotta", "breakfast", "brunch", "honey", "quick", "vegetarian"],
    ingredients: [
      { name: "thick-cut sourdough bread", amount: "2", unit: "slices" },
      { name: "whole-milk ricotta", amount: "1/2", unit: "cup" },
      { name: "walnuts", amount: "1/4", unit: "cup" },
      { name: "honey", amount: "2", unit: "tbsp" },
      { name: "extra-virgin olive oil", amount: "1", unit: "tsp" },
      { name: "flaky sea salt", amount: "1", unit: "pinch" },
      { name: "freshly cracked black pepper", amount: "1", unit: "pinch" }
    ],
    steps: [
      { step: 1, text: "Toast walnuts in a dry skillet over medium heat until fragrant and a shade darker, about 3 minutes. Roughly chop." },
      { step: 2, text: "Toast the sourdough until deeply golden and crisp on the outside but still slightly soft within." },
      { step: 3, text: "Spread each slice generously with ricotta, pressing it into an even layer. Scatter toasted walnuts over the top." },
      { step: 4, text: "Drizzle with honey and a thin stream of olive oil. Finish with flaky salt and a grind of black pepper." }
    ]
  },
  {
    title: "Chilaquiles Rojos",
    slug: "chilaquiles-rojos",
    description: "Crispy tortilla chips bathed in tangy red salsa until just softened, topped with crema, queso fresco, and a fried egg. The best reason to wake up.",
    cuisine: "Mexican",
    time_total: "30 min",
    time_active: "30 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Serious Eats / J. Kenji López-Alt",
    tags: ["chilaquiles", "mexican", "breakfast", "brunch", "eggs", "tortilla"],
    ingredients: [
      { name: "corn tortillas", amount: "12", unit: "" },
      { name: "vegetable oil", amount: "1/2", unit: "cup" },
      { name: "dried guajillo chiles", amount: "4", unit: "" },
      { name: "dried ancho chile", amount: "1", unit: "" },
      { name: "Roma tomatoes", amount: "4", unit: "" },
      { name: "garlic", amount: "2", unit: "cloves" },
      { name: "yellow onion", amount: "1/2", unit: "" },
      { name: "ground cumin", amount: "1/2", unit: "tsp" },
      { name: "salt", amount: "1", unit: "tsp" },
      { name: "eggs", amount: "4", unit: "large" },
      { name: "crema or sour cream", amount: "1/4", unit: "cup" },
      { name: "queso fresco", amount: "1/2", unit: "cup" },
      { name: "fresh cilantro", amount: "1/4", unit: "cup" },
      { name: "white onion", amount: "1/4", unit: "", group: "garnish" },
      { name: "avocado", amount: "1", unit: "", group: "garnish" }
    ],
    steps: [
      { step: 1, text: "Cut tortillas into sixths. Heat oil in a large skillet over medium-high and fry tortilla pieces in batches until golden and crisp, about 2 minutes per batch. Drain on paper towels." },
      { step: 2, text: "Toast chiles in a dry skillet until fragrant and pliable, about 1 minute per side. Remove stems and seeds. Soak in hot water for 15 minutes." },
      { step: 3, text: "Blend soaked chiles with tomatoes, garlic, onion, cumin, salt, and 1/2 cup of the soaking liquid until smooth." },
      { step: 4, text: "Pour salsa into a large skillet over medium heat. Simmer until thickened slightly, about 5 minutes. Add fried tortilla chips and toss gently to coat. Cook 1–2 minutes — you want them softened but not soggy." },
      { step: 5, text: "Fry eggs sunny-side up in a separate pan. Top the chilaquiles with fried eggs, crema, crumbled queso fresco, sliced avocado, thinly sliced onion, and cilantro." }
    ]
  },
  {
    title: "Granola with Olive Oil and Maple",
    slug: "granola-olive-oil-maple",
    description: "Chunky, crunchy clusters of oats and nuts held together with olive oil and maple syrup. Makes your kitchen smell incredible and puts store-bought to shame.",
    cuisine: "American",
    time_total: "45 min",
    time_active: "10 min",
    time_passive: "35 min",
    time_passive_label: "baking",
    servings: "12",
    servings_label: "servings",
    source_attribution: "Inspired by Smitten Kitchen / Deb Perelman",
    tags: ["granola", "breakfast", "make-ahead", "vegetarian", "meal prep", "snack"],
    ingredients: [
      { name: "old-fashioned rolled oats", amount: "3", unit: "cups" },
      { name: "raw almonds", amount: "1/2", unit: "cup" },
      { name: "raw pecans", amount: "1/2", unit: "cup" },
      { name: "unsweetened coconut flakes", amount: "1/2", unit: "cup" },
      { name: "maple syrup", amount: "1/3", unit: "cup" },
      { name: "extra-virgin olive oil", amount: "1/4", unit: "cup" },
      { name: "light brown sugar", amount: "2", unit: "tbsp" },
      { name: "salt", amount: "3/4", unit: "tsp" },
      { name: "cinnamon", amount: "1", unit: "tsp" },
      { name: "vanilla extract", amount: "1", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Preheat oven to 325°F and line a sheet pan with parchment paper." },
      { step: 2, text: "Roughly chop almonds and pecans. Toss oats, nuts, and coconut flakes in a large bowl." },
      { step: 3, text: "Whisk together maple syrup, olive oil, brown sugar, salt, cinnamon, and vanilla. Pour over the oat mixture and stir until everything is evenly coated." },
      { step: 4, text: "Spread in an even layer on the sheet pan, pressing it down firmly with a spatula — this is the secret to big clusters. Bake 20 minutes, rotate the pan, and bake another 10–15 minutes until deep golden brown." },
      { step: 5, text: "Let cool completely on the pan without stirring — at least 30 minutes. The granola will crisp as it cools. Break into clusters and store in an airtight container for up to 2 weeks." }
    ]
  },
  {
    title: "Croque Madame",
    slug: "croque-madame",
    description: "A golden, béchamel-blanketed ham and Gruyère sandwich crowned with a fried egg. Brunch indulgence that justifies its own category.",
    cuisine: "French",
    time_total: "35 min",
    time_active: "35 min",
    servings: "2",
    servings_label: "servings",
    source_attribution: "Inspired by Bon Appétit",
    tags: ["sandwich", "french", "brunch", "eggs", "cheese", "ham"],
    ingredients: [
      { name: "white sandwich bread", amount: "4", unit: "slices" },
      { name: "unsalted butter", amount: "3", unit: "tbsp" },
      { name: "all-purpose flour", amount: "1", unit: "tbsp" },
      { name: "whole milk", amount: "3/4", unit: "cup" },
      { name: "Gruyère cheese", amount: "1", unit: "cup", group: "" },
      { name: "Dijon mustard", amount: "2", unit: "tsp" },
      { name: "nutmeg", amount: "1", unit: "pinch" },
      { name: "salt", amount: "1/4", unit: "tsp" },
      { name: "black pepper", amount: "1", unit: "pinch" },
      { name: "sliced ham", amount: "4", unit: "oz" },
      { name: "eggs", amount: "2", unit: "large" }
    ],
    steps: [
      { step: 1, text: "Melt 1 tablespoon butter in a small saucepan over medium heat. Whisk in flour and cook 1 minute. Slowly whisk in milk, stirring constantly until smooth and thickened, about 3 minutes. Remove from heat, stir in 1/4 cup grated Gruyère, nutmeg, salt, and pepper." },
      { step: 2, text: "Spread Dijon on two slices of bread. Layer ham and half the remaining Gruyère on top. Close with the other bread slices." },
      { step: 3, text: "Melt 1 tablespoon butter in a skillet over medium heat. Toast sandwiches until golden on both sides, about 3 minutes per side." },
      { step: 4, text: "Transfer sandwiches to a sheet pan. Spoon béchamel over the tops and scatter the rest of the Gruyère on top. Broil until bubbly and golden, 2–3 minutes. Watch carefully." },
      { step: 5, text: "Fry eggs in the remaining butter until the whites are set and edges are crisp. Place one egg on top of each sandwich." }
    ]
  },
  {
    title: "Savory Oatmeal with Soft Egg and Chili Crisp",
    slug: "savory-oatmeal-soft-egg-chili-crisp",
    description: "Steel-cut oats cooked like congee — creamy, savory, and topped with a jammy egg and a drizzle of chili crisp. The breakfast you didn't know you needed.",
    cuisine: "Fusion",
    time_total: "35 min",
    time_active: "15 min",
    servings: "2",
    servings_label: "servings",
    source_attribution: "Inspired by Food52",
    tags: ["oatmeal", "savory", "breakfast", "eggs", "chili crisp", "comfort food"],
    ingredients: [
      { name: "steel-cut oats", amount: "1/2", unit: "cup" },
      { name: "water", amount: "1 1/2", unit: "cups" },
      { name: "low-sodium chicken or vegetable broth", amount: "1/2", unit: "cup" },
      { name: "salt", amount: "1/2", unit: "tsp" },
      { name: "eggs", amount: "2", unit: "large" },
      { name: "soy sauce", amount: "1", unit: "tsp" },
      { name: "sesame oil", amount: "1", unit: "tsp" },
      { name: "chili crisp", amount: "2", unit: "tsp" },
      { name: "green onions", amount: "2", unit: "" },
      { name: "sesame seeds", amount: "1", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Bring water, broth, and salt to a boil in a small saucepan. Add oats, reduce to a simmer, and cook, stirring occasionally, until thick and creamy, about 25 minutes." },
      { step: 2, text: "While oats cook, bring a small pot of water to a gentle boil. Lower eggs in carefully, cook exactly 6 1/2 minutes for a jammy yolk. Transfer to ice water for 2 minutes, then peel." },
      { step: 3, text: "Stir soy sauce and sesame oil into the finished oats. Divide between two bowls." },
      { step: 4, text: "Halve the soft-boiled eggs and nestle into the oatmeal. Drizzle with chili crisp, scatter sliced green onions and sesame seeds on top." }
    ]
  },
  {
    title: "Lemon Ricotta Pancakes",
    slug: "lemon-ricotta-pancakes",
    description: "Light, pillowy pancakes with a subtle tang from ricotta and bright lemon zest. They puff up beautifully and taste like a special occasion.",
    cuisine: "Italian-American",
    time_total: "25 min",
    time_active: "25 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Claire Saffitz",
    tags: ["pancakes", "ricotta", "lemon", "breakfast", "brunch", "vegetarian"],
    ingredients: [
      { name: "whole-milk ricotta", amount: "1", unit: "cup" },
      { name: "eggs", amount: "3", unit: "large" },
      { name: "whole milk", amount: "1/2", unit: "cup" },
      { name: "lemon zest", amount: "1", unit: "tbsp" },
      { name: "lemon juice", amount: "1", unit: "tbsp" },
      { name: "vanilla extract", amount: "1", unit: "tsp" },
      { name: "all-purpose flour", amount: "3/4", unit: "cup" },
      { name: "sugar", amount: "2", unit: "tbsp" },
      { name: "baking powder", amount: "1", unit: "tsp" },
      { name: "salt", amount: "1/4", unit: "tsp" },
      { name: "unsalted butter", amount: "2", unit: "tbsp" },
      { name: "maple syrup", amount: "0", unit: "", group: "for serving" }
    ],
    steps: [
      { step: 1, text: "Separate the eggs. Whisk yolks with ricotta, milk, lemon zest, lemon juice, and vanilla until smooth." },
      { step: 2, text: "In a separate bowl, whisk flour, sugar, baking powder, and salt. Fold the dry ingredients into the ricotta mixture until just combined — a few lumps are fine." },
      { step: 3, text: "Beat egg whites with a pinch of salt until soft peaks form. Gently fold whites into the batter in two additions, preserving as much volume as possible." },
      { step: 4, text: "Heat a nonstick pan or griddle over medium-low heat. Add a small pat of butter. Scoop 1/4-cup portions of batter onto the surface. Cook until bubbles form on the surface and edges look set, about 2 minutes. Flip gently and cook 1–2 minutes more." },
      { step: 5, text: "Stack pancakes and serve with a drizzle of warm maple syrup and extra lemon zest if you like." }
    ]
  },
  {
    title: "Turkish Eggs (Çılbır)",
    slug: "turkish-eggs-cilbir",
    description: "Poached eggs on a cloud of garlicky yogurt, finished with sizzling Aleppo pepper butter. Ancient, elegant, and ready in 15 minutes.",
    cuisine: "Turkish",
    time_total: "15 min",
    time_active: "15 min",
    servings: "2",
    servings_label: "servings",
    source_attribution: "Inspired by Epicurious",
    tags: ["eggs", "turkish", "breakfast", "brunch", "yogurt", "quick", "vegetarian"],
    ingredients: [
      { name: "full-fat Greek yogurt", amount: "1", unit: "cup" },
      { name: "garlic", amount: "1", unit: "clove" },
      { name: "salt", amount: "1/2", unit: "tsp" },
      { name: "eggs", amount: "4", unit: "large" },
      { name: "white vinegar", amount: "1", unit: "tbsp" },
      { name: "unsalted butter", amount: "2", unit: "tbsp" },
      { name: "Aleppo pepper", amount: "1", unit: "tsp" },
      { name: "fresh dill", amount: "1", unit: "tbsp" },
      { name: "crusty bread", amount: "0", unit: "", group: "for serving" }
    ],
    steps: [
      { step: 1, text: "Finely grate or mince the garlic. Stir into yogurt with a pinch of salt. Divide between two shallow bowls and spread into a wide bed, creating a well in the center." },
      { step: 2, text: "Bring a medium pot of water to a gentle simmer. Add vinegar. Crack eggs one at a time into a small cup and slide into the water. Poach until whites are set but yolks are still runny, about 3 minutes. Remove with a slotted spoon, draining well." },
      { step: 3, text: "Nestle 2 poached eggs into each yogurt bed." },
      { step: 4, text: "Melt butter in a small pan over medium heat until foaming. Add Aleppo pepper, swirl for 10 seconds — it should sizzle and turn the butter a vibrant red-orange. Immediately spoon the hot butter over the eggs." },
      { step: 5, text: "Scatter fresh dill on top and serve with plenty of crusty bread for scooping." }
    ]
  },
  {
    title: "Shakshuka-Style Baked Eggs with Greens",
    slug: "baked-eggs-with-greens",
    description: "Eggs baked into a bed of garlicky, wilted greens with a hit of chili flakes and Parmesan. A lighter riff on shakshuka that works any time of day.",
    cuisine: "Mediterranean",
    time_total: "25 min",
    time_active: "25 min",
    servings: "2",
    servings_label: "servings",
    source_attribution: "Inspired by Food52",
    tags: ["eggs", "greens", "breakfast", "brunch", "vegetarian", "one-pan", "healthy"],
    ingredients: [
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "garlic", amount: "3", unit: "cloves" },
      { name: "red pepper flakes", amount: "1/4", unit: "tsp" },
      { name: "baby spinach", amount: "5", unit: "oz" },
      { name: "kale", amount: "1", unit: "small bunch" },
      { name: "salt", amount: "1/2", unit: "tsp" },
      { name: "black pepper", amount: "1/4", unit: "tsp" },
      { name: "eggs", amount: "4", unit: "large" },
      { name: "Parmesan cheese", amount: "2", unit: "tbsp" },
      { name: "lemon juice", amount: "1", unit: "tsp" },
      { name: "crusty bread", amount: "0", unit: "", group: "for serving" }
    ],
    steps: [
      { step: 1, text: "Heat olive oil in a large oven-safe skillet over medium heat. Add sliced garlic and red pepper flakes, cook until fragrant, about 30 seconds." },
      { step: 2, text: "Strip kale leaves from stems and roughly chop. Add kale to the pan and cook until wilted, about 3 minutes. Add spinach in handfuls, stirring until fully wilted. Season with salt and pepper." },
      { step: 3, text: "Make 4 wells in the greens. Crack an egg into each well. Season eggs with a pinch of salt." },
      { step: 4, text: "Transfer skillet to a 400°F oven (or cover on the stovetop) and bake until whites are set but yolks are still runny, about 6–8 minutes." },
      { step: 5, text: "Grate Parmesan over the top, squeeze a little lemon juice over everything, and serve straight from the skillet with good bread." }
    ]
  },
  {
    title: "Banana Bread French Toast",
    slug: "banana-bread-french-toast",
    description: "Thick slices of day-old banana bread, dipped in vanilla custard and pan-fried until caramelized. Decadent enough to serve as dessert, honest enough to call breakfast.",
    cuisine: "American",
    time_total: "20 min",
    time_active: "20 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Smitten Kitchen / Deb Perelman",
    tags: ["french toast", "banana bread", "breakfast", "brunch", "weekend"],
    ingredients: [
      { name: "day-old banana bread", amount: "8", unit: "thick slices" },
      { name: "eggs", amount: "3", unit: "large" },
      { name: "whole milk", amount: "1/3", unit: "cup" },
      { name: "heavy cream", amount: "2", unit: "tbsp" },
      { name: "vanilla extract", amount: "1", unit: "tsp" },
      { name: "cinnamon", amount: "1/2", unit: "tsp" },
      { name: "salt", amount: "1", unit: "pinch" },
      { name: "unsalted butter", amount: "2", unit: "tbsp" },
      { name: "maple syrup", amount: "0", unit: "", group: "for serving" },
      { name: "sliced bananas", amount: "0", unit: "", group: "for serving" },
      { name: "powdered sugar", amount: "0", unit: "", group: "for serving" }
    ],
    steps: [
      { step: 1, text: "Whisk eggs, milk, cream, vanilla, cinnamon, and salt in a shallow dish until well combined." },
      { step: 2, text: "Melt half the butter in a large nonstick skillet or griddle over medium heat." },
      { step: 3, text: "Dip banana bread slices into the custard, letting each side soak for about 10 seconds — the bread is already moist, so don't oversoak." },
      { step: 4, text: "Cook in batches until deep golden brown and slightly caramelized, about 2–3 minutes per side. Add more butter between batches as needed." },
      { step: 5, text: "Stack on plates with sliced bananas, a dusting of powdered sugar, and warm maple syrup." }
    ]
  }
]

// --- Main ---
async function main() {
  console.log('=== RecDex Batch Import: Breakfast & Brunch (10 recipes) ===\n')

  // Step 1: Fetch all existing titles for dedup
  console.log('Fetching existing recipes for dedup check...')
  const { data: existing, error: fetchError } = await supabaseRead
    .from('recipes')
    .select('title, slug')
    .order('title')
    .limit(1000)

  if (fetchError) {
    console.error('Failed to fetch existing recipes:', fetchError.message)
    process.exit(1)
  }

  const existingTitles = (existing || []).map(r => r.title)
  const existingSlugs = new Set((existing || []).map(r => r.slug))
  console.log(`Found ${existingTitles.length} existing recipes.\n`)

  // Step 2: Dedup and publish
  let imported = 0
  let skipped = 0

  for (const recipe of recipes) {
    // Slug dedup
    if (existingSlugs.has(recipe.slug)) {
      console.log(`SKIP (slug exists): ${recipe.title}`)
      skipped++
      continue
    }

    // Title dedup (exact + near-match)
    const match = existingTitles.find(t => isNearMatch(t, recipe.title))
    if (match) {
      console.log(`SKIP (near-match "${match}"): ${recipe.title}`)
      skipped++
      continue
    }

    // Fetch Unsplash image
    console.log(`Fetching image for: ${recipe.title}...`)
    const image = await fetchImage(recipe.title)
    const image_url = image?.url || null
    const photo_credit = image?.credit || null

    // Publish
    const { error: insertError } = await supabaseWrite.from('recipes').insert({
      ...recipe,
      image_url,
      photo_credit,
      status: 'published',
      source: 'community',
    })

    if (insertError) {
      console.error(`FAIL: ${recipe.title} — ${insertError.message}`)
    } else {
      console.log(`OK: ${recipe.title} (${recipe.cuisine}) ${image_url ? '+ image' : '(no image)'}`)
      imported++
    }

    // Rate limit for Unsplash
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log(`\n=== Done: ${imported} imported, ${skipped} skipped ===`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
