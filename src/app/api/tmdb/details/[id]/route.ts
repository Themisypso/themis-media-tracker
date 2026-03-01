import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 30 })

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(req.url)
    const mediaType = searchParams.get('type') || 'movie' // movie or tv
    const { id } = params

    const cacheKey = `details:${mediaType}:${id}`
    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        // Fetch main details + external IDs in parallel
        const [detailsRes, externalRes] = await Promise.all([
            fetch(`${TMDB_BASE}/${mediaType}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,genres`),
            fetch(`${TMDB_BASE}/${mediaType}/${id}/external_ids?api_key=${API_KEY}`),
        ])

        if (!detailsRes.ok) throw new Error(`TMDB error: ${detailsRes.status}`)

        const details = await detailsRes.json()
        const external = externalRes.ok ? await externalRes.json() : {}

        const response = {
            id: details.id,
            title: details.title || details.name,
            mediaType,
            posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
            backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
            releaseYear: details.release_date
                ? parseInt(details.release_date.split('-')[0])
                : details.first_air_date
                    ? parseInt(details.first_air_date.split('-')[0])
                    : null,
            runtime: details.runtime || details.episode_run_time?.[0] || null, // minutes
            genres: (details.genres || []).map((g: any) => g.name),
            overview: details.overview,
            tmdbRating: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
            imdbId: external.imdb_id || null,
            episodeCount: details.number_of_episodes || null,
            seasonCount: details.number_of_seasons || null,
        }

        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[TMDB DETAILS ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch TMDB details' }, { status: 500 })
    }
}
