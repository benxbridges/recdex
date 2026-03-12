import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/trending
 * Returns trending recipe videos from YouTube (free, using existing API key).
 * Also attempts to pull trending food topics from Google Trends RSS.
 *
 * Query params:
 *   ?limit=10         — max results (default 10, max 25)
 *   ?region=US        — region code for YouTube (default US)
 *   ?refresh=true     — bypass cache
 *
 * Returns: { videos: TrendingVideo[], trendingTopics: string[], cached: boolean }
 */

type TrendingVideo = {
  videoId: string
  title: string
  dishName: string  // Clean dish name extracted by Claude (e.g. "Garlic Parmesan Chicken and Potatoes")
  channelTitle: string
  channelId: string
  thumbnail: string
  publishedAt: string
  platform: 'youtube'
  url: string
  description: string
}

type TrendingTopic = {
  title: string
  traffic: string
  url: string
}

// Simple in-memory cache (survives hot reloads in dev, resets on cold start)
let cache: { videos: TrendingVideo[]; topics: TrendingTopic[]; ts: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '10'), 25)
  const region = req.nextUrl.searchParams.get('region') || 'US'
  const refresh = req.nextUrl.searchParams.get('refresh') === 'true'

  // Return cache if fresh
  if (!refresh && cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({
      videos: cache.videos.slice(0, limit),
      trendingTopics: cache.topics,
      cached: true,
    })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY not set' }, { status: 500 })
  }

  // Fetch YouTube trending recipe videos + Google Trends in parallel
  const [rawVideos, topics] = await Promise.all([
    fetchYouTubeTrendingRecipes(apiKey, region, 25),
    fetchGoogleTrendsFood(),
  ])

  // Use Claude to extract clean dish names from clickbait YouTube titles
  const videos = await extractDishNames(rawVideos)

  // Update cache
  cache = { videos, topics, ts: Date.now() }

  return NextResponse.json({
    videos: videos.slice(0, limit),
    trendingTopics: topics,
    cached: false,
  })
}

// ===== LISTICLE FILTER =====

/**
 * Detects compilation/listicle videos that contain multiple recipes.
 * We only want single-recipe videos for importing.
 */
function isListicleTitle(title: string): boolean {
  const t = title.toLowerCase()

  // Pattern: starts with or contains "N easy/best/quick/..." — e.g. "5 Easy Dinners", "Top 10 Recipes"
  // Matches: "5 easy", "10 best", "top 7", "15 quick", "my 3 favorite"
  if (/\b(\d{1,2})\s+(easy|best|quick|simple|favorite|favourite|healthy|cheap|budget|amazing|delicious|incredible|must.try|weeknight|dinner|lunch|breakfast|meal|recipe|crockpot|slow.cooker|instant.pot|air.fryer)/i.test(t)) return true

  // Pattern: "top N", "N recipes", "N meals", "N dishes", "N ideas"
  if (/\btop\s+\d/i.test(t)) return true
  if (/\b\d+\s+(recipes|meals|dishes|dinners|lunches|breakfasts|ideas|ways|things|snacks|appetizers|desserts|sides)\b/i.test(t)) return true

  // Pattern: explicit compilation words
  if (/\b(meal prep for the week|weekly meal prep|what i eat in a|full day of eating|full week)\b/i.test(t)) return true

  // Pattern: "recipes" (plural) in the title almost always means a compilation
  if (/\brecipes\b/i.test(t)) return true

  return false
}

// ===== YOUTUBE SEARCH =====

async function fetchYouTubeTrendingRecipes(
  apiKey: string,
  region: string,
  maxResults: number,
): Promise<TrendingVideo[]> {
  // Strategy: search for "recipe" in the Howto & Style category, sorted by view count
  // from the past 7 days. This gives us genuinely trending recipe content.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Queries targeting SINGLE recipes (not compilations like "10 easy dinners")
  const queries = [
    'viral recipe I made',
    'this recipe is incredible',
    'you need to try this recipe',
    'best recipe I ever made',
    'one pot recipe easy',
  ]
  const allVideos: TrendingVideo[] = []
  const seenIds = new Set<string>()

  for (const q of queries) {
    if (allVideos.length >= maxResults) break

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q,
        type: 'video',
        order: 'relevance',
        publishedAfter: weekAgo,
        regionCode: region,
        maxResults: String(Math.min(10, maxResults - allVideos.length)),
        relevanceLanguage: 'en',
        safeSearch: 'strict',
        videoDefinition: 'high',
        key: apiKey,
      })

      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
      if (!res.ok) {
        console.error('[trending] YouTube search error:', res.status, await res.text())
        continue
      }

      const data = await res.json()
      for (const item of data.items || []) {
        const vid = item.id?.videoId
        if (!vid || seenIds.has(vid)) continue

        const titleText: string = item.snippet.title || ''
        const descText: string = item.snippet.description || ''

        // English filter — check both title and description for Latin characters
        const titleLatin = titleText.replace(/[^a-zA-Z]/g, '').length
        if (titleText.length > 0 && titleLatin / titleText.length < 0.5) continue

        // Also check description (catches transliterated non-English titles)
        if (descText.length > 20) {
          const descLatin = descText.replace(/[^a-zA-Z]/g, '').length
          if (descLatin / descText.length < 0.4) continue
        }

        // Skip compilation/listicle videos ("5 Easy Dinners", "Top 10 Recipes", etc.)
        if (isListicleTitle(titleText)) continue

        seenIds.add(vid)

        allVideos.push({
          videoId: vid,
          title: item.snippet.title,
          dishName: item.snippet.title, // Will be overwritten by Claude extraction
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          thumbnail: item.snippet.thumbnails?.high?.url ||
                     item.snippet.thumbnails?.medium?.url ||
                     item.snippet.thumbnails?.default?.url || '',
          publishedAt: item.snippet.publishedAt,
          platform: 'youtube',
          url: `https://www.youtube.com/watch?v=${vid}`,
          description: (item.snippet.description || '').slice(0, 300),
        })
      }
    } catch (err) {
      console.error('[trending] YouTube search fetch error:', err)
    }
  }

  return allVideos
}

