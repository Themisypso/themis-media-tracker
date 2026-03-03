import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Search, User as UserIcon, Film, Tv, Users, Compass } from 'lucide-react'

// Allow caching where possible, but this uses searchParams which makes it dynamic
export const dynamic = 'force-dynamic'

async function searchTMDB(query: string) {
    if (!query) return { media: [], people: [] }
    const endpoint = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`

    try {
        const res = await fetch(endpoint, { next: { revalidate: 300 } })
        if (!res.ok) return { media: [], people: [] }
        const data = await res.json()

        const results = data.results || []

        // Split into media and people
        const media = results.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 12)
        const people = results.filter((r: any) => r.media_type === 'person').slice(0, 8)

        return { media, people }
    } catch {
        return { media: [], people: [] }
    }
}

async function searchUsers(query: string) {
    if (!query) return []
    try {
        return await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 12,
            select: {
                id: true,
                username: true,
                name: true,
                image: true,
                createdAt: true,
                _count: {
                    select: { followers: true, following: true, mediaItems: true }
                }
            }
        })
    } catch {
        return []
    }
}

export default async function GlobalSearchPage({ searchParams }: { searchParams: { q?: string } }) {
    const query = searchParams.q || ''

    const [tmdbData, users] = await Promise.all([
        searchTMDB(query),
        searchUsers(query)
    ])

    const { media, people } = tmdbData

    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center gap-3 mb-10 border-b border-border pb-6">
                    <Search className="text-accent-cyan" size={28} />
                    <h1 className="text-3xl font-display font-bold text-text-primary">
                        Search Results for <span className="text-accent-cyan">&quot;{query}&quot;</span>
                    </h1>
                </div>

                {!query && (
                    <div className="text-center py-20 text-text-secondary">
                        <Compass className="mx-auto mb-4 opacity-50" size={48} />
                        <p className="text-lg">Type something in the navigation bar to start searching globally.</p>
                    </div>
                )}

                {query && users.length === 0 && media.length === 0 && people.length === 0 && (
                    <div className="text-center py-20 text-text-secondary">
                        <p className="text-lg">No results found across TMDB and User Profiles.</p>
                    </div>
                )}

                <div className="space-y-16">
                    {/* User Profiles */}
                    {users.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <UserIcon size={22} className="text-accent-purple" />
                                Community Profiles
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {users.map((u: any) => (
                                    <Link key={u.id} href={`/user/${u.username}`} className="glass-card p-5 rounded-2xl border border-border hover:border-accent-purple transition-all group flex items-start gap-4">
                                        {u.image ? (
                                            <img src={u.image} alt={u.username} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                                                {u.name?.[0]?.toUpperCase() || u.username[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-bold text-text-primary truncate">{u.name || u.username}</p>
                                            <p className="text-xs text-text-muted mb-2">@{u.username}</p>
                                            <div className="flex gap-2 text-[10px] text-text-secondary">
                                                <span>{u._count.mediaItems} Library</span>
                                                <span>•</span>
                                                <span>{u._count.followers} Followers</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Media Items */}
                    {media.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <Film size={22} className="text-accent-cyan" />
                                Movies & TV Shows
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {media.map((m: any) => {
                                    const title = m.title || m.name
                                    const poster = m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null
                                    const year = (m.release_date || m.first_air_date || '').split('-')[0]
                                    const type = m.media_type === 'tv' ? 'tv' : 'movie'

                                    return (
                                        <Link key={m.id} href={`/media/${m.id}?type=${type}`} className="group flex flex-col">
                                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-border bg-bg-secondary shadow-card">
                                                {poster ? (
                                                    <img src={poster} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-text-muted text-xs p-2 text-center">{title}</div>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-sm text-text-primary truncate group-hover:text-accent-cyan transition-colors">{title}</h3>
                                            <div className="flex justify-between items-center mt-1 text-xs text-text-muted">
                                                <span className="capitalize">{type === 'tv' ? 'TV Show' : 'Movie'}</span>
                                                <span>{year}</span>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {/* People */}
                    {people.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <Users size={22} className="text-[#ff3264]" />
                                Cast & Crew
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {people.map((p: any) => {
                                    const name = p.name
                                    const photo = p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : null

                                    return (
                                        <Link key={p.id} href={`/people?search=${encodeURIComponent(name)}`} className="group flex flex-col items-center">
                                            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-3 border-4 border-bg-card shadow-xl bg-bg-secondary group-hover:border-[#ff3264] transition-colors">
                                                {photo ? (
                                                    <img src={photo} alt={name} className="w-full h-full object-cover object-top p-1 rounded-full group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full font-bold text-2xl text-text-muted">{name[0]}</div>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-sm text-text-primary text-center truncate w-full group-hover:text-[#ff3264] transition-colors">{name}</h3>
                                            <span className="text-xs text-text-muted mt-1">{p.known_for_department || 'Actor'}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    )
}
