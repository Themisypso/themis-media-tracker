import { NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'

// GET /api/people/popular?dept=Acting|Directing|Writing|Production|all&page=1
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const dept = searchParams.get('dept') || 'all'
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const API_KEY = process.env.TMDB_API_KEY

    try {
        // For department filters, fetch multiple pages and filter client-side
        const pagesToFetch = dept === 'all' ? [page] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        const results = await Promise.all(
            pagesToFetch.map(p =>
                fetch(`${TMDB_BASE}/person/popular?api_key=${API_KEY}&language=en-US&page=${p}`, {
                    next: { revalidate: 3600 }
                }).then(r => r.ok ? r.json() : { results: [] })
                    .catch(() => ({ results: [] }))
            )
        )

        let people = results.flatMap(d => (d.results || []).map((person: any) => ({
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
        })))

        if (dept !== 'all') {
            people = people.filter((p: any) => p.knownForDepartment === dept)
        }

        return NextResponse.json(people)
    } catch {
        return NextResponse.json([])
    }
}
