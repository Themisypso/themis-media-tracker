'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Heart, Reply, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface CommentBubbleProps {
    comment: Comment
    currentUserId?: string
    threadId: string
    onReplyPosted: (reply: Comment, parentId: string) => void
    depth?: number
}

export function CommentBubble({ comment, currentUserId, threadId, onReplyPosted, depth = 0 }: CommentBubbleProps) {
    const [showReplyBox, setShowReplyBox] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [likes, setLikes] = useState(comment._count?.likes || 0)
    const [hasLiked, setHasLiked] = useState((comment.likes?.length ?? 0) > 0)
    const [showReplies, setShowReplies] = useState(true)

    const handleLike = async () => {
        if (!currentUserId) return
        const prevLiked = hasLiked
        setHasLiked(!hasLiked)
        setLikes(l => hasLiked ? l - 1 : l + 1)
        try {
            await fetch(`/api/discussions/${threadId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: comment.id })
            })
        } catch {
            setHasLiked(prevLiked)
            setLikes(l => !prevLiked ? l - 1 : l + 1)
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
            onReplyPosted({ ...newReply, _count: { likes: 0 }, likes: [], replies: [] }, comment.id)
            setReplyContent('')
            setShowReplyBox(false)
            setShowReplies(true)
        } catch { }
        setSubmitting(false)
    }

    const replyCount = comment._count?.replies ?? (comment.replies?.length ?? 0)

    return (
        <div className={`flex gap-3 group ${depth > 0 ? 'ml-8 mt-3 border-l border-border/40 pl-4' : ''}`}>
            <Link href={`/user/${comment.user.username}`} className="flex-shrink-0 mt-1">
                {comment.user.image ? (
                    <img
                        src={comment.user.image}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-border group-hover:ring-accent-pink/60 transition-all"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-bold text-text-muted">
                        {comment.user.name?.[0] || 'U'}
                    </div>
                )}
            </Link>

            <div className="flex-1 min-w-0">
                <div className="bg-bg-secondary/50 p-3.5 rounded-2xl rounded-tl-none border border-border/60 group-hover:border-border transition-colors">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Link href={`/user/${comment.user.username}`}
                            className="font-bold text-xs text-text-primary hover:text-accent-pink transition-colors"
                        >
                            {comment.user.name || comment.user.username}
                        </Link>
                        <span className="text-[10px] text-text-muted">•</span>
                        <span className="text-[10px] text-text-muted">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-4 mt-1.5 px-1">
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

                    {replyCount > 0 && (
                        <button
                            onClick={() => setShowReplies(v => !v)}
                            className="ml-auto flex items-center gap-1 text-xs text-text-muted hover:text-text-primary py-1 transition-colors"
                        >
                            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                </div>

                {/* Inline Reply Box */}
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
                            className="p-2 bg-accent-cyan text-bg-primary rounded-xl disabled:opacity-50 transition-opacity"
                        >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        </button>
                    </form>
                )}

                {/* Nested Replies */}
                {showReplies && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-1">
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
