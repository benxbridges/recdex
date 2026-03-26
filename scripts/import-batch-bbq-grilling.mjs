#!/usr/bin/env node
/**
 * RecDex Import Batch: BBQ & Grilling (10 recipes)
 * Run: node scripts/import-batch-bbq-grilling.mjs
 * Requires: SUPABASE_SERVICE_KEY in environment
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── DEDUP HELPERS ───

function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function isNearMatch(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  // Strip common prefixes
  for (const prefix of ['classic ', 'easy ', 'simple ', 'best ', 'ultimate ', 'perfect ']) {
    if (na.replace(prefix, '') === nb.replace(prefix, '') && na.replace(prefix, '') !== na) return true
  }
  return false
}

// ─── 10 BBQ & GRILLING RECIPES ───

const recipes = [
  {
    title: "Grilled Lamb Chops with Herb Butter",
    slug: "grilled-lamb-chops-herb-butter",
    description: "Thick-cut lamb loin chops kissed by high heat, finished with a compound butter of rosemary, garlic, and anchovy that melts into each bite.",
    cuisine: "American",
    time_total: "30 min",
    time_active: "20 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by J. Kenji López-Alt",
    tags: ["grilling", "lamb", "weeknight", "summer", "gluten-free"],
    ingredients: [
      { name: "lamb loin chops", amount: "8", unit: "", group: "Lamb" },
      { name: "olive oil", amount: "2", unit: "tbsp", group: "Lamb" },
      { name: "kosher salt", amount: "1", unit: "tbsp", group: "Lamb" },
      { name: "black pepper", amount: "1", unit: "tsp", group: "Lamb" },
      { name: "unsalted butter, softened", amount: "4", unit: "tbsp", group: "Herb Butter" },
      { name: "fresh rosemary, finely chopped", amount: "1", unit: "tbsp", group: "Herb Butter" },
      { name: "garlic, minced", amount: "2", unit: "cloves", group: "Herb Butter" },
      { name: "anchovy paste", amount: "1", unit: "tsp", group: "Herb Butter" },
      { name: "lemon zest", amount: "1", unit: "tsp", group: "Herb Butter" }
    ],
    steps: [
      { step: 1, text: "Mash softened butter with rosemary, garlic, anchovy paste, and lemon zest. Roll into a log in plastic wrap and refrigerate while you prep the lamb." },
      { step: 2, text: "Pat lamb chops dry and let them come to room temperature, about 15 minutes. Rub with olive oil, then season generously with salt and pepper on both sides." },
      { step: 3, text: "Heat grill to high (500°F+). Clean and oil the grates." },
      { step: 4, text: "Grill chops over direct heat for 3–4 minutes per side for medium-rare (130°F internal). For thicker chops, move to indirect heat after searing and cook until they hit temp." },
      { step: 5, text: "Rest the chops for 5 minutes, then top each with a coin of herb butter. Serve as the butter pools across the plate." }
    ]
  },
  {
    title: "Texas-Style Beef Ribs",
    slug: "texas-style-beef-ribs",
    description: "Massive plate ribs rubbed simply with salt and pepper, smoked low and slow until the meat pulls back from the bone and the bark shatters at the touch.",
    cuisine: "American",
    time_total: "8 hrs",
    time_active: "30 min",
    time_passive: "7 hrs 30 min",
    time_passive_label: "smoking",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Inspired by Aaron Franklin",
    tags: ["bbq", "beef", "smoking", "texas", "low-and-slow"],
    ingredients: [
      { name: "beef plate ribs (3-bone rack)", amount: "1", unit: "rack, about 5 lbs" },
      { name: "coarse black pepper", amount: "3", unit: "tbsp" },
      { name: "kosher salt", amount: "3", unit: "tbsp" },
      { name: "oak or post oak wood splits", amount: "4-5", unit: "splits" }
    ],
    steps: [
      { step: 1, text: "Trim excess fat from the top of the ribs, leaving about ¼ inch. Remove the membrane from the bone side." },
      { step: 2, text: "Mix equal parts coarse black pepper and kosher salt. Apply the rub generously, pressing it into the meat." },
      { step: 3, text: "Set up your smoker with oak splits, targeting 250–275°F. Place ribs bone-side down, fat cap up." },
      { step: 4, text: "Smoke for 3 hours without opening the lid. The bark should be forming—dark mahogany and firm to the touch." },
      { step: 5, text: "Continue smoking, spritzing with water or apple cider vinegar every 45 minutes to keep the surface moist, for another 3–4 hours." },
      { step: 6, text: "When the internal temperature hits 200–205°F and a probe slides in like warm butter, pull the ribs." },
      { step: 7, text: "Wrap loosely in butcher paper and rest for at least 1 hour. Slice between the bones to serve." }
    ]
  },
  {
    title: "Grilled Chicken Thighs with Alabama White Sauce",
    slug: "grilled-chicken-alabama-white-sauce",
    description: "Bone-in chicken thighs charred over live fire, basted and served with Alabama's tangy, peppery mayonnaise-based white BBQ sauce.",
    cuisine: "American",
    time_total: "1 hr",
    time_active: "30 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Big Bob Gibson Bar-B-Q tradition",
    tags: ["grilling", "chicken", "bbq", "southern", "alabama"],
    ingredients: [
      { name: "bone-in, skin-on chicken thighs", amount: "8", unit: "", group: "Chicken" },
      { name: "olive oil", amount: "2", unit: "tbsp", group: "Chicken" },
      { name: "smoked paprika", amount: "1", unit: "tbsp", group: "Chicken" },
      { name: "garlic powder", amount: "1", unit: "tsp", group: "Chicken" },
      { name: "kosher salt", amount: "2", unit: "tsp", group: "Chicken" },
      { name: "black pepper", amount: "1", unit: "tsp", group: "Chicken" },
      { name: "mayonnaise", amount: "1", unit: "cup", group: "White Sauce" },
      { name: "apple cider vinegar", amount: "¼", unit: "cup", group: "White Sauce" },
      { name: "lemon juice", amount: "1", unit: "tbsp", group: "White Sauce" },
      { name: "prepared horseradish", amount: "1", unit: "tbsp", group: "White Sauce" },
      { name: "black pepper", amount: "1", unit: "tsp", group: "White Sauce" },
      { name: "cayenne pepper", amount: "½", unit: "tsp", group: "White Sauce" },
      { name: "sugar", amount: "1", unit: "tsp", group: "White Sauce" }
    ],
    steps: [
      { step: 1, text: "Whisk together mayonnaise, vinegar, lemon juice, horseradish, black pepper, cayenne, and sugar. Refrigerate for at least 30 minutes to let flavors meld." },
      { step: 2, text: "Toss chicken thighs with olive oil, paprika, garlic powder, salt, and pepper." },
      { step: 3, text: "Set up grill for two-zone cooking—hot coals on one side, none on the other." },
      { step: 4, text: "Place thighs skin-side down over direct heat. Cook 5–6 minutes until the skin is deeply golden and crisp, then flip." },
      { step: 5, text: "Move chicken to indirect heat, close the lid, and cook until internal temp reaches 175°F, about 15–20 minutes more." },
      { step: 6, text: "During the last few minutes, brush thighs generously with white sauce. Pull from the grill and serve with extra sauce on the side." }
    ]
  },
  {
    title: "Carne Asada",
    slug: "carne-asada",
    description: "Skirt steak marinated in citrus, garlic, and chili, grilled fast over screaming-hot coals, then sliced thin against the grain for tacos or plates.",
    cuisine: "Mexican",
    time_total: "45 min",
    time_active: "15 min",
    time_passive: "30 min",
    time_passive_label: "marinating",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Traditional Mexican preparation",
    tags: ["grilling", "beef", "mexican", "tacos", "weeknight"],
    ingredients: [
      { name: "skirt steak", amount: "2", unit: "lbs" },
      { name: "lime juice", amount: "¼", unit: "cup" },
      { name: "orange juice", amount: "¼", unit: "cup" },
      { name: "olive oil", amount: "3", unit: "tbsp" },
      { name: "garlic, minced", amount: "4", unit: "cloves" },
      { name: "jalapeño, minced", amount: "1", unit: "" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "chili powder", amount: "1", unit: "tsp" },
      { name: "fresh cilantro, chopped", amount: "¼", unit: "cup" },
      { name: "kosher salt", amount: "2", unit: "tsp" },
      { name: "black pepper", amount: "1", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Whisk lime juice, orange juice, olive oil, garlic, jalapeño, cumin, chili powder, cilantro, salt, and pepper in a bowl." },
      { step: 2, text: "Place skirt steak in a shallow dish or zip-lock bag. Pour marinade over, turn to coat, and refrigerate for 30 minutes (no longer than 2 hours or the citrus will start to cure the meat)." },
      { step: 3, text: "Heat grill to the highest setting. Remove steak from marinade, shake off excess, and pat surface dry." },
      { step: 4, text: "Grill over direct high heat for 3–4 minutes per side. Skirt steak is thin—you want a hard sear and medium-rare center." },
      { step: 5, text: "Rest for 5 minutes, then slice thinly against the grain. Serve with warm tortillas, lime wedges, and salsa." }
    ]
  },
  {
    title: "Yakitori",
    slug: "yakitori",
    description: "Bite-sized pieces of chicken thigh threaded on bamboo skewers and grilled over binchotan, lacquered with a soy-mirin tare that caramelizes into a glossy glaze.",
    cuisine: "Japanese",
    time_total: "45 min",
    time_active: "30 min",
    servings: "4",
    servings_label: "servings (about 12 skewers)",
    source_attribution: "Traditional Japanese street food",
    tags: ["grilling", "chicken", "japanese", "skewers", "appetizer"],
    ingredients: [
      { name: "boneless, skinless chicken thighs", amount: "1.5", unit: "lbs", group: "Chicken" },
      { name: "scallions, cut into 1-inch pieces", amount: "6", unit: "", group: "Chicken" },
      { name: "soy sauce", amount: "½", unit: "cup", group: "Tare" },
      { name: "mirin", amount: "½", unit: "cup", group: "Tare" },
      { name: "sake", amount: "¼", unit: "cup", group: "Tare" },
      { name: "sugar", amount: "2", unit: "tbsp", group: "Tare" },
      { name: "shichimi togarashi", amount: "", unit: "for serving" }
    ],
    steps: [
      { step: 1, text: "Soak bamboo skewers in water for 20 minutes." },
      { step: 2, text: "Combine soy sauce, mirin, sake, and sugar in a small saucepan. Bring to a boil, then simmer until reduced by about half and slightly syrupy, 8–10 minutes. Set aside." },
      { step: 3, text: "Cut chicken thighs into roughly 1-inch pieces. Thread onto skewers, alternating with scallion pieces. Pack them snugly—they shrink as they cook." },
      { step: 4, text: "Heat grill to medium-high. Grill skewers for 2–3 minutes per side, brushing with tare after each flip, until chicken is cooked through with charred edges." },
      { step: 5, text: "Give a final brush of tare off the heat. Sprinkle with shichimi togarashi and serve immediately." }
    ]
  },
  {
    title: "Grilled Swordfish with Salsa Verde",
    slug: "grilled-swordfish-salsa-verde",
    description: "Thick swordfish steaks grilled until just opaque, served under a bright, herbaceous Italian salsa verde loaded with parsley, capers, and anchovy.",
    cuisine: "Italian",
    time_total: "25 min",
    time_active: "20 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Marcella Hazan's approach to grilled fish",
    tags: ["grilling", "seafood", "italian", "summer", "quick"],
    ingredients: [
      { name: "swordfish steaks, 1 inch thick", amount: "4", unit: "pieces, about 6 oz each", group: "Fish" },
      { name: "olive oil", amount: "2", unit: "tbsp", group: "Fish" },
      { name: "kosher salt", amount: "", unit: "to taste", group: "Fish" },
      { name: "black pepper", amount: "", unit: "to taste", group: "Fish" },
      { name: "flat-leaf parsley, packed", amount: "1", unit: "cup", group: "Salsa Verde" },
      { name: "extra-virgin olive oil", amount: "⅓", unit: "cup", group: "Salsa Verde" },
      { name: "capers, drained", amount: "2", unit: "tbsp", group: "Salsa Verde" },
      { name: "anchovy fillets", amount: "2", unit: "", group: "Salsa Verde" },
      { name: "garlic clove", amount: "1", unit: "small", group: "Salsa Verde" },
      { name: "red wine vinegar", amount: "1", unit: "tbsp", group: "Salsa Verde" },
      { name: "lemon juice", amount: "1", unit: "tbsp", group: "Salsa Verde" },
      { name: "red pepper flakes", amount: "¼", unit: "tsp", group: "Salsa Verde" }
    ],
    steps: [
      { step: 1, text: "Finely chop parsley, capers, anchovies, and garlic together on a cutting board (or pulse briefly in a food processor—you want texture, not a purée). Stir in olive oil, vinegar, lemon juice, and red pepper flakes. Season with salt." },
      { step: 2, text: "Heat grill to high. Brush swordfish steaks with olive oil and season with salt and pepper." },
      { step: 3, text: "Grill swordfish for 4 minutes per side. Resist the urge to move the fish—let it develop grill marks and release naturally." },
      { step: 4, text: "Transfer to plates and spoon salsa verde generously over each steak. Serve with grilled lemon halves." }
    ]
  },
  {
    title: "Spatchcocked Grilled Chicken",
    slug: "spatchcocked-grilled-chicken",
    description: "A whole chicken flattened and grilled indirect until the skin is shatteringly crisp and the thighs hit 175°F—the fastest, most even way to grill a whole bird.",
    cuisine: "American",
    time_total: "1 hr 15 min",
    time_active: "20 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Serious Eats technique",
    tags: ["grilling", "chicken", "whole-bird", "weekend", "technique"],
    ingredients: [
      { name: "whole chicken", amount: "1", unit: "about 4 lbs" },
      { name: "kosher salt", amount: "1", unit: "tbsp" },
      { name: "baking powder", amount: "1", unit: "tsp" },
      { name: "black pepper", amount: "1", unit: "tsp" },
      { name: "smoked paprika", amount: "1", unit: "tsp" },
      { name: "garlic powder", amount: "1", unit: "tsp" },
      { name: "olive oil", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Place chicken breast-side down. Using sturdy kitchen shears, cut along both sides of the backbone and remove it. Flip the bird and press firmly on the breastbone until it cracks flat." },
      { step: 2, text: "Mix salt, baking powder, pepper, paprika, and garlic powder. Rub olive oil all over the chicken, then apply the seasoning evenly on both sides. Tuck wing tips behind the breasts." },
      { step: 3, text: "Set up grill for two-zone cooking—all coals banked to one side. Place chicken skin-side up on the cooler side, close the lid with the vent over the chicken. Target 350–375°F." },
      { step: 4, text: "Cook for 35–40 minutes without lifting the lid. The indirect heat does the work." },
      { step: 5, text: "When thighs reach 170°F, move the chicken skin-side down over direct heat for 3–5 minutes to crisp the skin." },
      { step: 6, text: "Rest for 10 minutes on a cutting board, then carve. The juices should run clear and the skin should crackle when you cut through it." }
    ]
  },
  {
    title: "Grilled Corn with Miso Butter",
    slug: "grilled-corn-miso-butter",
    description: "Sweet summer corn charred on the grill, then slathered with a umami-rich white miso compound butter that caramelizes against the hot kernels.",
    cuisine: "Japanese-American",
    time_total: "20 min",
    time_active: "15 min",
    servings: "6",
    servings_label: "ears",
    source_attribution: "Inspired by Ivan Ramen",
    tags: ["grilling", "vegetarian", "corn", "summer", "side-dish"],
    ingredients: [
      { name: "ears of corn, husked", amount: "6", unit: "" },
      { name: "unsalted butter, softened", amount: "4", unit: "tbsp", group: "Miso Butter" },
      { name: "white (shiro) miso paste", amount: "2", unit: "tbsp", group: "Miso Butter" },
      { name: "honey", amount: "1", unit: "tsp", group: "Miso Butter" },
      { name: "lime juice", amount: "1", unit: "tsp", group: "Miso Butter" },
      { name: "shichimi togarashi or black pepper", amount: "", unit: "for finishing" },
      { name: "scallions, thinly sliced", amount: "2", unit: "", group: "Garnish" }
    ],
    steps: [
      { step: 1, text: "Mash softened butter with miso paste, honey, and lime juice until smooth." },
      { step: 2, text: "Heat grill to medium-high. Place corn directly on the grates." },
      { step: 3, text: "Grill, turning every 2–3 minutes, until charred in spots all around, about 8–10 minutes total." },
      { step: 4, text: "Brush miso butter generously over hot corn, letting it melt into the kernels. Sprinkle with shichimi togarashi and sliced scallions." }
    ]
  },
  {
    title: "Grilled Pork Tenderloin with Peach Glaze",
    slug: "grilled-pork-tenderloin-peach-glaze",
    description: "Lean pork tenderloin brined quickly for insurance, grilled over medium heat, and finished with a sticky bourbon-peach glaze that catches and chars at the edges.",
    cuisine: "American",
    time_total: "50 min",
    time_active: "25 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Bon Appétit",
    tags: ["grilling", "pork", "fruit", "summer", "weeknight"],
    ingredients: [
      { name: "pork tenderloin", amount: "1.5", unit: "lbs", group: "Pork" },
      { name: "kosher salt", amount: "1", unit: "tbsp", group: "Pork" },
      { name: "black pepper", amount: "1", unit: "tsp", group: "Pork" },
      { name: "olive oil", amount: "1", unit: "tbsp", group: "Pork" },
      { name: "peach preserves", amount: "⅓", unit: "cup", group: "Glaze" },
      { name: "bourbon", amount: "2", unit: "tbsp", group: "Glaze" },
      { name: "apple cider vinegar", amount: "1", unit: "tbsp", group: "Glaze" },
      { name: "soy sauce", amount: "1", unit: "tbsp", group: "Glaze" },
      { name: "Dijon mustard", amount: "1", unit: "tsp", group: "Glaze" },
      { name: "cayenne pepper", amount: "⅛", unit: "tsp", group: "Glaze" }
    ],
    steps: [
      { step: 1, text: "Trim any silver skin from the pork tenderloin. Season all over with salt and pepper, then rub with olive oil. Let sit at room temperature for 15 minutes." },
      { step: 2, text: "Whisk together peach preserves, bourbon, vinegar, soy sauce, mustard, and cayenne in a small bowl." },
      { step: 3, text: "Heat grill to medium (375–400°F). Sear tenderloin over direct heat, turning to brown all sides, about 8 minutes total." },
      { step: 4, text: "Move to indirect heat, brush generously with peach glaze, close the lid, and cook for another 10–12 minutes, brushing with more glaze every few minutes." },
      { step: 5, text: "Pull when internal temp hits 140°F. Brush with one final coat of glaze, tent with foil, and rest 8 minutes. Slice into ½-inch medallions." }
    ]
  },
  {
    title: "Grilled Halloumi and Vegetable Skewers",
    slug: "grilled-halloumi-vegetable-skewers",
    description: "Chunks of salty halloumi cheese threaded with zucchini, peppers, and red onion, grilled until the cheese develops a golden crust and the vegetables blister and sweeten.",
    cuisine: "Mediterranean",
    time_total: "30 min",
    time_active: "25 min",
    servings: "4",
    servings_label: "servings (8 skewers)",
    source_attribution: "Inspired by Ottolenghi",
    tags: ["grilling", "vegetarian", "halloumi", "skewers", "mediterranean", "summer"],
    ingredients: [
      { name: "halloumi cheese", amount: "8", unit: "oz", group: "Skewers" },
      { name: "zucchini, cut into 1-inch half-moons", amount: "2", unit: "medium", group: "Skewers" },
      { name: "red bell pepper, cut into 1-inch pieces", amount: "1", unit: "large", group: "Skewers" },
      { name: "red onion, cut into wedges", amount: "1", unit: "medium", group: "Skewers" },
      { name: "cherry tomatoes", amount: "1", unit: "pint", group: "Skewers" },
      { name: "olive oil", amount: "3", unit: "tbsp", group: "Marinade" },
      { name: "lemon juice", amount: "2", unit: "tbsp", group: "Marinade" },
      { name: "dried oregano", amount: "1", unit: "tsp", group: "Marinade" },
      { name: "smoked paprika", amount: "½", unit: "tsp", group: "Marinade" },
      { name: "garlic, minced", amount: "2", unit: "cloves", group: "Marinade" },
      { name: "za'atar", amount: "1", unit: "tbsp", group: "Finishing" },
      { name: "honey", amount: "1", unit: "tbsp", group: "Finishing" }
    ],
    steps: [
      { step: 1, text: "Cut halloumi into 1-inch cubes. Whisk olive oil, lemon juice, oregano, paprika, and garlic. Toss vegetables and halloumi in the marinade." },
      { step: 2, text: "Thread skewers, alternating halloumi with vegetables. Don't pack too tightly—leave small gaps for even cooking." },
      { step: 3, text: "Heat grill to medium-high. Oil the grates well—halloumi will stick otherwise." },
      { step: 4, text: "Grill skewers for 3–4 minutes per side, turning twice for a total of about 10 minutes. The halloumi should have defined grill marks and golden edges, the vegetables tender and blistered." },
      { step: 5, text: "Transfer to a platter, drizzle lightly with honey, and scatter za'atar over the top." }
    ]
  }
]

// ─── MAIN ───

async function main() {
  // 1. Fetch all existing titles for dedup
  console.log('Fetching existing recipes for dedup check...')
  let allTitles = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase.from('recipes').select('title').range(from, from + pageSize - 1)
    if (error) { console.error('Fetch error:', error.message); break }
    if (!data || data.length === 0) break
    allTitles = allTitles.concat(data.map(r => r.title))
    if (data.length < pageSize) break
    from += pageSize
  }
  console.log(`Found ${allTitles.length} existing recipes.`)

  // 2. Dedup and publish
  let imported = 0, skipped = 0
  for (const recipe of recipes) {
    const isDupe = allTitles.some(existing => isNearMatch(existing, recipe.title))
    if (isDupe) {
      console.log(`SKIP (dupe): ${recipe.title}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('recipes').insert({
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      time_total: recipe.time_total,
      time_active: recipe.time_active || null,
      time_passive: recipe.time_passive || null,
      time_passive_label: recipe.time_passive_label || null,
      servings: recipe.servings || null,
      servings_label: recipe.servings_label || null,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
      status: 'published',
      source_attribution: recipe.source_attribution || null,
      source_url: recipe.source_url || null,
    })

    if (error) {
      console.error(`FAIL: ${recipe.title} — ${error.message}`)
    } else {
      console.log(`OK: ${recipe.title}`)
      imported++
    }
  }

  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}, Failed: ${recipes.length - imported - skipped}`)
}

main()
