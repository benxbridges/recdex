# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# RecDex (Recipe Index)

## Token Efficiency
Be token-efficient: prefer targeted reads (offset/limit) over full file reads, use Grep/Glob before Read, batch independent tool calls, avoid re-reading files already in context, keep responses concise, and use Edit over Write for existing files.

## What This Is
A recipe site built around actually cooking. People discover recipes here (browse, search, paste a URL) — but every design decision pushes toward getting them into cook mode and sharing what they made with friends. The whole funnel: Find → Cook → Share. Cook mode IS the product.

Tagline: "Be a better cook."
URL: recipeindex.org

## Tech Stack
- **Framework**: Next.js 16 (App Router, React 19, TypeScript 5, React Compiler on — skip manual `useMemo`/`useCallback`)
- **Database**: Supabase (Postgres). Anon key for reads, service key for writes (RLS blocks anon writes)
- **Styling**: Inline CSS-in-JS with theme tokens from `src/app/lib/theme.ts` — `C.*` for colors, `SERIF`/`SANS`/`MONO` for fonts. Tailwind is installed but barely used.
- **AI**: Claude Sonnet (recipe extraction, analysis), OpenAI (backup), Gemini (backup + image generation), Replicate/Flux (image generation alternative)
- **APIs**: Unsplash (images + photo credits), YouTube API (trending), Supadata (YouTube/TikTok transcripts)
- **Deploy**: Vercel (auto-deploys from `main`)

## Commands
- `npm run dev` — dev server on port 3000
- `npm run build` — production build; catches type errors the dev server misses. Run before considering work done.
- `npm run lint` — ESLint
- No test suite exists.

