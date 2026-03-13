export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 30 })

/**
 * GET /api/tmdb/seasons/[id]?season=1
 * Returns episode list for a given TV show season.
 * Cached in LRU (30 min TTL).
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season') || '1'
    const { id } = params

    const cacheKey = `seasons:${id}:${season}`
    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        const res = await fetch(
            `${TMDB_BASE}/tv/${id}/season/${season}?api_key=${API_KEY}&language=en-US`
        )
        if (!res.ok) throw new Error(`TMDB ${res.status}`)
        const data = await res.json()

        const response = {
            seasonNumber: data.season_number,
            name: data.name,
            episodeCount: data.episodes?.length ?? 0,
            episodes: (data.episodes ?? []).map((ep: any) => ({
                number: ep.episode_number,
                name: ep.name,
                airDate: ep.air_date ?? null,
                overview: ep.overview ?? null,
                runtime: ep.runtime ?? null,
                stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null,
            })),
        }

        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[TMDB SEASONS ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch season data' }, { status: 500 })
    }
}
