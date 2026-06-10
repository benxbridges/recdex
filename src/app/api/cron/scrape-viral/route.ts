import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cron/scrape-viral
 *
 * Vercel Cron endpoint — runs every 6 hours.
 * Triggers the TikTok scraper and refreshes the YouTube trending cache.
 *
 * Vercel crons send the CRON_SECRET as a bearer token automatically.
 */

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this automatically).
  // Fail closed: if CRON_SECRET isn't configured, refuse to run.
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = req.nextUrl.origin
  const results: Record<string, unknown> = {}

  // 1. Trigger TikTok scraper — pass the secret in a header, not a query param,
  // to keep it out of access logs and referrers.
  try {
    const tiktokRes = await fetch(`${baseUrl}/api/scrape-tiktok`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({
        queries: [
          'cooking recipe',
          'recipe',
          'easy dinner recipe',
          'viral recipe',
          'baking',
          'cook',
        ],
        screenshotFallback: true,
      }),
    })
    results.tiktok = tiktokRes.ok ? await tiktokRes.json() : { error: tiktokRes.status }
  } catch (err) {
    results.tiktok = { error: String(err) }
  }

  // 2. Refresh YouTube trending cache
  try {
    const ytRes = await fetch(`${baseUrl}/api/trending?refresh=true&limit=15`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    })
    results.youtube = ytRes.ok ? { refreshed: true, status: ytRes.status } : { error: ytRes.status }
  } catch (err) {
    results.youtube = { error: String(err) }
  }

  console.log('[cron/scrape-viral] Completed:', JSON.stringify(results))

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  })
}
