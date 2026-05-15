import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/scrape-tiktok
 *
 * Discovers trending cooking videos on TikTok using two strategies:
 *
 * Strategy A: Fetch TikTok search pages and parse embedded JSON
 *   TikTok SSR pages embed video data in a rehydration <script> tag.
 *   We extract titles, authors, view counts, and video URLs from this.
 *
 * Strategy B (fallback): Screenshot + Claude Vision
 *   If HTML parsing fails (anti-bot, layout change), we use a screenshot
 *   service to capture the search results page, then Claude Vision extracts
 *   the video data from the screenshot image.
 *
 * Results are stored in the `viral_videos` Supabase table and merged with
 * YouTube results in the /api/trending endpoint.
 *
 * Auth: Requires ?key= matching CRON_SECRET env var (for cron triggers)
 *       or SCRAPE_TIKTOK_KEY env var.
 *
 * Usage:
 *   POST /api/scrape-tiktok?key=SECRET
 *   Body (optional): { "queries": ["cooking", "recipe"], "screenshotFallback": true }
 */

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const DEFAULT_QUERIES = [
  'cooking recipe',
  'recipe',
  'easy dinner recipe',
  'viral recipe',
  'baking',
]

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
]

type ScrapedVideo = {
  platform_id: string
  platform: 'tiktok'
  title: string
  author_name: string
  author_url: string
  thumbnail_url: string
  video_url: string
  view_count: number
  like_count: number
  share_count: number
  discovered_via: string // query that found it
  raw_data: Record<string, unknown> | null
}

// ===== STRATEGY A: HTML PARSE =====

/**
 * Fetches TikTok search page and extracts video data from SSR JSON.
 * TikTok embeds a large JSON blob in <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">.
 */
async function scrapeTikTokSearch(query: string): Promise<ScrapedVideo[]> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}&t=${Date.now()}`

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      console.log(`[scrape-tiktok] Search fetch failed for "${query}": ${res.status}`)
      return []
    }

    const html = await res.text()

    // Extract the rehydration JSON
    const scriptMatch = html.match(/<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      console.log(`[scrape-tiktok] No rehydration script found for "${query}"`)
      return []
    }

    const jsonData = JSON.parse(scriptMatch[1])

    // Navigate the TikTok data structure to find search results
    // The path varies but is typically: __DEFAULT_SCOPE__["webapp.search-detail"]
    const searchData = jsonData?.['__DEFAULT_SCOPE__']?.['webapp.search-detail']
    const itemList = searchData?.itemList || searchData?.data || []

    if (!Array.isArray(itemList) || itemList.length === 0) {
      // Try alternate paths
      const altData = jsonData?.['__DEFAULT_SCOPE__']?.['webapp.search']
      const altList = altData?.itemList || altData?.videoList || []
      if (!Array.isArray(altList) || altList.length === 0) {
        console.log(`[scrape-tiktok] No video items found for "${query}"`)
        return []
      }
      return parseVideoItems(altList, query)
    }

    return parseVideoItems(itemList, query)
  } catch (err) {
    console.error(`[scrape-tiktok] Error scraping "${query}":`, err)
    return []
  }
}

function parseVideoItems(items: Record<string, unknown>[], query: string): ScrapedVideo[] {
  const videos: ScrapedVideo[] = []

  for (const item of items) {
    try {
      const video = item as Record<string, unknown>
      const desc = (video.desc as string) || ''
      const id = (video.id as string) || ''
      const author = video.author as Record<string, unknown> | undefined
      const stats = video.stats as Record<string, number> | undefined
      const videoData = video.video as Record<string, unknown> | undefined

      if (!id || !desc) continue

      const authorName = (author?.nickname as string) || (author?.uniqueId as string) || ''
      const authorId = (author?.uniqueId as string) || ''
      const cover = (videoData?.cover as string) || (videoData?.dynamicCover as string) || (videoData?.originCover as string) || ''
      const viewCount = stats?.playCount || 0
      const likeCount = stats?.diggCount || 0
      const shareCount = stats?.shareCount || 0

      // Only include videos with substantial views
      if (viewCount < 10000) continue

      videos.push({
        platform_id: id,
        platform: 'tiktok',
        title: desc.slice(0, 500), // TikTok "titles" are descriptions
        author_name: authorName,
        author_url: authorId ? `https://www.tiktok.com/@${authorId}` : '',
        thumbnail_url: cover,
        video_url: `https://www.tiktok.com/@${authorId}/video/${id}`,
        view_count: viewCount,
        like_count: likeCount,
        share_count: shareCount,
        discovered_via: query,
        raw_data: { stats, desc, authorId },
      })
    } catch {
      // Skip malformed items
    }
  }

  return videos
}

// ===== STRATEGY B: SCREENSHOT + CLAUDE VISION =====