// ===== DISH NAME EXTRACTION (Claude) =====

/**
 * Uses Claude to extract clean dish names from YouTube video titles.
 * One batch call for all videos — runs once per cache refresh (~1/hour).
 * Cost: ~$0.002 per call with Haiku.
 */
async function extractDishNames(videos: TrendingVideo[]): Promise<TrendingVideo[]> {
  if (videos.length === 0) return videos

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    console.log('[trending] No ANTHROPIC_API_KEY, using raw titles')
    return videos.map(v => ({ ...v, dishName: v.title }))
  }
  console.log('[trending] Extracting dish names for', videos.length, 'videos...')

  try {
    const titleList = videos.map((v, i) => `${i + 1}. ${v.title}`).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Extract ONLY the dish/recipe name from each YouTube video title below. Strip ALL clickbait, filler, channel names, hashtags, emoji, and commentary. Return JUST the simple dish name in title case.

If the title doesn't contain a specific identifiable dish name (e.g. "We tried this viral recipe" with no dish mentioned, or just "Sandwich"), return null.

Rules:
- The dish name should be what you'd see on a restaurant menu or recipe index
- Remove words like "viral", "trending", "amazing", "incredible", "easy", "quick", "best ever"
- Remove "recipe" from the end unless it's part of the name
- Keep specific descriptors that identify the dish (e.g. "Nashville Hot", "Garlic Parmesan", "Blackened")
- If the title is in a non-English language, translate the dish name to English

Examples:
- "VIRAL TRENDING CROCKPOT RECIPE Garlic Parmesan Chicken & Potatoes SUPER YUMMY" → "Garlic Parmesan Chicken and Potatoes"
- "Testing the Chocolate Dumpling Recipe from TikTok!" → "Chocolate Dumplings"
- "This brioche recipe is amazing. Few people know this secret." → "Brioche"
- "Brits Try American Cinnamon Butter Swim Biscuits… This Should Be Illegal" → "Cinnamon Butter Swim Biscuits"
- "We FINALLY tried this viral recipe 🔥" → null
- "Sandwich #shorts #viral" → null
- "Medu vada | south indian food" → "Medu Vada"
- "how to make something tasty and delicious snacks at home" → null

Now extract dish names from these titles:
${titleList}

Return ONLY a JSON array of strings or nulls, one per title, same order. No markdown fences.`,
        }],
      }),
    })

    if (!res.ok) {
      console.error('[trending] Claude dish name extraction failed:', res.status)
      return videos.map(v => ({ ...v, dishName: v.title }))
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text || ''
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const names: (string | null)[] = JSON.parse(cleaned)

    console.log('[trending] Extracted dish names:', names.filter(Boolean).length, 'of', names.length)

    // Filter out videos where Claude couldn't identify a specific dish
    return videos
      .map((v, i) => ({ ...v, dishName: names[i] || '' }))
      .filter(v => v.dishName.length > 0)
  } catch (err) {
    console.error('[trending] Dish name extraction error:', err)
    return videos.map(v => ({ ...v, dishName: v.title }))
  }
}

// ===== GOOGLE TRENDS RSS =====

async function fetchGoogleTrendsFood(): Promise<TrendingTopic[]> {
  try {
    // Google Trends Daily Trends RSS — no auth needed
    const res = await fetch(
      'https://trends.google.com/trending/rss?geo=US',
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []

    const xml = await res.text()

    // Parse RSS items — look for food/recipe-related trends
    const items: TrendingTopic[] = []
    const itemRegex = /<item>[\s\S]*?<\/item>/g
    let match: RegExpExecArray | null

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[0]
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || ''
      const traffic = itemXml.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] || ''
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || ''

      // Filter for food-related trends
      const foodKeywords = [
        'recipe', 'food', 'cook', 'meal', 'dinner', 'lunch', 'breakfast',
        'chicken', 'pasta', 'cake', 'bread', 'salad', 'soup', 'pizza',
        'burger', 'steak', 'rice', 'taco', 'sushi', 'bbq', 'grill',
        'bake', 'dessert', 'chocolate', 'coffee', 'smoothie',
        'restaurant', 'chef', 'kitchen',
      ]
      const titleLower = title.toLowerCase()
      if (foodKeywords.some(kw => titleLower.includes(kw))) {
        items.push({ title, traffic, url: link })
      }
    }

    return items.slice(0, 5) // Top 5 food-related trends
  } catch (err) {
    console.error('[trending] Google Trends fetch error:', err)
    return []
  }
}
