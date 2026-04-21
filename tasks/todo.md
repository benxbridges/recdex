# RecDex Task Tracker

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
