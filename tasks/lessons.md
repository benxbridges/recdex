# Lessons Learned

## Architecture
- **Worktree sync is critical**: Dev server runs from worktree, not main repo. Every file edit must be copied over before verifying. Forgetting this wastes entire debug cycles.
- **RLS blocks anon writes**: Supabase anon key can read but writes silently succeed without actually updating. Always use `SUPABASE_SERVICE_KEY` for mutations.
- **No direct DB access**: Can't run SQL programmatically (no psql, no linked Supabase project). Schema changes require user to run SQL in dashboard.

## React / Next.js
- **React error #300**: `router.push()` between pages with different hook counts causes "Rendered fewer hooks than expected." Fix: use `window.location.href` for cross-page navigation.
- **Stale closures in effects**: State values captured at render time, not current. Pass values as function parameters instead of relying on state inside closures.
- **React Compiler is on**: `reactCompiler: true` in next.config — no need for manual `useMemo`/`useCallback` in most cases, but be aware it changes optimization behavior.

## Design (User Preferences)
- **Ben has strong visual opinions**: Always show screenshots before considering done. He'll catch things like missing thumbnails, wrong grouping, or "unsexy" layouts.
- **Cookbook index, not Pinterest**: Browse should feel like flipping to the back of a cookbook. Alphabetical, scannable, compact rows.
- **Time > difficulty**: Difficulty labels are subjective and discouraging. Time is the real signal.
- **Images on homepage, compact on browse**: Homepage Discover section needs thumbnails. Browse can use small 36x36 fingernails.
- **No publication names**: Never import "BA's Classic Minestrone" — strip to "Classic Minestrone."
- **Iterate fast**: Ship it, get feedback, adjust. Don't over-plan the design.

## Common Mistakes
- **Nested `cp -r`**: Copying `cp -r src/app/admin` into a directory that already has `admin/` creates `admin/admin/`. Delete target first or copy contents.
- **Unsplash photo IDs**: URLs stored in DB (e.g., `photo-1574684117906-...`) don't always resolve via Unsplash API. The backfill script needs a different ID extraction approach.
- **Git worktree branch conflicts**: Can't `git checkout main` from worktree since main is checked out in the parent repo. Merge from the parent repo instead.
