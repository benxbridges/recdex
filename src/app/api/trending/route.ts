import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/trending
 * Returns trending recipe videos from YouTube (free, using existing API key).
 * Also attempts to pull trending food topics from Google Trends RSS.
 *
 * Discovery strategy:
 *   1. YouTube search with order=viewCount for recipe queries (past 7 days)
 *   2. YouTube search for "TikTok viral recipe" queries (marked platform: 'tiktok-via-youtube')
 *   3. Fetch actual view counts via /videos?part=statistics
 *   4. Filter: minimum 50,000 views
 *   5. Sort by viewCount descending
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
  platform: 'youtube' | 'tiktok-via-youtube'
  url: string
  description: string
  viewCount: number
}

type RawVideo = Omit<TrendingVideo, 'dishName'> & { dishName: string }

type TrendingTopic = {
  title: string
  traffic: string
  url: string
}

// Simple in-memory cache (survives hot reloads in dev, resets on cold start)
let cache: { videos: TrendingVideo[]; topics: TrendingTopic[]; ts: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

const MIN_VIEW_COUNT = 50_000

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

  // Fetch YouTube trending recipe videos + TikTok-via-YouTube + Google Trends in parallel
  const [youtubeRaw, tiktokRaw, topics] = await Promise.all([
    fetchYouTubeTrendingRecipes(apiKey, region, 25),
    fetchTikTokViaYouTube(apiKey, region, 15),
    fetchGoogleTrendsFood(),
  ])

  // Merge and deduplicate (YouTube results take priority over tiktok-via-youtube)
  const seenIds = new Set<string>()
  const merged: RawVideo[] = []

  for (const v of youtubeRaw) {
    if (!seenIds.has(v.videoId)) {
      seenIds.add(v.videoId)
      merged.push(v)
    }
  }
  for (const v of tiktokRaw) {
    if (!seenIds.has(v.videoId)) {
      seenIds.add(v.videoId)
      merged.push(v)
    }
  }

  // Fetch actual view counts from YouTube Data API
  const withStats = await fetchViewCounts(apiKey, merged)

  // Filter by minimum view count and sort by views descending
  const ranked = withStats
    .filter(v => v.viewCount >= MIN_VIEW_COUNT)
    .sort((a, b) => b.viewCount - a.viewCount)

  // Use Claude to extract clean dish names from clickbait YouTube titles
  const videos = await extractDishNames(ranked)

  // Update cache
  cache = { videos, topics, ts: Date.now() }

  return NextResponse.json({
    videos: videos.slice(0, limit),
    trendingTopics: topics,
    cached: false,
  })
}

// ===== CONTENT FILTERS =====

/**
 * Detects videos that aren't single, cookable recipes.
 * Catches: compilations, hacks, ASMR, mukbang, reviews, challenges, etc.
 */
function isNonRecipeContent(title: string): boolean {
  const t = title.toLowerCase()

  // --- Compilations / listicles ---
  if (/\b(\d{1,2})\s+(easy|best|quick|simple|favorite|favourite|healthy|cheap|budget|amazing|delicious|incredible|must.try|weeknight|dinner|lunch|breakfast|meal|recipe|crockpot|slow.cooker|instant.pot|air.fryer)/i.test(t)) return true
  if (/\btop\s+\d/i.test(t)) return true
  if (/\b\d+\s+(recipes|meals|dishes|dinners|lunches|breakfasts|ideas|ways|things|snacks|appetizers|desserts|sides)\b/i.test(t)) return true
  if (/\b(meal prep for the week|weekly meal prep|what i eat in a|full day of eating|full week)\b/i.test(t)) return true
  if (/\brecipes\b/i.test(t)) return true

  // --- Non-recipe video types ---
  if (/\b(hacks?|tips|tricks|ranking|ranked|tier list|taste test|review|compared|vs\.?|versus)\b/i.test(t)) return true
  if (/\b(mukbang|asmr|eating show|food challenge|speed eating|competitive eating)\b/i.test(t)) return true
  if (/\b(trying|ranking|rating)\s+(every|all|different)\b/i.test(t)) return true
  if (/\b(grocery haul|kitchen tour|what i bought|pantry restock|fridge tour)\b/i.test(t)) return true
  if (/\b(day in my life|morning routine|night routine|vlog)\b/i.test(t)) return true
  if (/\b(react|reaction)\b/i.test(t)) return true

  return false
}

/**
 * Detects channels that are typically non-recipe content (ASMR, mukbang, village cooking, etc.)
 * These channels may have food titles but don't produce usable single-recipe content.
 */
