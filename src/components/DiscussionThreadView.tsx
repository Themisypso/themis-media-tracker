'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { CommentBubble } from '@/components/CommentBubble'

interface Comment {
    id: string
    content: string
    createdAt: string
    parentId: string | null
    user: { id: string; name: string | null; username: string | null; image: string | null }
    _count?: { likes: number; replies: number }
    likes?: { id: string }[]
    replies?: Comment[]
}

interface Props {
    threadId: string
    initialComments: Comment[]
    currentUserId?: string
    currentUserImage?: string | null
    currentUserName?: string | null
}

export function DiscussionThreadView({ threadId, initialComments, currentUserId, currentUserImage, currentUserName }: Props) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)

    const handleReplyPosted = useCallback((reply: Comment, parentId: string) => {
        setComments(prev => prev.map(c =>
            c.id === parentId
                ? { ...c, replies: [...(c.replies || []), reply], _count: { ...c._count, likes: c._count?.likes ?? 0, replies: (c._count?.replies ?? 0) + 1 } }
                : c
        ))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || submitting) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/discussions/${threadId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim() })
            })
            if (!res.ok) throw new Error()
            const newComment = await res.json()
            setComments(prev => [...prev, { ...newComment, _count: { likes: 0, replies: 0 }, likes: [], replies: [] }])
            setContent('')
        } catch { }
        setSubmitting(false)
    }

    const handleLoadMore = async () => {
        if (!nextCursor || loadingMore) return
        setLoadingMore(true)
        try {
            const res = await fetch(`/api/discussions/${threadId}?cursor=${nextCursor}`)
            if (res.ok) {
                const data = await res.json()
                setComments(prev => [...prev, ...data.comments])
                setNextCursor(data.nextCursor)
            }
        } catch { }
        setLoadingMore(false)
    }

    return (
        <div className="space-y-5">
            {/* Comments List */}
            {comments.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-border rounded-2xl text-text-muted">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                </div>
            ) : (
                comments.map(comment => (
                    <CommentBubble
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId}
                        threadId={threadId}
                        onReplyPosted={handleReplyPosted}
                    />
                ))
            )}

            {nextCursor && (
                <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 text-sm text-accent-cyan hover:opacity-80 border border-border/50 hover:border-accent-cyan/40 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loadingMore ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : 'Load more'}
                </button>
            )}

            {/* Comment Form */}
            <div className="glass-card p-5 rounded-2xl mt-6 bg-bg-card/80 backdrop-blur-xl">
                {session ? (
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        {currentUserImage ? (
                            <img src={currentUserImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 border border-border" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center text-sm font-bold text-accent-purple shrink-0 mt-0.5">
                                {currentUserName?.[0] || session.user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex-1 relative">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Share your thoughts…"
                                className="w-full bg-bg-secondary/50 border border-border rounded-xl p-3.5 pr-12 text-sm resize-none focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition-all h-20"
                                disabled={submitting}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
                                }}
                            />
                            <button type="submit" disabled={!content.trim() || submitting}
                                className="absolute right-3 bottom-3 p-1.5 bg-accent-pink text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <Send size={14} className={submitting ? 'animate-pulse' : ''} />
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="text-sm text-center text-text-secondary">
                        <Link href="/auth/login" className="text-accent-cyan font-bold hover:underline">Log in</Link> to join the discussion.
                    </p>
                )}
            </div>
        </div>
    )
}
