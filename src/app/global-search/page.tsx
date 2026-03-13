import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { PosterCard } from '@/components/PosterCard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Search, User as UserIcon, Film, Users, Compass, BookOpen, Gamepad2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function searchGlobalAPI(query: string) {
    if (!query) return []
    // Make sure we use an absolute URL when fetching in Server Components
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    try {
        const res = await fetch(`${baseUrl}/api/tmdb/search?q=${encodeURIComponent(query)}&type=multi`, { next: { revalidate: 300 } })
        if (!res.ok) return []
        const data = await res.json()
        return data.results || []
    } catch (e) {
        console.error('[GlobalSearch Page Fetching Error]', e)
        return []
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

    const [apiResults, users] = await Promise.all([
        searchGlobalAPI(query),
        searchUsers(query)
    ])

    // Bucket the combined API results
    const media = apiResults.filter((r: any) => r.mediaType === 'movie' || r.mediaType === 'tv')
    const people = apiResults.filter((r: any) => r.mediaType === 'person')
    const books = apiResults.filter((r: any) => r.mediaType === 'book')
    const games = apiResults.filter((r: any) => r.mediaType === 'game')

    const hasNoResults = users.length === 0 && apiResults.length === 0

    const session = await getServerSession(authOptions)
    let userStatusMap: Record<string, string> = {}

    if (session?.user?.id && apiResults.length > 0) {
        const queryIds = apiResults.map((r: any) => String(r.id))
        const userItems = await prisma.mediaItem.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    { tmdbId: { in: queryIds } },
                    { rawgId: { in: queryIds } },
                    { bookId: { in: queryIds } }
                ]
            },
            select: { tmdbId: true, rawgId: true, bookId: true, status: true }
        })
        userItems.forEach(item => {
            if (item.tmdbId) userStatusMap[`tmdb_${item.tmdbId}`] = item.status
            if (item.rawgId) userStatusMap[`rawg_${item.rawgId}`] = item.status
            if (item.bookId) userStatusMap[`book_${item.bookId}`] = item.status
        })
    }

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

                {query && hasNoResults && (
                    <div className="text-center py-20 text-text-secondary glass-card border border-border rounded-xl">
                        <p className="text-lg">No results found across Movies, TV, Books, Games, or Users.</p>
                    </div>
                )}

                <div className="space-y-16">
                    {/* User Profiles */}
                    {users.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <UserIcon size={22} className="text-[#a855f7]" />
                                Community Profiles
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {users.map((u) => {
                                    const profileSlug = u.username ?? u.id
                                    const displayName = u.name || u.username || 'Unknown User'
                                    const handleName = u.username ? `@${u.username}` : 'No username set'

                                    return (
                                        <Link key={u.id} href={`/user/${profileSlug}`} className="glass-card p-5 rounded-2xl border border-border hover:border-[#a855f7] transition-all group flex items-start gap-4">
                                            {u.image ? (
                                                <img src={u.image} alt={displayName} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform text-white/50">
                                                    {displayName[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-text-primary truncate">{displayName}</p>
                                                <p className="text-xs text-text-muted mb-2">{handleName}</p>
                                                <div className="flex gap-2 text-[10px] text-text-secondary">
                                                    <span>{u._count.mediaItems} Library</span>
                                                    <span>•</span>
                                                    <span>{u._count.followers} Followers</span>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {/* Media Items (Movies & TV) */}
                    {media.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <Film size={22} className="text-accent-cyan" />
                                Movies &amp; TV Shows
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {media.map((m: any) => (
                                    <PosterCard
                                        key={m.id}
                                        item={{
                                            id: m.id,
                                            tmdbId: m.id,
                                            title: m.title,
                                            type: m.mediaType === 'tv' ? 'TVSHOW' : 'MOVIE',
                                            status: userStatusMap[`tmdb_${m.id}`] || null,
                                            posterUrl: m.posterUrl,
                                            releaseYear: m.releaseYear,
                                            tmdbRating: m.tmdbRating,
                                            genres: []
                                        }}
                                        href={`/media/${m.id}?type=${m.mediaType}`}
                                        hideStatus={true}
                                        showContextMenu={true}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Books */}
                    {books.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <BookOpen size={22} className="text-[var(--accent-pink)]" />
                                Books
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {books.map((b: any) => (
                                    <PosterCard
                                        key={b.id}
                                        item={{
                                            id: b.id,
                                            bookId: b.id,
                                            title: b.title,
                                            type: 'BOOK',
                                            status: userStatusMap[`book_${b.id}`] || null,
                                            posterUrl: b.posterUrl,
                                            releaseYear: b.releaseYear,
                                            tmdbRating: b.tmdbRating,
                                            genres: []
                                        }}
                                        href={`/books/${b.id}`}
                                        hideStatus={true}
                                        showContextMenu={true}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Games */}
                    {games.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <Gamepad2 size={22} className="text-[#00ff9d]" />
                                Games
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {games.map((g: any) => (
                                    <PosterCard
                                        key={g.id}
                                        item={{
                                            id: g.id,
                                            rawgId: parseInt(g.id),
                                            title: g.title,
                                            type: 'GAME',
                                            status: userStatusMap[`rawg_${g.id}`] || null,
                                            posterUrl: g.posterUrl,
                                            releaseYear: g.releaseYear,
                                            tmdbRating: g.tmdbRating,
                                            genres: []
                                        }}
                                        href={`/games/${g.id}`}
                                        hideStatus={true}
                                        showContextMenu={true}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* People */}
                    {people.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold font-display text-text-primary mb-6 flex items-center gap-2">
                                <Users size={22} className="text-[#ff3264]" />
                                Cast &amp; Crew
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {people.map((p: any) => (
                                    <Link key={p.id} href={`/person/${p.id}`} className="group flex flex-col items-center">
                                        <div className="relative w-32 h-32 rounded-full overflow-hidden mb-3 border-4 border-bg-card shadow-xl bg-bg-secondary group-hover:border-[#ff3264] transition-colors">
                                            {p.posterUrl ? (
                                                <img src={p.posterUrl} alt={p.title} className="w-full h-full object-cover object-top p-1 rounded-full group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full font-bold text-2xl text-text-muted text-center">{p.title[0]}</div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-sm text-text-primary text-center truncate w-full group-hover:text-[#ff3264] transition-colors">{p.title}</h3>
                                        <span className="text-xs text-text-muted mt-1 text-center truncate w-full">{p.overview || 'Actor'}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    )
}
