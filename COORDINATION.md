# RecDex Session Coordination

This file helps you coordinate across parallel sessions. **Ask any session a question** — they'll check here and either answer or redirect.

---

## Active Sessions

### Cook Mode
**Focus:** Timers, sounds, haptic feedback, ingredient persistence, confetti on completion
**Status:** Starting fresh
**Blockers:** None
**Key file:** `src/app/recipe/[slug]/cook/page.tsx` (~2100 lines)
**Needs from UI:** Color scheme for timer urgency states (normal → warning → urgent)
**Needs from Scraping:** None

### UI Polish & Site Maintenance
**Focus:** Browse refinements (letter anchors), admin dashboard, grid/list views, responsive tweaks
**Status:** Starting fresh
**Blockers:** None
**Key files:** `src/app/browse/page.tsx`, `src/app/page.tsx`, `src/app/admin/page.tsx`
**Needs from Cook:** Timer color scheme decision
**Needs from Scraping:** Data quality report (dupes, missing images, bad titles)

### Recipe Pipeline & Data Automation
**Focus:** Backfill photographer credits, dedup cleanup, data quality checks, optimize import flow
**Status:** Scripts created and tested
**Blockers:** Unsplash API quota (50 req/hr) — backfill running but slow
**Key files:** `scripts/backfill-photo-credits.ts`, `scripts/check-data-quality.ts`, `scripts/dedup-recipes.ts`
**Needs from Cook:** None
**Needs from UI:** None

---

## Decisions Made (Do Not Undo)

- **No difficulty labels** — Removed from browse, homepage, recipe cards. Time is the differentiator.
- **Time-based filters** — Quick (<30m), Weeknight (<1hr), Weekend project. Replace difficulty.
- **Browse as flat alphabetical index** — Not grouped by cuisine. Cuisine shown as small pill on each row.
- **Homepage Discover** — Randomized with shuffle button. Retains thumbnail images.
- **Photo credits** — Every recipe should have photographer byline from Unsplash. New imports auto-populate. Backfill in progress.
- **No publication names** — Titles like "BA's Minestrone" → "Classic Minestrone". Credit author in description if needed.
- **Voice mode removed** — Cook mode no longer has TTS or speech recognition. (User feedback: "sounding too robotic")
- **Share feature added** — Cook completion screen has Web Share API + SMS fallback to text recipes to friends.

---

## Cross-Cutting Concerns

These affect multiple sessions. Decide once, apply everywhere.

### Color Scheme for Timer States
**Status:** OPEN — Cook mode needs this
**Question:** What colors for normal → warning → urgent timer states?
**Affects:** Cook mode (display), UI polish (any timer visualizations elsewhere)
**Answer:** [Pending]

### Admin Dashboard Design
**Status:** OPEN — UI polish starting this
**Question:** What should admins be able to do? (delete recipes, bulk edit, view stats, etc?)
**Affects:** `src/app/admin/page.tsx`, API routes
**Answer:** [Pending]

### Recipe Detail Page Layout
**Status:** DECIDED
**What:** Hero image with photo credit byline (top-right, small white text)
**Where:** `src/app/recipe/[slug]/page.tsx`

---

## Open Questions (Ask Any Session)

**[URGENT]** Timer color scheme for cook mode
→ Needed by Cook Mode session
→ Ask: "What colors for timer urgency? Normal state? Warning? Danger?"

**[HIGH]** What should the admin dashboard do?
→ Needed by UI Polish session
→ Ask: "Should admins be able to delete recipes, bulk edit, view stats?"

**[MEDIUM]** Should we auto-remove old/stale recipes?
→ Affects Recipe Pipeline automation
→ Ask: "If a recipe hasn't been cooked in 6 months, should we mark it or remove it?"

**[LOW]** Dark mode — worth adding?
→ Could be UI polish session
→ Ask: "Interest in dark mode toggle? (You have theme.ts set up for it)"

---

## Session Protocol

**At session start:**
1. Read this file to understand the landscape
2. Check "Open Questions" — your answer might be in here
3. Update your session's status to "In Progress"

**During work:**
- If you need info from another session, check "Cross-Cutting Concerns"
- If you make a decision that affects other sessions, add it here immediately
- If you hit a blocker, update your "Blockers" line

**At session end:**
1. Update "Status" to what you accomplished
2. Add any new decisions to "Decisions Made"
3. Flag any new "Open Questions" for the next session
4. Commit this file with your PR

---

## Reference

- **Full project context:** See `/Users/bxb/recdex/CLAUDE.md`
- **Memory & patterns:** See `/Users/bxb/.claude/projects/-Users-bxb-recdex/memory/`
- **Git history:** `git log --oneline` for recent decisions and commits

---

*This file is the source of truth for cross-session coordination. Update it as you work.*
