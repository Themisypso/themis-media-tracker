import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { QuoteCard } from '@/components/QuoteCard'
import { MessageSquareQuote, TrendingUp, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default async function QuotesPage({ searchParams }: { searchParams: { filter?: string } }) {
    const session = await getServerSession(authOptions)

    // Page is public, but "friends" filter requires login
    const filter = searchParams.filter || 'trending'

    let whereClause = {}
    let orderByClause: any = { createdAt: 'desc' }

    if (filter === 'friends' && session?.user?.id) {
        const following = await prisma.follows.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true }
        })
        whereClause = { userId: { in: following.map(f => f.followingId) } }
    } else if (filter === 'trending') {
        orderByClause = { likes: { _count: 'desc' } }
    } // 'newest' uses default createdAt desc

    const quotes = await prisma.quote.findMany({
        where: whereClause,
        take: 50,
        orderBy: orderByClause,
        include: {
            user: { select: { name: true, image: true, username: true } },
            media: true,
            _count: { select: { likes: true, comments: true } },
            likes: session?.user?.id ? { where: { userId: session.user.id } } : false
        }
    })

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />

            {/* Subtly glowing minimal background */}
            <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(123, 47, 255, 0.03) 0%, transparent 60%)' }} />

            {/* Hero / Header Area */}
            <div className="border-b border-border/50 bg-bg-card/70 backdrop-blur-xl sticky top-[56px] md:top-[64px] z-30 shadow-sm transition-all">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3 tracking-tight">
                            <MessageSquareQuote size={28} className="text-accent-pink" /> Quote Feed
                        </h1>
                        <p className="text-sm text-text-secondary mt-1 max-w-lg">Discover legendary dialogue and community highlights.</p>
                    </div>

                    {/* Feed Tabs */}
                    <div className="flex bg-bg-secondary p-1 rounded-xl w-max border border-border/50 overflow-x-auto max-w-full snap-x">
                        {session?.user && (
                            <Link href="/quotes?filter=friends" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all snap-start whitespace-nowrap ${filter === 'friends' ? 'bg-bg-primary text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'}`}>
                                <Users size={16} /> Friends
                            </Link>
                        )}
                        <Link href="/quotes?filter=trending" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all snap-start whitespace-nowrap ${filter === 'trending' ? 'bg-bg-primary text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'}`}>
                            <TrendingUp size={16} /> Trending
                        </Link>
                        <Link href="/quotes?filter=newest" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all snap-start whitespace-nowrap ${filter === 'newest' ? 'bg-bg-primary text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'}`}>
                            <Clock size={16} /> Newest
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 relative">

                {/* Masonry Layout */}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {quotes.map((quote, idx) => (
                        <div key={quote.id} className="break-inside-avoid">
                            {/* @ts-ignore */}
                            <QuoteCard quote={quote} currentUserId={session?.user?.id} />
                        </div>
                    ))}
                </div>

                {quotes.length === 0 && (
                    <div className="text-center py-20 text-text-muted bg-bg-card/20 border border-dashed border-border rounded-2xl flex flex-col items-center max-w-lg mx-auto">
                        <MessageSquareQuote size={48} className="mb-4 text-bg-hover" />
                        <h3 className="text-xl font-display font-medium text-text-primary mb-2">No quotes found</h3>
                        <p>No dialogue has been added to this feed yet.</p>
                    </div>
                )}

                {quotes.length > 0 && (
                    <div className="text-center py-12 mt-8 border-t border-border/30">
                        <p className="text-sm text-text-muted">You've reached the end of the feed.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
