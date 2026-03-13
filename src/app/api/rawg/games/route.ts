export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const RAWG_BASE = 'https://api.rawg.io/api'
const API_KEY = process.env.RAWG_API_KEY

const cache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 10 })

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') || '1'
    const sort = searchParams.get('sort') || '-popularity'
    const genre = searchParams.get('genre') || ''
    const platform = searchParams.get('platform') || ''
    const startYear = searchParams.get('startYear') || ''
    const endYear = searchParams.get('endYear') || ''
    const query = searchParams.get('query') || ''

    if (!API_KEY) {
        return NextResponse.json({ error: 'RAWG API key not configured' }, { status: 500 })
    }

    const cacheKey = `rawg:games:${page}:${sort}:${genre}:${platform}:${startYear}:${endYear}:${query}`
    if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

    try {
        const params = new URLSearchParams({ key: API_KEY, page, page_size: '24', ordering: sort })

        if (query) params.set('search', query)
        if (genre) params.set('genres', genre)
        if (platform) params.set('platforms', platform)
        if (startYear || endYear) {
            const from = startYear ? `${startYear}-01-01` : '1970-01-01'
            const to = endYear ? `${endYear}-12-31` : new Date().toISOString().split('T')[0]
            params.set('dates', `${from},${to}`)
        }

        const url = query
            ? `${RAWG_BASE}/games?${params}&search_precise=true`
            : `${RAWG_BASE}/games?${params}`

        const res = await fetch(url, { next: { revalidate: 600 } })
        if (!res.ok) throw new Error(`RAWG error: ${res.status}`)
        const data = await res.json()

        const results = (data.results || []).map((g: any) => ({
            id: g.id,
            slug: g.slug,
            title: g.name,
            posterUrl: g.background_image || null,
            releaseYear: g.released ? parseInt(g.released.split('-')[0]) : null,
            genres: (g.genres || []).map((x: any) => x.name),
            platforms: (g.platforms || []).map((p: any) => p.platform.name).slice(0, 4),
            rating: g.rating || null,
            metacritic: g.metacritic || null,
            type: 'GAME',
            tmdbId: null,
        }))

        const response = { results, hasMore: !!data.next }
        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (err) {
        console.error('[RAWG GAMES ERROR]', err)
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }
}
