# Bon Appétit 100-recipe Import Plan

## Goal
Import 100 more BA recipes into the Supabase `recipes` table, net-new after dedup against existing rows.

## What we already have
- 50 vegetarian BA recipes loaded via `scripts/import-ba-vegetarian.ts` (hardcoded list, published 2026-04-ish).
- Other BA recipes trickle in via the scheduled Claude-desktop daily-learn task.
- JSON-LD extraction is mature: `src/app/lib/json-ld-recipe.ts` + `src/app/api/extract-recipe/route.ts` reads `schema.org/Recipe` directly from bonappetit.com pages — no brittle DOM scraping required.

## Target mix (diversity over volume)
Since the existing 50 are vegetarian, weight the new 100 toward the gaps:
- 25 chicken / poultry classics (roast chicken, chicken parm, coq au vin, bang bang chicken, etc.)
- 15 beef / pork / lamb (brisket, pork shoulder, ragù, lamb tagine)
- 15 seafood (branzino, salmon rice bowl, shrimp scampi, miso-glazed black cod)
- 15 pasta / grain bowls (carbonara, orzotto, farro salad, dan dan noodles)
- 10 soups / stews (chili, ribollita, tortilla soup, pho)
- 10 baking / desserts (BA's best chocolate chip, olive oil cake, banana bread)
- 10 sides + sauces (smashed potatoes, crispy brussels, romesco, green goddess)

Spread cuisines: Italian, French, Mexican, Thai, Vietnamese, Japanese, Sichuan, Middle Eastern, Southern US, Caribbean, Indian. No "BA's" in titles (CLAUDE.md rule).

## Pipeline (five stages, reuse existing tooling)

### Stage 0 — Dedup list
Before sourcing, pull existing BA titles to skip:
```sql
select title, slug from recipes
where source = 'bon_appetit' or source_attribution ilike '%bon appétit%';
```
Write to `scripts/recipe-pipeline/pipeline-data/existing-ba-titles.json`. The sourcer must case-insensitive-exact-match AND near-match (see CLAUDE.md dedup rules) against this list before proceeding.

### Stage 1 — Source (URLs → raw recipe data)
Input: a curated list of 100 BA recipe URLs in `scripts/recipe-pipeline/pipeline-data/ba-urls.txt` (one URL per line).

Curation options, pick one:
- **A. Manual curation (recommended, ~1 hr)** — browse bonappetit.com/recipes, open the hits/classics/popular tags, paste 100 URLs. Highest quality signal.
- **B. Sitemap scrape** — `https://www.bonappetit.com/sitemap.xml` → filter to `/recipes/` paths → sort by lastmod → hand-filter.
- **C. Keyword search** — take the target-mix list above, run each query through BA's own search, take top-2 per query.

For each URL, run a new `scripts/recipe-pipeline/1b-source-from-url.mjs`:
- fetch the HTML
- run `extractRecipeFromJsonLd(html)` (same parser used by `/api/extract-recipe`)
- enrich with og:image for Stage 4 fallback
- write to `pipeline-data/sourced/{slug}.json`

This stage is the only new code. Everything downstream already exists.

### Stage 2 — Synthesize (rewrite in RecDex voice)
Reuse `scripts/recipe-pipeline/2-synthesize.mjs` unchanged. Claude rewrites:
- `description` in 1–2 sentences, no "BA's" / "our"
- `steps[].text` in clear imperative sensory-cue style (CLAUDE.md brand voice)
- strips "Enjoy!" / "Serve and enjoy!"

Preserves ingredient amounts/units exactly — only `steps` and `description` get rewritten.

### Stage 3 — Validate
Reuse `scripts/recipe-pipeline/3-validate.mjs`. Confidence score ≥ 0.8 → `published`; 0.6–0.8 → `draft` for review; < 0.6 → skip.
Optional: `--with-llm` flag for Claude proofreading pass.

### Stage 4 — Images
`scripts/recipe-pipeline/4-fetch-images.mjs`. Search Unsplash by title + cuisine, save `image_url` + `photo_credit`. If og:image from BA was captured in Stage 1, keep it as a last-resort fallback (but prefer Unsplash for licensing cleanliness).

### Stage 5 — Publish
`scripts/recipe-pipeline/5-publish.mjs` — upserts to Supabase using `SUPABASE_SERVICE_KEY`. Every row gets:
- `source: 'bon_appetit'`
- `source_attribution: 'Bon Appétit'`
- `source_url: <original BA url>`
- `status` from Stage 3 confidence

## Execution

```bash
# once
node scripts/recipe-pipeline/0-dedup-existing.mjs

# then, for the curated URL list
node scripts/recipe-pipeline/run-pipeline.mjs \
  --from-urls pipeline-data/ba-urls.txt \
  --source bon_appetit
```

Add `--from-urls` support to `run-pipeline.mjs` (currently takes recipe names); Stage 1 swaps to `1b-source-from-url.mjs` when that flag is set.

## Quality gates
- Dedup pass: 0 rows conflict with existing titles (strict + near-match).
- Every recipe has `image_url`, `description`, `time_total`, `cuisine`, `ingredients`, `steps`.
- Random-sample 10 post-publish: read on `/recipe/{slug}`, cook-mode opens, step timers are parsed.
- `scripts/check-data-quality.ts` shows no new missing-field rows.

## Legal
Recipes (facts) are not copyrightable; the written expression is. Stage 2 rewrites every step in our own voice. We keep `source_attribution` + `source_url` on every row so credit links back to BA.

## Estimated effort
- Curation (Stage 0–1 input): 1–2 hrs
- New script `1b-source-from-url.mjs`: ~2 hrs
- Pipeline run (100 recipes @ ~20s/recipe for Claude rewrite): ~45 min compute, ~$3–5 Anthropic spend
- Spot-check + fix: 1 hr
Total: ~half a day of human attention, mostly curating URLs.
