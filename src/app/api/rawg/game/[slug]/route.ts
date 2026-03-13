export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const RAWG_BASE = 'https://api.rawg.io/api'
const API_KEY = process.env.RAWG_API_KEY
const cache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 30 })

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
    const { slug } = params
    if (!API_KEY) return NextResponse.json({ error: 'RAWG API key not configured' }, { status: 500 })

    const cacheKey = `rawg:game:${slug}`
    if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

    try {
        const [gameRes, screenshotsRes] = await Promise.all([
            fetch(`${RAWG_BASE}/games/${slug}?key=${API_KEY}`, { next: { revalidate: 3600 } }),
            fetch(`${RAWG_BASE}/games/${slug}/screenshots?key=${API_KEY}`, { next: { revalidate: 3600 } }),
        ])

        if (!gameRes.ok) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

        const game = await gameRes.json()
        const screenshots = screenshotsRes.ok ? (await screenshotsRes.json()).results || [] : []

        const result = {
            id: game.id,
            slug: game.slug,
            title: game.name,
            description: game.description_raw || game.description || null,
            coverUrl: game.background_image || null,
            releaseYear: game.released ? parseInt(game.released.split('-')[0]) : null,
            releaseDate: game.released || null,
            genres: (game.genres || []).map((g: any) => g.name),
            platforms: (game.platforms || []).map((p: any) => p.platform.name),
            developers: (game.developers || []).map((d: any) => d.name),
            publishers: (game.publishers || []).map((p: any) => p.name),
            tags: (game.tags || []).slice(0, 10).map((t: any) => t.name),
            rating: game.rating || null,
            ratingsCount: game.ratings_count || 0,
            metacritic: game.metacritic || null,
            playtime: game.playtime || null, // avg hours
            website: game.website || null,
            screenshots: screenshots.slice(0, 8).map((s: any) => s.image),
            esrb: game.esrb_rating?.name || null,
        }

        cache.set(cacheKey, result)
        return NextResponse.json(result)
    } catch (err) {
        console.error('[RAWG GAME DETAIL ERROR]', err)
        return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
    }
}