/**
 * Takes a screenshot of TikTok search results using an external service,
 * then uses Claude Vision to extract video data from the image.
 *
 * Screenshot services (in order of preference):
 * 1. SCREENSHOT_API_URL env var (self-hosted or any service)
 * 2. screenshotone.com (free tier: 100/month)
 * 3. urlbox.io (free tier: 100/month)
 */
async function screenshotAndParse(query: string): Promise<ScrapedVideo[]> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    console.log('[scrape-tiktok] No ANTHROPIC_API_KEY for vision fallback')
    return []
  }

  const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`
  let screenshotBase64: string | null = null

  // Try screenshot services
  const screenshotApiUrl = process.env.SCREENSHOT_API_URL
  const screenshotApiKey = process.env.SCREENSHOT_API_KEY || ''

  if (screenshotApiUrl) {
    // Custom/self-hosted screenshot service
    // Expected: POST with { url } → { image: base64 }
    try {
      const res = await fetch(screenshotApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(screenshotApiKey ? { 'Authorization': `Bearer ${screenshotApiKey}` } : {}),
        },
        body: JSON.stringify({
          url: searchUrl,
          width: 1280,
          height: 2400,
          wait_for: 3000,
          format: 'png',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        screenshotBase64 = data.image || data.screenshot || data.base64
      }
    } catch (err) {
      console.error('[scrape-tiktok] Custom screenshot service error:', err)
    }
  }

  if (!screenshotBase64) {
    // Try screenshotone.com free API
    const screenshotoneKey = process.env.SCREENSHOTONE_API_KEY
    if (screenshotoneKey) {
      try {
        const params = new URLSearchParams({
          access_key: screenshotoneKey,
          url: searchUrl,
          viewport_width: '1280',
          viewport_height: '2400',
          format: 'png',
          delay: '3',
          response_type: 'json',
        })
        const res = await fetch(`https://api.screenshotone.com/take?${params}`)
        if (res.ok) {
          const data = await res.json()
          screenshotBase64 = data.screenshot
        }
      } catch (err) {
        console.error('[scrape-tiktok] ScreenshotOne error:', err)
      }
    }
  }

  if (!screenshotBase64) {
    console.log(`[scrape-tiktok] No screenshot available for "${query}"`)
    return []
  }

  // Send screenshot to Claude Vision
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 },
            },
            {
              type: 'text',
              text: `This is a screenshot of TikTok search results for "${query}". Extract all visible cooking/recipe videos.

For each video, extract:
- title: the video description/caption text
- author: the creator's username (with @)
- views: the view count (parse "1.2M" as 1200000, "500K" as 500000, etc.)
- likes: the like count (same format parsing)

Return ONLY a JSON array, no markdown fences:
[{ "title": "...", "author": "@username", "views": 1200000, "likes": 50000 }]

If no cooking videos are visible, return [].`,
            },
          ],
        }],
      }),
    })

    if (!res.ok) {
      console.error('[scrape-tiktok] Claude Vision error:', res.status)
      return []
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text || '[]'
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned) as { title: string; author: string; views: number; likes: number }[]

    return parsed
      .filter(v => v.views >= 10000)
      .map(v => ({
        platform_id: `ss-${query}-${v.author}-${v.views}`, // Synthetic ID
        platform: 'tiktok' as const,
        title: v.title,
        author_name: v.author.replace(/^@/, ''),
        author_url: `https://www.tiktok.com/${v.author.startsWith('@') ? v.author : '@' + v.author}`,
        thumbnail_url: '', // Not available from screenshot
        video_url: '', // Not available from screenshot — will need manual matching
        view_count: v.views,
        like_count: v.likes,
        share_count: 0,
        discovered_via: `screenshot:${query}`,
        raw_data: null,
      }))
  } catch (err) {
    console.error('[scrape-tiktok] Vision parsing error:', err)
    return []
  }
}

// ===== DISH NAME CLEANING (Claude) =====

async function cleanDishNames(videos: ScrapedVideo[]): Promise<(ScrapedVideo & { dish_name: string })[]> {
  if (videos.length === 0) return []

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return videos.map(v => ({ ...v, dish_name: v.title.slice(0, 100) }))
  }

  try {
    const titleList = videos.map((v, i) => `${i + 1}. ${v.title.slice(0, 200)}`).join('\n')

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
          content: `These are TikTok video descriptions for cooking/recipe content. Extract a single clean dish name from each, or null if it's not a real cookable recipe.

Return null if:
- It's a compilation, hack, or tip video
- No specific dish is identifiable
- It's mukbang, ASMR, or eating content
- The description is just hashtags with no clear dish

Return the dish name if:
- It names a specific cookable dish
- You can identify what recipe this is even if the description is informal

Strip all hashtags, emoji, filler words, and clickbait. Return a clean recipe name.

Descriptions:
${titleList}

Return ONLY a JSON array of strings or nulls, one per description, same order. No markdown fences.`,
        }],
      }),
    })

    if (!res.ok) {
      return videos.map(v => ({ ...v, dish_name: v.title.slice(0, 100) }))
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text || ''
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const names: (string | null)[] = JSON.parse(cleaned)

    return videos
      .map((v, i) => ({ ...v, dish_name: names[i] || '' }))
      .filter(v => v.dish_name.length > 0)
  } catch (err) {
    console.error('[scrape-tiktok] Dish name cleaning error:', err)
    return videos.map(v => ({ ...v, dish_name: v.title.slice(0, 100) }))
  }
}

