# Launch Post Drafts

Ready to adapt and post. One launch per product beat — don't burn them all at once.

---

## Show HN (beat 1: URL → cook mode)

**Title:** Show HN: I built a free site that turns any recipe URL into distraction-free cook mode

**Body:**

Like a lot of people here, I got tired of cooking from recipe sites: a 2,000-word essay, four ad reloads, and a screen that sleeps the moment my hands are covered in flour.

RecDex (https://recipeindex.org) is my answer. Paste any recipe URL and you get:

- A clean, structured recipe (JSON-LD first — Claude only as fallback for unstructured pages)
- One-tap cook mode: one step per screen, big type, screen stays awake
- Timers parsed out of the steps automatically ("simmer 10–15 min", "4 min per side") that actually fire — Web Audio beeps that survive tab backgrounding, plus service-worker notifications that work with the phone locked if you install it as a PWA
- You can also snap a photo of a cookbook page and get the same thing

It's free, ad-free, and runs in the browser — nothing to install. Tech: Next.js, Supabase, extraction via schema.org parsing with an LLM fallback.

The part I'm proudest of is timer extraction: a client-side parser catches ranges, "per side", and approximations ("about an hour") that structured data misses.

Would love feedback — especially on extraction failures. Paste your gnarliest recipe URL and tell me what breaks.

---

## Product Hunt (same beat)

**Name:** RecDex
**Tagline:** Any recipe, cook-ready — paste a link, get guided steps and timers
**First comment (maker):**

Hey PH 👋

I built RecDex because the gap between *finding* a recipe and *cooking* it is miserable: ads, life stories, and a phone screen that locks mid-recipe.

How it works:
1. Paste any recipe URL (or snap a cookbook page)
2. Hit "Cook now" — one step per screen, ingredients a swipe away
3. Timers are auto-detected from the steps and actually ring, even with the screen locked (PWA)

It's free and ad-free on the web — no app to download, so you can send a friend a recipe link that opens straight into cook mode.

What I'd love feedback on: extraction accuracy (paste something weird), and what would make you cook one more night a week.

---

## r/SideProject

**Title:** I got tired of cooking from ad-riddled recipe pages, so I built a free "cook mode" for any recipe URL

Short version: paste a recipe link → clean steps, one per screen, with timers that auto-detect from the text and actually fire when your phone is locked. Also scans cookbook pages with your camera. Free, no app, no ads: recipeindex.org

Happy to share the stack (Next.js / Supabase / schema.org parsing with LLM fallback) or anything about timer reliability on mobile browsers — that was the hard part.

---

## Future beats (hold in reserve)

- **Cookbook scan**: "Snap a cookbook page, get guided cook mode" — own post for r/Cooking-adjacent audiences and press
- **TikTok/video import**: "Found a recipe on TikTok? Paste the link, cook it tonight" — strongest short-form video hook
- **Clean-recipe micro-tool**: "Recipe without the story" — second Show HN when shipped
