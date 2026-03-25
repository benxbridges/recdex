# Recipe Import Log: French Cuisine
**Date:** 2026-03-25
**Genre:** French Cuisine
**Recipes imported:** 10

## Recipes

| # | Title | Cuisine | Difficulty | Source Inspiration | Slug |
|---|-------|---------|------------|-------------------|------|
| 1 | Coq au Vin | French | Medium | NYT Cooking, Julia Child, Bon Appetit, Serious Eats, David Lebovitz | `coq-au-vin` |
| 2 | Beef Bourguignon | French | Medium | Bon Appetit, NYT Cooking, Serious Eats, Julia Child, Epicurious | `beef-bourguignon` |
| 3 | Ratatouille | French | Easy | NYT Cooking, Bon Appetit, Serious Eats, Epicurious, Food52 | `ratatouille` |
| 4 | Duck Confit | French | Medium | Serious Eats, NYT Cooking, Bon Appetit, David Lebovitz | `duck-confit` |
| 5 | Cassoulet | French | Hard | NYT Cooking, Bon Appetit, Serious Eats, Epicurious, Food52 | `cassoulet` |
| 6 | Croque Monsieur | French | Easy | Bon Appetit, NYT Cooking, Serious Eats, Epicurious | `croque-monsieur` |
| 7 | Nicoise Salad | French | Easy | Bon Appetit, NYT Cooking, Serious Eats, Epicurious, Food52 | `nicoise-salad` |
| 8 | Tarte Tatin | French | Medium | NYT Cooking, Bon Appetit, Serious Eats, Epicurious, Food52 | `tarte-tatin` |
| 9 | Gougeres | French | Medium | NYT Cooking, Bon Appetit, Serious Eats, Food52 | `gougeres` |
| 10 | Madeleines | French | Easy | Bon Appetit, NYT Cooking, Epicurious, Food52 | `madeleines` |

## Overlap Check

Verified no duplicates exist in the RecDex library:
- **French onion soup** exists but is categorized under `Soup`, not a standalone French recipe
- **French toast** exists but is categorized under `Breakfast`
- **Crepes** exist under `Breakfast`
- **Croissants** exist under `Baking`
- **Quiche Lorraine** exists under `Breakfast`
- **Creme brulee** exists under `Baking`
- **Chocolate mousse** exists under `Baking`
- **Brioche** exists under `Baking`

None of the 10 imported recipes duplicate any existing recipe in the library.

## Voice & Style

All recipes written in the RecDex brand voice:
- Concise and practical — every word earns its place
- Warm but not cutesy, confident but not preachy
- Specific sensory cues for doneness (e.g., "until deeply golden", "pulls easily from the bone")
- Timing estimates in steps where helpful
- No filler phrases, no "Enjoy!"
- Descriptions are 1-2 sentences: what the dish IS and what makes it worth making

## Attribution

All recipes are original compositions synthesized from consensus data across multiple
established sources. Factual elements (ingredients, ratios, techniques, temperatures,
timings) are based on well-documented, widely published versions of these classic French
dishes. All instructional text is original, written in the RecDex brand voice.

Primary reference sources: NYT Cooking, Bon Appetit, Serious Eats, Epicurious, Food52,
Julia Child's "Mastering the Art of French Cooking", David Lebovitz.

## Files Modified

- `scripts/recipe-urls.ts` — Added 10 French recipe URLs
- `supabase/seed-external-recipes.sql` — Added 10 external recipe entries (#25-34)
- `scripts/recipe-pipeline/pipeline-data/synthesized/*.json` — 10 new recipe JSON files
- `scripts/import-logs/2026-03-25-french-cuisine.md` — This log

## Publishing

To publish these recipes to Supabase, run:
```bash
node scripts/recipe-pipeline/5-publish.mjs --force
```

Or to validate first:
```bash
node scripts/recipe-pipeline/3-validate.mjs
node scripts/recipe-pipeline/5-publish.mjs
```
