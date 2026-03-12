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
  const [videos, topics] = await Promise.all([
    fetchYouTubeTrendingRecipes(apiKey, region, 25),
    fetchGoogleTrendsFood(),
  ])

  // Update cache
  cache = { videos, topics, ts: Date.now() }

  return NextResponse.json({
    videos: videos.slice(0, limit),
    trendingTopics: topics,
    cached: false,
  })
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

  const queries = ['easy dinner recipe', 'viral food recipe 2026', 'quick meal idea recipe']
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

        // Basic English filter — skip titles that are mostly non-Latin characters
        const titleText: string = item.snippet.title || ''
        const latinChars = titleText.replace(/[^a-zA-Z]/g, '').length
        if (titleText.length > 0 && latinChars / titleText.length < 0.5) continue

        seenIds.add(vid)

        allVideos.push({
          videoId: vid,
          title: item.snippet.title,
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
