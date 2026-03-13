import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { DiscussionThreadView } from '@/components/DiscussionThreadView'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Film } from 'lucide-react'

export default async function DiscussionThreadPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    const thread = await prisma.discussionThread.findUnique({
        where: { id: params.id },
        include: {
            author: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { comments: true } }
        }
    })

    if (!thread) notFound()

    // Fetch initial comments (SSR)
    const initialComments = await prisma.comment.findMany({
        where: { discussionThreadId: thread.id, parentId: null },
        take: 50,
        orderBy: { createdAt: 'asc' },
        include: {
            user: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { likes: true, replies: true } },
            likes: session?.user?.id ? { where: { userId: session.user.id }, select: { id: true } } : false,
            replies: {
                take: 5,
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { id: true, name: true, username: true, image: true } },
                    _count: { select: { likes: true } },
                    likes: session?.user?.id ? { where: { userId: session.user.id }, select: { id: true } } : false
                }
            }
        }
    })

    const mediaHref = thread.tmdbId && thread.mediaType
        ? `/media/${thread.tmdbId}?type=${thread.mediaType === 'TVSHOW' ? 'tv' : thread.mediaType?.toLowerCase()}`
        : null

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />

            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 md:py-12">
                {/* Back */}
                <Link href="/discussions" className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8">
                    <ArrowLeft size={16} />
                    All Discussions
                </Link>

                {/* Thread Header */}
                <div className="glass-card p-6 rounded-2xl mb-8 bg-bg-card/80 backdrop-blur-xl">
                    <div className="flex gap-4 items-start">
                        {thread.mediaPosterUrl && (
                            <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 border border-border/50 shadow-md">
                                <img src={thread.mediaPosterUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            {thread.mediaTitle && mediaHref && (
                                <Link href={mediaHref} className="text-xs text-accent-cyan font-semibold hover:underline mb-1 block">
                                    ↗ {thread.mediaTitle}
                                </Link>
                            )}
                            <h1 className="text-2xl font-display font-bold text-text-primary leading-tight">
                                {thread.title || `Discussion for ${thread.mediaTitle || 'this media'}`}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                                {thread.author && (
                                    <span className="flex items-center gap-1.5">
                                        {thread.author.image && <img src={thread.author.image} alt="" className="w-4 h-4 rounded-full" />}
                                        Started by <strong className="text-text-primary">@{thread.author.username}</strong>
                                    </span>
                                )}
                                <span>•</span>
                                <span>{thread._count.comments} comments</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interactive Comment Section */}
                <DiscussionThreadView
                    threadId={thread.id}
                    initialComments={initialComments as any}
                    currentUserId={session?.user?.id}
                    currentUserImage={(session?.user as any)?.image}
                    currentUserName={session?.user?.name}
                />
            </div>
        </div>
    )
}
