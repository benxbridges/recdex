# RecDex Early Marketing Strategy

*Drafted June 2026, based on competitive research across recipe managers (Paprika, Mela, Crouton, ReciMe, Pestle), editorial players (NYT Cooking, BBC Good Food), and guided-cooking apps (SideChef, Kitchen Stories, Tasty). Full research findings summarized at the bottom.*

## Positioning

**Functional hook: "Any recipe, cook-ready."**
Paste a link or snap a cookbook page — clean steps, real timers, no scrolling with wet hands. Free, on the web, no app to install.

**Emotional layer: "Be a better cook."** (existing tagline — keep; it's the only skill-progression promise in the market)

Why this angle:
- Every competitor markets *saving and organizing* recipes. Nobody owns the 45 minutes at the stove. Cook mode is RecDex's center of gravity — market the moment of cooking, not the bookmark folder.
- **Web-first is a structural moat**: NYT is paywalled, ReciMe is $59.99/yr, Pestle/Crouton/Mela are iOS-only. A shared RecDex link opens instantly for anyone. Every share is an acquisition event — which is exactly the Find → Cook → Share funnel.
- Do NOT position as a recipe manager. That aisle has cheaper (Paprika $5 one-time) and better-funded (ReciMe, $1.5M seed) incumbents.

## Target user (first 1,000)

People who find recipes on TikTok/Instagram/food blogs and are annoyed by ads, life stories, and unusable phone screens while cooking. They already complain about this weekly on r/Cooking and Hacker News. Meet them at the complaint.

## Channels, in priority order

### 1. Recipe schema SEO (compounds while you sleep)
The pipeline imports ~25 recipes per run. Each published recipe page must have full `schema.org/Recipe` JSON-LD (already built — `src/app/lib/json-ld-recipe.ts` parses it; verify we also *emit* it on recipe pages), clean titles, and target long-tail queries the big sites under-serve — specific cuisines (Sichuan, Filipino, Levantine) are already in the data model. This is the BBC Good Food playbook at indie scale.

### 2. Launch posts: Show HN + Product Hunt + r/SideProject
Lead with the 15-second demo: **paste URL → instant cook mode**. HN has repeatedly rewarded anti-recipe-bloat tools (OnlyRecipe's Show HN). One launch per product milestone: URL import, cookbook scan, TikTok import — each is a separate beat. Ready-to-post drafts in `launch-posts.md`.

### 3. Faceless short-form video (TikTok + Reels)
ReciMe's documented formula (20k → 400k users in a year): viral recipe + simple faceless execution + app as the punchline. Extend it one step they don't own — show the *cooking*: viral recipe → paste into RecDex → cook mode with timers firing → finished dish. 3 posts/week is sustainable solo. Scripts in `video-scripts.md`.

### 4. Reddit presence (r/Cooking, r/AskCulinary, r/MealPrepSunday)
Answer "how do I keep my phone usable while cooking" / "best recipe organizer" threads helpfully; mention RecDex only when directly relevant. Recommendation threads recur weekly and sustained Paprika's word of mouth for a decade.

### 5. Press pitches (Lifehacker / The Verge / 9to5Mac tier)
Pestle got TechCrunch coverage for each feature milestone. RecDex's pitches: "this free website turns any recipe URL into distraction-free cook mode" and "scan a cookbook page, get guided steps." Template in `press-pitch.md`.

### 6. Cookbook affiliate content (monetization + SEO, after Bookshop.org approval)
Not generic listicles. "We cooked 10 recipes from [cookbook] — what's worth your weekend," each recipe scannable into cook mode, affiliate link on the book. Demos the scan feature, differentiated content, earns commission. Blocked on the Bookshop.org affiliate application (see tasks/todo.md → Monetization).

## Product work that IS marketing (highest leverage)

1. **Shareable cook-completion card** — the Share step should produce a postable image/link: dish, time cooked, steps done, and a link that opens *that recipe in cook mode* for the recipient. This is the viral object. (Cook mode already has share-on-completion; upgrade it to a card.)
2. **"Clean this recipe" micro-tool** — a no-signup page: paste URL → clean readable recipe, with "Cook this step-by-step →" upsell. Ranks for "recipe without the story" queries; converts the exact user we want. Most of the machinery (extract-recipe API) already exists.
3. **Verify Recipe JSON-LD is emitted on all recipe pages** — table stakes for channel #1.

## 90-day plan

| Weeks | Focus |
|-------|-------|
| 1–2 | Verify JSON-LD output on recipe pages; build shareable completion card; set up TikTok + Instagram accounts |
| 3–4 | Show HN + Product Hunt launch ("paste URL → cook mode"); start 3x/week short-form video cadence |
| 5–8 | Keep video cadence; weekly Reddit participation; pitch Lifehacker/Verge tier press; apply to Bookshop.org affiliate program |
| 9–12 | Ship "clean this recipe" micro-tool as second launch beat; first cookbook affiliate post if approved; review what's working, double down |

## Metrics that matter (keep it simple)

- Weekly: unique visitors, cook-mode sessions started, cook completions, shares sent
- Per channel: which referrer drives cook-mode *completions* (not just visits)
- North star: **cooks completed per week** — it's the product promise and the precursor to sharing

## What we deliberately ignore for now

- Paid ads (ReciMe layered these on only after organic proof)
- B2B/appliance partnerships (where SideChef/Kitchen Stories ended up — a later-stage option)
- App Store presence (web-first is the wedge, not a gap)

---

## Appendix: competitive landscape summary

| Cluster | Players | Positioning | Pricing | Lesson |
|---------|---------|-------------|---------|--------|
| Recipe managers | Paprika, Mela, Crouton, Umami, ReciMe, Recipe Keeper | "All your recipes in one place" | $5 one-time (old guard) to $59.99/yr (ReciMe) | Crowded; don't fight here |
| Editorial | NYT Cooking, BBC Good Food, Serious Eats | Trusted, tested recipes | Subscription / ads | SEO + schema is the engine; trust is the brand |
| Guided cooking | SideChef, Kitchen Stories, Tasty | Step-by-step hand-holding | Pivoted to B2B/ads/appliances | Consumer guided-cooking subscription has never been won — stay free, monetize adjacent (affiliates) |
| Social/AI | Samsung Food, Pestle | AI personalization / import-anything | Free (sells fridges) / one-time | Press beats per feature milestone work for indies |

Key gaps RecDex exploits: (1) nobody owns the cooking moment, (2) web-first with zero install friction, (3) "get better at cooking" is an unclaimed promise.
