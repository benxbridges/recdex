# RecDex Task Tracker

## Session pin — 2026-05-12 (paused mid-test)

Branch: **`claude/recipe-tags-user-lists-BTVAt`** · Head: `9edf4ac` · All code pushed to origin.

### What landed this session

Code (10 commits, all on this branch):
- `ee27015` — Auth foundation (Letterboxd-style email + password + handle)
- `846def9` — Made auth SQL non-destructive + added RLS to reserved_handles
- `fcf6901` — Migrated saved recipes (the Box) from localStorage to DB
- `5282142` — Quick-unsave × button on profile saved-recipe cards
- `efe5939` — Migrated user lists from localStorage to DB
- `1e3e46d` — Surfaced lists: homepage shelf + nav + reorder on /lists
- `d306fc7` — Promoted Lists to top nav, dropped Tools (still at /tools, linked from /about)
- `f2eef05` — Wired /profile display_name + bio to DB when signed in
- `8091259` — Comments author as @handle linked to /u/[handle] when signed in
- `9edf4ac` — Public lists toggle on /lists + render on /u/[handle]

Also: audit pass before all of this (commit `05c3b1e` — mobile/a11y/display consistency).

### SQL migrations to run (Supabase Dashboard → SQL Editor)

Run in order. All idempotent and non-destructive.

| File | Status | Verify |
|---|---|---|
| `supabase/auth-profiles-setup.sql` | ✅ already run | `select * from public.profiles limit 1;` works |
| `supabase/saved-recipes-setup.sql` | ✅ already run | `select * from public.saved_recipes limit 1;` |
| `supabase/user-lists-setup.sql` | ✅ already run | `select * from public.user_lists limit 1;` |
| `supabase/comments-add-user-id.sql` | ⚠️ **NEEDS RUNNING** | `select column_name from information_schema.columns where table_schema='public' and table_name='comments' and column_name='user_id';` should return 1 row |

### Pending verification (pick up here when back)

Two items reported "not working" — most likely stale dev or unrun SQL, not real bugs:

