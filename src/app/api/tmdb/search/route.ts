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

        let results = (data.results || []).slice(0, 10).map((item: any) => ({
            id: item.id.toString(),
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
            overview: item.overview || (item.known_for_department ? `Known for ${item.known_for_department}` : ''),
        }))

        // Top Cast Injection: If the best match is a movie/tv, fetch its cast and prepend to results
        if (type === 'multi' && results.length > 0) {
            const topHit = results[0]
            if (topHit.mediaType === 'movie' || topHit.mediaType === 'tv') {
                try {
                    const creditsRes = await fetch(`${TMDB_BASE}/${topHit.mediaType}/${topHit.id}/credits?api_key=${API_KEY}`)
                    if (creditsRes.ok) {
                        const creditsData = await creditsRes.json()
                        const topCast = (creditsData.cast || []).slice(0, 3).map((actor: any) => ({
                            id: actor.id.toString(),
                            title: actor.name,
                            mediaType: 'person',
                            posterUrl: actor.profile_path ? `https://image.tmdb.org/t/p/w342${actor.profile_path}` : null,
                            backdropUrl: null,
                            releaseYear: null,
                            tmdbRating: null,
                            overview: `Played ${actor.character} in ${topHit.title}`
                        }))
                        // Insert cast right after the top hit
                        results.splice(1, 0, ...topCast)
                    }
                } catch (e) {
                    console.error('[Top Cast Injection Error]', e)
                }
            }
        }

        // Parallel fetch for Books & Games
        if (type === 'multi') {
            try {
                // Fetch Books from Google direct
                const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY
                const booksUrl = GOOGLE_BOOKS_API_KEY
                    ? `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=4&key=${GOOGLE_BOOKS_API_KEY}`
                    : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=4`

                const booksPromise = fetch(booksUrl).then(res => res.ok ? res.json() : null).catch(() => null)

                // Fetch Games from RAWG
                const RAWG_API_KEY = process.env.RAWG_API_KEY
                const gamesUrl = RAWG_API_KEY
                    ? `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=4`
                    : null
                const gamesPromise = gamesUrl ? fetch(gamesUrl).then(res => res.ok ? res.json() : null).catch(() => null) : Promise.resolve(null)

                const [booksData, gamesData] = await Promise.all([booksPromise, gamesPromise])

                if (booksData && booksData.items) {
                    const bookResults = booksData.items.slice(0, 4).map((book: any) => {
                        const info = book.volumeInfo || {}
                        return {
                            id: book.id,
                            title: info.title,
                            mediaType: 'book',
                            posterUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
                            backdropUrl: null,
                            releaseYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
                            tmdbRating: info.averageRating || null,
                            overview: info.description || '',
                        }
                    })
                    // append books
                    results = [...results, ...bookResults]
                }

                if (gamesData && gamesData.results) {
                    const gameResults = gamesData.results.slice(0, 4).map((game: any) => ({
                        id: String(game.id),
                        title: game.name,
                        mediaType: 'game',
                        posterUrl: game.background_image || null,
                        backdropUrl: null,
                        releaseYear: game.released ? parseInt(game.released.split('-')[0]) : null,
                        tmdbRating: game.rating ? Math.round(game.rating * 2) : null,
                        overview: '',
                    }))
                    // append games
                    results = [...results, ...gameResults]
                }

            } catch (err) {
                console.error('[External Multi-Search Error]', err)
            }
        }

        // Deduplicate by ID just in case
        const seen = new Set()
        results = results.filter((r: any) => {
            if (seen.has(r.id)) return false
            seen.add(r.id)
            return true
        })

        const response = { results }
        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[TMDB SEARCH ERROR]', error)
        return NextResponse.json({ error: 'Failed to search TMDB' }, { status: 500 })
    }
}
