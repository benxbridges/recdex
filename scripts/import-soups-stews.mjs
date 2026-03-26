#!/usr/bin/env node
/**
 * Import 10 Soups & Stews recipes to RecDex
 * Run: SUPABASE_SERVICE_KEY=xxx node scripts/import-soups-stews.mjs
 *
 * Genre: Soups & Stews (rotating from previous Middle Eastern run)
 * All 10 recipes dedup-checked against 232 existing recipes on 2026-03-26
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

const recipes = [
  {
    title: "Chicken Tortilla Soup",
    slug: "chicken-tortilla-soup",
    description: "A smoky, chile-laced broth loaded with shredded chicken and topped with crispy tortilla strips, avocado, and lime. The kind of bowl that makes you forget takeout exists.",
    cuisine: "Mexican",
    time_total: "45 min",
    time_active: "25 min",
    servings: 6,
    servings_label: "servings",
    source_attribution: "Inspired by Rick Bayless",
    tags: ["soup", "chicken", "mexican", "weeknight", "gluten-free-adaptable", "spicy"],
    ingredients: [
      { name: "bone-in, skin-on chicken thighs", amount: "1.5", unit: "lbs" },
      { name: "vegetable oil", amount: "2", unit: "tbsp" },
      { name: "yellow onion, diced", amount: "1", unit: "" },
      { name: "garlic cloves, minced", amount: "4", unit: "" },
      { name: "jalapeño, seeded and minced", amount: "1", unit: "" },
      { name: "canned fire-roasted tomatoes", amount: "14", unit: "oz" },
      { name: "dried ancho chile, stemmed and seeded", amount: "1", unit: "" },
      { name: "chicken broth", amount: "6", unit: "cups" },
      { name: "ground cumin", amount: "1", unit: "tsp" },
      { name: "dried oregano (Mexican if available)", amount: "1", unit: "tsp" },
      { name: "salt", amount: "1", unit: "tsp" },
      { name: "corn tortillas, cut into strips", amount: "6", unit: "", group: "Toppings" },
      { name: "avocado, diced", amount: "1", unit: "", group: "Toppings" },
      { name: "lime, cut into wedges", amount: "1", unit: "", group: "Toppings" },
      { name: "fresh cilantro", amount: "1/4", unit: "cup", group: "Toppings" },
      { name: "sour cream", amount: "", unit: "", group: "Toppings" },
      { name: "cotija cheese, crumbled", amount: "", unit: "", group: "Toppings" }
    ],
    steps: [
      { step: 1, text: "Heat oil in a large Dutch oven over medium-high heat. Season chicken thighs with salt and sear skin-side down until golden, about 5 minutes per side. Remove and set aside." },
      { step: 2, text: "In the same pot, cook onion until softened, about 4 minutes. Add garlic and jalapeño and cook until fragrant, about 1 minute." },
      { step: 3, text: "Tear the ancho chile into pieces and add to the pot along with fire-roasted tomatoes, cumin, and oregano. Stir and cook for 2 minutes." },
      { step: 4, text: "Pour in chicken broth, nestle the chicken thighs back in, and bring to a boil. Reduce heat and simmer until chicken is cooked through, about 20 minutes." },
      { step: 5, text: "Remove chicken, shred the meat (discard skin and bones), and return to the pot. Season with salt to taste." },
      { step: 6, text: "While the soup simmers, toss tortilla strips with a drizzle of oil, spread on a baking sheet, and bake at 400°F until crispy, about 8 minutes." },
      { step: 7, text: "Ladle soup into bowls and top with crispy tortilla strips, diced avocado, cilantro, a squeeze of lime, and any other toppings you like." }
    ]
  },
  {
    title: "Mulligatawny",
    slug: "mulligatawny",
    description: "A velvety, curry-spiced soup born from the collision of Indian and British cooking. Lentils, coconut milk, and a squeeze of lemon make it deeply satisfying.",
    cuisine: "Indian",
    time_total: "50 min",
    time_active: "20 min",
    servings: 6,
    servings_label: "servings",
    source_attribution: "Inspired by Madhur Jaffrey",
    tags: ["soup", "indian", "lentils", "coconut", "weeknight", "gluten-free"],
    ingredients: [
      { name: "ghee or butter", amount: "3", unit: "tbsp" },
      { name: "yellow onion, diced", amount: "1", unit: "large" },
      { name: "carrots, peeled and diced", amount: "2", unit: "" },
      { name: "celery stalks, diced", amount: "2", unit: "" },
      { name: "garlic cloves, minced", amount: "3", unit: "" },
      { name: "fresh ginger, grated", amount: "1", unit: "tbsp" },
      { name: "curry powder", amount: "2", unit: "tbsp" },
      { name: "ground turmeric", amount: "1/2", unit: "tsp" },
      { name: "red lentils, rinsed", amount: "3/4", unit: "cup" },
      { name: "chicken or vegetable broth", amount: "5", unit: "cups" },
      { name: "coconut milk", amount: "14", unit: "oz" },
      { name: "tart apple (like Granny Smith), peeled and diced", amount: "1", unit: "" },
      { name: "lemon juice", amount: "2", unit: "tbsp" },
      { name: "salt", amount: "1", unit: "tsp" },
      { name: "cooked basmati rice, for serving", amount: "", unit: "" }
    ],
    steps: [
      { step: 1, text: "Melt ghee in a large pot over medium heat. Cook onion, carrots, and celery until softened, about 6 minutes." },
      { step: 2, text: "Add garlic and ginger and cook until fragrant, about 1 minute. Stir in curry powder and turmeric and toast for 30 seconds." },
      { step: 3, text: "Add lentils, diced apple, and broth. Bring to a boil, then reduce heat and simmer until lentils are completely tender, about 25 minutes." },
      { step: 4, text: "Stir in coconut milk and use an immersion blender to blend until smooth (or leave some texture if you prefer)." },
      { step: 5, text: "Add lemon juice and season with salt. Serve in bowls with a scoop of basmati rice." }
    ]
  },
  {
    title: "Caldo Verde",
    slug: "caldo-verde",
    description: "Portugal's national soup — silky potato broth with ribbons of kale and smoky chorizo. Simple ingredients, extraordinary comfort.",
    cuisine: "Portuguese",
    time_total: "40 min",
    time_active: "15 min",
    servings: 4,
    servings_label: "servings",
    source_attribution: "Inspired by David Leite",
    tags: ["soup", "portuguese", "kale", "chorizo", "simple", "gluten-free", "weeknight"],
    ingredients: [
      { name: "extra-virgin olive oil", amount: "3", unit: "tbsp" },
      { name: "dry-cured chorizo, sliced into half-moons", amount: "6", unit: "oz" },
      { name: "yellow onion, diced", amount: "1", unit: "" },
      { name: "garlic cloves, minced", amount: "3", unit: "" },
      { name: "Yukon Gold potatoes, peeled and diced", amount: "1", unit: "lb" },
      { name: "chicken broth", amount: "5", unit: "cups" },
      { name: "lacinato (Tuscan) kale, stems removed, leaves thinly sliced", amount: "1", unit: "bunch" },
      { name: "salt and black pepper", amount: "", unit: "" },
      { name: "crusty bread, for serving", amount: "", unit: "" }
    ],
    steps: [
      { step: 1, text: "Heat 1 tablespoon olive oil in a large pot over medium heat. Add chorizo and cook until the edges crisp and the fat renders, about 4 minutes. Remove with a slotted spoon and set aside." },
      { step: 2, text: "In the same pot, add onion and cook until translucent, about 4 minutes. Add garlic and cook for 1 minute." },
      { step: 3, text: "Add potatoes and broth. Bring to a boil, then reduce heat and simmer until potatoes are falling apart, about 20 minutes." },
      { step: 4, text: "Mash the potatoes directly in the pot with a potato masher or wooden spoon — the broth should be thick but not completely smooth." },
      { step: 5, text: "Add the sliced kale and cook until just wilted, about 3 minutes. Return the chorizo to the pot." },
      { step: 6, text: "Season with salt and pepper. Ladle into bowls and finish with a drizzle of good olive oil. Serve with crusty bread." }
    ]
  },
  {
    title: "Hot and Sour Soup",
    slug: "hot-and-sour-soup",
    description: "The real thing — tangy from black vinegar, warming from white pepper, packed with mushrooms and silky egg ribbons. Nothing like the takeout version.",
    cuisine: "Sichuan",
    time_total: "30 min",
    time_active: "20 min",
    servings: 4,
    servings_label: "servings",
    source_attribution: "Inspired by Fuchsia Dunlop",
    tags: ["soup", "chinese", "sichuan", "quick", "weeknight", "spicy"],
    ingredients: [
      { name: "dried wood ear mushrooms", amount: "1/2", unit: "oz" },
      { name: "dried lily buds (optional)", amount: "1/4", unit: "cup" },
      { name: "firm tofu, cut into thin strips", amount: "4", unit: "oz" },
      { name: "pork loin, cut into thin strips", amount: "4", unit: "oz" },
      { name: "chicken broth", amount: "4", unit: "cups" },
      { name: "soy sauce", amount: "2", unit: "tbsp" },
      { name: "Chinkiang black vinegar", amount: "3", unit: "tbsp" },
      { name: "ground white pepper", amount: "1", unit: "tsp" },
      { name: "chili oil", amount: "1", unit: "tsp" },
      { name: "cornstarch mixed with 3 tbsp water", amount: "2", unit: "tbsp" },
      { name: "egg, beaten", amount: "1", unit: "" },
      { name: "sesame oil", amount: "1", unit: "tsp" },
      { name: "scallions, thinly sliced", amount: "2", unit: "" },
      { name: "salt", amount: "", unit: "" }
    ],
    steps: [
      { step: 1, text: "Soak wood ear mushrooms (and lily buds, if using) in hot water for 20 minutes. Drain, trim any tough bits, and slice the mushrooms into thin strips." },
      { step: 2, text: "Bring chicken broth to a boil in a medium pot. Add pork strips and cook for 2 minutes, skimming any foam." },
      { step: 3, text: "Add tofu strips, mushrooms, and lily buds. Simmer for 3 minutes." },
      { step: 4, text: "Stir in soy sauce, black vinegar, white pepper, and chili oil. Taste and adjust — it should be noticeably tangy and peppery." },
      { step: 5, text: "Give the cornstarch slurry a stir and pour it into the soup while stirring. Cook until the broth thickens slightly, about 1 minute." },
      { step: 6, text: "Turn off the heat. Slowly drizzle in the beaten egg while stirring gently in one direction to form silky ribbons." },
      { step: 7, text: "Finish with sesame oil and scallions. Serve immediately — this soup doesn't like to sit." }
    ]
  },
  {
    title: "Avgolemono",
    slug: "avgolemono",
    description: "Greece's iconic egg-lemon soup — silky, bright, and warming. Orzo and shredded chicken make it a complete meal in a bowl.",
    cuisine: "Greek",
    time_total: "35 min",
    time_active: "20 min",
    servings: 4,
    servings_label: "servings",
    source_attribution: "Inspired by Diane Kochilas",
    tags: ["soup", "greek", "chicken", "lemon", "egg", "weeknight", "comfort"],
    ingredients: [
      { name: "chicken broth", amount: "6", unit: "cups" },
      { name: "orzo pasta", amount: "1/2", unit: "cup" },
      { name: "cooked chicken breast, shredded", amount: "2", unit: "cups" },
      { name: "eggs", amount: "3", unit: "" },
      { name: "lemon juice", amount: "1/4", unit: "cup" },
      { name: "lemon zest", amount: "1", unit: "tsp" },
      { name: "salt", amount: "1", unit: "tsp" },
      { name: "black pepper", amount: "1/2", unit: "tsp" },
      { name: "fresh dill, chopped", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Bring chicken broth to a boil in a large pot. Add orzo and cook until just tender, about 8 minutes." },
      { step: 2, text: "Reduce heat to low and stir in the shredded chicken." },
      { step: 3, text: "In a medium bowl, whisk eggs and lemon juice together vigorously until frothy." },
      { step: 4, text: "Slowly ladle about 1 cup of hot broth into the egg mixture, whisking constantly — this tempers the eggs so they won't curdle." },
      { step: 5, text: "Pour the tempered egg mixture back into the pot, stirring gently. Cook on low heat for 2-3 minutes until the soup is creamy and slightly thickened. Do not let it boil or the eggs will scramble." },
      { step: 6, text: "Season with salt, pepper, and lemon zest. Serve topped with fresh dill." }
    ]
  },
  {
    title: "Wonton Soup",
    slug: "wonton-soup",
    description: "Delicate pork-and-shrimp wontons swimming in a clean, ginger-scented broth with baby bok choy. The effort is in the folding — the rest takes care of itself.",
    cuisine: "Chinese",
    time_total: "1 hr",
    time_active: "40 min",
    servings: 4,
    servings_label: "servings",
    source_attribution: "Inspired by Woks of Life",
    tags: ["soup", "chinese", "dumplings", "pork", "shrimp", "comfort"],
    ingredients: [
      { name: "ground pork", amount: "8", unit: "oz", group: "Wontons" },
      { name: "raw shrimp, peeled and finely chopped", amount: "4", unit: "oz", group: "Wontons" },
      { name: "soy sauce", amount: "1", unit: "tbsp", group: "Wontons" },
      { name: "sesame oil", amount: "1", unit: "tsp", group: "Wontons" },
      { name: "fresh ginger, grated", amount: "1", unit: "tsp", group: "Wontons" },
      { name: "scallion, finely chopped", amount: "1", unit: "", group: "Wontons" },
      { name: "ground white pepper", amount: "1/4", unit: "tsp", group: "Wontons" },
      { name: "wonton wrappers", amount: "40", unit: "", group: "Wontons" },
      { name: "chicken broth", amount: "6", unit: "cups", group: "Broth" },
      { name: "fresh ginger, sliced", amount: "3", unit: "slices", group: "Broth" },
      { name: "soy sauce", amount: "1", unit: "tbsp", group: "Broth" },
      { name: "sesame oil", amount: "1", unit: "tsp", group: "Broth" },
      { name: "baby bok choy, halved", amount: "4", unit: "", group: "Broth" },
      { name: "scallions, sliced", amount: "2", unit: "", group: "Garnish" },
      { name: "chili oil, for serving", amount: "", unit: "", group: "Garnish" }
    ],
    steps: [
      { step: 1, text: "Mix pork, chopped shrimp, soy sauce, sesame oil, grated ginger, scallion, and white pepper in a bowl until well combined." },
      { step: 2, text: "Place about 1 teaspoon of filling in the center of each wonton wrapper. Wet the edges with water, fold into a triangle, and press to seal. Pull the two bottom corners together and pinch — you'll get a classic wonton shape." },
      { step: 3, text: "Bring a large pot of water to a boil for cooking the wontons. In a separate pot, heat chicken broth with ginger slices until simmering." },
      { step: 4, text: "Drop wontons into the boiling water and cook until they float and the wrappers look translucent, about 3-4 minutes. Add bok choy to the broth pot for the last 2 minutes." },
      { step: 5, text: "Season the broth with soy sauce and sesame oil. Remove the ginger slices." },
      { step: 6, text: "Divide wontons and bok choy among bowls, ladle broth over them, and top with sliced scallions and a drizzle of chili oil." }
    ]
  },
  {
    title: "Roasted Pumpkin Soup",
    slug: "roasted-pumpkin-soup",
    description: "Roasting concentrates the pumpkin's sweetness, then everything blends into a velvety bowl finished with brown butter and sage. Autumn in a spoon.",
    cuisine: "American",
    time_total: "1 hr",
    time_active: "15 min",
    time_passive: "40 min",
    time_passive_label: "roasting",
    servings: 4,
    servings_label: "servings",
    source_attribution: "Inspired by Samin Nosrat",
    tags: ["soup", "pumpkin", "vegetarian", "fall", "gluten-free", "vegan-adaptable"],
    ingredients: [
      { name: "sugar pumpkin (about 3 lbs), halved and seeded", amount: "1", unit: "" },
      { name: "extra-virgin olive oil", amount: "2", unit: "tbsp" },
      { name: "butter", amount: "3", unit: "tbsp" },
      { name: "yellow onion, diced", amount: "1", unit: "" },
      { name: "garlic cloves, minced", amount: "3", unit: "" },
      { name: "fresh sage leaves", amount: "8", unit: "" },
      { name: "vegetable or chicken broth", amount: "3", unit: "cups" },
      { name: "heavy cream", amount: "1/4", unit: "cup" },
      { name: "freshly grated nutmeg", amount: "1/4", unit: "tsp" },
      { name: "salt and black pepper", amount: "", unit: "" },
      { name: "pepitas (pumpkin seeds), toasted", amount: "2", unit: "tbsp" }
    ],
    steps: [
      { step: 1, text: "Heat oven to 400°F. Brush pumpkin halves with olive oil, season with salt, and place cut-side down on a sheet pan. Roast until a knife slides through easily, 35-40 minutes. Scoop out the flesh." },
      { step: 2, text: "Melt 1 tablespoon butter in a large pot over medium heat. Cook onion until soft and golden, about 6 minutes. Add garlic and cook for 1 minute." },
      { step: 3, text: "Add roasted pumpkin flesh and broth. Bring to a simmer and cook for 10 minutes." },
      { step: 4, text: "Blend until completely smooth with an immersion blender (or in batches in a regular blender). Stir in cream and nutmeg. Season with salt and pepper." },
      { step: 5, text: "In a small pan, melt remaining 2 tablespoons butter over medium heat. When it foams and turns golden brown, add sage leaves and fry until crisp, about 30 seconds." },
      { step: 6, text: "Ladle soup into bowls. Drizzle with brown butter, top with fried sage leaves and toasted pepitas." }
    ]
  },
  {
    title: "Tuscan White Bean Soup",
    slug: "tuscan-white-bean-soup",
    description: "A rustic Italian soup where creamy cannellini beans melt into a broth perfumed with rosemary and Parmesan rind. The definition of humble food done right.",
    cuisine: "Italian",
    time_total: "45 min",
    time_active: "15 min",
    servings: 4,
    servings_label: "servings",
    source_attribution: "Inspired by Marcella Hazan",
    tags: ["soup", "italian", "beans", "vegetarian", "tuscan", "weeknight", "comfort"],
    ingredients: [
      { name: "extra-virgin olive oil, plus more for finishing", amount: "3", unit: "tbsp" },
      { name: "pancetta, diced (or omit for vegetarian)", amount: "3", unit: "oz" },
      { name: "yellow onion, diced", amount: "1", unit: "" },
      { name: "carrots, diced", amount: "2", unit: "" },
      { name: "celery stalks, diced", amount: "2", unit: "" },
      { name: "garlic cloves, minced", amount: "4", unit: "" },
      { name: "fresh rosemary sprigs", amount: "2", unit: "" },
      { name: "canned cannellini beans, drained and rinsed", amount: "30", unit: "oz" },
      { name: "chicken or vegetable broth", amount: "4", unit: "cups" },
      { name: "Parmesan rind (optional)", amount: "1", unit: "piece" },
      { name: "lacinato kale, stems removed, roughly chopped", amount: "4", unit: "cups" },
      { name: "red pepper flakes", amount: "1/4", unit: "tsp" },
      { name: "salt and black pepper", amount: "", unit: "" },
      { name: "grated Parmesan, for serving", amount: "", unit: "" },
      { name: "crusty bread, for serving", amount: "", unit: "" }
    ],
    steps: [
      { step: 1, text: "Heat olive oil in a large pot over medium heat. Cook pancetta until rendered and crispy, about 5 minutes. Remove half for garnish." },
      { step: 2, text: "Add onion, carrots, and celery. Cook until softened, about 6 minutes. Add garlic, rosemary, and red pepper flakes and cook for 1 minute." },
      { step: 3, text: "Add beans, broth, and Parmesan rind. Bring to a simmer. Take out about 1 cup of beans, mash them, and stir back in — this thickens the broth naturally." },
      { step: 4, text: "Simmer for 20 minutes until the flavors meld. Add kale in the last 5 minutes and cook until tender." },
      { step: 5, text: "Remove rosemary sprigs and Parmesan rind. Season with salt and pepper." },
      { step: 6, text: "Serve in bowls with a generous drizzle of olive oil, grated Parmesan, reserved crispy pancetta, and crusty bread alongside." }
    ]
  },
  {
    title: "Chicken and Dumplings",
    slug: "chicken-and-dumplings",
    description: "Tender chicken in a rich, creamy broth topped with fluffy drop dumplings that steam right in the pot. Southern comfort at its finest.",
    cuisine: "American Southern",
    time_total: "1 hr 15 min",
    time_active: "30 min",
    servings: 6,
    servings_label: "servings",
    source_attribution: "Inspired by Edna Lewis",
    tags: ["soup", "stew", "chicken", "dumplings", "southern", "comfort", "american"],
    ingredients: [
      { name: "bone-in, skin-on chicken thighs and drumsticks", amount: "2.5", unit: "lbs", group: "Stew" },
      { name: "butter", amount: "3", unit: "tbsp", group: "Stew" },
      { name: "yellow onion, diced", amount: "1", unit: "", group: "Stew" },
      { name: "carrots, sliced into coins", amount: "3", unit: "", group: "Stew" },
      { name: "celery stalks, sliced", amount: "3", unit: "", group: "Stew" },
      { name: "garlic cloves, minced", amount: "3", unit: "", group: "Stew" },
      { name: "all-purpose flour", amount: "1/4", unit: "cup", group: "Stew" },
      { name: "chicken broth", amount: "6", unit: "cups", group: "Stew" },
      { name: "fresh thyme sprigs", amount: "4", unit: "", group: "Stew" },
      { name: "bay leaf", amount: "1", unit: "", group: "Stew" },
      { name: "heavy cream", amount: "1/2", unit: "cup", group: "Stew" },
      { name: "salt and black pepper", amount: "", unit: "", group: "Stew" },
      { name: "all-purpose flour", amount: "2", unit: "cups", group: "Dumplings" },
      { name: "baking powder", amount: "1", unit: "tbsp", group: "Dumplings" },
      { name: "salt", amount: "1", unit: "tsp", group: "Dumplings" },
      { name: "butter, cold, cut into pieces", amount: "4", unit: "tbsp", group: "Dumplings" },
      { name: "buttermilk", amount: "3/4", unit: "cup", group: "Dumplings" },
      { name: "fresh parsley, chopped", amount: "2", unit: "tbsp", group: "Dumplings" }
    ],
    steps: [
      { step: 1, text: "Season chicken pieces with salt and pepper. Melt butter in a large Dutch oven over medium-high heat. Sear chicken until golden on both sides, about 4 minutes per side. Remove and set aside." },
      { step: 2, text: "In the same pot, cook onion, carrots, and celery until softened, about 5 minutes. Add garlic and cook for 1 minute." },
      { step: 3, text: "Sprinkle flour over the vegetables and stir for 1 minute. Slowly pour in chicken broth, stirring to prevent lumps. Add thyme and bay leaf." },
      { step: 4, text: "Return chicken to the pot. Bring to a boil, then reduce heat and simmer, covered, until chicken is cooked through, about 25 minutes." },
      { step: 5, text: "Remove chicken, shred the meat (discard skin and bones), and return to the pot. Stir in cream. Remove thyme stems and bay leaf." },
      { step: 6, text: "Make the dumplings: whisk flour, baking powder, and salt. Cut in cold butter until the mixture looks like coarse crumbs. Stir in buttermilk and parsley until just combined — don't overmix." },
      { step: 7, text: "Drop heaping tablespoons of dumpling dough onto the surface of the simmering stew — you'll get about 12 dumplings. Cover and cook without lifting the lid for 15 minutes. The dumplings are done when fluffy and cooked through." },
      { step: 8, text: "Season the stew with salt and pepper. Ladle into bowls, making sure everyone gets a few dumplings." }
    ]
  },
  {
    title: "Matzo Ball Soup",
    slug: "matzo-ball-soup",
    description: "Light, fluffy matzo balls in a golden chicken broth so good it earned its reputation as Jewish penicillin. The secret is seltzer in the matzo mixture.",
    cuisine: "Jewish",
    time_total: "2 hrs",
    time_active: "30 min",
    time_passive: "1 hr",
    time_passive_label: "chilling + simmering",
    servings: 6,
    servings_label: "servings",
    source_attribution: "Inspired by Joan Nathan",
    tags: ["soup", "jewish", "chicken", "matzo", "comfort", "classic"],
    ingredients: [
      { name: "matzo meal", amount: "1", unit: "cup", group: "Matzo balls" },
      { name: "eggs, beaten", amount: "4", unit: "", group: "Matzo balls" },
      { name: "vegetable oil or schmaltz", amount: "1/4", unit: "cup", group: "Matzo balls" },
      { name: "seltzer water", amount: "2", unit: "tbsp", group: "Matzo balls" },
      { name: "salt", amount: "1", unit: "tsp", group: "Matzo balls" },
      { name: "ground white pepper", amount: "1/4", unit: "tsp", group: "Matzo balls" },
      { name: "whole chicken (about 4 lbs)", amount: "1", unit: "", group: "Broth" },
      { name: "yellow onion, quartered", amount: "1", unit: "", group: "Broth" },
      { name: "carrots, cut into chunks", amount: "3", unit: "", group: "Broth" },
      { name: "celery stalks with leaves", amount: "3", unit: "", group: "Broth" },
      { name: "fresh dill sprigs", amount: "6", unit: "", group: "Broth" },
      { name: "parsley stems", amount: "6", unit: "", group: "Broth" },
      { name: "black peppercorns", amount: "1", unit: "tsp", group: "Broth" },
      { name: "salt", amount: "1", unit: "tbsp", group: "Broth" },
      { name: "water", amount: "10", unit: "cups", group: "Broth" },
      { name: "fresh dill, chopped", amount: "2", unit: "tbsp", group: "Garnish" }
    ],
    steps: [
      { step: 1, text: "Start the broth: place chicken, onion, carrots, celery, dill sprigs, parsley, peppercorns, and salt in a large pot. Cover with water and bring to a boil. Reduce heat and simmer, partially covered, for 1 hour, skimming any foam." },
      { step: 2, text: "While the broth simmers, make the matzo ball mixture: whisk eggs, oil (or schmaltz), seltzer, salt, and white pepper. Stir in matzo meal until just combined. Cover and refrigerate for at least 30 minutes — this makes them fluffy." },
      { step: 3, text: "Strain the broth through a fine-mesh sieve into a clean pot. Shred some chicken breast meat for serving (save the rest for another use). Slice the cooked carrots and return them to the strained broth." },
      { step: 4, text: "Bring a large pot of salted water to a boil. With wet hands, gently roll the matzo mixture into golf ball-sized balls — they'll expand, so don't pack them tight." },
      { step: 5, text: "Drop the matzo balls into the boiling water, cover, and simmer for 30-35 minutes without lifting the lid. They're done when light and fluffy all the way through." },
      { step: 6, text: "Reheat the broth and season with salt to taste. Place matzo balls in bowls, add some shredded chicken and carrot, ladle broth over, and finish with fresh dill." }
    ]
  }
]

async function main() {
  // Final dedup check against database
  const { data: existing, error: fetchErr } = await sb
    .from('recipes')
    .select('title, slug')

  if (fetchErr) {
    console.error('Failed to fetch existing recipes:', fetchErr)
    process.exit(1)
  }

  const existingSlugs = new Set(existing.map(r => r.slug))
  const existingTitles = new Set(existing.map(r => r.title.toLowerCase()))

  let imported = 0
  let skipped = 0

  for (const recipe of recipes) {
    // Dedup by slug
    if (existingSlugs.has(recipe.slug)) {
      console.log(`⏭ SKIP (slug exists): ${recipe.title}`)
      skipped++
      continue
    }
    // Dedup by title
    if (existingTitles.has(recipe.title.toLowerCase())) {
      console.log(`⏭ SKIP (title exists): ${recipe.title}`)
      skipped++
      continue
    }

    const { error } = await sb.from('recipes').insert({
      ...recipe,
      status: 'published',
      source: 'community',
      difficulty: 'easy',
    })

    if (error) {
      console.error(`✗ FAILED: ${recipe.title}`, error.message)
    } else {
      console.log(`✓ Published: ${recipe.title} (${recipe.cuisine})`)
      imported++
    }
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped`)
}

main()
