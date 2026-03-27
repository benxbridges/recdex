/**
 * import-batch-bbq-grilling.mjs — Import 10 BBQ & Grilling recipes
 *
 * Genre: BBQ / Grilling
 * Sources: Serious Eats, Bon Appétit, NYT Cooking, Food52, Kenji Lopez-Alt
 *
 * Run locally:
 *   node scripts/recipe-pipeline/import-batch-bbq-grilling.mjs
 *   node scripts/recipe-pipeline/import-batch-bbq-grilling.mjs --dry-run
 */

import { supabase, slugify } from './config.mjs'

const RECIPES = [
  {
    title: "Smoked Brisket",
    slug: "smoked-brisket",
    description: "Salt-and-pepper Texas-style brisket smoked low and slow until the bark cracks and the meat pulls apart with zero resistance. The kind of project that rewards patience with something transcendent.",
    cuisine: "American",
    time_total: "14 hrs",
    time_active: "1 hr",
    time_passive: "13 hrs",
    time_passive_label: "smoking",
    servings: "12",
    servings_label: "servings",
    source_attribution: "Inspired by Aaron Franklin's technique",
    source_url: "https://www.seriouseats.com/texas-style-smoked-brisket",
    tags: ["bbq", "beef", "smoking", "low-and-slow", "texas", "weekend-project"],
    ingredients: [
      { name: "whole packer brisket", amount: "12-14", unit: "lb" },
      { name: "coarse black pepper", amount: "1/4", unit: "cup" },
      { name: "coarse kosher salt", amount: "1/4", unit: "cup" },
      { name: "yellow mustard (binder)", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Trim the brisket: remove the hard fat cap down to about 1/4 inch, square off the edges, and remove any silver skin from the flat. Save trimmings for grinding." },
      { step: 2, text: "Mix equal parts coarse black pepper and kosher salt. Coat the brisket lightly with yellow mustard, then apply the rub generously on all sides. Let it sit uncovered in the fridge for at least 1 hour, or overnight." },
      { step: 3, text: "Set up your smoker for indirect heat at 225°F using oak or post oak. Place the brisket fat-side up with the point end facing the heat source." },
      { step: 4, text: "Smoke undisturbed for 6-8 hours, spritzing with a 50/50 mix of apple cider vinegar and water every 90 minutes after the first 3 hours. The bark should be deep mahogany." },
      { step: 5, text: "When the internal temp hits 165-170°F and the bark is set, wrap tightly in butcher paper. Return to the smoker." },
      { step: 6, text: "Continue cooking until an instant-read thermometer slides into the thickest part of the flat like butter — around 200-205°F. The probe should meet almost no resistance." },
      { step: 7, text: "Rest the wrapped brisket in a cooler (no ice) for at least 1 hour, up to 4 hours. This is not optional — resting redistributes the juices." },
      { step: 8, text: "Slice the flat against the grain into pencil-thick slices. Separate the point from the flat and slice it against its own grain. The meat should hold together but pull apart with a gentle tug." }
    ]
  },
  {
    title: "Grilled Lamb Chops with Herb Salsa Verde",
    slug: "grilled-lamb-chops-herb-salsa-verde",
    description: "Quick-seared lamb rib chops with a bright, punchy herb sauce that cuts through the richness. Fifteen minutes of actual cooking for something that looks like you spent the whole afternoon.",
    cuisine: "Mediterranean",
    time_total: "30 min",
    time_active: "20 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Bon Appétit",
    source_url: "https://www.bonappetit.com/recipe/grilled-lamb-chops",
    tags: ["grilling", "lamb", "quick", "mediterranean", "weeknight", "herbs"],
    ingredients: [
      { name: "lamb rib chops (1 inch thick)", amount: "8", unit: "" },
      { name: "extra-virgin olive oil", amount: "3", unit: "tbsp", group: "lamb" },
      { name: "kosher salt", amount: "", unit: "", group: "lamb" },
      { name: "black pepper", amount: "", unit: "", group: "lamb" },
      { name: "flat-leaf parsley, roughly chopped", amount: "1", unit: "cup", group: "salsa verde" },
      { name: "fresh mint leaves, roughly chopped", amount: "1/2", unit: "cup", group: "salsa verde" },
      { name: "capers, drained and chopped", amount: "2", unit: "tbsp", group: "salsa verde" },
      { name: "red wine vinegar", amount: "2", unit: "tbsp", group: "salsa verde" },
      { name: "garlic clove, minced", amount: "1", unit: "", group: "salsa verde" },
      { name: "Dijon mustard", amount: "1", unit: "tsp", group: "salsa verde" },
      { name: "extra-virgin olive oil", amount: "1/3", unit: "cup", group: "salsa verde" },
      { name: "anchovy fillet, minced (optional)", amount: "1", unit: "", group: "salsa verde" },
      { name: "red pepper flakes", amount: "1/4", unit: "tsp", group: "salsa verde" }
    ],
    steps: [
      { step: 1, text: "Make the salsa verde: combine parsley, mint, capers, garlic, anchovy (if using), mustard, vinegar, and red pepper flakes. Stir in the olive oil. Season with salt. Set aside — it gets better as it sits." },
      { step: 2, text: "Pat the lamb chops dry and bring to room temperature, about 20 minutes. Rub with olive oil and season aggressively with salt and pepper on both sides." },
      { step: 3, text: "Heat your grill to high (or a cast-iron grill pan over high heat until smoking). Grill the chops 3-4 minutes per side for medium-rare — the fat should be rendered and crispy at the edges." },
      { step: 4, text: "Rest the chops 5 minutes, then spoon the salsa verde generously over the top." }
    ]
  },
  {
    title: "Grilled Chicken Thighs with Lemon and Oregano",
    slug: "grilled-chicken-thighs-lemon-oregano",
    description: "Bone-in chicken thighs marinated in lemon, garlic, and oregano — the kind of unfussy, golden-skinned grilled chicken that tastes like summer in the Mediterranean.",
    cuisine: "Greek",
    time_total: "45 min",
    time_active: "25 min",
    time_passive: "20 min",
    time_passive_label: "marinating",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Kenji Lopez-Alt",
    source_url: "https://www.seriouseats.com/grilled-lemon-oregano-chicken",
    tags: ["grilling", "chicken", "greek", "weeknight", "lemon", "summer"],
    ingredients: [
      { name: "bone-in, skin-on chicken thighs", amount: "8", unit: "" },
      { name: "lemon, zested and juiced", amount: "2", unit: "" },
      { name: "garlic cloves, minced", amount: "4", unit: "" },
      { name: "dried oregano", amount: "1", unit: "tbsp" },
      { name: "extra-virgin olive oil", amount: "3", unit: "tbsp" },
      { name: "kosher salt", amount: "1", unit: "tbsp" },
      { name: "black pepper", amount: "1", unit: "tsp" },
      { name: "red pepper flakes", amount: "1/2", unit: "tsp" }
    ],
    steps: [
      { step: 1, text: "Combine lemon zest, lemon juice, garlic, oregano, olive oil, salt, pepper, and red pepper flakes. Toss with the chicken thighs and marinate at least 20 minutes, or up to 4 hours in the fridge." },
      { step: 2, text: "Heat your grill to medium-high with a cooler zone for indirect heat. Place chicken skin-side down over direct heat and cook without moving until the skin is deeply golden and releases easily, about 5-7 minutes." },
      { step: 3, text: "Flip and move to the cooler zone. Cover the grill and cook until the thickest part reads 165°F, another 8-12 minutes. If flare-ups happen, move the chicken to the cool side until they subside." },
      { step: 4, text: "Rest 5 minutes before serving. Squeeze extra lemon over the top if you like." }
    ]
  },
  {
    title: "Grilled Shrimp Skewers with Garlic Butter",
    slug: "grilled-shrimp-skewers-garlic-butter",
    description: "Big shrimp basted in garlic-herb butter over a hot grill — charred edges, juicy centers, done in the time it takes to set the table.",
    cuisine: "American",
    time_total: "20 min",
    time_active: "15 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Food52",
    source_url: "https://food52.com/recipes/grilled-shrimp-garlic-butter",
    tags: ["grilling", "shrimp", "seafood", "quick", "weeknight", "summer", "garlic"],
    ingredients: [
      { name: "large shrimp, peeled and deveined (tail-on)", amount: "1.5", unit: "lb" },
      { name: "unsalted butter", amount: "4", unit: "tbsp" },
      { name: "garlic cloves, minced", amount: "4", unit: "" },
      { name: "fresh parsley, finely chopped", amount: "2", unit: "tbsp" },
      { name: "lemon juice", amount: "1", unit: "tbsp" },
      { name: "smoked paprika", amount: "1", unit: "tsp" },
      { name: "red pepper flakes", amount: "1/4", unit: "tsp" },
      { name: "kosher salt", amount: "", unit: "" },
      { name: "olive oil", amount: "1", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Melt butter in a small saucepan over medium heat. Add garlic and cook until fragrant but not browned, about 1 minute. Stir in parsley, lemon juice, smoked paprika, and red pepper flakes. Set aside." },
      { step: 2, text: "Thread shrimp onto skewers (if using wooden skewers, soak them first for 20 minutes). Brush with olive oil and season with salt." },
      { step: 3, text: "Grill over high heat for 2-3 minutes per side — the shrimp should be pink and lightly charred. Brush generously with garlic butter after each flip." },
      { step: 4, text: "Pull off the grill and hit with one more round of garlic butter. Serve immediately with lemon wedges." }
    ]
  },
  {
    title: "Baby Back Ribs with Dry Rub",
    slug: "baby-back-ribs-dry-rub",
    description: "Tender, smoky ribs with a spiced bark that shatters at the bite. No sauce needed — the rub does all the talking.",
    cuisine: "American",
    time_total: "5 hrs",
    time_active: "30 min",
    time_passive: "4 hrs 30 min",
    time_passive_label: "smoking/grilling",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Meathead Goldwyn / AmazingRibs.com",
    source_url: "https://www.seriouseats.com/baby-back-ribs",
    tags: ["bbq", "ribs", "pork", "smoking", "low-and-slow", "weekend-project"],
    ingredients: [
      { name: "racks baby back ribs", amount: "2", unit: "" },
      { name: "brown sugar", amount: "1/4", unit: "cup", group: "dry rub" },
      { name: "smoked paprika", amount: "2", unit: "tbsp", group: "dry rub" },
      { name: "chili powder", amount: "1", unit: "tbsp", group: "dry rub" },
      { name: "garlic powder", amount: "1", unit: "tbsp", group: "dry rub" },
      { name: "onion powder", amount: "1", unit: "tbsp", group: "dry rub" },
      { name: "kosher salt", amount: "1", unit: "tbsp", group: "dry rub" },
      { name: "black pepper", amount: "2", unit: "tsp", group: "dry rub" },
      { name: "cayenne pepper", amount: "1/2", unit: "tsp", group: "dry rub" },
      { name: "yellow mustard (binder)", amount: "2", unit: "tbsp" },
      { name: "apple cider vinegar (for spritzing)", amount: "1/2", unit: "cup" }
    ],
    steps: [
      { step: 1, text: "Remove the membrane from the back of each rack: slide a butter knife under it at one end, grip with a paper towel, and peel it off in one motion." },
      { step: 2, text: "Mix all dry rub ingredients together. Coat the ribs lightly with yellow mustard, then apply the rub generously on both sides. Let sit at room temperature for 30 minutes." },
      { step: 3, text: "Set up your smoker or grill for indirect heat at 250°F. Add a couple of chunks of fruit wood (apple or cherry). Place the ribs bone-side down on the cool side." },
      { step: 4, text: "Smoke for 3 hours, spritzing with apple cider vinegar every 45 minutes after the first hour. The bark should be deep and the meat should have pulled back from the bones about 1/4 inch." },
      { step: 5, text: "Wrap each rack tightly in foil with a splash of apple cider vinegar. Return to the smoker for 1 hour." },
      { step: 6, text: "Unwrap and place back on the grate for 30 minutes to firm up the bark. The ribs are done when a toothpick slides into the meat between the bones with little resistance." },
      { step: 7, text: "Rest 10 minutes, then slice between the bones. The meat should bend and crack when you pick up a rack — not fall off the bone completely." }
    ]
  },
  {
    title: "Grilled Vegetable Platter with Romesco",
    slug: "grilled-vegetable-platter-romesco",
    description: "A spread of charred summer vegetables served with smoky, nutty romesco — the kind of side dish that quietly becomes the main event.",
    cuisine: "Spanish",
    time_total: "45 min",
    time_active: "35 min",
    servings: "6",
    servings_label: "servings",
    source_attribution: "Inspired by Bon Appétit",
    source_url: "https://www.bonappetit.com/recipe/grilled-vegetables-romesco",
    tags: ["grilling", "vegetarian", "vegetables", "spanish", "summer", "romesco"],
    ingredients: [
      { name: "zucchini, halved lengthwise", amount: "2", unit: "", group: "vegetables" },
      { name: "red bell peppers, quartered", amount: "2", unit: "", group: "vegetables" },
      { name: "eggplant, sliced into 1/2-inch rounds", amount: "1", unit: "", group: "vegetables" },
      { name: "red onion, cut into thick rings", amount: "1", unit: "", group: "vegetables" },
      { name: "asparagus, trimmed", amount: "1", unit: "bunch", group: "vegetables" },
      { name: "olive oil", amount: "3", unit: "tbsp", group: "vegetables" },
      { name: "kosher salt and pepper", amount: "", unit: "", group: "vegetables" },
      { name: "roasted red peppers (jarred)", amount: "1", unit: "cup", group: "romesco" },
      { name: "marcona almonds", amount: "1/3", unit: "cup", group: "romesco" },
      { name: "garlic clove", amount: "1", unit: "", group: "romesco" },
      { name: "smoked paprika", amount: "1", unit: "tsp", group: "romesco" },
      { name: "sherry vinegar", amount: "1", unit: "tbsp", group: "romesco" },
      { name: "extra-virgin olive oil", amount: "1/4", unit: "cup", group: "romesco" },
      { name: "tomato paste", amount: "1", unit: "tbsp", group: "romesco" },
      { name: "cayenne pepper", amount: "pinch", unit: "", group: "romesco" }
    ],
    steps: [
      { step: 1, text: "Make the romesco: blend roasted red peppers, almonds, garlic, smoked paprika, sherry vinegar, tomato paste, and cayenne until mostly smooth. Stream in the olive oil and blend until combined. Season with salt. Thin with a splash of water if needed." },
      { step: 2, text: "Toss all vegetables with olive oil, salt, and pepper. Let them sit while the grill heats — drawing out moisture helps charring." },
      { step: 3, text: "Grill over medium-high heat, turning once: bell peppers and eggplant need 4-5 minutes per side, zucchini and onion rings 3-4 minutes, asparagus 2-3 minutes. You want deep char marks but vegetables that still have structure." },
      { step: 4, text: "Arrange on a platter, drizzle with extra olive oil, and serve the romesco alongside for dipping." }
    ]
  },
  {
    title: "Spatchcocked Grilled Chicken",
    slug: "spatchcocked-grilled-chicken",
    description: "A whole chicken flattened and grilled — juicy dark meat, crispy skin everywhere, and done in under an hour. Once you spatchcock, you don't go back.",
    cuisine: "American",
    time_total: "55 min",
    time_active: "20 min",
    time_passive: "35 min",
    time_passive_label: "grilling",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Kenji Lopez-Alt",
    source_url: "https://www.seriouseats.com/spatchcocked-grilled-chicken",
    tags: ["grilling", "chicken", "whole-chicken", "spatchcock", "weekend"],
    ingredients: [
      { name: "whole chicken (3.5-4 lb)", amount: "1", unit: "" },
      { name: "kosher salt", amount: "1", unit: "tbsp" },
      { name: "baking powder", amount: "1", unit: "tsp" },
      { name: "black pepper", amount: "1", unit: "tsp" },
      { name: "garlic powder", amount: "1", unit: "tsp" },
      { name: "smoked paprika", amount: "1", unit: "tsp" },
      { name: "olive oil", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Spatchcock the chicken: place breast-side down and use kitchen shears to cut along both sides of the backbone. Remove the backbone (save it for stock). Flip the chicken and press down firmly on the breastbone until it cracks flat." },
      { step: 2, text: "Mix salt, baking powder, pepper, garlic powder, and smoked paprika. Pat the chicken dry, rub with olive oil, and season all over with the mixture. Tuck the wing tips behind the breasts." },
      { step: 3, text: "Set up a two-zone grill: high heat on one side, no heat on the other. Place the chicken skin-side up on the cool side. Cover with the lid vent positioned over the chicken to draw smoke across it." },
      { step: 4, text: "Grill with the lid closed for 25-30 minutes until the thigh reads 155°F. Move the chicken skin-side down over direct heat for 3-5 minutes to crisp the skin — watch for flare-ups." },
      { step: 5, text: "Rest the chicken 10 minutes on a cutting board. The thighs should read 175°F and the breast 165°F after resting. Carve into pieces and serve." }
    ]
  },
  {
    title: "Korean BBQ Short Ribs (Galbi)",
    slug: "korean-bbq-short-ribs-galbi",
    description: "Thin-cut beef short ribs marinated in a sweet-savory mix of soy, pear, and sesame, then grilled fast and hot until caramelized at the edges.",
    cuisine: "Korean",
    time_total: "4 hrs 20 min",
    time_active: "20 min",
    time_passive: "4 hrs",
    time_passive_label: "marinating",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Maangchi",
    source_url: "https://www.seriouseats.com/korean-bbq-short-ribs",
    tags: ["grilling", "korean", "beef", "ribs", "bbq", "marinated"],
    ingredients: [
      { name: "flanken-cut beef short ribs (1/4 inch thick)", amount: "3", unit: "lb" },
      { name: "soy sauce", amount: "1/2", unit: "cup", group: "marinade" },
      { name: "Asian pear, grated (or sub 3 tbsp sugar + 2 tbsp water)", amount: "1", unit: "", group: "marinade" },
      { name: "brown sugar", amount: "3", unit: "tbsp", group: "marinade" },
      { name: "sesame oil", amount: "2", unit: "tbsp", group: "marinade" },
      { name: "garlic cloves, minced", amount: "5", unit: "", group: "marinade" },
      { name: "fresh ginger, grated", amount: "1", unit: "tbsp", group: "marinade" },
      { name: "rice wine (mirin)", amount: "2", unit: "tbsp", group: "marinade" },
      { name: "black pepper", amount: "1", unit: "tsp", group: "marinade" },
      { name: "scallions, thinly sliced", amount: "3", unit: "", group: "garnish" },
      { name: "toasted sesame seeds", amount: "1", unit: "tbsp", group: "garnish" }
    ],
    steps: [
      { step: 1, text: "Soak the short ribs in cold water for 30 minutes to draw out excess blood. Drain and pat dry." },
      { step: 2, text: "Blend the grated pear, soy sauce, brown sugar, sesame oil, garlic, ginger, mirin, and black pepper until smooth. Pour over the ribs and marinate in the fridge for at least 4 hours, or overnight." },
      { step: 3, text: "Heat your grill to high — you want screaming-hot grates. Pull the ribs from the marinade and shake off excess (the sugars will burn if the coating is too thick)." },
      { step: 4, text: "Grill 2-3 minutes per side. The thin-cut ribs cook fast — you want dark caramelization on the edges but the meat should still be juicy, not dried out." },
      { step: 5, text: "Stack on a platter and scatter with scallions and sesame seeds. Serve with steamed rice, lettuce wraps, and kimchi." }
    ]
  },
  {
    title: "Grilled Corn with Chile-Lime Butter",
    slug: "grilled-corn-chile-lime-butter",
    description: "Sweet summer corn charred on the grill and rolled in spiced butter — the flavor of elote without the street cart mess. Peak August eating.",
    cuisine: "Mexican",
    time_total: "20 min",
    time_active: "15 min",
    servings: "6",
    servings_label: "ears",
    source_attribution: "Inspired by Rick Bayless",
    source_url: "https://www.seriouseats.com/grilled-corn-chile-lime-butter",
    tags: ["grilling", "corn", "mexican", "summer", "side-dish", "vegetarian", "quick"],
    ingredients: [
      { name: "ears of corn, husked", amount: "6", unit: "" },
      { name: "unsalted butter, softened", amount: "4", unit: "tbsp" },
      { name: "lime, zested and juiced", amount: "1", unit: "" },
      { name: "ancho chile powder", amount: "1", unit: "tsp" },
      { name: "smoked paprika", amount: "1/2", unit: "tsp" },
      { name: "cayenne pepper", amount: "1/4", unit: "tsp" },
      { name: "kosher salt", amount: "1/2", unit: "tsp" },
      { name: "cotija cheese, crumbled", amount: "1/4", unit: "cup" },
      { name: "cilantro, chopped", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Mix softened butter with lime zest, lime juice, ancho chile powder, smoked paprika, cayenne, and salt until combined." },
      { step: 2, text: "Grill corn over high heat, turning every 2-3 minutes, until charred in spots all around — about 8-10 minutes total. Some kernels should be blistered and blackened." },
      { step: 3, text: "While the corn is still hot, roll each ear in the chile-lime butter, then sprinkle with crumbled cotija and cilantro." }
    ]
  },
  {
    title: "Grilled Swordfish Steaks with Olive Tapenade",
    slug: "grilled-swordfish-steaks-olive-tapenade",
    description: "Thick-cut swordfish grilled until just opaque with a briny, punchy olive tapenade spooned on top. A fish that stands up to the grill without falling apart.",
    cuisine: "Mediterranean",
    time_total: "25 min",
    time_active: "20 min",
    servings: "4",
    servings_label: "servings",
    source_attribution: "Inspired by Epicurious",
    source_url: "https://www.epicurious.com/recipes/grilled-swordfish-tapenade",
    tags: ["grilling", "seafood", "swordfish", "mediterranean", "quick", "weeknight", "olives"],
    ingredients: [
      { name: "swordfish steaks (1 inch thick)", amount: "4", unit: "6-oz" },
      { name: "olive oil", amount: "2", unit: "tbsp", group: "fish" },
      { name: "kosher salt", amount: "", unit: "", group: "fish" },
      { name: "black pepper", amount: "", unit: "", group: "fish" },
      { name: "Kalamata olives, pitted", amount: "1", unit: "cup", group: "tapenade" },
      { name: "capers, drained", amount: "2", unit: "tbsp", group: "tapenade" },
      { name: "anchovy fillets", amount: "2", unit: "", group: "tapenade" },
      { name: "garlic clove", amount: "1", unit: "", group: "tapenade" },
      { name: "lemon juice", amount: "1", unit: "tbsp", group: "tapenade" },
      { name: "fresh thyme leaves", amount: "1", unit: "tsp", group: "tapenade" },
      { name: "extra-virgin olive oil", amount: "3", unit: "tbsp", group: "tapenade" }
    ],
    steps: [
      { step: 1, text: "Make the tapenade: pulse olives, capers, anchovies, garlic, lemon juice, and thyme in a food processor until coarsely chopped (not a paste). Stir in the olive oil. Season with pepper — it likely won't need salt." },
      { step: 2, text: "Pat the swordfish dry, brush both sides with olive oil, and season generously with salt and pepper. Let sit at room temperature for 10 minutes." },
      { step: 3, text: "Grill over high heat, about 4-5 minutes per side. Swordfish is done when just opaque in the center — it will continue cooking off the heat. Don't overcook or it turns dry and chalky." },
      { step: 4, text: "Spoon tapenade over each steak and serve immediately." }
    ]
  }
]

// --- Dedup helpers ---

function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function isNearMatch(newTitle, existingTitle) {
  const a = normalize(newTitle)
  const b = normalize(existingTitle)
  // Exact match
  if (a === b) return true
  // One contains the other
  if (a.includes(b) || b.includes(a)) return true
  // Check if removing common prefixes makes them match
  const prefixes = ['classic ', 'traditional ', 'homemade ', 'easy ', 'best ', 'simple ']
  for (const p of prefixes) {
    if (a.replace(p, '') === b.replace(p, '')) return true
    if (a.replace(p, '') === b || a === b.replace(p, '')) return true
  }
  return false
}

// --- Main ---

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('=== BBQ & Grilling Recipe Import ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')

  // Step 1: Fetch all existing titles for dedup
  console.log('Fetching existing recipes for dedup check...')
  const { data: existing, error: fetchError } = await supabase
    .from('recipes')
    .select('title, slug')
    .order('title')

  if (fetchError) {
    console.error('Failed to fetch existing recipes:', fetchError.message)
    process.exit(1)
  }

  console.log(`Found ${existing.length} existing recipes in database.`)
  console.log('')

  // Step 2: Dedup check + import
  let imported = 0
  let skipped = 0
  let failed = 0

  for (const recipe of RECIPES) {
    // Check for duplicates
    const dupe = existing.find(e => isNearMatch(recipe.title, e.title))
    if (dupe) {
      console.log(`⏭  SKIP (duplicate): "${recipe.title}" ≈ "${dupe.title}"`)
      skipped++
      continue
    }

    // Also check slug
    const slugDupe = existing.find(e => e.slug === recipe.slug)
    if (slugDupe) {
      console.log(`⏭  SKIP (slug exists): "${recipe.slug}"`)
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`✓  WOULD IMPORT: "${recipe.title}" [${recipe.cuisine}] (${recipe.time_total})`)
      imported++
      continue
    }

    // Publish
    const { error: insertError } = await supabase.from('recipes').insert({
      ...recipe,
      status: 'published',
      difficulty: 'medium',
      source: 'community',
    })

    if (insertError) {
      console.error(`✗  FAILED: "${recipe.title}" — ${insertError.message}`)
      failed++
    } else {
      console.log(`✓  IMPORTED: "${recipe.title}" [${recipe.cuisine}] (${recipe.time_total})`)
      imported++
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Imported: ${imported}`)
  console.log(`Skipped (duplicates): ${skipped}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total candidates: ${RECIPES.length}`)
  console.log('')
  console.log('Genre: BBQ & Grilling')
  console.log('Sources: Serious Eats, Bon Appétit, Food52, Epicurious, Kenji Lopez-Alt, Maangchi, Rick Bayless')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