function isNonRecipeChannel(channelName: string): boolean {
  const c = channelName.toLowerCase()
  // Non-recipe content types
  if (/\b(asmr|mukbang|eating sounds?|village cook|outdoor cook|primitive|survival|bushcraft|food ranger|street food|food tour)\b/i.test(c)) return true
  // Non-English cooking channels (transliterated names)
  if (/\b(rasoi|khana|swad|zaika|tadka|bhojan|rannaghar|pakwan|vlog bangla|desi)\b/i.test(c)) return true
  return false
}

/**
 * Detects non-Latin script characters (Devanagari, Arabic, CJK, Thai, etc.)
 * Used to filter out non-English content that slips through with transliterated titles.
 */
function hasNonLatinScript(str: string): boolean {
  // Match common non-Latin scripts: Devanagari, Arabic, Bengali, CJK, Thai, Korean, Tamil, Telugu, etc.
  return /[\u0900-\u097F\u0600-\u06FF\u0980-\u09FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F\u0B80-\u0BFF\u0C00-\u0C7F\u0A00-\u0A7F]/.test(str)
}

/**
 * Checks if a string is predominantly English.
 * Stricter than just Latin chars — also checks for non-Latin scripts.
 */
function isEnglishContent(title: string, description: string, channelName: string): boolean {
  // Reject if title contains non-Latin scripts
  if (hasNonLatinScript(title)) return false

  // Reject if channel name contains non-Latin scripts
  if (hasNonLatinScript(channelName)) return false

  // Reject if description has significant non-Latin scripts
  if (description.length > 10 && hasNonLatinScript(description)) {
    // Count non-Latin script chars vs total — if more than 15%, skip
    const nonLatin = description.match(/[\u0900-\u097F\u0600-\u06FF\u0980-\u09FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F\u0B80-\u0BFF\u0C00-\u0C7F\u0A00-\u0A7F]/g)
    if (nonLatin && nonLatin.length / description.length > 0.15) return false
  }

  // Title must be mostly Latin characters (stricter: 70%+)
  const titleLatin = title.replace(/[^a-zA-Z]/g, '').length
  if (title.length > 0 && titleLatin / title.length < 0.6) return false

  // Description check (stricter: 50%+ Latin)
  if (description.length > 20) {
    const descLatin = description.replace(/[^a-zA-Z]/g, '').length
    if (descLatin / description.length < 0.5) return false
  }

  return true
}

// ===== YOUTUBE SEARCH (viewCount ordered) =====

async function searchYouTube(
  apiKey: string,
  queries: string[],
  region: string,
  maxResults: number,
  platform: 'youtube' | 'tiktok-via-youtube',
): Promise<RawVideo[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const allVideos: RawVideo[] = []
  const seenIds = new Set<string>()

  for (const q of queries) {
    if (allVideos.length >= maxResults) break

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q,
        type: 'video',
        order: 'viewCount',
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
        const channelName: string = item.snippet.channelTitle || ''

        // Strict English/North American content filter
        if (!isEnglishContent(titleText, descText, channelName)) continue

        // Skip non-recipe content (compilations, ASMR, hacks, reviews, etc.)
        if (isNonRecipeContent(titleText)) continue

        // Skip channels that don't produce real recipes
        if (isNonRecipeChannel(channelName)) continue

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
          platform,
          url: `https://www.youtube.com/watch?v=${vid}`,
          description: (item.snippet.description || '').slice(0, 300),
          viewCount: 0, // Will be filled by fetchViewCounts
        })
      }
    } catch (err) {
      console.error('[trending] YouTube search fetch error:', err)
    }
  }

  return allVideos
}

async function fetchYouTubeTrendingRecipes(
  apiKey: string,
  region: string,
  maxResults: number,
): Promise<RawVideo[]> {
  // Queries targeting single recipes popular with American audiences.
  const queries = [
    'viral recipe I made this week',
    'this recipe is incredible you have to try',
    'crockpot recipe easy family dinner',
    'one pot recipe comfort food',
    'air fryer recipe crispy easy',
    'easy weeknight dinner recipe homemade',
    'best homemade recipe from scratch',
    'baked chicken recipe juicy tender',
    'pasta recipe creamy garlic',
    'dessert recipe chocolate easy',
    'slow cooker dump recipe',
  ]

  return searchYouTube(apiKey, queries, region, maxResults, 'youtube')
}

// ===== TIKTOK-VIA-YOUTUBE SEARCH =====

