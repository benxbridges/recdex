# CLAUDE.md — RecDex

## Project Overview

RecDex is a recipe discovery and cooking platform. Users can browse recipes, search by cuisine/keyword, save recipes to a personal box, and use a step-by-step cook mode with built-in timers. All recipe data is stored in Supabase (PostgreSQL).

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19.2.3 with React Compiler enabled
- **Database**: Supabase (PostgreSQL via `@supabase/supabase-js`)
- **Styling**: Tailwind CSS 4 (PostCSS plugin) + inline styles
- **Fonts**: Geist (via next/font), Source Serif 4, DM Sans, JetBrains Mono (loaded via Google Fonts `<style>` tags)
- **Node**: v22, npm v10

## Quick Reference

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config, core-web-vitals + typescript)
```

There is no test framework configured. No `.env` files are committed — the Supabase anon key is hardcoded in `src/app/lib/supabase.ts`.

## Directory Structure

```
src/
└── app/
    ├── lib/
    │   └── supabase.ts          # Supabase client singleton
    ├── recipe/
    │   └── [slug]/
    │       ├── page.tsx          # Recipe detail page (452 lines)
    │       └── cook/
    │           └── page.tsx      # Step-by-step cook mode (221 lines)
    ├── globals.css               # Tailwind import + CSS custom properties
    ├── layout.tsx                # Root layout (Geist fonts, metadata)
    ├── page.tsx                  # Home page — main entry point (692 lines)
    └── favicon.ico
public/
    ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
```

There are **no API routes**, **no middleware**, **no custom hooks**, and **no global state management** (context, Redux, etc.). All state lives in component-level `useState`/`useEffect` hooks. Saved recipes persist via `localStorage` key `recdex-box`.

## Route Map

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Home: featured recipes, browse by category, search |
| `/recipe/[slug]` | `src/app/recipe/[slug]/page.tsx` | Recipe detail: ingredients, steps, grocery list modal |
| `/recipe/[slug]/cook` | `src/app/recipe/[slug]/cook/page.tsx` | Cook mode: step-by-step with timers |

## Architecture & Patterns

### All pages are client components

Every page uses `"use client"` and fetches data directly from Supabase in `useEffect`. There are no React Server Components for data fetching. The React Compiler is enabled (`next.config.ts: reactCompiler: true`).

### Inline styles, not CSS classes

Almost all styling is done via inline `style` props. Tailwind is imported in `globals.css` but barely used in components. The codebase uses a centralized design token object (`C`) and typography constants defined at the top of each page file:

```typescript
const C = {
  bg: '#FEFDFB',        // warm off-white
  accent: '#C84A2A',    // burnt orange (primary action color)
  text: '#1A1A18',      // primary text
  text2: '#5C5647',     // secondary text
  text3: '#9C9585',     // muted text
  rule: '#D4CDBE',      // borders
  green: '#4A6741',     // success / easy difficulty
  gold: '#A8862A',      // medium difficulty
  blue: '#3D6B8E',      // variations
  // ... more tokens
}

const SERIF = "'Source Serif 4', Georgia, serif"   // headings, body copy
const SANS = "'DM Sans', system-ui, sans-serif"    // UI labels
const MONO = "'JetBrains Mono', 'Courier New'"     // metadata, timers
```

When modifying or adding UI, follow this inline-style pattern and use the `C` object for colors. Do not introduce CSS modules or styled-components.

### Type definitions are per-file

Types (`Recipe`, `Step`, `Category`, `IngredientItem`) are redefined in each page file rather than shared. The `Recipe` type matches the Supabase `recipes` table:

```typescript
type Recipe = {
  id: string; slug: string; title: string; description: string | null;
  cuisine: string | null; category_id: string | null;
  difficulty: string;  // 'easy' | 'medium' | 'hard'
  time_total: number | null; time_active: number | null;
  time_passive: number | null; time_passive_label: string | null;
  image_url: string | null; servings: number | null;
  servings_label: string | null; tags: string[] | null;
  ingredients: any[];  // flat items or { group, items }[] structure
  steps: { step: number; text: string; timer_minutes: number | null }[];
  status: string;
}
```

### Components are colocated in page files

There is no `components/` directory. Reusable UI pieces (EggDot, DifficultyBadge, InlineTimer, CookMode, RecipeCard, GroceryListModal, etc.) are defined in the same file as the page that uses them. Some components like `EggDot` and `DifficultyBadge` are duplicated across files.

### Supabase queries

All queries go through the singleton client in `src/app/lib/supabase.ts`. Tables used:
- `recipes` — main content table, always filtered by `.eq('status', 'published')`
- `categories` — for browse filtering, ordered by `sort_order`

### localStorage for persistence

Saved recipe IDs are stored in `localStorage` under key `recdex-box` as a JSON-serialized string array.

### Animations

Custom `@keyframes` are defined inline in `<style>` tags within components (fadeIn, backdropIn, cookModeIn, pulse, listIn). Follow this same pattern for new animations.

## Conventions

- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths)
- **ESLint**: Flat config with `eslint-config-next` core-web-vitals and typescript presets
- **Commit style**: Lowercase, descriptive messages (e.g. "add recipe pages and cook mode routes")
- **No tests**: No test runner or test files exist
- **No `.env`**: Supabase credentials are hardcoded (anon/public key only)
- **Responsive design**: Mobile detection via `window.innerWidth < 700` in useEffect; clamp-based font sizing; conditional layouts

## Common Tasks

### Adding a new page

1. Create `src/app/<route>/page.tsx` with `"use client"` directive
2. Define or import the `C` color object and font constants
3. Fetch data from Supabase in a `useEffect`
4. Style with inline `style` props using design tokens

### Modifying the design system

The `C` color object and typography constants are defined at the top of `src/app/page.tsx`, `src/app/recipe/[slug]/page.tsx`, and `src/app/recipe/[slug]/cook/page.tsx`. Changes must be applied to all three files to stay consistent.

### Adding a Supabase query

Import from `@/app/lib/supabase` and use the Supabase JS client. Always filter recipes by `.eq('status', 'published')`.
