export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const RAWG_BASE = 'https://api.rawg.io/api'
const API_KEY = process.env.RAWG_API_KEY

// In-memory LRU cache: 300 entries, 5min TTL
const cache = new LRUCache<string, any>({ max: 300, ttl: 1000 * 60 * 5 })

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] })
    }

    if (!API_KEY) {
        return NextResponse.json({ error: 'RAWG API key not configured' }, { status: 500 })
    }

    const cacheKey = `rawg:search:${query.toLowerCase()}`
    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        const endpoint = `${RAWG_BASE}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=12&ordering=-rating`
        const res = await fetch(endpoint, { next: { revalidate: 300 } })

        if (!res.ok) throw new Error(`RAWG error: ${res.status}`)

        const data = await res.json()

        const results = (data.results || []).map((game: any) => ({
            id: game.id,
            slug: game.slug,
            title: game.name,
            coverUrl: game.background_image || null,
            releaseYear: game.released ? parseInt(game.released.split('-')[0]) : null,
            genres: (game.genres || []).map((g: any) => g.name),
            platforms: (game.platforms || []).map((p: any) => p.platform.name).slice(0, 5),
            rating: game.rating ? Math.round(game.rating * 20) / 10 : null, // normalize to /10
            rawgRating: game.rating || null,
            metacritic: game.metacritic || null,
        }))

        const response = { results }
        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[RAWG SEARCH ERROR]', error)
        return NextResponse.json({ error: 'Failed to search RAWG' }, { status: 500 })
    }
}
