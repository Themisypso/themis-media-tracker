import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const RAWG_API_KEY = process.env.RAWG_API_KEY
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ items: [] })
    }

    try {
        const results: any[] = []

        // 1. TMDB Multi Search (Movies, TV Shows, People)
        const tmdbPromise = TMDB_API_KEY ? fetch(
            `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
        ).then(res => res.json()) : Promise.resolve(null)

        // 2. RAWG Games Search
        const rawgPromise = RAWG_API_KEY ? fetch(
            `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=3`
        ).then(res => res.json()) : Promise.resolve(null)

        // 3. Google Books Search
        const booksPromise = GOOGLE_BOOKS_API_KEY ? fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&key=${GOOGLE_BOOKS_API_KEY}`
        ).then(res => res.json()) : Promise.resolve(null)

        const [tmdbData, rawgData, booksData] = await Promise.all([tmdbPromise, rawgPromise, booksPromise])

        // Parse TMDB
        if (tmdbData?.results) {
            const tmdbResults = tmdbData.results.slice(0, 4).map((item: any) => {
                let type = item.media_type === 'movie' ? 'MOVIE' : item.media_type === 'tv' ? 'TVSHOW' : 'PERSON'
                let year = item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : undefined
                let image = item.poster_path || item.profile_path ? `https://image.tmdb.org/t/p/w92${item.poster_path || item.profile_path}` : undefined
                return {
                    id: item.id.toString(),
                    title: item.title || item.name,
                    type,
                    year,
                    image
                }
            })
            results.push(...tmdbResults)
        }

        // Parse RAWG
        if (rawgData?.results) {
            const rawgResults = rawgData.results.map((item: any) => ({
                id: item.slug,
                title: item.name,
                type: 'GAME',
                year: item.released ? item.released.split('-')[0] : undefined,
                image: item.background_image
            }))
            results.push(...rawgResults)
        }

        // Parse Google Books
        if (booksData?.items) {
            const booksResults = booksData.items.map((item: any) => ({
                id: item.id,
                title: item.volumeInfo?.title,
                type: 'BOOK',
                year: item.volumeInfo?.publishedDate ? item.volumeInfo.publishedDate.split('-')[0] : undefined,
                image: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:')
            }))
            results.push(...booksResults)
        }

        // Sort by pseudo-relevance (TMDB first usually makes sense, but we shuffle slightly or keep order)
        // For suggest, just return the first 6 items to keep it clean
        const finalResults = results.slice(0, 6)

        return NextResponse.json({ items: finalResults })
    } catch (error) {
        console.error('Suggest search error:', error)
        return NextResponse.json({ items: [] }, { status: 500 })
    }
}
