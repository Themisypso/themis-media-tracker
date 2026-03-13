'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquareQuote, Heart, MessageCircle, Share2, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QuoteCardProps {
    quote: any
    currentUserId?: string
}

export function QuoteCard({ quote, currentUserId }: QuoteCardProps) {
    const [likes, setLikes] = useState(quote._count?.likes || 0)
    const [hasLiked, setHasLiked] = useState(quote.likes?.length > 0 || false)
    const [isLiking, setIsLiking] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!currentUserId || isLiking) return

        setIsLiking(true)
        const previousLiked = hasLiked
        const previousLikes = likes

        // Optimistic update
        setHasLiked(!hasLiked)
        setLikes(hasLiked ? likes - 1 : likes + 1)

        try {
            const res = await fetch(`/api/quotes/${quote.id}/like`, { method: 'POST' })
            if (!res.ok) throw new Error()
            if (typeof window !== 'undefined') window.location.reload()
        } catch {
            // Revert
            setHasLiked(previousLiked)
            setLikes(previousLikes)
        }
        setIsLiking(false)
    }

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault()
        navigator.clipboard.writeText(`${window.location.origin}/quotes/${quote.id}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Determine correct link based on media type
    const mediaHref = () => {
        if (quote.media.type === 'GAME') return quote.media.rawgId ? `/games/${quote.media.rawgId}` : '/games'
        if (quote.media.type === 'BOOK') return quote.media.bookId ? `/books/${quote.media.bookId}` : '/books'
        const tmdbType = quote.media.type === 'MOVIE' ? 'movie' : 'tv'
        return `/media/${quote.media.tmdbId}?type=${tmdbType}`
    }

    return (
        <div className="relative group rounded-2xl overflow-hidden border border-border/50 bg-bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-accent-pink/50 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_30px_rgba(255,45,122,0.1)]">

            {/* Blurred Backdrop */}
            {quote.media.backdropUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500">
                    <img src={quote.media.backdropUrl} alt="" className="w-full h-full object-cover blur-sm" />
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-card/90 z-[1] pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 p-6 flex flex-col gap-4">

                {/* Header: User Info & Timestamp */}
                <div className="flex items-center justify-between">
                    <Link href={`/user/${quote.user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {quote.user.image ? (
                            <img src={quote.user.image} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-border" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-accent-pink/10 border border-accent-pink/30 flex items-center justify-center text-sm font-bold text-accent-pink uppercase shadow-sm">
                                {quote.user.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm leading-tight hover:underline">{quote.user.name || quote.user.username}</span>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5 font-medium tracking-wide">
                                <span>@{quote.user.username}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Body: Quote Text */}
                <Link href={`/quotes/${quote.id}`} className="block group/text mt-2 mb-2">
                    <p className="text-xl md:text-2xl font-serif italic text-text-primary leading-relaxed break-words">
                        "{quote.content}"
                    </p>
                </Link>

                {/* Attachment (image or video) */}
                {quote.mediaUrl && quote.attachmentType === 'IMAGE' && (
                    <div className="rounded-xl overflow-hidden border border-border/40 mt-1 mb-1">
                        <img
                            src={quote.mediaUrl}
                            alt="Quote attachment"
                            className="w-full max-h-64 object-contain bg-bg-secondary/40"
                        />
                    </div>
                )}
                {quote.mediaUrl && quote.attachmentType === 'VIDEO' && (
                    <div className="rounded-xl overflow-hidden border border-border/40 mt-1 mb-1">
                        <video
                            src={quote.mediaUrl}
                            controls
                            className="w-full max-h-64 bg-bg-secondary/40"
                        />
                    </div>
                )}

                {/* Media Context Ribbon */}
                <Link href={mediaHref()} className="flex items-center gap-3 mt-auto p-2.5 rounded-xl bg-bg-secondary/40 border border-border/30 hover:bg-bg-secondary/80 hover:border-accent-cyan/40 transition-all group/media w-full md:w-max max-w-full backdrop-blur-md">
                    {quote.media.posterUrl ? (
                        <img src={quote.media.posterUrl} alt="" className="w-9 h-14 rounded object-cover shadow-sm shrink-0" />
                    ) : (
                        <div className="w-9 h-14 rounded bg-bg-primary border border-border/50 flex items-center justify-center shrink-0">
                            <span className="text-[8px] text-text-muted">No Img</span>
                        </div>
                    )}
                    <div className="min-w-0 pr-4 flex flex-col justify-center">
                        <p className="font-bold text-sm text-text-primary truncate group-hover/media:text-accent-cyan transition-colors">
                            {quote.media.title}
                        </p>
                        {quote.reference ? (
                            <p className="text-xs text-text-muted truncate mt-1 tracking-wide font-mono bg-bg-primary/50 border border-border/50 px-2 py-0.5 rounded-md inline-block shadow-sm w-max">
                                {quote.reference}
                            </p>
                        ) : (
                            <p className="text-xs text-text-muted truncate mt-1">
                                {quote.media.releaseYear || ''}
                            </p>
                        )}
                    </div>
                </Link>

                {/* Footer Actions */}
                <div className="flex items-center gap-6 mt-1 pt-4 border-t border-border/30">
                    <button
                        onClick={handleLike}
                        disabled={!currentUserId || isLiking}
                        title={!currentUserId ? "Sign in to like" : "Like"}
                        className={`flex items-center gap-2 group/btn p-2 -ml-2 rounded-full transition-colors disabled:opacity-50 ${hasLiked ? 'text-accent-pink' : 'text-text-muted hover:text-accent-pink hover:bg-accent-pink/10'}`}
                    >
                        <Heart size={18} className={`transition-transform group-active/btn:scale-95 ${hasLiked ? 'fill-accent-pink scale-110' : 'group-hover/btn:scale-110'}`} />
                        <span className="text-sm font-medium">{likes}</span>
                    </button>

                    <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2 text-text-muted hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 p-2 rounded-full transition-colors group/btn">
                        <MessageCircle size={18} className="transition-transform group-hover/btn:scale-110 group-active/btn:scale-95" />
                        <span className="text-sm font-medium">{quote._count?.comments || 0}</span>
                    </Link>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-text-muted hover:text-accent-purple hover:bg-accent-purple/10 p-2 rounded-full transition-colors ml-auto group/share"
                        title="Copy link"
                    >
                        {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} className="transition-transform group-hover/share:scale-110 group-active/share:scale-95" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
