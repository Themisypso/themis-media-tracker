import { NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')

    if (!query) return NextResponse.json({ results: [] })

    try {
        const res = await fetch(
            `${TMDB_BASE}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
        )
        if (!res.ok) throw new Error('Failed to search people')

        const data = await res.json()

        const results = (data.results || []).map((person: any) => ({
            id: person.id,
            name: person.name,
            profileUrl: person.profile_path
                ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                : null,
            knownForDepartment: person.known_for_department || 'Acting',
            popularity: Math.round(person.popularity),
            knownFor: (person.known_for || []).slice(0, 3).map((k: any) => ({
                title: k.title || k.name,
                mediaType: k.media_type,
                posterUrl: k.poster_path ? `https://image.tmdb.org/t/p/w92${k.poster_path}` : null,
            })),
        }))

        return NextResponse.json({ results })
    } catch (error) {
        console.error('[PEOPLE SEARCH ERROR]', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