## Env Vars (in `.env.local`)
Core: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`, `UNSPLASH_ACCESS_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`
Optional: `REPLICATE_API_TOKEN` (Flux images), `SCRAPE_TIKTOK_KEY`, `SCREENSHOTONE_API_KEY`, `SPOONACULAR_API_KEY`

## Development Workflow

### Worktree Setup (Ben's local machine only)
On Ben's machine the dev server runs from a git worktree, not the main repo:
- **Main repo**: `/Users/bxb/recdex/` (checked out on `main`)
- **Worktree**: `/Users/bxb/recdex/.claude/worktrees/magical-benz/` (branch `claude/magical-benz`)
- **Pattern**: Edit files in main repo → `cp` to worktree → verify in preview → merge to main and push

Remote/cloud sessions: work on the assigned `claude/*` branch as usual; this worktree dance doesn't apply.

### Verify Before Done
1. (Local) Copy changed files to worktree
2. Check preview (dev server on port 3000) — screenshot + interact
3. Check console for errors
4. `next build` catches type errors the dev server misses
5. Merge/push per the session's branch instructions

### Database Changes
- No direct DB access (psql blocked, no Supabase access token linked)
- Schema changes: write SQL into `supabase/*.sql` and ask user to run it in the Supabase dashboard
- Use `SUPABASE_SERVICE_KEY` for any writes — anon key silently fails due to RLS

## Key Files

### Pages (`src/app/`)
| File | What it does |
|------|-------------|
| `page.tsx` | Homepage — hero, Tonight's Pick, cuisine stats, Discover (shuffled recipes) |
| `browse/page.tsx` | Cookbook index — flat alphabetical list, thumbnails, cuisine pills, time filters |
| `contribute/page.tsx` | Paste URL → extract → review → publish flow. Primary button is "Cook now →" (extract, stash in sessionStorage, jump straight to cook mode) |
| `recipe/[slug]/page.tsx` | Recipe detail — hero image, ingredients, Kitchen Consensus |
| `recipe/[slug]/cook/page.tsx` | Cook mode (~2100 lines) — step-by-step with timers (Web Audio + service worker notifications), dock navigation, add-missing-ingredient, share on completion |
| `pantry/page.tsx` | "What's in your kitchen?" — ingredient scan → recipe matches |
| `scan/page.tsx` | Cookbook photo scan → recipe extraction |
| `tools/page.tsx` | Toolbox — one search bar + Scan button entry point |
| `community/page.tsx`, `community/[id]/` | Discussion threads |
| `lists/page.tsx` | Recipe lists/cookbooks |
| `leaderboard/page.tsx`, `profile/page.tsx` | Cook-log gamification ("egg system" shared between the two) |
| `admin/page.tsx` | Admin dashboard (password-gated, signed session cookie) — draft review, HIDE button drafts published recipes without deleting |
| `trending/page.tsx` | Trending recipes from YouTube/TikTok |

Shared UI lives in `src/app/components/` (`SiteHeader` is on every page; also `CookLog`, `CookbookShelf`, `OnboardingFlow`, `BensNoteModal`, `PublishCheckModal`, `ThemeToggle`, `ServiceWorkerRegistrar`).

### API Routes (`src/app/api/`)
| Route | Purpose |
|-------|---------|
| `extract-recipe` | Recipe extraction from URL/text — JSON-LD `schema.org/Recipe` parser first, Claude fallback/rewrite |
| `quick-import` | One-click import: fetch video content → Claude extract → save → return slug for cook mode |
| `publish-recipe` | Save to Supabase + Unsplash image fallback + photo credit |
| `scan-recipe` | Extract recipe from cookbook photo(s) — accepts `images: string[]` |
| `image-search`, `unsplash-download`, `upload-recipe-image` | Unsplash search, download tracking, user image upload |
| `generate-image` | AI recipe images — Gemini default, Replicate/Flux via `?provider=replicate` |
| `substitute` | Ingredient substitution suggestions |
| `comments`, `cook-log`, `feedback` | Community/engagement data |
| `youtube-transcript` | Unified transcripts (YouTube + TikTok) via Supadata, caption-scrape fallback |
| `scrape-tiktok`, `trending` | Trending cooking video discovery |
| `cron/scrape-viral` | Vercel cron (daily 8:00 UTC, see `vercel.json`) — TikTok scrape + YouTube trending refresh. Requires `CRON_SECRET` bearer token, fails closed |
| `oembed`, `find-mirror` | Video embed helpers |
| `admin` | Admin operations (update image, delete/hide recipe) |
| `tts` | Text-to-speech (currently unused — voice mode removed) |

### Lib (`src/app/lib/`)
| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client (anon key hardcoded — reads only) |
| `theme.ts` | Color tokens (`C.*`), font stacks, shared constants |
| `security.ts` | Server-only (`import 'server-only'`): SSRF guard (`isUnsafeFetchTarget`), rate limiting (`applyRateLimit`), admin session auth (`requireAdmin`, signed cookie). NEVER import from client components |
| `url-safe.ts` | Client-safe URL helpers (`safeHref`, `safeImageSrc`, `escapeLike`) — re-exported by security.ts |
| `json-ld-recipe.ts` | schema.org/Recipe structured-data parser (primary extraction path) |
| `cook-utils.ts` | Timer parsing (`parseTimerFromText` — handles ranges, "per side", approximations), step helpers |
| `classify-steps.ts` | Step type classification (prep, active, passive) |
| `cooking-tips.ts`, `substitutions.ts`, `bens-note.ts` | Content databases |
| `unsplash.ts`, `copy-ingredients.ts` | Unsplash helpers, clipboard formatting |

### Security
- `src/middleware.ts` sets CSP + security headers on every response. CSP allows inline styles/scripts (app uses CSS-in-JS); frame-src whitelist includes YouTube/TikTok/Instagram for embeds. Adding a new external API? Add it to `connect-src`.
- Mutating API routes use `requireAdmin` or rate limiting from `security.ts`; server-side fetches of user-supplied URLs must pass `isUnsafeFetchTarget` (SSRF).

## Design Sensibility
The user (Ben) has strong design opinions. Key patterns:
- **Cookbook index feel** for browse — not a Pinterest grid. Alphabetical, scannable, minimal.
- **Time over difficulty** — difficulty labels removed. Time is the real differentiator.
- **Images matter on homepage** — Discover section needs thumbnails. Browse can be compact.
- **No publication names in titles** — "Classic Minestrone" not "BA's Classic Minestrone"
- **Photo credits** — Unsplash photographer bylines on recipe images
- **Mobile-first** — `isMobile` breakpoint at 768px (some pages use 700 or 820)
- **No over-engineering** — ship it, iterate based on feedback
- **Show screenshots** before considering visual work done — Ben will catch missing thumbnails, wrong grouping, "unsexy" layouts

## Common Pitfalls
1. **Worktree sync** (local): Edits in main repo don't appear in dev preview until copied to worktree
2. **RLS writes**: Supabase anon key reads succeed but writes silently fail. Always use service key.
3. **React error #300**: Client-side `router.push()` between pages with different hook counts crashes. Use `window.location.href` for cross-page navigation.
4. **Stale closures in effects**: Pass values as function parameters instead of relying on state inside closures.
5. **Nested cp**: `cp -r dir/` into a directory that already has that name creates `dir/dir/`. Remove first or copy contents.
6. **Photo IDs**: Unsplash URLs stored in DB don't always map cleanly to API photo IDs for credit lookup.
7. **server-only imports**: `security.ts` pulls in Node built-ins — importing it from a client component breaks the bundle. Use `url-safe.ts` client-side.

## Database (Supabase)
Tables beyond `recipes`: `cookbooks`, `cook_logs`, threads/discussions, `item_comments`, `external_recipes`, community submissions, viral videos. Schema migrations live as SQL files in `supabase/` — Ben runs them in the dashboard.

### `recipes` table — required fields
- `title` — Clean dish name. NEVER include publication names.
- `slug` — URL-safe, lowercase, unique
- `description` — 1-2 sentences. What it is + what makes this version worth making.
- `cuisine` — Capitalize first letter. Use specific cuisines (e.g. "Sichuan" not "Chinese" when appropriate)
- `time_total` — Human-readable string: "25 min", "1 hr 30 min", "3 hrs"
- `ingredients` — JSON array of `{ name, amount, unit, group? }` objects
- `steps` — JSON array of `{ step, text }` objects (1-indexed; `timer_minutes` per step where applicable)
- `tags` — String array for searchability
- `status` — "published" or "draft"

Optional but encouraged:
- `image_url` — Unsplash regular URL
- `photo_credit` — Photographer name from Unsplash
- `servings`, `servings_label` — e.g. "4", "servings"
- `time_active`, `time_passive`, `time_passive_label`
- `summary` — backfilled by `scripts/backfill-summaries.ts`
- `source_attribution`, `source_url` — Credit original author/source
- `video_url`, `creator_name`, `creator_url` — For video-sourced recipes

## Brand Voice (for recipe writing)
- Concise and practical — every word earns its place
- Warm but not cutesy. Confident but not preachy
- Instructions are clear, sequential, action-oriented
- Use specific sensory cues ("until the onions are translucent and fragrant, about 3 minutes")
- Include timing estimates in steps where helpful
- Never use "Enjoy!" or "Serve and enjoy!" — end with the final practical step
- Descriptions: 1-2 sentences — what the dish IS and what makes this version worth making

## Automation & Pipeline

### Scheduled Tasks
1. **Recipe import** (GitHub Actions `import-recipes.yml`, every 4 hrs) — runs `scripts/recipe-pipeline/auto-import.mjs`, imports ~25 recipes as drafts, rotates genres, rewrites in RecDex voice. Manual trigger via workflow_dispatch (count/genre/dry_run inputs), or push a change to `.trigger-import` (`push-import.yml`).
2. **Viral scrape** (Vercel cron, daily 8:00 UTC) — `/api/cron/scrape-viral` refreshes TikTok + YouTube trending.
3. **Image fill** (hourly, Ben's machine) — `scripts/recipe-pipeline/4-fetch-images.mjs --from-db` fills missing Unsplash images.

### Scripts (`scripts/`)
| Script | Purpose | Usage |
|--------|---------|-------|
| `recipe-pipeline/run-pipeline.mjs` | Full 5-stage import pipeline (Source → Synthesize → Validate → Images → Publish) | `node run-pipeline.mjs "recipe name"` |
| `recipe-pipeline/auto-import.mjs` | Unattended batch import (used by GitHub Actions) | `node auto-import.mjs` |
| `recipe-pipeline/4-fetch-images.mjs` | Fill Unsplash images for recipes missing them | `node 4-fetch-images.mjs --from-db` |
| `check-data-quality.ts` | Detect dupes, missing images, bad titles, missing fields | `npx tsx scripts/check-data-quality.ts` |
| `dedup-recipes.ts` | Remove duplicate recipes (keeps oldest, preserves images) | `npx tsx scripts/dedup-recipes.ts --dry-run` |
| `backfill-photo-credits.ts` | Backfill photographer names for existing Unsplash images | `npx tsx scripts/backfill-photo-credits.ts` |
| `backfill-summaries.ts` | Backfill recipe summaries | `npx tsx scripts/backfill-summaries.ts` |
| `audit-images.ts` | Audit recipe image quality/coverage | `npx tsx scripts/audit-images.ts` |

### Dedup Rules (CRITICAL for scheduled imports)
When importing recipes, check for duplicates:
1. Query ALL existing titles from Supabase
2. Case-insensitive exact match (e.g. "Pad Thai" = "pad thai")
3. Near-match detection: "Classic Tiramisu" ≈ "Tiramisu", "Filipino Chicken Adobo" ≈ "Chicken Adobo"
4. If a recipe exists with a similar name, SKIP IT — don't create a variant

## Session Checklist

**Start of session (parallel sessions):**
1. Read `COORDINATION.md` to understand what other sessions are doing
2. Check "Open Questions" — your answer might already be there
3. Read this file + `tasks/lessons.md`
4. Verify dev server is running (`preview_list`)
5. Mark your session as "In Progress" in COORDINATION.md

**During work:**
- If you make a decision that affects other sessions, update COORDINATION.md immediately
- If you hit a blocker, flag it in COORDINATION.md

**End of session:**
1. Copy files to worktree, verify in preview
2. Commit with descriptive message, push per branch instructions
3. Update `COORDINATION.md`: status, accomplishments, new blockers/questions
4. Update `tasks/todo.md` and `tasks/lessons.md` if applicable
