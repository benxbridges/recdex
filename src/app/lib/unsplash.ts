// Shared Unsplash API utilities — single source of truth for all Unsplash interactions

export type UnsplashPhoto = {
  id: string
  urls: { regular: string; small: string; thumb: string; full: string; raw: string }
  user: { name: string; username: string; links: { html: string } }
  links: { html: string; download_location: string }
  likes: number
  width: number
  height: number
  color: string
}

export type UnsplashImageData = {
  url: string       // urls.regular — what we display
  thumb: string     // urls.small — for thumbnails
  credit: string    // user.name
  creditUrl: string // user.links.html — photographer profile
  photoUrl: string  // links.html — photo page on Unsplash
  unsplashId: string // id — needed for download trigger
  downloadLocation: string // links.download_location — correct URL for triggering downloads
}

export async function searchPhotos(query: string, accessKey: string, perPage = 6): Promise<UnsplashPhoto[]> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

// Only ever send the Unsplash access key to api.unsplash.com — passing it to
// any other host would leak the credential to that host's logs.
function isUnsplashApiUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'api.unsplash.com'
  } catch { return false }
}

export async function triggerDownload(downloadLocation: string, accessKey: string): Promise<void> {
  if (!isUnsplashApiUrl(downloadLocation)) return
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })
  } catch {} // fire-and-forget
}

export async function triggerDownloadById(unsplashId: string, accessKey: string): Promise<void> {
  try {
    await fetch(
      `https://api.unsplash.com/photos/${unsplashId}/download`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    )
  } catch {} // fire-and-forget
}

export function toImageData(photo: UnsplashPhoto): UnsplashImageData {
  return {
    url: photo.urls.regular,
    thumb: photo.urls.small,
    credit: photo.user.name,
    creditUrl: photo.user.links.html,
    photoUrl: photo.links.html,
    unsplashId: photo.id,
    downloadLocation: photo.links.download_location,
  }
}

// Append Unsplash-required UTM referral params
export const withUtm = (url: string) =>
  url + (url.includes('?') ? '&' : '?') + 'utm_source=recipeindex&utm_medium=referral'

// Smart query builder for recipe titles
const JUNK = /\b(easy|simple|classic|best|perfect|ultimate|homemade|traditional|authentic|quick|one-pot|no-knead|slow|lazy)\b/gi
const CONNECTORS = /\b(al|alla|alle|dello|della|dei|con|e|di|du|au|aux|en|le|la|les|de|el|los|las|the|a|an|and|or|of|in|on|for)\b/gi
const TRANSLATIONS: Record<string, string> = {
  limone: 'lemon', pollo: 'chicken', carne: 'meat', pesce: 'fish', riso: 'rice',
  poulet: 'chicken', boeuf: 'beef', poisson: 'fish', fromage: 'cheese',
  arroz: 'rice', pollo2: 'chicken', cerdo: 'pork',
}

export function extractDishQuery(title: string): string {
  if (title.split(/\s+/).length <= 2) return `${title} food dish`
  let q = title.replace(JUNK, '').replace(CONNECTORS, '').trim()
  for (const [foreign, english] of Object.entries(TRANSLATIONS)) {
    q = q.replace(new RegExp(`\\b${foreign}\\b`, 'gi'), english)
  }
  const beforeSplit = q.split(/\b(with|and|over|served)\b/i)[0]?.trim() || q
  const words = beforeSplit.split(/\s+/).filter(w => w.length > 0).slice(0, 6)
  return `${words.join(' ')} food dish`
}
