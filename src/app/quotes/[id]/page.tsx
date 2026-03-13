import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { redirect, notFound } from 'next/navigation'
import { QuoteCard } from '@/components/QuoteCard'
import { QuoteCommentForm } from '@/components/QuoteCommentForm'
import Link from 'next/link'

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/auth/login')

    const quote = await prisma.quote.findUnique({
        where: { id: params.id },
        include: {
            user: { select: { name: true, image: true, username: true } },
            media: true,
            _count: { select: { likes: true, comments: true } },
            likes: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true, image: true, name: true } } }
            },
            comments: {
                orderBy: { createdAt: 'asc' },
                include: { user: { select: { username: true, image: true, name: true } } }
            }
        }
    })

    if (!quote) notFound()

    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link href="/quotes" className="text-sm font-medium text-text-muted hover:text-accent-cyan transition-colors mb-6 inline-block">
                    &larr; Back to Quotes
                </Link>

                <div className="mb-8">
                    {/* Reuse the QuoteCard, but maybe we shouldn't nest it if it links to itself. 
                        Wait, QuoteCard links to `/quotes/[id]`, which is this page. 
                        It's fine, we can use it. But let's build a dedicated view here later if needed. */}
                    <QuoteCard quote={quote} currentUserId={session.user.id} />
                </div>

                <div className="glass-card p-6 rounded-2xl">
                    <h2 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
                        Discussion <span className="text-sm font-normal text-text-muted">({quote.comments.length})</span>
                    </h2>

                    <div className="space-y-6 mb-8">
                        {quote.comments.length === 0 ? (
                            <p className="text-text-muted text-sm italic">No comments yet. Be the first to share your thoughts!</p>
                        ) : (
                            quote.comments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-4 group">
                                    <Link href={`/user/${comment.user.username}`} className="flex-shrink-0 mt-1">
                                        {comment.user.image ? (
                                            <img src={comment.user.image} alt="" className="w-10 h-10 rounded-full object-cover border border-border group-hover:border-accent-cyan transition-colors" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center font-bold text-text-muted group-hover:border-accent-cyan transition-colors">
                                                {comment.user.name?.[0] || 'U'}
                                            </div>
                                        )}
                                    </Link>
                                    <div className="flex-1 bg-bg-secondary p-4 rounded-2xl rounded-tl-none border border-border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Link href={`/user/${comment.user.username}`} className="font-bold text-sm text-text-primary hover:text-accent-cyan transition-colors">
                                                {comment.user.name || comment.user.username}
                                            </Link>
                                            <span className="text-xs text-text-muted">@{comment.user.username}</span>
                                            <span className="text-xs text-text-muted ml-auto">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <QuoteCommentForm quoteId={quote.id} />
                </div>
            </main>
        </div>
    )
}
