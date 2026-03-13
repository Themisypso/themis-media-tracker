'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Layers } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ListCardProps {
    list: any
    currentUserId?: string
}

export function ListCard({ list, currentUserId }: ListCardProps) {
    const router = useRouter()
    const [likes, setLikes] = useState(list._count?.likes || 0)
    const [hasLiked, setHasLiked] = useState(list.likes?.length > 0 || false)
    const [isLiking, setIsLiking] = useState(false)

    // Get first 4 items for the collage
    const displayItems = list.items?.slice(0, 4) || []

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
            const res = await fetch(`/api/lists/${list.id}/like`, { method: 'POST' })
            if (!res.ok) throw new Error()
            router.refresh()
        } catch {
            // Revert
            setHasLiked(previousLiked)
            setLikes(previousLikes)
        }
        setIsLiking(false)
    }

    return (
        <div className="group flex flex-col h-full bg-bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden hover:border-accent-cyan/50 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_30px_rgba(0,212,255,0.1)]">
            {/* Stacked Poster Collage */}
            <Link href={`/list/${list.id}`} className="block relative h-[180px] bg-bg-secondary/40 overflow-hidden flex items-end justify-center pb-4 pt-8">
                {displayItems.length > 0 ? (
                    <div className="flex -space-x-12 sm:-space-x-14 md:-space-x-16 lg:-space-x-12 relative z-10 px-4 group-hover:-translate-y-2 transition-transform duration-500">
                        {displayItems.map((item: any, idx: number) => (
                            <div
                                key={item.id || idx}
                                className="relative w-24 sm:w-28 h-36 sm:h-40 rounded-xl overflow-hidden shadow-[4px_4px_15px_rgba(0,0,0,0.3)] border border-border/40 transition-all duration-300 hover:-translate-y-4 hover:rotate-3 hover:!z-50"
                                style={{ zIndex: 10 - idx }}
                            >
                                {item.posterUrl ? (
                                    <img
                                        src={item.posterUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-bg-primary flex items-center justify-center text-text-muted">
                                        <Layers size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted opacity-30 z-10">
                        <Layers size={48} />
                    </div>
                )}

                {/* Overlay count */}
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10 z-20 shadow-sm flex items-center gap-1">
                    <Layers size={12} className="text-accent-cyan" /> {list._count?.items || 0}
                </div>

                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-card to-transparent pointer-events-none z-0" />
            </Link>

            <div className="p-5 flex flex-col flex-1 relative z-10 bg-bg-card">
                <div className="mb-4">
                    <Link href={`/list/${list.id}`} className="block w-max max-w-full">
                        <h3 className="text-lg font-display font-bold text-text-primary group-hover:text-accent-cyan transition-colors line-clamp-1 mb-1.5 focus:outline-none">
                            {list.title}
                        </h3>
                    </Link>
                    <p className="text-sm text-text-secondary line-clamp-2 min-h-[40px] leading-relaxed">
                        {list.description || 'No description provided.'}
                    </p>
                </div>

                <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
                    <Link href={`/user/${list.user.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        {list.user.image ? (
                            <img src={list.user.image} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm border border-border/50" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-accent-cyan/10 flex items-center justify-center text-[10px] font-bold text-accent-cyan uppercase ring-1 ring-accent-cyan/30">
                                {list.user.name?.[0] || 'U'}
                            </div>
                        )}
                        <span className="text-xs font-bold text-text-secondary tracking-wide hover:text-text-primary transition-colors">@{list.user.username}</span>
                    </Link>

                    <button
                        onClick={handleLike}
                        disabled={!currentUserId || isLiking}
                        title={!currentUserId ? "Sign in to like" : "Like"}
                        className={`flex items-center gap-1.5 text-sm font-bold transition-all p-1.5 -mr-1.5 rounded-lg group/btn ${hasLiked ? 'text-accent-pink bg-accent-pink/5' : 'text-text-muted hover:text-accent-pink hover:bg-accent-pink/10'} disabled:opacity-50`}
                    >
                        <Heart size={16} className={`group-active/btn:scale-90 transition-transform ${hasLiked ? 'fill-accent-pink scale-110' : 'group-hover/btn:scale-110'}`} />
                        <span>{likes}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
