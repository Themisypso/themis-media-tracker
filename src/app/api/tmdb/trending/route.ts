export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all' // all, movie, tv, person
    const timeWindow = searchParams.get('timeWindow') || 'day' // day, week

    try {
        const endpoint = `${TMDB_BASE}/trending/${type}/${timeWindow}?api_key=${API_KEY}`
        const res = await fetch(endpoint, { next: { revalidate: 3600 } }) // 1 hour
        if (!res.ok) throw new Error(`TMDB error: ${res.status}`)

        const data = await res.json()

        const results = (data.results || []).map((item: any) => {
            let itemType = item.media_type === 'tv' ? 'TVSHOW' : 'MOVIE'
            if (item.media_type === 'tv') {
                const isAnime = (item.origin_country || []).includes('JP') && (item.genre_ids || []).includes(16)
                if (isAnime) itemType = 'ANIME'
            }

            return {
                id: String(item.id),
                title: item.title || item.name,
                type: itemType,
                posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
                backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
                releaseYear: item.release_date
                    ? parseInt(item.release_date.split('-')[0])
                    : item.first_air_date
                        ? parseInt(item.first_air_date.split('-')[0])
                        : null,
                tmdbRating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
            }
        })

        return NextResponse.json({ results })
    } catch (error) {
        console.error('[TMDB TRENDING ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 })
    }
}
