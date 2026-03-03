export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

// In-memory LRU cache: 200 entries, 5min TTL
const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 5 })

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'multi' // multi, movie, tv

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] })
    }

    const cacheKey = `search:${type}:${query}`
    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        let endpoint = `${TMDB_BASE}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`

        const res = await fetch(endpoint, { next: { revalidate: 300 } })
        if (!res.ok) throw new Error(`TMDB error: ${res.status}`)

        const data = await res.json()

        // Normalize results — filter out "person" from multi search
        const rawResults = (data.results || [])
        const filtered = type === 'multi'
            ? rawResults.filter((item: any) => item.media_type !== 'person')
            : rawResults

        const results = filtered.slice(0, 12).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            mediaType: item.media_type || type,
            posterUrl: item.poster_path
                ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                : item.profile_path
                    ? `https://image.tmdb.org/t/p/w342${item.profile_path}`
                    : null,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
            releaseYear: item.release_date
                ? parseInt(item.release_date.split('-')[0])
                : item.first_air_date
                    ? parseInt(item.first_air_date.split('-')[0])
                    : null,
            tmdbRating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
            overview: item.overview,
        }))

        const response = { results }
        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[TMDB SEARCH ERROR]', error)
        return NextResponse.json({ error: 'Failed to search TMDB' }, { status: 500 })
    }
}
