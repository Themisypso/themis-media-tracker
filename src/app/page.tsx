import Link from 'next/link'
import { Clapperboard, Star, ArrowRight, Tv, Film, Gamepad2, Users, MessageSquareQuote, List as ListIcon, Heart, Layers, MessageSquare, BookOpen } from 'lucide-react'
import { ThisWeekInMedia } from '@/components/ThisWeekInMedia'
import { prisma } from '@/lib/prisma'
import { PosterCard } from '@/components/PosterCard'
import { HomePeopleSection } from '@/components/HomePeopleSection'
import { Navbar } from '@/components/Navbar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActivityFeed } from '@/components/ActivityFeed'
import { unstable_cache } from 'next/cache'

export const revalidate = 60

const EMPTY_DATA = { trendingItems: [], newestItems: [], topItems: [], popularPeople: [], popularQuotes: [], trendingLists: [], trendingDiscussions: [], spotlightUsers: [] }

const getCachedLandingData = unstable_cache(
    async () => {
        try {
            const [trendingGroups, rawNewest, rawTop, popularPeopleRes, rawQuotes, rawLists, rawDiscussions, rawSpotlight] = await Promise.all([
                prisma.mediaItem.groupBy({
                    by: ['tmdbId'],
                    _count: { tmdbId: true },
                    orderBy: { _count: { tmdbId: 'desc' } },
                    where: { tmdbId: { not: null } },
                    take: 10,
                }),
                prisma.mediaItem.findMany({
                    take: 40,
                    where: { tmdbId: { not: null } },
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, tmdbId: true, title: true, type: true, posterUrl: true, status: true, totalTimeMinutes: true }
                }),
                prisma.mediaItem.findMany({
                    take: 40,
                    where: { tmdbId: { not: null }, tmdbRating: { gte: 8 } },
                    orderBy: { tmdbRating: 'desc' },
                    select: { id: true, tmdbId: true, title: true, type: true, posterUrl: true, status: true, totalTimeMinutes: true }
                }),
                fetch(
                    `https://api.themoviedb.org/3/person/popular?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`,
                    { next: { revalidate: 3600 } }
                ).then(r => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),
                prisma.quote.findMany({
                    take: 6,
                    where: { isFeatured: true },
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, name: true, username: true, image: true } }, media: { select: { id: true, title: true, type: true, posterUrl: true, backdropUrl: true, tmdbId: true } } }
                }),
                prisma.list.findMany({
                    take: 6,
                    where: { isPublic: true, isFeatured: true },
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, name: true, username: true, image: true } }, _count: { select: { items: true, likes: true } } }
                }),
                // Hot discussions: top threads by comment count in last 30 days
                prisma.discussionThread.findMany({
                    take: 4,
                    orderBy: { comments: { _count: 'desc' } },
                    include: {
                        _count: { select: { comments: true } },
                        comments: { take: 1, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }
                    }
                }),
                // Spotlight users: most-followed with recent activity
                prisma.user.findMany({
                    take: 6,
                    orderBy: { followers: { _count: 'desc' } },
                    select: {
                        id: true, name: true, username: true, image: true,
                        _count: { select: { followers: true, mediaItems: true } }
                    },
                    where: { username: { not: null } }
                })
            ])

            const newestItems: any[] = []
            const seenNew = new Set()
            for (const item of rawNewest) {
                if (!seenNew.has(item.tmdbId)) {
                    seenNew.add(item.tmdbId)
                    newestItems.push(item)
                    if (newestItems.length === 10) break
                }
            }

            const topItems: any[] = []
            const seenTop = new Set()
            for (const item of rawTop) {
                if (!seenTop.has(item.tmdbId)) {
                    seenTop.add(item.tmdbId)
                    topItems.push(item)
                    if (topItems.length === 10) break
                }
            }

            const trendingIds = trendingGroups.map((g: any) => g.tmdbId).filter(Boolean) as string[]
            let trendingItems: any[] = []

            if (trendingIds.length > 0) {
                const rawTrending = await prisma.mediaItem.findMany({
                    where: { tmdbId: { in: trendingIds } },
                    select: { id: true, tmdbId: true, title: true, type: true, posterUrl: true, status: true, totalTimeMinutes: true, userRating: true }
                })
                const seenTrend = new Set()
                for (const id of trendingIds) {
                    const item = rawTrending.find(r => r.tmdbId === id && !seenTrend.has(r.tmdbId))
                    if (item) {
                        seenTrend.add(item.tmdbId)
                        trendingItems.push(item)
                    }
                }
            }

            const allIds = [
                ...trendingItems.map(i => i.tmdbId),
                ...newestItems.map(i => i.tmdbId),
                ...topItems.map(i => i.tmdbId)
            ].filter(Boolean) as string[]

            if (allIds.length > 0) {
                const ratingAggs = await prisma.mediaItem.groupBy({
                    by: ['tmdbId'],
                    _avg: { userRating: true },
                    where: { tmdbId: { in: allIds }, userRating: { not: null } }
                })
                const ratingMap = new Map(ratingAggs.map(r => [r.tmdbId, r._avg.userRating ? Math.round(r._avg.userRating * 10) / 10 : null]))

                for (const list of [trendingItems, newestItems, topItems]) {
                    for (const item of list) {
                        item.userRating = item.tmdbId ? (ratingMap.get(item.tmdbId) || null) : null
                    }
                }
            }

            const popularPeople = ((popularPeopleRes as any).results || []).slice(0, 12).map((person: any) => ({
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
                    posterUrl: k.poster_path ? `https://image.tmdb.org/t/p/w92${k.poster_path}` : null,
                }))
            }))

            return { trendingItems, newestItems, topItems, popularPeople, popularQuotes: rawQuotes, trendingLists: rawLists, trendingDiscussions: rawDiscussions, spotlightUsers: rawSpotlight }
        } catch (err) {
            console.error('[LandingPage] DB unavailable:', err)
            return EMPTY_DATA
        }
    },
    ['landing-page-data'],
    { revalidate: 60, tags: ['landing-data'] }
)