async function fetchTikTokViaYouTube(
  apiKey: string,
  region: string,
  maxResults: number,
): Promise<RawVideo[]> {
  // Pragmatic TikTok sourcing: search YouTube for TikTok-viral recipe content.
  // These are typically YouTube creators recreating or covering TikTok-viral dishes.
  const queries = [
    'tiktok viral recipe 2026',
    'tiktok food hack trending',
    'recipe going viral on tiktok',
    'tiktok recipe I tried and it actually works',
    'trending tiktok dinner recipe',
  ]

  return searchYouTube(apiKey, queries, region, maxResults, 'tiktok-via-youtube')
}

// ===== FETCH VIEW COUNTS =====

/**
 * Fetches actual view counts from the YouTube Data API /videos endpoint.
 * Batches video IDs in groups of 50 (API limit).
 */
async function fetchViewCounts(apiKey: string, videos: RawVideo[]): Promise<RawVideo[]> {
  if (videos.length === 0) return videos

  const videoIds = videos.map(v => v.videoId)
  const viewCountMap = new Map<string, number>()

  // YouTube allows up to 50 IDs per request
  const batchSize = 50
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize)
    try {
      const params = new URLSearchParams({
        part: 'statistics',
        id: batch.join(','),
        key: apiKey,
      })

      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
      if (!res.ok) {
        console.error('[trending] YouTube statistics error:', res.status, await res.text())
        continue
      }

      const data = await res.json()
      for (const item of data.items || []) {
        const count = parseInt(item.statistics?.viewCount || '0', 10)
        viewCountMap.set(item.id, count)
      }
    } catch (err) {
      console.error('[trending] YouTube statistics fetch error:', err)
    }
  }

  // Attach view counts to videos
  return videos.map(v => ({
    ...v,
    viewCount: viewCountMap.get(v.videoId) || 0,
  }))
}

// ===== DISH NAME EXTRACTION (Claude) =====

/**
 * Uses Claude to extract clean dish names from YouTube video titles.
 * One batch call for all videos — runs once per cache refresh (~1/hour).
 * Cost: ~$0.002 per call with Haiku.
 */
async function extractDishNames(videos: RawVideo[]): Promise<TrendingVideo[]> {
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
          content: `You are curating a "Trending Recipes" page for an American cooking app. Extract a single cookable dish name from each YouTube video title, or return null if it doesn't qualify.

THE KEY TEST: Could someone click "Cook This" and get a single recipe with ingredients and steps? If not → null.

Return null if:
- It's hacks, tips, tricks, a roundup, or a taste test (e.g. "Box Cake Mix Hacks", "Ranking Fast Food Burgers")
- No specific identifiable dish (e.g. "We tried this viral recipe", "Sandwich", "Egg Toast")
- The video is about a technique or concept, not a specific dish (e.g. "How to Season Cast Iron")
- The dish is too niche/regional for American audiences (e.g. "Aalu Sevai Cutlet", "Ghujia", "Patra ni Macchi")
- It's just a condiment, sauce, or side with no main dish context (e.g. "Tamarind Water")
- The title is too vague to produce a meaningful recipe (e.g. "easy snacks at home")
- It's ASMR, mukbang, or eating content rather than a recipe

Return the dish name if:
- It names ONE specific, cookable dish that an American home cook would want to make
- It's a dish you could write a complete recipe card for (ingredients + steps)
- International dishes are OK if mainstream in America (Pad Thai, Birria Tacos, Ramen, Tikka Masala)

Rules for the dish name:
- Strip clickbait, filler, channel names, hashtags, emoji
- Should read like a recipe index entry or restaurant menu item
- Remove "viral", "trending", "amazing", "easy", "best ever", "recipe"
- Keep meaningful descriptors ("Nashville Hot", "Garlic Parmesan", "Slow Cooker")

Examples:
- "VIRAL TRENDING CROCKPOT RECIPE Garlic Parmesan Chicken & Potatoes" → "Garlic Parmesan Chicken and Potatoes"
- "This brioche recipe is amazing." → "Brioche"
- "I made Birria Tacos and they're insane" → "Birria Tacos"
- "Slow Cooker Smoked Sausage and Sweet Corn" → "Slow Cooker Smoked Sausage and Sweet Corn"
- "Box Cake Mix Hacks That Will Change Your Life" → null
- "We FINALLY tried this viral recipe 🔥" → null
- "Egg Toast #shorts #viral" → null
- "Aalu Sevai Cutlet - Ramzan Special" → null
- "Deep Fried Beef Curry | Village Cooking" → null
- "how to make something tasty and delicious snacks at home" → null

Titles:
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
