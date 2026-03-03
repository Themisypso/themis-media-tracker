import { prisma } from '@/lib/prisma'
import { PosterCard } from '@/components/PosterCard'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Film, Tv, Gamepad2, BookOpen, LayoutGrid, Clock, Star, TrendingUp } from 'lucide-react'

// Next.js 13+ Route Segment Config
export const dynamic = 'force-dynamic'

const TABS = [
    { id: 'ALL', label: 'All', icon: <LayoutGrid size={16} /> },
    { id: 'ANIME', label: 'Anime', icon: <Tv size={16} /> },
    { id: 'MOVIE', label: 'Movies', icon: <Film size={16} /> },
    { id: 'TVSHOW', label: 'TV Shows', icon: <Tv size={16} /> },
    { id: 'GAME', label: 'Games', icon: <Gamepad2 size={16} /> },
    { id: 'BOOK', label: 'Books', icon: <BookOpen size={16} /> },
]

const SORTS = [
    { id: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
    { id: 'newest', label: 'Newest', icon: <Clock size={14} /> },
    { id: 'top', label: 'Top Rated', icon: <Star size={14} /> },
]

export default async function ExplorePage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const type = typeof searchParams.type === 'string' ? searchParams.type : 'ALL'
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'trending'

    let items: any[] = []

    if (sort === 'trending') {
        const whereClause: any = { tmdbId: { not: null } }
        if (type !== 'ALL') whereClause.type = type

        const trendingGroups = await prisma.mediaItem.groupBy({
            by: ['tmdbId'],
            _count: { tmdbId: true },
            orderBy: { _count: { tmdbId: 'desc' } },
            where: whereClause,
            take: 48,
        })
        const trendingIds = trendingGroups.map(g => g.tmdbId).filter(Boolean) as string[]
        if (trendingIds.length > 0) {
            const raw = await prisma.mediaItem.findMany({
                where: { tmdbId: { in: trendingIds } }
            })
            for (const id of trendingIds) {
                const item = raw.find(r => r.tmdbId === id)
                if (item) items.push(item)
            }
        }
    } else if (sort === 'newest') {
        const whereClause: any = { tmdbId: { not: null } }
        if (type !== 'ALL') whereClause.type = type

        const raw = await prisma.mediaItem.findMany({
            take: 100,
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        })
        const seen = new Set()
        for (const item of raw) {
            if (!seen.has(item.tmdbId)) {
                seen.add(item.tmdbId)
                items.push(item)
                if (items.length === 48) break
            }
        }
    } else if (sort === 'top') {
        const whereClause: any = { tmdbId: { not: null }, tmdbRating: { not: null } }
        if (type !== 'ALL') whereClause.type = type

        const raw = await prisma.mediaItem.findMany({
            take: 100,
            where: whereClause,
            orderBy: { tmdbRating: 'desc' }
        })
        const seen = new Set()
        for (const item of raw) {
            if (!seen.has(item.tmdbId)) {
                seen.add(item.tmdbId)
                items.push(item)
                if (items.length === 48) break
            }
        }
    }

    return (
        <div className="min-h-screen cyber-bg pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-10">
                <div className="mb-10">
                    <h1 className="text-4xl font-display font-bold text-text-primary mb-3">Explore</h1>
                    <p className="text-text-secondary">Discover trending media, recent additions, and highly rated content tracking across the platform.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    {/* Type Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {TABS.map(tab => {
                            const isActive = type === tab.id
                            return (
                                <Link
                                    key={tab.id}
                                    href={`/explore?type=${tab.id}&sort=${sort}`}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                                        ${isActive
                                            ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                                            : 'bg-bg-card text-text-secondary border border-border hover:border-border-bright hover:text-text-primary'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Sort Pills */}
                    <div className="flex items-center gap-2 bg-bg-card p-1.5 rounded-xl border border-border shrink-0">
                        {SORTS.map(s => {
                            const isActive = sort === s.id
                            return (
                                <Link
                                    key={s.id}
                                    href={`/explore?type=${type}&sort=${s.id}`}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                        ${isActive
                                            ? 'bg-bg-hover text-text-primary border border-border-bright'
                                            : 'text-text-secondary border border-transparent hover:text-text-primary'
                                        }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Results Grid */}
                {items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {items.map(item => (
                            <PosterCard key={item.id} item={item} href={`/media/${item.id}?type=${item.type}`} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center glass-card border border-border rounded-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-bg-hover border border-border flex items-center justify-center mx-auto mb-4 text-text-secondary">
                            <LayoutGrid size={24} />
                        </div>
                        <h3 className="text-xl font-display font-medium text-text-primary mb-2">No results found</h3>
                        <p className="text-text-muted">Try adjusting your filters or checking back later.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
