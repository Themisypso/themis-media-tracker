'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Send, MessageSquare, Heart, Reply, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
    id: string
    content: string
    createdAt: string
    user: { id: string; name: string | null; username: string | null; image: string | null }
    parentId: string | null
    _count?: { likes: number; replies: number }
    likes?: { id: string }[]
    replies?: Comment[]
}

interface Thread {
    id: string
    tmdbId?: string | null
    mediaTitle?: string | null
    mediaPosterUrl?: string | null
    _count?: { comments: number }
    author?: { name: string | null; username: string | null; image: string | null } | null
}

interface MediaDiscussionProps {
    tmdbId: string
    title: string
}

function CommentBubble({
    comment,
    currentUserId,
    threadId,
    onReplyPosted,
    depth = 0
}: {
    comment: Comment
    currentUserId?: string
    threadId: string
    onReplyPosted: (reply: Comment, parentId: string) => void
    depth?: number
}) {
    const [showReplyBox, setShowReplyBox] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [likes, setLikes] = useState(comment._count?.likes || 0)
    const [hasLiked, setHasLiked] = useState((comment.likes?.length ?? 0) > 0)
    const [showReplies, setShowReplies] = useState(depth === 0)

    const handleLike = async () => {
        if (!currentUserId) return
        const prev = hasLiked
        setHasLiked(!hasLiked)
        setLikes(l => hasLiked ? l - 1 : l + 1)
        try {
            await fetch(`/api/discussions/${threadId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: comment.id })
            })
        } catch {
            setHasLiked(prev)
            setLikes(l => !prev ? l - 1 : l + 1)
        }
    }

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!replyContent.trim() || submitting) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/discussions/${threadId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyContent.trim(), parentId: comment.id })
            })
            if (!res.ok) throw new Error()
            const newReply = await res.json()
            onReplyPosted(newReply, comment.id)
            setReplyContent('')
            setShowReplyBox(false)
            setShowReplies(true)
        } catch { }
        setSubmitting(false)
    }

    return (
        <div className={`flex gap-3 group ${depth > 0 ? 'ml-10 mt-3' : ''}`}>
            <Link href={`/user/${comment.user.username}`} className="flex-shrink-0 mt-1">
                {comment.user.image ? (
                    <img src={comment.user.image} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-border group-hover:ring-accent-pink/60 transition-all" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-bold text-text-muted group-hover:ring-2 ring-accent-pink/50 transition-all">
                        {comment.user.name?.[0] || 'U'}
                    </div>
                )}
            </Link>

            <div className="flex-1 min-w-0">
                <div className="bg-bg-secondary/50 p-3.5 rounded-2xl rounded-tl-none border border-border/60 group-hover:border-border transition-colors">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Link href={`/user/${comment.user.username}`} className="font-bold text-xs text-text-primary hover:text-accent-pink transition-colors">
                            {comment.user.name || comment.user.username}
                        </Link>
                        <span className="text-[10px] text-text-muted">•</span>
                        <span className="text-[10px] text-text-muted">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-1 px-1">
                    <button
                        onClick={handleLike}
                        disabled={!currentUserId}
                        className={`flex items-center gap-1.5 text-xs py-1 transition-colors disabled:opacity-40 ${hasLiked ? 'text-accent-pink' : 'text-text-muted hover:text-accent-pink'}`}
                    >
                        <Heart size={13} className={hasLiked ? 'fill-accent-pink' : ''} />
                        {likes > 0 && <span>{likes}</span>}
                    </button>

                    {currentUserId && depth < 2 && (
                        <button
                            onClick={() => setShowReplyBox(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan py-1 transition-colors"
                        >
                            <Reply size={13} />
                            Reply
                        </button>
                    )}

                    {(comment._count?.replies ?? (comment.replies?.length ?? 0)) > 0 && (
                        <button
                            onClick={() => setShowReplies(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary py-1 transition-colors ml-auto"
                        >
                            {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {comment._count?.replies ?? comment.replies?.length} {showReplies ? 'Hide' : 'View'} replies
                        </button>
                    )}
                </div>

                {/* Reply Box */}
                {showReplyBox && (
                    <form onSubmit={handleReply} className="flex gap-2 mt-2 ml-1">
                        <input
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder={`Reply to ${comment.user.name || comment.user.username}…`}
                            className="flex-1 bg-bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-cyan transition-colors"
                            autoFocus
                        />
                        <button type="submit" disabled={!replyContent.trim() || submitting}
                            className="px-3 py-2 bg-accent-cyan text-bg-primary rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        </button>
                    </form>
                )}

                {/* Nested Replies */}
                {showReplies && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-1 space-y-1">
                        {comment.replies.map(reply => (
                            <CommentBubble
                                key={reply.id}
                                comment={reply}
                                currentUserId={currentUserId}
                                threadId={threadId}
                                onReplyPosted={onReplyPosted}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export function MediaDiscussion({ tmdbId, title }: MediaDiscussionProps) {
    const { data: session } = useSession()
    const [thread, setThread] = useState<Thread | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchComments = useCallback(async (cursor?: string) => {
        const url = `/api/discussions/tmdb/${tmdbId}${cursor ? `?cursor=${cursor}` : ''}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        if (cursor) {
            setComments(prev => [...prev, ...data.comments])
        } else {
            setThread(data.thread)
            setComments(data.comments || [])
        }
        setNextCursor(data.nextCursor)
    }, [tmdbId])

    useEffect(() => {
        fetchComments().finally(() => setLoading(false))
    }, [fetchComments])

    const handleLoadMore = async () => {
        if (!nextCursor || loadingMore) return
        setLoadingMore(true)
        await fetchComments(nextCursor)
        setLoadingMore(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || submitting || !session) return

        setSubmitting(true)
        try {
            // Get or create thread via tmdb comment endpoint
            const res = await fetch(`/api/tmdb/discussion/${tmdbId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim() })
            })
            if (!res.ok) throw new Error()
            const newComment = await res.json()
            // Enrich comment shape for rendering
            const enriched: Comment = {
                ...newComment,
                _count: { likes: 0, replies: 0 },
                likes: [],
                replies: []
            }
            setComments(prev => [...prev, enriched])
            setContent('')
        } catch { }
        setSubmitting(false)
    }

    const handleReplyPosted = (reply: Comment, parentId: string) => {
        setComments(prev => prev.map(c => {
            if (c.id === parentId) {
                return { ...c, replies: [...(c.replies || []), reply], _count: { ...c._count, likes: c._count?.likes ?? 0, replies: (c._count?.replies ?? 0) + 1 } }
            }
            return c
        }))
    }

    const threadId = thread?.id || ''

    return (
        <div className="glass-card p-6 md:p-8 rounded-2xl mt-12 bg-bg-card/80 backdrop-blur-xl">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-6 flex items-center gap-3">
                <MessageSquare size={24} className="text-accent-pink" />
                Community Discussion
                <span className="text-sm font-normal text-text-muted">({comments.length}{nextCursor ? '+' : ''})</span>
            </h2>

            {loading ? (
                <div className="space-y-4">
                    <div className="h-16 rounded-xl shimmer"></div>
                    <div className="h-16 rounded-xl shimmer"></div>
                </div>
            ) : (
                <div className="space-y-5 mb-8">
                    {comments.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-border rounded-xl">
                            <p className="text-text-muted italic">No one has started a discussion for {title} yet.</p>
                            <p className="text-xs text-text-secondary mt-1">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <CommentBubble
                                key={comment.id}
                                comment={comment}
                                currentUserId={session?.user?.id}
                                threadId={threadId}
                                onReplyPosted={handleReplyPosted}
                            />
                        ))
                    )}

                    {nextCursor && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="w-full py-3 text-sm text-accent-cyan hover:text-accent-cyan/80 border border-border/50 hover:border-accent-cyan/40 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loadingMore ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : 'Load more comments'}
                        </button>
                    )}
                </div>
            )}

            {session ? (
                <form onSubmit={handleSubmit} className="flex gap-3 relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your thoughts, theories, or reviews…"
                        className="w-full bg-bg-secondary/50 border border-border rounded-xl p-4 pr-14 text-sm resize-none focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition-all h-24"
                        disabled={submitting}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e)
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!content.trim() || submitting}
                        className="absolute right-3 bottom-3 p-2 bg-accent-pink text-white rounded-lg hover:bg-[#ff1a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-pink/20"
                    >
                        <Send size={16} className={submitting ? 'animate-pulse' : ''} />
                    </button>
                </form>
            ) : (
                <div className="bg-bg-secondary/30 border border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-text-secondary">
                        <Link href="/auth/login" className="text-accent-cyan font-bold hover:underline">Log in</Link> to join the discussion.
                    </p>
                </div>
            )}
        </div>
    )
}