export default async function LandingPage() {
    const session = await getServerSession(authOptions)
    const { trendingItems, newestItems, topItems, popularPeople, popularQuotes, trendingLists, trendingDiscussions, spotlightUsers } = await getCachedLandingData()

    return (
        <main className="min-h-screen bg-bg-primary">
            <Navbar />

            {/* Subtly glowing minimal background */}
            <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.03) 0%, transparent 60%)' }} />

            {/* Hero Section */}
            <section className="pt-24 pb-16 px-6 sm:px-12 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] mb-6 tracking-tight text-text-primary">
                        Track. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-accent-cyan to-accent-purple">Connect.</span> <br />
                        Discover.
                    </h1>
                    <p className="text-lg sm:text-xl text-text-secondary max-w-xl mb-10 leading-relaxed font-medium">
                        Join a network of obsessive consumers. Track movies, games, and books. Curate custom lists, share iconic quotes, and see what your friends are hooked on right now.
                    </p>
                    <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                        {session ? (
                            <>
                                <Link href="/dashboard" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 rounded-xl group transition-all">
                                    Enter Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/explore" className="btn-cyber text-base px-8 py-3.5 rounded-xl">
                                    Explore Media
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 rounded-xl group transition-all">
                                    Join Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/auth/login" className="btn-cyber text-base px-8 py-3.5 rounded-xl">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Hero Feature Cards (Minimal) */}
                <div className="hidden lg:grid grid-cols-2 gap-4">
                    <div className="glass-card p-6 flex flex-col gap-4 group hover:border-accent-cyan/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan"><Film size={20} /></div>
                        <div><h3 className="font-bold text-text-primary text-lg">Movies & TV</h3><p className="text-sm text-text-secondary">Syncs deeply with TMDB for rich metadata.</p></div>
                    </div>
                    <div className="glass-card p-6 flex flex-col gap-4 group hover:border-accent-pink/50 transition-colors translate-y-6">
                        <div className="w-10 h-10 rounded-lg bg-accent-pink/10 flex items-center justify-center text-accent-pink"><MessageSquareQuote size={20} /></div>
                        <div><h3 className="font-bold text-text-primary text-lg">Social Quotes</h3><p className="text-sm text-text-secondary">Save and interact with legendary dialogue.</p></div>
                    </div>
                    <div className="glass-card p-6 flex flex-col gap-4 group hover:border-accent-purple/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple"><ListIcon size={20} /></div>
                        <div><h3 className="font-bold text-text-primary text-lg">Custom Lists</h3><p className="text-sm text-text-secondary">Curate collections and discover new favorites.</p></div>
                    </div>
                    <div className="glass-card p-6 flex flex-col gap-4 group hover:border-[#00ff9d]/50 transition-colors translate-y-6">
                        <div className="w-10 h-10 rounded-lg bg-[#00ff9d]/10 flex items-center justify-center text-[#00ff9d]"><Gamepad2 size={20} /></div>
                        <div><h3 className="font-bold text-text-primary text-lg">Games & Books</h3><p className="text-sm text-text-secondary">Track your total playtime and reading pages.</p></div>
                    </div>
                </div>
            </section>

            {/* Immediately under hero: Friends Activity Feed (vertical, prominent) */}
            <section className="max-w-[1400px] mx-auto px-6 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-accent-cyan shadow-[0_0_10px_var(--accent-cyan)] animate-pulse" />
                    <h2 className="text-2xl lg:text-3xl font-display font-bold text-text-primary">
                        {session ? 'Friends Activity' : 'Live Community Activity'}
                    </h2>
                </div>
                <div className="bg-bg-secondary/30 rounded-2xl border border-border p-6 shadow-sm max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <ActivityFeed filter={session ? 'following' : 'global'} hideHeader={true} />
                </div>
            </section>

            {/* Horizontal Carousels Area */}
            <div className="max-w-[1400px] mx-auto px-6 py-16 space-y-20">

                {trendingItems.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary">Trending Today</h2>
                            <Link href="/explore?sort=trending" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide items-end" style={{ scrollbarWidth: 'none' }}>
                            {trendingItems.map((item: any, idx: number) => (
                                <div key={`trending-${item.id}`} className={
                                    idx === 0
                                        ? "w-[150px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0 snap-start transition-all"
                                        : "w-[125px] sm:w-[135px] md:w-[150px] lg:w-[170px] shrink-0 snap-start transition-all"
                                }>
                                    <PosterCard item={item} href={`/media/${item.tmdbId}?type=${item.type.toLowerCase()}`} hideStatus />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {newestItems.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary">New Releases & Updates</h2>
                            <Link href="/explore?sort=newest" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide items-end" style={{ scrollbarWidth: 'none' }}>
                            {newestItems.map((item: any, idx: number) => (
                                <div key={`newest-${item.id}`} className={
                                    idx === 0
                                        ? "w-[150px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0 snap-start transition-all"
                                        : "w-[125px] sm:w-[135px] md:w-[150px] lg:w-[170px] shrink-0 snap-start transition-all"
                                }>
                                    <PosterCard item={item} href={`/media/${item.tmdbId}?type=${item.type.toLowerCase()}`} hideStatus />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-display font-bold text-text-primary">Community Favorites</h2>
                        {topItems.length > 0 && (
                            <Link href="/explore?sort=top" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        )}
                    </div>
                    {topItems.length === 0 ? (
                        <div className="text-center py-12 glass-card rounded-2xl border border-border/50 text-text-muted">
                            Community favorites will appear here once users rate media.
                        </div>
                    ) : topItems.length < 5 ? (
                        <div className="flex justify-center gap-4 flex-wrap items-end">
                            {topItems.map((item: any, idx: number) => (
                                <div key={`top-${item.id}`} className={
                                    idx === 0
                                        ? "w-[150px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0 transition-all"
                                        : "w-[125px] sm:w-[135px] md:w-[150px] lg:w-[170px] shrink-0 transition-all"
                                }>
                                    <PosterCard item={item} href={`/media/${item.tmdbId}?type=${item.type.toLowerCase()}`} hideStatus />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide items-end" style={{ scrollbarWidth: 'none' }}>
                            {topItems.map((item: any, idx: number) => (
                                <div key={`top-${item.id}`} className={
                                    idx === 0
                                        ? "w-[150px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0 snap-start transition-all"
                                        : "w-[125px] sm:w-[135px] md:w-[150px] lg:w-[170px] shrink-0 snap-start transition-all"
                                }>
                                    <PosterCard item={item} href={`/media/${item.tmdbId}?type=${item.type.toLowerCase()}`} hideStatus />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Combined Featured Quotes and Lists Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                    {popularQuotes.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                    <MessageSquareQuote size={20} className="text-accent-pink" /> Most Quoted
                                </h3>
                                <Link href="/quotes" className="text-sm font-medium text-accent-cyan hover:underline">View Quotes</Link>
                            </div>
                            <div className="space-y-4">
                                {popularQuotes.map((quote: any) => (
                                    <div key={quote.id} className="glass-card p-5 rounded-xl border-l-[3px] border-l-accent-pink bg-bg-card relative overflow-hidden group">
                                        {quote.media.backdropUrl && (
                                            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none transition-opacity">
                                                <img src={quote.media.backdropUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="relative z-10 flex flex-col h-full">
                                            <p className="text-sm font-medium text-text-primary italic leading-relaxed">"{quote.content}"</p>
                                            <div className="mt-4 flex items-center gap-3">
                                                {quote.media.posterUrl ? (
                                                    <img src={quote.media.posterUrl} alt="" className="w-8 h-12 rounded object-cover shadow-sm" />
                                                ) : (
                                                    <div className="w-8 h-12 rounded bg-bg-secondary" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{quote.media.title}</p>
                                                    <p className="text-xs text-text-muted">by {quote.user.username}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {trendingLists.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                    <ListIcon size={20} className="text-accent-purple" /> Recommended Lists
                                </h3>
                                <Link href="/lists" className="text-sm font-medium text-accent-cyan hover:underline">View Lists</Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {trendingLists.map((list: any) => (
                                    <Link key={list.id} href={`/list/${list.id}`} className="block glass-card p-4 rounded-xl border border-border/50 hover:border-accent-cyan/50 transition-all group bg-bg-card/40 backdrop-blur-sm">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-lg bg-bg-secondary overflow-hidden shrink-0 border border-border select-none">
                                                {list.items?.[0]?.posterUrl ? (
                                                    <img src={list.items[0].posterUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-muted"><Layers size={20} /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-text-primary group-hover:text-accent-cyan transition-colors line-clamp-1">{list.title}</h4>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted font-bold tracking-wider uppercase">
                                                    <span className="flex items-center gap-1 text-accent-pink"><Heart size={12} className="fill-current" /> {list._count?.likes || 0}</span>
                                                    <span>{list._count?.items || 0} Items</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Popular People */}
                {popularPeople.length > 0 && (
                    <section className="pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary">Popular People</h2>
                            <Link href="/people" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <HomePeopleSection people={popularPeople} />
                    </section>
                )}

                {/* Hot Discussions */}
                {trendingDiscussions.length > 0 && (
                    <section className="pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
                                <MessageSquare size={22} className="text-accent-cyan" /> Hot Discussions
                            </h2>
                            <Link href="/discussions" className="text-sm font-medium text-accent-cyan hover:underline">All Discussions</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {trendingDiscussions.map((thread: any) => (
                                <Link
                                    key={thread.id}
                                    href={thread.tmdbId && thread.mediaType
                                        ? `/media/${thread.tmdbId}?type=${thread.mediaType === 'TVSHOW' ? 'tv' : thread.mediaType?.toLowerCase()}#discussion`
                                        : `/discussions/${thread.id}`
                                    }
                                    className="glass-card p-4 rounded-2xl border border-border/40 hover:border-accent-cyan/50 transition-all group bg-bg-card/40 backdrop-blur-sm hover:bg-bg-card/60 flex gap-3"
                                >
                                    {thread.mediaPosterUrl ? (
                                        <img src={thread.mediaPosterUrl} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0 border border-border/50" />
                                    ) : (
                                        <div className="w-10 h-14 rounded-lg bg-bg-secondary border border-border/50 flex items-center justify-center shrink-0">
                                            <MessageSquare size={14} className="text-text-muted" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        {thread.mediaTitle && <p className="text-[10px] text-accent-cyan font-semibold mb-0.5 truncate">{thread.mediaTitle}</p>}
                                        <h4 className="font-bold text-sm text-text-primary group-hover:text-accent-cyan transition-colors line-clamp-2 leading-snug">
                                            {thread.title || `Discussion for ${thread.mediaTitle || 'this media'}`}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-muted">
                                            <MessageSquare size={11} />
                                            <span>{thread._count.comments} comments</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Community Members Spotlight */}
                {spotlightUsers.length > 0 && (
                    <section className="pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
                                <Users size={22} className="text-accent-purple" /> Community Members
                            </h2>
                            <Link href="/people" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {spotlightUsers.map((u: any) => (
                                <Link
                                    key={u.id}
                                    href={`/user/${u.username}`}
                                    className="glass-card p-4 rounded-2xl border border-border/40 hover:border-accent-purple/40 transition-all group bg-bg-card/40 backdrop-blur-sm flex flex-col items-center gap-3 text-center"
                                >
                                    {u.image ? (
                                        <img src={u.image} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-accent-purple/60 transition-colors shadow-md" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-purple/30 to-accent-cyan/30 border-2 border-border group-hover:border-accent-purple/60 transition-colors flex items-center justify-center text-xl font-bold text-accent-purple">
                                            {u.name?.[0] || u.username?.[0] || 'U'}
                                        </div>
                                    )}
                                    <div className="min-w-0 w-full">
                                        <p className="font-bold text-sm text-text-primary group-hover:text-accent-purple transition-colors truncate">{u.name || u.username}</p>
                                        <p className="text-xs text-text-muted truncate">@{u.username}</p>
                                        <div className="flex items-center justify-center gap-2 mt-1.5 text-[10px] text-text-muted">
                                            <span className="flex items-center gap-0.5"><Users size={9} /> {u._count.followers}</span>
                                            <span>•</span>
                                            <span>{u._count.mediaItems} tracked</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* This Week in Media */}
                <ThisWeekInMedia
                    movies={trendingItems.filter((i: any) => i.type === 'MOVIE').slice(0, 8)}
                    tvShows={trendingItems.filter((i: any) => i.type === 'TVSHOW').slice(0, 8)}
                    anime={trendingItems.filter((i: any) => i.type === 'ANIME').slice(0, 8)}
                    games={trendingItems.filter((i: any) => i.type === 'GAME').slice(0, 8)}
                />

                {/* Browse by Category */}
                <section className="pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-display font-bold text-text-primary">Browse by Category</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { label: 'Movies', icon: Film, href: '/explore?type=movie', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10 hover:bg-accent-cyan/20' },
                            { label: 'TV Shows', icon: Tv, href: '/explore?type=tv', color: 'text-accent-purple', bg: 'bg-accent-purple/10 hover:bg-accent-purple/20' },
                            { label: 'Anime', icon: Clapperboard, href: '/explore?type=anime', color: 'text-accent-pink', bg: 'bg-accent-pink/10 hover:bg-accent-pink/20' },
                            { label: 'Games', icon: Gamepad2, href: '/games', color: 'text-[#00ff9d]', bg: 'bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20' },
                            { label: 'Books', icon: BookOpen, href: '/books', color: 'text-[#f5a623]', bg: 'bg-[#f5a623]/10 hover:bg-[#f5a623]/20' },
                        ].map(cat => (
                            <Link key={cat.label} href={cat.href}
                                className={`${cat.bg} border border-border/40 hover:border-transparent rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group`}
                            >
                                <cat.icon size={24} className={cat.color} />
                                <span className={`text-sm font-bold ${cat.color}`}>{cat.label}</span>
                            </Link>
                        ))}
                    </div>
                </section>

            </div>

            {/* Footer teaser */}
            <section className="mt-16 bg-bg-secondary/30 border-t border-border">
                <div className="max-w-[1400px] mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-left">
                        <h3 className="text-3xl font-display font-bold text-text-primary mb-3">Join the community.</h3>
                        <p className="text-text-secondary text-lg">Detailed statistics, cross-platform tracking, and a social experience built just for media drops.</p>
                    </div>
                    <div className="shrink-0">
                        {session ? (
                            <Link href="/dashboard" className="btn-primary px-8 py-4 rounded-xl text-lg font-medium shadow-glow-cyan">Enter Dashboard</Link>
                        ) : (
                            <Link href="/auth/register" className="btn-primary px-8 py-4 rounded-xl text-lg font-medium shadow-glow-cyan">Create Free Account</Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Minimal spacing for the site footer layout (handled in layout.tsx) */}
        </main>
    )
}
