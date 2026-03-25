/**
 * Batch import: 10 Middle Eastern recipes
 * Run: SUPABASE_SERVICE_KEY=xxx node scripts/recipe-pipeline/import-batch-middle-eastern.mjs
 *
 * Genre rotation: Middle Eastern
 * Sources: Serious Eats, NYT Cooking, Bon Appétit, Food52, Epicurious, Ottolenghi
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
  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return true
  // Remove common prefixes like "classic", "easy", "best"
  const strip = s => s.replace(/^(classic|easy|best|simple|traditional|authentic|homemade)\s+/i, '')
  if (strip(na) === strip(nb)) return true
  return false
}

// --- The 10 recipes ---
const recipes = [
  {
    title: "Lamb Kofta",
    slug: "lamb-kofta",
    description: "Warmly spiced ground lamb shaped onto skewers and grilled until charred outside, juicy within. Best served with a swipe of tahini and pickled onions.",
    cuisine: "Middle Eastern",
    time_total: "35 min",
    time_active: "25 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Serious Eats",
    tags: ["lamb", "grilling", "middle eastern", "kofta", "weeknight"],
    ingredients: [
      { name: "ground lamb", amount: "1", unit: "lb" },
      { name: "yellow onion", amount: "1/2", unit: "", group: "" },
      { name: "garlic", amount: "3", unit: "cloves" },
      { name: "fresh parsley", amount: "1/4", unit: "cup" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "ground coriander", amount: "1", unit: "tsp" },
      { name: "paprika", amount: "1/2", unit: "tsp" },
      { name: "cinnamon", amount: "1/4", unit: "tsp" },
      { name: "cayenne pepper", amount: "1/4", unit: "tsp" },
      { name: "salt", amount: "1", unit: "tsp" },
      { name: "black pepper", amount: "1/2", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Grate the onion on the large holes of a box grater and squeeze out excess moisture in a clean towel. Finely mince the garlic and parsley." },
      { step: 2, text: "Combine lamb, grated onion, garlic, parsley, cumin, coriander, paprika, cinnamon, cayenne, salt, and pepper in a bowl. Mix with your hands until just combined — don't overwork it." },
      { step: 3, text: "Divide into 8 portions. Shape each around a flat metal skewer, forming an elongated oval about 4 inches long. Refrigerate 15 minutes to firm up." },
      { step: 4, text: "Heat a grill or grill pan to high heat. Oil the grates. Grill kofta 3–4 minutes per side, turning once, until charred in spots and cooked through (internal temp 160°F)." },
      { step: 5, text: "Serve on warm pita with tahini sauce, pickled red onions, and a scattering of fresh herbs." }
    ]
  },
  {
    title: "Muhammara",
    slug: "muhammara",
    description: "A smoky, sweet-sharp red pepper and walnut dip from Aleppo. Thick enough to scoop, complex enough to make you wonder why hummus gets all the attention.",
    cuisine: "Syrian",
    time_total: "20 min",
    time_active: "15 min",
    servings: "8",
    servings_label: "servings",
    source_attribution: "Inspired by Bon Appétit",
    tags: ["dip", "syrian", "walnuts", "red pepper", "vegetarian", "appetizer"],
    ingredients: [
      { name: "roasted red peppers", amount: "12", unit: "oz" },
      { name: "walnuts", amount: "1", unit: "cup" },
      { name: "breadcrumbs", amount: "1/2", unit: "cup" },
      { name: "pomegranate molasses", amount: "2", unit: "tbsp" },
      { name: "extra-virgin olive oil", amount: "3", unit: "tbsp" },
      { name: "lemon juice", amount: "1", unit: "tbsp" },
      { name: "garlic", amount: "1", unit: "clove" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "Aleppo pepper", amount: "1", unit: "tsp" },
      { name: "salt", amount: "3/4", unit: "tsp" },
      { name: "sugar", amount: "1/2", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Toast walnuts in a dry skillet over medium heat, stirring often, until fragrant and a shade darker, about 4 minutes. Let cool slightly." },
      { step: 2, text: "Pulse walnuts in a food processor until coarsely ground — you want some texture, not a paste." },
      { step: 3, text: "Add roasted peppers, breadcrumbs, pomegranate molasses, olive oil, lemon juice, garlic, cumin, Aleppo pepper, salt, and sugar. Pulse until combined but still slightly chunky." },
      { step: 4, text: "Taste and adjust seasoning — it should balance sweet, tart, and smoky. Transfer to a bowl, drizzle with olive oil, and sprinkle with extra Aleppo pepper." }
    ]
  },
  {
    title: "Chicken Shawarma",
    slug: "chicken-shawarma",
    description: "Deeply spiced yogurt-marinated chicken thighs, seared until crisp-edged and sliced thin. The kind of shawarma you build a whole meal around.",
    cuisine: "Levantine",
    time_total: "1 hr 15 min",
    time_active: "25 min",
    time_passive: "45 min",
    time_passive_label: "marinating",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Serious Eats / J. Kenji López-Alt",
    tags: ["chicken", "shawarma", "middle eastern", "weeknight", "meal prep"],
    ingredients: [
      { name: "boneless skinless chicken thighs", amount: "2", unit: "lbs" },
      { name: "plain yogurt", amount: "1/2", unit: "cup" },
      { name: "lemon juice", amount: "2", unit: "tbsp" },
      { name: "extra-virgin olive oil", amount: "2", unit: "tbsp" },
      { name: "garlic", amount: "4", unit: "cloves" },
      { name: "ground cumin", amount: "2", unit: "tsp" },
      { name: "ground coriander", amount: "1", unit: "tsp" },
      { name: "paprika", amount: "2", unit: "tsp" },
      { name: "turmeric", amount: "1/2", unit: "tsp" },
      { name: "cinnamon", amount: "1/4", unit: "tsp" },
      { name: "cardamom", amount: "1/4", unit: "tsp" },
      { name: "cayenne pepper", amount: "1/4", unit: "tsp" },
      { name: "salt", amount: "1 1/2", unit: "tsp" },
      { name: "black pepper", amount: "1/2", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Mince the garlic. Whisk yogurt, lemon juice, olive oil, garlic, and all spices together in a large bowl." },
      { step: 2, text: "Add chicken thighs and toss to coat thoroughly. Cover and refrigerate at least 45 minutes (up to overnight for deeper flavor)." },
      { step: 3, text: "Heat a large cast-iron skillet over medium-high until smoking. Working in batches to avoid crowding, cook chicken 5–6 minutes per side until deeply browned and cooked through (165°F internal)." },
      { step: 4, text: "Rest chicken 5 minutes, then slice against the grain into thin strips." },
      { step: 5, text: "Pile onto warm flatbread with pickled turnips, tahini sauce, sliced tomatoes, and fresh herbs." }
    ]
  },
  {
    title: "Fattoush",
    slug: "fattoush",
    description: "A bright, crunchy Levantine bread salad with fried pita shards and a tangy sumac dressing. Best eaten immediately, while the pita is still crisp.",
    cuisine: "Lebanese",
    time_total: "25 min",
    time_active: "25 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Ottolenghi",
    tags: ["salad", "lebanese", "vegetarian", "bread salad", "sumac"],
    ingredients: [
      { name: "pita bread", amount: "2", unit: "rounds" },
      { name: "olive oil", amount: "3", unit: "tbsp" },
      { name: "romaine lettuce", amount: "1", unit: "head" },
      { name: "Persian cucumbers", amount: "3", unit: "" },
      { name: "ripe tomatoes", amount: "2", unit: "medium" },
      { name: "radishes", amount: "5", unit: "" },
      { name: "green onions", amount: "4", unit: "" },
      { name: "fresh mint", amount: "1/4", unit: "cup" },
      { name: "fresh parsley", amount: "1/2", unit: "cup" },
      { name: "sumac", amount: "2", unit: "tsp" },
      { name: "lemon juice", amount: "3", unit: "tbsp" },
      { name: "extra-virgin olive oil", amount: "1/4", unit: "cup" },
      { name: "garlic", amount: "1", unit: "clove" },
      { name: "salt", amount: "3/4", unit: "tsp" },
      { name: "pomegranate seeds", amount: "1/4", unit: "cup" }
    ],
    steps: [
      { step: 1, text: "Tear pita into rough 1-inch pieces. Toss with 3 tablespoons olive oil and spread on a sheet pan. Bake at 375°F until golden and crisp, about 10 minutes, or fry in oil until golden." },
      { step: 2, text: "Chop romaine into bite-sized pieces. Halve cucumbers lengthwise and slice into half-moons. Cut tomatoes into wedges. Thinly slice radishes and green onions. Roughly chop herbs." },
      { step: 3, text: "Whisk together lemon juice, 1/4 cup olive oil, minced garlic, sumac, and salt for the dressing." },
      { step: 4, text: "Toss vegetables and herbs in a large bowl. Pour dressing over and toss again. Add pita chips and pomegranate seeds, toss gently once more, and serve immediately." }
    ]
  },
  {
    title: "Mujaddara",
    slug: "mujaddara",
    description: "Lentils and rice crowned with a tangle of deeply caramelized onions — the kind of humble dish that tastes far more luxurious than its ingredient list suggests.",
    cuisine: "Lebanese",
    time_total: "1 hr",
    time_active: "30 min",
    time_passive: "15 min",
    time_passive_label: "resting",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Inspired by NYT Cooking",
    tags: ["lentils", "rice", "lebanese", "vegetarian", "vegan", "comfort food"],
    ingredients: [
      { name: "green or brown lentils", amount: "1", unit: "cup" },
      { name: "basmati rice", amount: "1", unit: "cup" },
      { name: "yellow onions", amount: "3", unit: "large" },
      { name: "olive oil", amount: "1/3", unit: "cup" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "ground coriander", amount: "1/2", unit: "tsp" },
      { name: "cinnamon", amount: "1/4", unit: "tsp" },
      { name: "salt", amount: "1 1/2", unit: "tsp" },
      { name: "black pepper", amount: "1/2", unit: "tsp" },
      { name: "water", amount: "3", unit: "cups" }
    ],
    steps: [
      { step: 1, text: "Halve the onions through the root and slice into thin half-moons. Heat olive oil in a large heavy pot over medium-high heat. Add onions, stir, and cook, stirring every few minutes, until deeply golden brown and jammy, 25–30 minutes. Remove two-thirds of the onions and set aside for topping." },
      { step: 2, text: "Rinse lentils. Add to the pot with the remaining onions along with cumin, coriander, cinnamon, salt, and pepper. Stir for 30 seconds until fragrant." },
      { step: 3, text: "Add 3 cups water and bring to a boil. Reduce to a simmer, cover, and cook 15 minutes until lentils are almost tender." },
      { step: 4, text: "Rinse rice and add to the pot. Stir gently, cover, and cook on low heat 15 minutes until rice is tender and liquid is absorbed." },
      { step: 5, text: "Remove from heat and let rest, covered, for 10 minutes. Fluff with a fork and mound onto a platter. Top with the reserved crispy onions and serve with plain yogurt." }
    ]
  },
  {
    title: "Shakshuka",
    slug: "shakshuka",
    description: "Eggs poached in a spiced, chunky tomato-pepper sauce — eaten straight from the skillet with crusty bread for mopping. Breakfast, lunch, or dinner.",
    cuisine: "North African",
    time_total: "35 min",
    time_active: "35 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Food52",
    tags: ["eggs", "tomato", "north african", "breakfast", "vegetarian", "one-pan"],
    ingredients: [
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "yellow onion", amount: "1", unit: "medium" },
      { name: "red bell pepper", amount: "1", unit: "" },
      { name: "garlic", amount: "4", unit: "cloves" },
      { name: "ground cumin", amount: "1 1/2", unit: "tsp" },
      { name: "paprika", amount: "1", unit: "tsp" },
      { name: "cayenne pepper", amount: "1/4", unit: "tsp" },
      { name: "crushed tomatoes", amount: "28", unit: "oz can" },
      { name: "salt", amount: "1", unit: "tsp" },
      { name: "sugar", amount: "1/2", unit: "tsp" },
      { name: "eggs", amount: "6", unit: "large" },
      { name: "fresh cilantro", amount: "2", unit: "tbsp" },
      { name: "crumbled feta", amount: "1/4", unit: "cup" }
    ],
    steps: [
      { step: 1, text: "Heat olive oil in a large deep skillet over medium heat. Add diced onion and bell pepper, cook until softened and lightly browned, about 8 minutes." },
      { step: 2, text: "Add minced garlic, cumin, paprika, and cayenne. Stir for 30 seconds until fragrant." },
      { step: 3, text: "Pour in crushed tomatoes, salt, and sugar. Simmer, stirring occasionally, until the sauce thickens slightly, about 10 minutes." },
      { step: 4, text: "Make 6 wells in the sauce with the back of a spoon. Crack an egg into each well. Season eggs with a pinch of salt." },
      { step: 5, text: "Cover the skillet and cook on medium-low until the whites are set but yolks are still runny, 6–8 minutes. Scatter with crumbled feta and cilantro. Serve in the skillet with crusty bread." }
    ]
  },
  {
    title: "Labneh",
    slug: "labneh",
    description: "Thick, tangy strained yogurt drizzled with good olive oil — dead simple and endlessly versatile as a dip, spread, or base for toppings.",
    cuisine: "Levantine",
    time_total: "12 hrs",
    time_active: "10 min",
    time_passive: "12 hrs",
    time_passive_label: "straining",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Inspired by Ottolenghi",
    tags: ["yogurt", "dip", "levantine", "vegetarian", "make-ahead", "appetizer"],
    ingredients: [
      { name: "full-fat plain yogurt", amount: "32", unit: "oz" },
      { name: "salt", amount: "1/2", unit: "tsp" },
      { name: "extra-virgin olive oil", amount: "2", unit: "tbsp" },
      { name: "za'atar", amount: "1", unit: "tsp" },
      { name: "Aleppo pepper", amount: "1/2", unit: "tsp" },
      { name: "toasted pine nuts", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Stir salt into yogurt. Line a fine-mesh strainer with two layers of cheesecloth and set it over a deep bowl. Spoon in the yogurt, gather the cheesecloth edges, and twist gently to close." },
      { step: 2, text: "Refrigerate for 12–24 hours. The longer it strains, the thicker and tangier it gets. You'll drain off about 1 cup of whey (save it for smoothies or bread baking)." },
      { step: 3, text: "Transfer labneh to a serving bowl and spread it with the back of a spoon, creating swoops and wells. Drizzle generously with olive oil, then top with za'atar, Aleppo pepper, and toasted pine nuts." }
    ]
  },
  {
    title: "Lamb Tagine with Apricots",
    slug: "lamb-tagine-with-apricots",
    description: "A slow-braised Moroccan stew where tender lamb shoulder meets sweet dried apricots and warm spices. The kind of dish that fills the whole house with an incredible smell.",
    cuisine: "Moroccan",
    time_total: "2 hrs 30 min",
    time_active: "30 min",
    time_passive: "2 hrs",
    time_passive_label: "braising",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Inspired by Epicurious",
    tags: ["lamb", "tagine", "moroccan", "stew", "dried fruit", "slow cook"],
    ingredients: [
      { name: "lamb shoulder", amount: "2", unit: "lbs" },
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "yellow onion", amount: "1", unit: "large" },
      { name: "garlic", amount: "4", unit: "cloves" },
      { name: "fresh ginger", amount: "1", unit: "inch piece" },
      { name: "ground cinnamon", amount: "1", unit: "tsp" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "ground coriander", amount: "1/2", unit: "tsp" },
      { name: "turmeric", amount: "1/2", unit: "tsp" },
      { name: "saffron threads", amount: "1/4", unit: "tsp" },
      { name: "chicken stock", amount: "2", unit: "cups" },
      { name: "diced tomatoes", amount: "14", unit: "oz can" },
      { name: "dried apricots", amount: "1", unit: "cup" },
      { name: "honey", amount: "1", unit: "tbsp" },
      { name: "salt", amount: "1 1/2", unit: "tsp" },
      { name: "toasted almonds", amount: "1/4", unit: "cup" },
      { name: "fresh cilantro", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Cut lamb into 2-inch chunks and pat dry. Season generously with salt and pepper. Heat olive oil in a Dutch oven over medium-high heat and brown lamb on all sides in batches, about 3 minutes per side. Set aside." },
      { step: 2, text: "Reduce heat to medium. Add diced onion and cook until softened, about 5 minutes. Add minced garlic and grated ginger, stir for 1 minute. Add cinnamon, cumin, coriander, turmeric, and saffron, and stir until fragrant, about 30 seconds." },
      { step: 3, text: "Return lamb to the pot. Add stock, tomatoes, and salt. Bring to a boil, then reduce to a bare simmer. Cover and cook 1 hour 30 minutes." },
      { step: 4, text: "Add apricots and honey. Cover and continue simmering until lamb is fork-tender and the sauce has thickened, about 30 minutes more." },
      { step: 5, text: "Taste and adjust seasoning. Serve over couscous, scattered with toasted almonds and fresh cilantro." }
    ]
  },
  {
    title: "Falafel",
    slug: "falafel",
    description: "Crispy-shelled, herb-green chickpea fritters made from soaked (never canned) chickpeas. The texture difference is everything.",
    cuisine: "Levantine",
    time_total: "45 min",
    time_active: "30 min",
    time_passive: "12 hrs",
    time_passive_label: "soaking chickpeas",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Serious Eats / J. Kenji López-Alt",
    tags: ["chickpeas", "falafel", "levantine", "vegetarian", "vegan", "fried"],
    ingredients: [
      { name: "dried chickpeas", amount: "1", unit: "lb" },
      { name: "yellow onion", amount: "1", unit: "medium" },
      { name: "garlic", amount: "4", unit: "cloves" },
      { name: "fresh parsley", amount: "1", unit: "cup packed" },
      { name: "fresh cilantro", amount: "1/2", unit: "cup packed" },
      { name: "ground cumin", amount: "2", unit: "tsp" },
      { name: "ground coriander", amount: "1", unit: "tsp" },
      { name: "cayenne pepper", amount: "1/4", unit: "tsp" },
      { name: "salt", amount: "1 1/2", unit: "tsp" },
      { name: "black pepper", amount: "1/2", unit: "tsp" },
      { name: "baking powder", amount: "1", unit: "tsp" },
      { name: "sesame seeds", amount: "2", unit: "tbsp" },
      { name: "neutral oil for frying", amount: "3", unit: "cups" }
    ],
    steps: [
      { step: 1, text: "Soak dried chickpeas in plenty of cold water for at least 12 hours (up to 24). They should roughly double in size. Drain well and pat dry." },
      { step: 2, text: "Roughly chop the onion. Add chickpeas, onion, garlic, parsley, cilantro, cumin, coriander, cayenne, salt, and pepper to a food processor. Pulse in short bursts until the mixture resembles coarse sand — not a paste. You should see distinct bits of chickpea and herb." },
      { step: 3, text: "Transfer to a bowl, stir in baking powder and sesame seeds. Refrigerate 30 minutes if the mixture feels wet." },
      { step: 4, text: "Shape into roughly 12 patties, about 2 inches across and 3/4 inch thick. Don't compact them too tightly." },
      { step: 5, text: "Heat oil to 350°F in a deep pot. Fry falafel in batches of 4–5, turning once, until deeply golden brown all over, about 3–4 minutes total. Drain on a wire rack." },
      { step: 6, text: "Serve immediately in warm pita with tahini, pickled vegetables, and fresh tomato-cucumber salad." }
    ]
  },
  {
    title: "Turkish Red Lentil Soup",
    slug: "turkish-red-lentil-soup",
    description: "A velvety, warming soup finished with a sizzle of paprika butter and a squeeze of lemon. Comes together in 30 minutes from pantry staples.",
    cuisine: "Turkish",
    time_total: "35 min",
    time_active: "15 min",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Inspired by NYT Cooking",
    tags: ["soup", "lentils", "turkish", "vegetarian", "vegan-adaptable", "weeknight"],
    ingredients: [
      { name: "red lentils", amount: "1 1/2", unit: "cups" },
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "yellow onion", amount: "1", unit: "large" },
      { name: "carrot", amount: "1", unit: "medium" },
      { name: "garlic", amount: "3", unit: "cloves" },
      { name: "tomato paste", amount: "1", unit: "tbsp" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "water or vegetable stock", amount: "6", unit: "cups" },
      { name: "salt", amount: "1 1/2", unit: "tsp" },
      { name: "lemon juice", amount: "2", unit: "tbsp" },
      { name: "butter", amount: "2", unit: "tbsp" },
      { name: "Aleppo pepper or paprika", amount: "1", unit: "tsp" },
      { name: "dried mint", amount: "1/2", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Rinse red lentils until the water runs clear. Heat olive oil in a large pot over medium heat. Add diced onion and carrot, cook until softened, about 6 minutes." },
      { step: 2, text: "Add minced garlic, tomato paste, and cumin. Stir for 1 minute." },
      { step: 3, text: "Add lentils, water or stock, and salt. Bring to a boil, then reduce to a simmer. Cook uncovered, stirring occasionally, until lentils are completely falling apart, about 20 minutes." },
      { step: 4, text: "Blend soup with an immersion blender until smooth (or leave slightly chunky if you prefer). Stir in lemon juice. Adjust salt and add more lemon if needed." },
      { step: 5, text: "In a small pan, melt butter over medium heat until foamy. Add Aleppo pepper and dried mint, swirl for 15 seconds. Ladle soup into bowls and drizzle the sizzling paprika butter on top." }
    ]
  }
]

// --- Main ---
async function main() {
  console.log('=== RecDex Batch Import: Middle Eastern (10 recipes) ===\n')

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
