export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

const cache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 60 }) // 1 hour

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const personId = params.id
    const cacheKey = `person:${personId}`

    if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey))
    }

    try {
        // Fetch person details + combined credits in parallel
        const [detailRes, creditsRes] = await Promise.all([
            fetch(`${TMDB_BASE}/person/${personId}?api_key=${API_KEY}&language=en-US`),
            fetch(`${TMDB_BASE}/person/${personId}/combined_credits?api_key=${API_KEY}&language=en-US`),
        ])

        if (!detailRes.ok) throw new Error(`TMDB error: ${detailRes.status}`)
        if (!creditsRes.ok) throw new Error(`TMDB credits error: ${creditsRes.status}`)

        const detail = await detailRes.json()
        const credits = await creditsRes.json()

        // Process cast credits (actor roles)
        const castCredits = (credits.cast || [])
            .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 40)
            .map((c: any) => ({
                id: c.id,
                title: c.title || c.name,
                character: c.character || null,
                mediaType: c.media_type,
                posterUrl: c.poster_path
                    ? `https://image.tmdb.org/t/p/w185${c.poster_path}`
                    : null,
                releaseDate: c.release_date || c.first_air_date || null,
                voteAverage: c.vote_average ? Math.round(c.vote_average * 10) / 10 : null,
                episodeCount: c.episode_count || null,
            }))

        // Process crew credits (director, writer, etc.)
        const crewCredits = (credits.crew || [])
            .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 40)
            .map((c: any) => ({
                id: c.id,
                title: c.title || c.name,
                job: c.job || null,
                department: c.department || null,
                mediaType: c.media_type,
                posterUrl: c.poster_path
                    ? `https://image.tmdb.org/t/p/w185${c.poster_path}`
                    : null,
                releaseDate: c.release_date || c.first_air_date || null,
                voteAverage: c.vote_average ? Math.round(c.vote_average * 10) / 10 : null,
            }))

        const result = {
            id: detail.id,
            name: detail.name,
            biography: detail.biography || null,
            birthday: detail.birthday || null,
            deathday: detail.deathday || null,
            placeOfBirth: detail.place_of_birth || null,
            profileUrl: detail.profile_path
                ? `https://image.tmdb.org/t/p/w342${detail.profile_path}`
                : null,
            knownForDepartment: detail.known_for_department || 'Acting',
            popularity: Math.round(detail.popularity || 0),
            gender: detail.gender, // 1=Female, 2=Male, 3=Non-binary
            alsoKnownAs: (detail.also_known_as || []).slice(0, 5),
            homepage: detail.homepage || null,
            imdbId: detail.imdb_id || null,
            castCredits,
            crewCredits,
        }

        cache.set(cacheKey, result)
        return NextResponse.json(result)
    } catch (error) {
        console.error('[TMDB PERSON DETAIL ERROR]', error)
        return NextResponse.json(
            { error: 'Failed to fetch person details' },
            { status: 500 }
        )
    }
}
