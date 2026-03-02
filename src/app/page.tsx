import Link from 'next/link'
import { Clapperboard, BarChart3, Clock, Star, ArrowRight, Tv, Film, Gamepad2, Check } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { prisma } from '@/lib/prisma'
import { PosterCard } from '@/components/PosterCard'
import { Navbar } from '@/components/Navbar'

export const revalidate = 3600 // Cache for 1 hour, or make dynamic

import { unstable_cache } from 'next/cache'

const getCachedLandingData = unstable_cache(
    async () => {
        // 1. Fire independent initial queries in parallel
        const [trendingGroups, rawNewest, rawTop] = await Promise.all([
            prisma.mediaItem.groupBy({
                by: ['tmdbId'],
                _count: { tmdbId: true },
                orderBy: { _count: { tmdbId: 'desc' } },
                where: { tmdbId: { not: null } },
                take: 8,
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
            })
        ])

        // 2. Filter newest and top items to get 8 distinct items
        const newestItems: any[] = []
        const seenNew = new Set()
        for (const item of rawNewest) {
            if (!seenNew.has(item.tmdbId)) {
                seenNew.add(item.tmdbId)
                newestItems.push(item)
                if (newestItems.length === 8) break
            }
        }

        const topItems: any[] = []
        const seenTop = new Set()
        for (const item of rawTop) {
            if (!seenTop.has(item.tmdbId)) {
                seenTop.add(item.tmdbId)
                topItems.push(item)
                if (topItems.length === 8) break
            }
        }

        // 3. Fetch trending item details based on the grouped IDs
        const trendingIds = trendingGroups.map(g => g.tmdbId).filter(Boolean) as string[]
        let trendingItems: any[] = []

        if (trendingIds.length > 0) {
            const rawTrending = await prisma.mediaItem.findMany({
                where: { tmdbId: { in: trendingIds } },
                select: { id: true, tmdbId: true, title: true, type: true, posterUrl: true, status: true, totalTimeMinutes: true, userRating: true }
            })

            // Match them back to the ordered IDs, ensuring distinctness
            const seenTrend = new Set()
            for (const id of trendingIds) {
                const item = rawTrending.find(r => r.tmdbId === id && !seenTrend.has(r.tmdbId))
                if (item) {
                    seenTrend.add(item.tmdbId)
                    trendingItems.push(item)
                }
            }
        }

        // 4. Batch fetch average ratings for all displayed items in ONE query
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

            // Manually inject the computed average rating back into the items
            for (const list of [trendingItems, newestItems, topItems]) {
                for (const item of list) {
                    item.userRating = item.tmdbId ? (ratingMap.get(item.tmdbId) || null) : null
                }
            }
        }

        return { trendingItems, newestItems, topItems }
    },
    ['landing-page-data'],
    { revalidate: 3600, tags: ['landing-data'] }
)

export default async function LandingPage() {
    const { trendingItems, newestItems, topItems } = await getCachedLandingData()

    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />


            {/* Hero */}
            <section className="text-center px-6 py-20 max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 border" style={{ background: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                    ✦ Track every hour of your media life
                </div>
                <h1 className="text-5xl sm:text-7xl font-display font-extrabold leading-tight mb-6">
                    <span style={{ background: 'linear-gradient(135deg, #e8edf5 0%, #8899aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your Media.
                    </span>
                    <br />
                    <span style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your Stats.
                    </span>
                </h1>
                <p className="text-lg text-[#8899aa] max-w-2xl mx-auto mb-10 leading-relaxed">
                    Track anime, movies, TV shows, and games in one place. Auto-filled from TMDB. Visualize your lifetime media consumption with beautiful analytics.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Link href="/auth/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
                        Start Tracking Free <ArrowRight size={18} />
                    </Link>
                    <Link href="/auth/login" className="btn-cyber flex items-center gap-2 text-base px-8 py-3.5">
                        Sign In
                    </Link>
                </div>

                {/* Stats preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
                    {[
                        { label: 'Anime', icon: <Tv size={20} />, color: '#ff9500', val: '127 tracked' },
                        { label: 'Movies', icon: <Film size={20} />, color: '#00d4ff', val: '2,400+ titles' },
                        { label: 'Shows', icon: <Tv size={20} />, color: '#a78bfa', val: 'All seasons' },
                        { label: 'Games', icon: <Gamepad2 size={20} />, color: '#00ff9d', val: 'Manual playtime' },
                    ].map(({ label, icon, color, val }) => (
                        <div key={label} className="glass-card p-5 text-center">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                                {icon}
                            </div>
                            <p className="font-display font-semibold text-[#e8edf5] text-sm">{label}</p>
                            <p className="text-xs text-[#8899aa] mt-1">{val}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Media Showcase Sections */}
            <div className="mt-24 space-y-16 max-w-[1400px] mx-auto text-left">
                {/* Trending Section */}
                {trendingItems.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary">Trending Now</h2>
                            <Link href="/explore?sort=trending" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {trendingItems.map(item => (
                                <PosterCard key={`trending-${item.id}`} item={item} href={`/media/${item.id}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Newest Additions Section */}
                {newestItems.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary">Recently Tracked</h2>
                            <Link href="/explore?sort=newest" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {newestItems.map(item => (
                                <PosterCard key={`newest-${item.id}`} item={item} href={`/media/${item.id}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Rated Section */}
                {topItems.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-text-primary">Highest Rated</h2>
                            <Link href="/explore?sort=top" className="text-sm font-medium text-accent-cyan hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {topItems.map(item => (
                                <PosterCard key={`top-${item.id}`} item={item} href={`/media/${item.id}`} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* CTA */}
            <section className="text-center px-6 py-20 border-t border-border mt-12 bg-bg-secondary">
                <div className="max-w-2xl mx-auto glass-card p-12" style={{ boxShadow: '0 0 60px rgba(0,212,255,0.05)' }}>
                    <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">Ready to start tracking?</h2>
                    <p className="text-text-secondary mb-8">Create your free account and track anime, movies, TV shows, and games.</p>
                    <Link href="/auth/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
                        Create Free Account <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#1e2a3a] px-6 py-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Clapperboard size={16} className="text-[#00d4ff]" />
                    <span className="font-display font-semibold text-[#e8edf5]">Themis Media Tracker</span>
                </div>
                <p className="text-xs text-[#4a5568]">Powered by TMDB API. Built for obsessive media consumers.</p>
            </footer>
        </main >
    )
}
