import { NextRequest, NextResponse } from 'next/server'

const PAYWALL_DOMAINS = ['cooking.nytimes.com', 'nytimes.com', 'wsj.com']

function isPaywalled(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace('www.', '')
    return PAYWALL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch { return false }
}

function slugToSearchTerms(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return (parts[parts.length - 1] || '').replace(/^\d+-/, '').replace(/-/g, ' ').trim()
  } catch { return '' }
}

type Mirror = { url: string; title: string; domain: string }

const GROUNDING_REDIRECT = 'vertexaisearch.cloud.google.com/grounding-api-redirect'

async function resolveUrl(url: string): Promise<string> {
  if (!url.includes(GROUNDING_REDIRECT)) return url
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(4000) })
    return res.headers.get('location') || url
  } catch { return url }
}

export async function POST(req: NextRequest) {
  let body: { url: string; authorName?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const { url, authorName } = body
  if (!url) return NextResponse.json({ error: 'url_required' }, { status: 400 })

  const paywalled = isPaywalled(url)
  const searchTerms = slugToSearchTerms(url)
  if (!searchTerms) return NextResponse.json({ paywalled, mirrors: [] })

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return NextResponse.json({ paywalled, searchTerms, mirrors: [] })

  let mirrors: Mirror[] = []

  try {
    const prompt = `Find 5 non-paywalled recipe websites that have "${searchTerms}"${authorName ? ` by ${authorName}` : ''}. Exclude nytimes.com. Return only a JSON array: [{"url":"...","title":"...","domain":"..."}]`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0 },
        }),
        signal: AbortSignal.timeout(12000),
      }
    )

    if (!geminiRes.ok) return NextResponse.json({ paywalled, searchTerms, mirrors: [] })

    const geminiData = await geminiRes.json()
    const parts: Array<{ text?: string }> = geminiData?.candidates?.[0]?.content?.parts || []
    const fullText = parts.map(p => p.text || '').join('\n')

    // Parse JSON array from response
    const jsonMatch = fullText.match(/\[[\s\S]*?\]/)
    if (jsonMatch) {
      try {
        const parsed: Array<{ url?: string; title?: string; domain?: string }> = JSON.parse(jsonMatch[0])
        const candidates = parsed
          .filter(m => m.url)
          .slice(0, 6)

        // Follow any grounding redirect URLs in parallel
        const resolvedUrls = await Promise.all(candidates.map(m => resolveUrl(m.url!)))

        mirrors = candidates
          .map((m, i) => {
            const resolved = resolvedUrls[i]
            if (PAYWALL_DOMAINS.some(d => resolved.includes(d))) return null
            let domain = m.domain || ''
            if (!domain || domain.includes('vertexaisearch')) {
              try { domain = new URL(resolved).hostname.replace('www.', '') } catch { /* ignore */ }
            }
            return { url: resolved, title: m.title || domain, domain }
          })
          .filter((m): m is Mirror => m !== null && !m.url.includes(GROUNDING_REDIRECT))
          .slice(0, 5)
      } catch { /* JSON parse failed */ }
    }
  } catch (err) {
    console.error('[find-mirror] error:', err)
  }

  return NextResponse.json({ paywalled, searchTerms, mirrors })
}
