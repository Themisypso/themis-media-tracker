export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

const cache = new LRUCache<string, any>({ max: 100, ttl: 1000 * 60 * 30 })

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') || '1'

    const cacheKey = `people:popular:page:${page}`
    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        const res = await fetch(
            `${TMDB_BASE}/person/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
            { next: { revalidate: 1800 } }
        )
        if (!res.ok) throw new Error(`TMDB error: ${res.status}`)

        const data = await res.json()

        const results = (data.results || []).slice(0, 18).map((person: any) => ({
            id: person.id,
            name: person.name,
            profileUrl: person.profile_path
                ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                : null,
            knownForDepartment: person.known_for_department || 'Acting',
            popularity: person.popularity,
            knownFor: (person.known_for || []).slice(0, 3).map((k: any) => ({
                title: k.title || k.name,
                mediaType: k.media_type,
                posterUrl: k.poster_path
                    ? `https://image.tmdb.org/t/p/w92${k.poster_path}`
                    : null,
            })),
        }))

        const response = { results, totalPages: data.total_pages }
        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('[TMDB PEOPLE POPULAR ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch popular people' }, { status: 500 })
    }
}
