import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const API_KEY = process.env.TMDB_API_KEY

let genreCache: { movies: any[], tv: any[] } | null = null

async function getGenreMap() {
    if (genreCache) return genreCache

    try {
        const [mov, tv] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${API_KEY}`).then(r => r.json())
        ])
        genreCache = { movies: mov.genres || [], tv: tv.genres || [] }
        return genreCache
    } catch {
        return { movies: [], tv: [] }
    }
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        // 1. Get user's library
        const items = await prisma.mediaItem.findMany({
            where: { userId: session.user.id, type: { in: ['MOVIE', 'TVSHOW', 'ANIME'] } },
            select: { tmdbId: true, type: true, genres: true, userRating: true, status: true }
        })

        const existingTmdbIds = new Set(items.map(i => i.tmdbId))

        // 2. Extract top genres from highly rated or completed
        const genreCounts: Record<string, number> = {}
        for (const item of items) {
            if (item.status === 'COMPLETED' || (item.userRating && item.userRating >= 7)) {
                for (const g of item.genres || []) {
                    genreCounts[g] = (genreCounts[g] || 0) + 1
                }
            }
        }

        const topGenreNames = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0])

        // 3. Map names to TMDB IDs
        const map = await getGenreMap()
        const movieGenreIds = topGenreNames
            .map(name => map.movies.find((g: any) => g.name === name)?.id)
            .filter(Boolean)
        const tvGenreIds = topGenreNames
            .map(name => map.tv.find((g: any) => g.name === name)?.id)
            .filter(Boolean)

        // 4. Get favorite people
        const favs = await prisma.favoritePerson.findMany({
            where: { userId: session.user.id },
            select: { tmdbPersonId: true },
            take: 3
        })
        const personIds = favs.map(f => f.tmdbPersonId)

        // 5. Discover queries
        const queries = []

        if (movieGenreIds.length > 0) {
            queries.push(
                fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${movieGenreIds.join(',')}&sort_by=popularity.desc`)
                    .then(r => r.json()).then(data => ({ type: 'MOVIE', results: data.results || [] }))
            )
        }
        if (tvGenreIds.length > 0) {
            queries.push(
                fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=${tvGenreIds.join(',')}&sort_by=popularity.desc`)
                    .then(r => r.json()).then(data => ({ type: 'TVSHOW', results: data.results || [] }))
            )
        }
        if (personIds.length > 0) {
            queries.push(
                fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_cast=${personIds.join(',')}&sort_by=popularity.desc`)
                    .then(r => r.json()).then(data => ({ type: 'MOVIE', results: data.results || [] }))
            )
        }

        // Default generic query if library empty
        if (queries.length === 0) {
            queries.push(
                fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`)
                    .then(r => r.json()).then(data => ({ type: 'MIXED', results: data.results || [] }))
            )
        }

        const resultsRaw = await Promise.all(queries)

        // 6. Filter and format
        let recommendations: any[] = []
        const seenRecs = new Set<string>()

        for (const group of resultsRaw) {
            for (const item of group.results) {
                const idString = String(item.id)
                if (existingTmdbIds.has(idString) || seenRecs.has(idString)) continue

                seenRecs.add(idString)
                recommendations.push({
                    id: idString,
                    title: item.title || item.name,
                    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                    type: group.type === 'MIXED' ? (item.media_type === 'tv' ? 'TVSHOW' : 'MOVIE') : group.type,
                    releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0]) : (item.first_air_date ? parseInt(item.first_air_date.split('-')[0]) : null),
                    rating: item.vote_average,
                    overview: item.overview
                })
            }
        }

        // Shuffle and take top 15
        recommendations = recommendations.sort(() => 0.5 - Math.random()).slice(0, 15)

        return NextResponse.json(recommendations)
    } catch (error) {
        console.error('[RECOMMENDATIONS]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
