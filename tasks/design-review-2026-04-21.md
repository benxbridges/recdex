# RecDex Design Review — 2026-04-21

Done by a focused Explore agent against pages: homepage, recipe detail, cook mode, browse, contribute, plus the theme and globals.

## TL;DR

RecDex has a strong foundation: cohesive color system, good typography pairs, the EggDot brand anchor works, cook mode is genuinely polished. The lack of component abstraction and inconsistent styling across pages is the main debt.

## Top 10 fixes (by impact-per-hour)

1. **`<Button>` component with focus ring + variants** (1–2 hrs). 85+ uses across pages. Removes duplication, fixes 40% of a11y debt, makes design iteration trivial.
2. **Fix C.text3 contrast** on warm/accent backgrounds (0.5 hrs). Currently fails WCAG AA on meta lines (mono 10–11px on dark warm). Adjust `C.text3` darker for dark mode; bump to C.text2 where meta sits on accentBg.
3. **Keyboard nav** on search dropdown + ingredient checkboxes (2–3 hrs). Arrow/Enter support; proper `<input type="checkbox">`.
4. **`<Modal>` component** with focus trap + `role="dialog"` + `aria-labelledby` (2 hrs). GroceryListModal, ShareCardModal, CustomTimerDialog all reinvent this. ~150 lines removed.
5. **`<Input>` / `<Textarea>`** primitives (1.5 hrs). Standardizes padding, focus ring, error state.
6. **Move shared components to `src/app/components/`**: EggDot, DifficultyBadge, RecipeBoxIcon, BrokenEggCard (1 hr). ~80 lines removed.
7. **Shadow scale in `theme.ts`** (0.5 hrs). `shadows.sm/md/lg`.
8. **Fix ShareCardModal hardcoded light theme** — breaks in dark mode at `recipe/[slug]/page.tsx:440`.
9. **Spacing scale in `theme.ts`** (0.5 hrs). `SPACE.xs/sm/md/lg/xl`.
10. **Global `:focus-visible` outline** in `globals.css` (0.5 hrs).

## Biggest repetition offenders

- Button styles defined inline in 85+ places. Every `onClick` redefines padding/fontFamily/fontSize/fontWeight/border.
- DifficultyBadge re-declared 8+ times (page.tsx, browse/page.tsx, recipe/[slug]/page.tsx).
- Form inputs in cook/page.tsx lines 342–369 each define their own border/padding/borderRadius.

## Mobile crunch spots (375px)

1. "Cook with what you have" tag input — 3rd tag breaks layout. (page.tsx:690)
2. Grocery modal: 48px horizontal padding eats content width. (recipe/page.tsx:320)
3. Cook mode step text — no max-width; long techniques overflow.

## A11y gaps worth fixing

- **No visible focus ring anywhere.** Tab through the homepage — it's invisible.
- Ingredient checkboxes are `<div onClick>` not `<input>`. Not keyboard-reachable, wrong role for screen readers. (recipe/[slug]/page.tsx:340)
- Modals lack `role="dialog"`, `aria-labelledby`, focus trap.
- EggDot SVG needs `aria-hidden="true"`.
- Some Start Cooking buttons are `<span onClick>` instead of proper buttons/links.

## Agent's pushback on my earlier suggestions

- **Keep a single accent color** — adding a second would dilute the brand. Use opacity/saturation for variation instead. (I was going to propose teal for data; agent says don't.)
- **Lucide-react: be selective.** Use for UI chrome (chevrons, X, menu). Keep custom SVGs for brand/illustration (EggDot, broken egg, cook-mode decorative icons).
- **Don't just bump meta mono from 10→12px** — bump the color first (C.text3 → C.text2) so contrast passes without breaking layouts.

## Suggested order of work

**Week 1 (component primitives):**
1. Create `<Button>` + `<Modal>` + `<Input>` / `<Textarea>`
2. Move EggDot, DifficultyBadge, BrokenEggCard into components/
3. Replace inline usages page-by-page

**Week 2 (system polish):**
4. Add shadow + spacing scales to theme
5. Fix C.text3 contrast + add global focus-visible
6. Replace emojis with lucide-react icons for UI chrome
7. Fix ShareCardModal dark-mode bug
8. Keyboard nav on search dropdown + ingredient checkboxes