// ===== SUPABASE STORAGE =====

async function storeVideos(videos: (ScrapedVideo & { dish_name: string })[]) {
  if (!SUPABASE_SERVICE_KEY || videos.length === 0) return { stored: 0 }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Upsert by platform + platform_id
  const rows = videos.map(v => ({
    platform: v.platform,
    platform_id: v.platform_id,
    dish_name: v.dish_name,
    title: v.title.slice(0, 500),
    author_name: v.author_name,
    author_url: v.author_url,
    thumbnail_url: v.thumbnail_url,
    video_url: v.video_url,
    view_count: v.view_count,
    like_count: v.like_count,
    share_count: v.share_count,
    discovered_via: v.discovered_via,
    scraped_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('viral_videos')
    .upsert(rows, { onConflict: 'platform,platform_id' })
    .select('id')

  if (error) {
    console.error('[scrape-tiktok] Supabase upsert error:', error)
    return { stored: 0, error: error.message }
  }

  return { stored: data?.length || 0 }
}

// ===== ROUTE HANDLER =====

export async function POST(req: NextRequest) {
  // Auth check — accept either Authorization: Bearer header (preferred) or
  // ?key= for backwards compatibility. Fail closed if no secret configured.
  const validKey = process.env.CRON_SECRET || process.env.SCRAPE_TIKTOK_KEY
  const authHeader = req.headers.get('authorization') || ''
  const headerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const queryKey = req.nextUrl.searchParams.get('key') || ''
  if (!validKey || (headerKey !== validKey && queryKey !== validKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { queries?: string[]; screenshotFallback?: boolean } = {}
  try { body = await req.json() } catch { /* empty body is fine */ }

  const queries = body.queries || DEFAULT_QUERIES
  const useScreenshotFallback = body.screenshotFallback !== false

  console.log(`[scrape-tiktok] Starting scrape for ${queries.length} queries...`)

  const allVideos: ScrapedVideo[] = []
  const seenIds = new Set<string>()
  const stats = { htmlParsed: 0, screenshotParsed: 0, failed: 0 }

  for (const query of queries) {
    // Strategy A: HTML parse
    let videos = await scrapeTikTokSearch(query)

    if (videos.length > 0) {
      stats.htmlParsed += videos.length
      console.log(`[scrape-tiktok] HTML parse: ${videos.length} videos for "${query}"`)
    } else if (useScreenshotFallback) {
      // Strategy B: Screenshot fallback
      console.log(`[scrape-tiktok] HTML parse failed for "${query}", trying screenshot...`)
      videos = await screenshotAndParse(query)
      if (videos.length > 0) {
        stats.screenshotParsed += videos.length
        console.log(`[scrape-tiktok] Screenshot parse: ${videos.length} videos for "${query}"`)
      } else {
        stats.failed++
      }
    } else {
      stats.failed++
    }

    // Deduplicate
    for (const v of videos) {
      if (!seenIds.has(v.platform_id)) {
        seenIds.add(v.platform_id)
        allVideos.push(v)
      }
    }

    // Rate limit between queries
    await new Promise(r => setTimeout(r, 1500))
  }

  // Sort by views and take top results
  allVideos.sort((a, b) => b.view_count - a.view_count)
  const topVideos = allVideos.slice(0, 25)

  // Clean dish names with Claude
  const withDishNames = await cleanDishNames(topVideos)
  console.log(`[scrape-tiktok] ${withDishNames.length} videos after dish name cleaning`)

  // Store in Supabase
  const storeResult = await storeVideos(withDishNames)

  return NextResponse.json({
    scraped: allVideos.length,
    cleaned: withDishNames.length,
    stored: storeResult.stored,
    stats,
    videos: withDishNames.map(v => ({
      dish_name: v.dish_name,
      author: v.author_name,
      views: v.view_count,
      url: v.video_url,
    })),
  })
}

// GET endpoint for checking latest scraped data
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '10'), 25)

  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get most recent viral TikTok videos, scored by views
  const { data, error } = await supabase
    .from('viral_videos')
    .select('*')
    .eq('platform', 'tiktok')
    .eq('is_active', true)
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ videos: data || [] })
}
