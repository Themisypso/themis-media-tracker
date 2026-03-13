import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { MessageSquare, Users, TrendingUp, Clock, Film, Tv, Gamepad2, BookOpen, Clapperboard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const revalidate = 30

async function getDiscussions(sort: string) {
    try {
        const orderBy: any = sort === 'trending'
            ? { comments: { _count: 'desc' } }
            : { updatedAt: 'desc' }

        return await prisma.discussionThread.findMany({
            take: 30,
            orderBy,
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { comments: true } },
                comments: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true, user: { select: { username: true } } }
                }
            }
        })
    } catch {
        return []
    }
}

const MEDIA_TYPE_ICONS: Record<string, any> = {
    MOVIE: Film,
    TVSHOW: Tv,
    ANIME: Clapperboard,
    GAME: Gamepad2,
    BOOK: BookOpen
}

export default async function DiscussionsPage({
    searchParams
}: {
    searchParams: { sort?: string }
}) {
    const session = await getServerSession(authOptions)
    const sort = searchParams.sort || 'trending'
    const discussions = await getDiscussions(sort)

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.03) 0%, transparent 60%)' }} />

            {/* Sticky Header */}
            <div className="border-b border-border/50 bg-bg-card/70 backdrop-blur-xl sticky top-[56px] md:top-[64px] z-30 shadow-sm">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
                            <MessageSquare size={28} className="text-accent-cyan" />
                            Community Discussions
                        </h1>
                        <p className="text-sm text-text-secondary mt-1">Join conversations about your favorite media.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sort Tabs */}
                        <div className="flex bg-bg-secondary p-1 rounded-xl border border-border/50 overflow-x-auto">
                            <Link href="/discussions?sort=trending" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${sort === 'trending' ? 'bg-bg-primary text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'}`}>
                                <TrendingUp size={14} /> Trending
                            </Link>
                            <Link href="/discussions?sort=recent" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${sort === 'recent' ? 'bg-bg-primary text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'}`}>
                                <Clock size={14} /> Recent
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
                {discussions.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-border rounded-2xl text-text-muted">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium text-text-primary mb-1">No discussions yet</p>
                        <p className="text-sm">Discussions start automatically when users comment on a media page.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {discussions.map((thread: any) => {
                            const TypeIcon = thread.mediaType ? MEDIA_TYPE_ICONS[thread.mediaType] : MessageSquare
                            const lastComment = thread.comments?.[0]
                            const linkTarget = thread.tmdbId && thread.mediaType
                                ? `/media/${thread.tmdbId}?type=${thread.mediaType === 'TVSHOW' ? 'tv' : thread.mediaType.toLowerCase()}#discussion`
                                : `/discussions/${thread.id}`

                            return (
                                <Link key={thread.id} href={linkTarget}
                                    className="flex items-stretch gap-4 glass-card p-4 rounded-2xl border border-border/40 hover:border-accent-cyan/40 transition-all group bg-bg-card/40 backdrop-blur-sm hover:bg-bg-card/60"
                                >
                                    {/* Poster thumbnail */}
                                    <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-bg-secondary border border-border/50 flex items-center justify-center">
                                        {thread.mediaPosterUrl ? (
                                            <img src={thread.mediaPosterUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <TypeIcon size={20} className="text-text-muted" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                {thread.mediaTitle && (
                                                    <p className="text-xs text-accent-cyan font-semibold mb-0.5 truncate">{thread.mediaTitle}</p>
                                                )}
                                                <h3 className="font-bold text-text-primary group-hover:text-accent-cyan transition-colors line-clamp-2 leading-snug">
                                                    {thread.title || `Discussion for ${thread.mediaTitle || 'this media'}`}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 text-text-muted">
                                                <MessageSquare size={14} />
                                                <span className="text-sm font-medium">{thread._count.comments}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                            {thread.author && (
                                                <span className="flex items-center gap-1.5">
                                                    {thread.author.image ? (
                                                        <img src={thread.author.image} alt="" className="w-4 h-4 rounded-full" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full bg-bg-secondary" />
                                                    )}
                                                    {thread.author.username}
                                                </span>
                                            )}
                                            {lastComment && (
                                                <>
                                                    <span>•</span>
                                                    <span>Last reply {formatDistanceToNow(new Date(lastComment.createdAt), { addSuffix: true })}</span>
                                                </>
                                            )}
                                            <span className="ml-auto">
                                                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
