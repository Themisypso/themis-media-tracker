export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

// In-memory LRU cache: 500 entries, 30min TTL
const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 30 })

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'movie' // movie, tv
    const page = searchParams.get('page') || '1'
    const sort = searchParams.get('sort') || 'popularity.desc'
    const genres = searchParams.get('genres') || ''
    const minRating = searchParams.get('minRating') || ''
    const minVotes = searchParams.get('minVotes') || '100' // Default min votes for meaningful rating sorts
    const withKeywords = searchParams.get('withKeywords') || ''
    const withoutKeywords = searchParams.get('withoutKeywords') || ''
    const withOriginCountry = searchParams.get('withOriginCountry') || ''
    const year = searchParams.get('year') || ''
    const startYear = searchParams.get('startYear') || ''
    const endYear = searchParams.get('endYear') || ''
    const query = searchParams.get('query') || ''

    const cacheKey = `discover:${type}:${page}:${sort}:${genres}:${minRating}:${withKeywords}:${withoutKeywords}:${withOriginCountry}:${year}:${startYear}:${endYear}:${query}`
    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        let endpoint = ''

        if (query) {
            endpoint = `${TMDB_BASE}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=${page}`
            if (year) {
                if (type === 'movie') endpoint += `&primary_release_year=${year}`
                else endpoint += `&first_air_date_year=${year}`
            }
        } else {
            endpoint = `${TMDB_BASE}/discover/${type}?api_key=${API_KEY}&language=en-US&page=${page}&sort_by=${sort}&vote_count.gte=${minVotes}`

            if (genres) endpoint += `&with_genres=${genres}`
            if (minRating) endpoint += `&vote_average.gte=${minRating}`
            if (withKeywords) endpoint += `&with_keywords=${withKeywords}`
            if (withoutKeywords) endpoint += `&without_keywords=${withoutKeywords}`
            if (withOriginCountry) endpoint += `&with_origin_country=${withOriginCountry}`

            if (year) {
                if (type === 'movie') endpoint += `&primary_release_year=${year}`
                else endpoint += `&first_air_date_year=${year}`
            } else if (startYear || endYear) {
                if (type === 'movie') {
                    if (startYear) endpoint += `&primary_release_date.gte=${startYear}-01-01`
                    if (endYear) endpoint += `&primary_release_date.lte=${endYear}-12-31`
                } else {
                    if (startYear) endpoint += `&first_air_date.gte=${startYear}-01-01`
                    if (endYear) endpoint += `&first_air_date.lte=${endYear}-12-31`
                }
            }
        }

        const res = await fetch(endpoint, { next: { revalidate: 1800 } })
        if (!res.ok) throw new Error(`TMDB error: ${res.status}`)

        const data = await res.json()

        const results = (data.results || []).map((item: any) => {
            let itemType = type === 'tv' ? 'TVSHOW' : 'MOVIE'
            const isAnime = (item.origin_country || []).includes('JP') && (item.genre_ids || []).includes(16)
            if (isAnime) itemType = 'ANIME'

            return {
                id: String(item.id),
                title: item.title || item.name,
                type: itemType,
                posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
                releaseYear: item.release_date
                    ? parseInt(item.release_date.split('-')[0])
                    : item.first_air_date
                        ? parseInt(item.first_air_date.split('-')[0])
                        : null,
                tmdbRating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
            }
        })

        const response = {
            results,
            page: data.page,
            totalPages: data.total_pages,
            totalResults: data.total_results,
        }

        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[TMDB DISCOVER ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 })
    }
}