1. **Comment usernames not clickable**
   - Most likely: `comments-add-user-id.sql` hasn't been run yet — without `user_id` column, the Link path is never taken
   - After running the SQL: post a NEW comment while signed in (legacy comments stay null user_id, won't link)
   - Pull/restart dev server to load latest bundle

2. **Publish lists toggle not working**
   - SQL is in place (is_public shipped with `user-lists-setup.sql`)
   - Most likely cause: local dev running a stale JS bundle. Hard refresh (Cmd+Shift+R) after pulling
   - Files that matter: `src/app/lists/page.tsx`, `src/app/lib/user-lists.ts`, `src/app/u/[handle]/page.tsx`

To resume:
```bash
cd ~/recdex
git fetch origin
git checkout claude/recipe-tags-user-lists-BTVAt
git pull origin claude/recipe-tags-user-lists-BTVAt
# sync to worktree (per CLAUDE.md), restart `next dev`, hard refresh browser
```

### Manual Supabase Dashboard setup (one-time, if not done already)

1. Authentication → URL Configuration: Site URL = `https://recipeindex.org`, Additional Redirect URLs include `http://localhost:3000`
2. Authentication → Providers → Email: confirm "Enable email confirmations" set how you want (ON for prod, OFF for instant dev signups)
3. (Optional) Authentication → SMTP: hook up SendGrid/Resend/Postmark for real email delivery

### Next-up queue (rough priority)

1. **Recipe tags** — branch name's stated third axis. Schema for a tag taxonomy (cuisine intersect, diet, technique, occasion), assignment UI, /browse filtering
2. **Profile polish** — "@handle is permanent" copy, 30-char display_name limit, a real settings page for display_name/bio/avatar
3. **Private notes → DB** (currently localStorage `recdex-notes`)
4. **Cook log → DB** (currently `recdex-cooked`)
5. **Claim-a-handle onboarding** — if a guest signs up via auto-generated handle from email, prompt them to claim a real one
6. **Public list deep-link** — `/u/[handle]/list/[id]` for shareable list URLs (currently /u/[handle] is the only public surface)
7. **Mass-apply `<Button>` + `<Modal>` primitives** — built in audit pass, only used in new auth code so far. ~85 inline buttons + 4 bespoke modals (GroceryList, ShareCard, Onboarding, CookModeTutorial, PublishCheck, BensNote) still pending

### Things I built but didn't ship to all sites

- `<Button>` primitive — used in auth pages only
- `<Modal>` primitive — built, but existing modals still use bespoke wrappers

---

## Shipped 2026-04-20/21 — Cook Mode Overhaul Phase 1–4

Key wins:
- **JSON-LD primary extraction** — NYT, Bon Appétit, Serious Eats, food blogs all publish `schema.org/Recipe` as structured data. We now read that first and use Claude only to rewrite steps in neutral voice + structure ingredient strings. Dramatically fewer ingredient drops. [src/app/lib/json-ld-recipe.ts](src/app/lib/json-ld-recipe.ts), [src/app/api/extract-recipe/route.ts](src/app/api/extract-recipe/route.ts)
- **Prompts hardened** for group flattening + timer rules + completeness self-check. Windows 8k→40k, max_tokens 2048→4096. Retry on parse failure. Same for scan-recipe. Model bumped to claude-sonnet-4-5.
- **Client-side timer parser** (`parseTimerFromText`) in [cook-utils.ts](src/app/lib/cook-utils.ts) catches any timer Claude missed. Verified against "Bake 25 min", "Simmer 10-15 min", "about an hour", "~5 min", "4 min per side", "1 hr 30 min", "half an hour", "a couple minutes". Applied at both publish time (review form) and load time (cook mode).
- **Review form exposes editable `timer_minutes`** per step — users can hand-fix any timer Claude missed.
- **Cook mode timer reliability**: AudioContext unlock on first gesture, Web Audio beeps scheduled at `ctx.currentTime + seconds` (survives tab backgrounding), Notification API fallback, replay button, custom manual timer, dismissal cancels SW scheduled alarm.
- **PWA + service worker**: [sw.js](public/sw.js) accepts `{type:'recdex-timer-schedule',fireAt,title,body}` messages, schedules `showNotification` — fires with the phone screen locked when installed as a PWA. Manifest already existed; wired up `ServiceWorkerRegistrar` + manifest link in layout.
- **Cook Now flow**: URL paste primary button is now "Cook now →" — extracts, stashes in sessionStorage, navigates straight to cook mode. Review is a secondary "customize first" link.
- **Add missing ingredient** in cook mode closes the loop: if extraction dropped "1 cup flour", tap "+ Add missing ingredient" in the ingredients panel, type it, persist to DB (or sessionStorage for temp recipes). Handles grouped + flat ingredient shapes.

Deferred (next session):
- Unit conversion toggle (metric/imperial)
- Multi-page cookbook scan UI (scan-recipe API already accepts `images: string[]`)
- "Save to Index" from cook mode for temp-scan recipes
- Full inline edit (steps too, not just add-ingredient)

## Active — Cook Mode Overhaul (2026-04-20)

Goal: make URL/picture → cook mode reliable enough that cook mode stands as the product. Bugs in scope: (1) ingredients dropped in extraction, (2) timers don't fire. Direction confirmed: cook mode is the product, locked-screen timers required, conversion + subs + multi-page scan all in.

### Phase 1 — Extraction reliability
- [ ] JSON-LD schema.org/Recipe primary parser (Claude fallback only)
- [ ] HTML cap 12k → 60k, prompt input 8k → 40k, max_tokens 2048 → 4096
- [ ] Prompt rules: flatten ingredient groups, preserve group in `notes`, self-check ingredient count
- [ ] Prompt rules: timer_minutes extraction (ranges, per-side, approximations)
- [ ] Retry once on JSON parse failure
- [ ] Same hardening for scan-recipe
- [ ] Client-side parseTimerFromText() fallback in cook-utils
- [ ] Expose editable timer_minutes per step in review form

### Phase 2 — Timer firing
- [ ] Unlock AudioContext on first gesture
- [ ] Schedule beeps via ctx.currentTime + seconds
- [ ] Notification API permission + system notification
- [ ] Persistent alert + replay button
- [ ] Manual custom timer input

### Phase 3 — Locked-screen PWA
- [ ] manifest.webmanifest + icons + meta tags
- [ ] Service worker with scheduled showNotification
- [ ] Install prompt (dismissible)
- [ ] iOS Add-to-Home-Screen instructions

### Phase 4 — Cook-as-product flow
- [ ] "Cook now" URL → cook mode in one step (save as draft in bg)
- [ ] Cook mode for unsaved recipes (generalize temp-scan)
- [ ] Inline edit recipe in cook mode (syncs to Supabase)

### Phase 5 — Bonus
- [ ] Unit conversion toggle (metric/imperial)
- [ ] Polish mid-cook substitutions
- [ ] Multi-page cookbook scan

## Backlog

### Monetization
- [ ] **Become a Bookshop.org affiliate** (preferred — 10% commission). Apply at bookshop.org/affiliate-program. Once approved, get your affiliate ID (the `<id>` in `bookshop.org/a/<id>/`).
- [ ] **Become an Amazon Associate** (fallback — ~3-4.5%). Apply at affiliate-program.amazon.com. Get your tracking ID (the `<tag>` in `?tag=<tag>-20`).
- [ ] **Update cookbook URLs** in Supabase once IDs are live. Run e.g. `UPDATE cookbooks SET bookshop_url = REPLACE(bookshop_url, 'bookshop.org/p/', 'bookshop.org/a/<your-id>/');` Until that's done, the homepage shelf links earn nothing.

### Cook Mode Polish
- [ ] Timer urgency colors (yellow at 30s, red+pulse at 10s)
- [ ] Timer sound + haptic (Web Audio beep, navigator.vibrate)
- [ ] Persistent ingredient checks (localStorage)
- [ ] Egg confetti on completion
- [ ] Auto-show cooking tips

### Admin Dashboard
- [ ] Photo review grid with accept/reject + Unsplash replacement
- [ ] Recipe management with 1-click delete + inline preview

### Data Quality
- [ ] Fix Unsplash backfill script (photo IDs from URLs don't match API format)
- [ ] Audit duplicate recipes (e.g., multiple Aloo Gobi, Cacio e Pepe)
- [ ] Clean up `api/tts/route.ts` (voice mode removed, route is dead code)

### Browse / Discovery
- [ ] Consider letter anchors (A, B, C...) for long alphabetical list
- [ ] Grid view polish for browse (currently list is default)

## Completed
- [x] Browse page: flat alphabetical index with thumbnails + cuisine pills
- [x] Remove difficulty labels everywhere, add time-based filters
- [x] Remove voice mode from cook mode (~210 lines)
- [x] Add share feature to cook mode completion (Web Share API + SMS)
- [x] Homepage: Discover section with shuffle (replaced Recently Added)
- [x] Strip publication names from recipe titles
- [x] Photo credit column in Supabase + credit on new imports
- [x] Homepage simplification (strip carousels)
- [x] Kitchen Consensus auto-display
- [x] Global CLAUDE.md + project CLAUDE.md setup
