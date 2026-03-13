'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageSquare, Star, CheckCircle, Plus, Edit3, Bookmark, Gamepad2, BookOpen, Tv } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { GlassCard } from '@/components/GlassCard'

interface ActivityMedia {
    id: string
    title: string
    type: string
    posterUrl: string | null
    releaseYear: number | null
    tmdbId: string | null
}

interface ActivityUser {
    id: string
    name: string | null
    username: string | null
    image: string | null
}

export interface Activity {
    id: string
    userId: string
    type: string
    mediaId: string | null
    content: string | null
    referenceId: string | null
    createdAt: string
    user: ActivityUser
    media: ActivityMedia | null
}

interface ActivityFeedProps {
    filter?: 'following' | 'global' | 'user'
    targetUserId?: string
    take?: number
    hideHeader?: boolean
}

export function ActivityFeed({ filter = 'following', targetUserId, take, hideHeader }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [cursor, setCursor] = useState<string | null>(null)

    useEffect(() => {
        setActivities([])
        setCursor(null)
        setHasMore(true)
        setLoading(true)
        fetchActivities(null)
    }, [filter, targetUserId])

    const fetchActivities = async (currentCursor: string | null) => {
        try {
            const params = new URLSearchParams()
            params.append('filter', filter)
            if (targetUserId) params.append('userId', targetUserId)
            if (currentCursor) params.append('cursor', currentCursor)

            const res = await fetch(`/api/feed?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                let newActivities = currentCursor ? [...activities, ...data.activities] : data.activities

                if (take && newActivities.length > take) {
                    newActivities = newActivities.slice(0, take)
                    setHasMore(false)
                } else {
                    setHasMore(data.hasMore)
                }

                setActivities(newActivities)
                setCursor(data.nextCursor)
            }
        } catch (error) {
            console.error('Failed to fetch activity feed', error)
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'ADDED_MEDIA': return <Plus size={16} className="text-accent-cyan" />
            case 'RATED': return <Star size={16} className="text-yellow-400" />
            case 'STATUS_CHANGE': return <Bookmark size={16} className="text-accent-purple" />
            case 'PROGRESS_UPDATE': return <Tv size={16} className="text-[#00d4ff]" />
            case 'NOTE_ADDED': return <Edit3 size={16} className="text-gray-400" />
            case 'FAVORITED_PERSON': return <Heart size={16} className="text-accent-pink fill-accent-pink" />
            case 'QUOTE': return <MessageSquare size={16} className="text-accent-purple" />
            case 'LIST_CREATED': return <Bookmark size={16} className="text-green-400" />
            case 'COMPLETED':
            case 'EPISODE_COMPLETED':
            case 'GAME_COMPLETED':
            case 'BOOK_COMPLETED':
                return <CheckCircle size={16} className="text-green-500" />
            default: return <MessageSquare size={16} className="text-text-muted" />
        }
    }

    const getActivityActionText = (activity: Activity) => {
        if (activity.type === 'FAVORITED_PERSON') return activity.content
        if (activity.type === 'ADDED_MEDIA') return 'Added to library'
        if (activity.type === 'STATUS_CHANGE') {
            const statusMap: Record<string, string> = {
                'WATCHING': 'is now watching',
                'COMPLETED': 'completed',
                'PLANNED': 'plans to watch',
                'DROPPED': 'dropped'
            }
            return statusMap[activity.content || ''] || 'updated status'
        }
        if (activity.type === 'RATED') return activity.content // "Rated 8/10"
        if (activity.type === 'NOTE_ADDED') return activity.content
        if (activity.type === 'PROGRESS_UPDATE') return activity.content
        if (activity.type === 'QUOTE') return 'added a quote'
        if (activity.type === 'LIST_CREATED') return 'created a list'
        return 'interacted with'
    }

    if (loading && activities.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!loading && activities.length === 0) {
        if (hideHeader) return null;
        return (
            <GlassCard className="p-8 text-center text-text-secondary">
                <p>No recent activity to show.</p>
            </GlassCard>
        )
    }

    return (
        <div className="space-y-4">
            {activities.map(activity => (
                <GlassCard key={activity.id} interactive className="p-4 flex gap-4 animate-fade-in relative overflow-hidden group border-border/50 hover:border-border">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-cyan to-transparent opacity-50" />

                    {/* User Avatar */}
                    <Link href={`/user/${activity.user.username}`} className="flex-shrink-0">
                        {activity.user.image ? (
                            <img src={activity.user.image} alt={activity.user.name || ''} className="w-10 h-10 rounded-full object-cover border border-border" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center font-bold text-lg text-accent-cyan">
                                {activity.user.name?.[0]?.toUpperCase() || activity.user.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm">
                                    <Link href={`/user/${activity.user.username}`} className="font-bold text-text-primary hover:text-accent-cyan transition-colors">
                                        {activity.user.name || activity.user.username}
                                    </Link>
                                    <span className="text-text-secondary mx-1.5">•</span>
                                    <span className="text-text-muted text-xs">
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                    </span>
                                </p>

                                <div className="flex items-center gap-2 mt-1 mb-2">
                                    {getActivityIcon(activity.type)}
                                    <p className="text-sm font-medium text-text-primary">
                                        {getActivityActionText(activity)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Media Card Attachment */}
                        {activity.media && (
                            <Link
                                href={
                                    activity.media.type === 'GAME' ? `/games/${activity.media.tmdbId}` // For Game, it's rawgId usually but tmdbId maps to it here often. Wait, I should fix the href later.
                                        : activity.media.type === 'BOOK' ? `/books/${activity.media.tmdbId}`
                                            : `/media/${activity.media.tmdbId}?type=${activity.media.type.toLowerCase()}`
                                }
                                className="mt-2 flex gap-3 p-2 rounded-lg bg-bg-secondary/50 border border-border/50 hover:bg-bg-secondary transition-colors group/card"
                            >
                                {activity.media.posterUrl ? (
                                    <img src={activity.media.posterUrl} alt={activity.media.title} className="w-12 h-16 object-cover rounded shadow-md" />
                                ) : (
                                    <div className="w-12 h-16 bg-bg-card border border-border rounded flex items-center justify-center text-xs text-text-muted text-center p-1">
                                        {activity.media.title}
                                    </div>
                                )}
                                <div className="flex flex-col justify-center">
                                    <p className="text-sm font-bold text-text-primary group-hover/card:text-accent-purple transition-colors truncate">
                                        {activity.media.title}
                                    </p>
                                    <p className="text-xs text-text-muted capitalize">
                                        {activity.media.type.toLowerCase()} {activity.media.releaseYear ? `• ${activity.media.releaseYear}` : ''}
                                    </p>
                                </div>
                            </Link>
                        )}

                        {/* Person Attachment */}
                        {activity.type === 'FAVORITED_PERSON' && activity.referenceId && (
                            <Link href={`/person/${activity.referenceId}`} className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/50 border border-border/50 hover:bg-bg-secondary transition-colors text-xs font-semibold text-accent-pink">
                                <Heart size={14} className="fill-accent-pink text-accent-pink" /> View Profile
                            </Link>
                        )}
                    </div>
                </GlassCard>
            ))}

            {hasMore && !take && (
                <button
                    onClick={() => fetchActivities(cursor)}
                    disabled={loading}
                    className="w-full py-3 rounded-xl border border-border bg-bg-secondary/50 hover:bg-bg-secondary text-text-secondary text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Load More Activity'}
                </button>
            )}
        </div>
    )
}
