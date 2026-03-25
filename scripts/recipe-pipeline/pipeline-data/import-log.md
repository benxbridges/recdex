# RecDex Recipe Import Log

## Batch 1: Quick Weeknight Dinners
**Date:** 2026-03-25
**Genre:** Quick Weeknight Dinners (30-minute cross-cuisine meals)
**Recipes imported:** 10
**Status:** Validated, ready for publish (Stage 5)

---

### 1. Sheet-Pan Chicken Thighs with Roasted Vegetables
- **Slug:** `sheet-pan-chicken-thighs-with-roasted-vegetables`
- **Cuisine:** American
- **Inspired by:** Sheet-pan chicken recipes from Bon Appetit (Chris Morocco) and NYT Cooking (Melissa Clark). Ingredient ratios and technique cross-referenced with Serious Eats and Food Network.
- **Key sources:** bonappetit.com, cooking.nytimes.com, seriouseats.com, foodnetwork.com
- **Notes:** 425°F oven temp and 35-40 min cook time verified across all sources for bone-in thighs.

### 2. One-Pot Creamy Tuscan Chicken
- **Slug:** `one-pot-creamy-tuscan-chicken`
- **Cuisine:** Italian
- **Inspired by:** NYT Cooking's creamy chicken recipes and Bon Appetit's one-pot chicken dinners. Sun-dried tomato and spinach cream sauce is a well-documented Italian-American preparation.
- **Key sources:** cooking.nytimes.com, bonappetit.com, halfbakedharvest.com, cafedelites.com
- **Notes:** Cream-to-broth ratio (1 cup : 1.5 cups) tested across multiple sources. 10-12 min simmer for bone-out chicken breasts is standard.

### 3. Miso-Butter Mushroom Pasta
- **Slug:** `miso-butter-mushroom-pasta`
- **Cuisine:** Fusion
- **Inspired by:** NYT Cooking's miso butter pasta variations and Bon Appetit's umami pasta series. Miso-butter is a well-established flavor combination popularized by multiple food publications.
- **Key sources:** cooking.nytimes.com, bonappetit.com, seriouseats.com, food52.com
- **Notes:** 2 tbsp miso to 3 tbsp butter ratio is the consensus across sources. Pasta water is essential for emulsification.

### 4. Skillet Chicken with Lemon and Olives
- **Slug:** `skillet-chicken-with-lemon-and-olives`
- **Cuisine:** Mediterranean
- **Inspired by:** NYT Cooking's braised chicken with olives (David Tanis) and Bon Appetit's Mediterranean skillet chicken recipes. Classic preparation found across Mediterranean cookbooks.
- **Key sources:** cooking.nytimes.com, bonappetit.com, seriouseats.com, saveur.com
- **Notes:** Castelvetrano olives specified as they're the most widely available mild green olive. 15-18 min partial-cover braise verified for bone-in thighs.

### 5. Honey-Soy Glazed Pork Chops
- **Slug:** `honey-soy-glazed-pork-chops`
- **Cuisine:** Asian-American
- **Inspired by:** Bon Appetit's glazed pork chop recipes and NYT Cooking's honey-soy preparations. Glaze proportions (1/4 cup soy : 2 tbsp honey) are standard across Asian-American cooking.
- **Key sources:** bonappetit.com, cooking.nytimes.com, seriouseats.com, foodandwine.com
- **Notes:** 145°F internal temp for pork chops per USDA guidelines. 1-inch thick chops need ~8 min total sear time.

### 6. Coconut Red Curry Lentils
- **Slug:** `coconut-red-curry-lentils`
- **Cuisine:** Indian-Thai Fusion
- **Inspired by:** NYT Cooking's red lentil soup/curry recipes (Yotam Ottolenghi, Hetty McKinnon) and Minimalist Baker's coconut curry lentils. Red lentils + coconut milk + curry paste is a well-documented vegetarian staple.
- **Key sources:** cooking.nytimes.com, bonappetit.com, minimalistbaker.com, cookieandkate.com, seriouseats.com
- **Notes:** Red lentils cook in 18-20 min and naturally break down — no blending needed. 1.5 cups lentils to 1 can coconut milk + 2 cups broth ratio verified.

### 7. Seared Steak with Chimichurri
- **Slug:** `seared-steak-with-chimichurri`
- **Cuisine:** Argentine
- **Inspired by:** Bon Appetit's chimichurri steak and Serious Eats' pan-seared steak guides (J. Kenji Lopez-Alt). Chimichurri ratios (1 cup parsley, 1/2 cup oil, 2 tbsp vinegar) are the Argentine standard.
- **Key sources:** bonappetit.com, seriouseats.com, cooking.nytimes.com, foodandwine.com, epicurious.com
- **Notes:** 4 min per side for medium-rare on 1-inch steaks verified via Serious Eats testing. 8-10 min rest is critical for juice redistribution.

### 8. One-Pan Orzo with Shrimp and Feta
- **Slug:** `one-pan-orzo-with-shrimp-and-feta`
- **Cuisine:** Greek
- **Inspired by:** NYT Cooking's baked orzo recipes and Bon Appetit's one-pan pasta techniques. Greek shrimp-tomato-feta combination (giouvetsi-adjacent) is a classic preparation.
- **Key sources:** cooking.nytimes.com, bonappetit.com, halfbakedharvest.com, delish.com
- **Notes:** 1.5 cups orzo to 3 cups broth ratio for absorption method verified. Shrimp pre-seared separately to avoid overcooking.

### 9. Chicken Lettuce Wraps
- **Slug:** `chicken-lettuce-wraps`
- **Cuisine:** Chinese-American
- **Inspired by:** NYT Cooking's lettuce wrap recipes and Bon Appetit's Asian-inspired ground meat preparations. Water chestnuts for crunch is the consensus across sources.
- **Key sources:** cooking.nytimes.com, bonappetit.com, seriouseats.com, allrecipes.com, delish.com
- **Notes:** Sauce ratio (3 tbsp soy, 1 tbsp hoisin, 1 tbsp rice vinegar, 1 tbsp sesame oil) tested across multiple sources. Butter lettuce specified for its natural cup shape.

### 10. Sausage and White Bean Skillet
- **Slug:** `sausage-and-white-bean-skillet`
- **Cuisine:** Italian-American
- **Inspired by:** Bon Appetit's sausage and beans recipes (Andy Baraghani) and NYT Cooking's one-pan sausage dinners. Classic Italian-American pantry dinner found in most Italian-American cookbooks.
- **Key sources:** bonappetit.com, cooking.nytimes.com, seriouseats.com, food52.com
- **Notes:** Sausage browned first, then sliced, then returned to sauce — this ensures crispy exterior while preventing drying out. Lacinato kale specified for its tender texture.

---

## Deduplication Check
All 10 recipes were verified against:
- `scripts/recipe-urls.ts` (555 existing entries across NYT and BA)
- `scripts/recipe-pipeline/pipeline-data/recipes-to-source.txt` (232 existing recipes)
- `src/app/recipe/consensus-data.ts` (247 consensus entries)

No duplicates or near-duplicates found. While individual components exist (e.g., "roasted salmon" exists but not "miso-butter mushroom pasta"), each recipe in this batch is a distinct dish not currently in the RecDex library.

## Next Batch Genre Rotation
Previous genres used:
1. Quick Weeknight Dinners (this batch)

Suggested next genres (rotate through):
- Cakes & Layer Cakes
- French Bistro Classics
- BBQ & Grilling
- Black/African American Heritage Recipes
- Italian Pastas (deep cuts)
- Baking Fundamentals
- Korean Home Cooking
