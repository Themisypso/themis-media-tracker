'use client'

import { Film, Star, Clock, Tv, Gamepad2, BookOpen, Heart } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/GlassCard'

import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import { ProgressBar } from './ProgressBar'
import { PosterContextMenu } from './PosterContextMenu'
import { ProgressEditor } from './ProgressEditor'
import { calcProgressFraction } from '@/lib/utils/media'
import { useState } from 'react'
import { X } from 'lucide-react'

interface MediaItem {
    id: string
    title: string
    type: string
    status?: string | null
    posterUrl: string | null
    backdropUrl?: string | null
    userRating?: number | null
    notes?: string | null
    releaseYear: number | null
    tmdbId?: string | null
    rawgId?: number | null
    bookId?: string | null
    totalTimeMinutes?: number | null
    runtime?: number | null
    episodeCount?: number | null
    episodeDuration?: number | null
    playtimeHours?: number | null
    genres: string[]
    overview?: string | null
    tmdbRating?: number | null
    imdbId?: string | null
    // Progress tracking
    progress?: number | null
    pageCount?: number | null
}

type Status = 'WATCHING' | 'COMPLETED' | 'PLANNED' | 'DROPPED'

interface PosterCardProps {
    item: MediaItem
    onClick?: (item: MediaItem) => void
    href?: string
    hideStatus?: boolean
    showContextMenu?: boolean
    currentStatus?: Status | null
    onStatusChange?: (newStatus: Status, newlySavedItem?: any) => void
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    ANIME: { label: 'Anime', icon: <Tv size={11} /> },
    MOVIE: { label: 'Movie', icon: <Film size={11} /> },
    TVSHOW: { label: 'TV Show', icon: <Tv size={11} /> },
    GAME: { label: 'Game', icon: <Gamepad2 size={11} /> },
    BOOK: { label: 'Book', icon: <BookOpen size={11} /> },
}

const PROGRESS_COLORS: Record<string, string> = {
    MOVIE: 'var(--accent-cyan)',
    TVSHOW: 'var(--accent-purple)',
    ANIME: '#ff9500',
    BOOK: '#00ff9d',
    GAME: 'var(--accent-pink)',
}

export function PosterCard({ item, onClick, href, hideStatus, showContextMenu = true, currentStatus, onStatusChange }: PosterCardProps) {
    const type = typeConfig[item.type] || { label: item.type, icon: <Film size={11} /> }
    const { isFavorited, toggleFavorite } = useMediaFavorites()

    const tmdbId = item.tmdbId || item.id
    const fav = isFavorited(tmdbId)

    const [localStatus, setLocalStatus] = useState<string | null>(currentStatus || item.status || null)
    const [progressPopupItem, setProgressPopupItem] = useState<any>(null)

    const activeStatus = localStatus || currentStatus || item.status || null

    const progressFraction = activeStatus === 'WATCHING'
        ? calcProgressFraction({
            type: item.type,
            progress: item.progress,
            runtime: item.runtime,
            episodeCount: item.episodeCount,
            pageCount: item.pageCount,
        })
        : null

    function formatTime(min: number | null | undefined) {
        if (!min) return null
        const h = Math.floor(min / 60)
        const m = min % 60
        return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
    }

    function renderMetric() {
        if (item.type === 'BOOK' && item.pageCount) {
            return (
                <span className="flex items-center gap-0.5 text-[9px] text-text-secondary">
                    <BookOpen size={9} />
                    {item.pageCount} p
                </span>
            )
        }
        if (item.type === 'GAME' && item.playtimeHours) {
            return (
                <span className="flex items-center gap-0.5 text-[9px] text-text-secondary">
                    <Clock size={9} />
                    {item.playtimeHours}h
                </span>
            )
        }
        if (item.totalTimeMinutes) {
            return (
                <span className="flex items-center gap-0.5 text-[9px] text-text-secondary">
                    <Clock size={9} />
                    {formatTime(item.totalTimeMinutes)}
                </span>
            )
        }
        return null
    }

    const cardContent = (
        <GlassCard
            onClick={onClick ? () => onClick(item) : undefined}
            interactive
            className="group border-border hover:border-border-bright cursor-pointer"
        >
            {/* Poster */}
            <div className="relative aspect-[2/3] overflow-hidden bg-bg-secondary rounded-t-xl">
                {item.posterUrl ? (
                    <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-bg-hover border border-border">
                            {type.icon}
                        </div>
                        <p className="text-xs text-text-muted text-center px-2 truncate">{item.title}</p>
                    </div>
                )}

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status badge bottom-right */}
                {!hideStatus && activeStatus && (
                    <span className={`absolute bottom-3 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium status-${activeStatus} z-20 shadow-lg`} style={{ backdropFilter: 'blur(8px)' }}>
                        {activeStatus === 'WATCHING' ? '▶ In Progress' :
                            activeStatus === 'COMPLETED' ? '✓ Done' :
                                activeStatus === 'PLANNED' ? '+ Planned' : '✕ Dropped'}
                    </span>
                )}

                {/* Favorite badge top-left */}
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite({
                            tmdbId: tmdbId as string,
                            title: item.title,
                            type: item.type,
                            posterUrl: item.posterUrl,
                            releaseYear: item.releaseYear
                        })
                    }}
                    className={`absolute top-2 left-2 p-1.5 rounded-full z-10 transition-all duration-300 shadow-lg backdrop-blur-sm
                        ${fav ? 'bg-accent-pink/90 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100'}
                    `}
                    aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart size={14} className={fav ? 'fill-current' : ''} />
                </button>

                {/* Rating badge bottom-left */}
                {item.userRating && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-black/70 text-[#ffd700] z-10">
                        <Star size={9} fill="currentColor" />
                        {item.userRating}
                    </span>
                )}

                {/* Progress bar pinned to bottom of poster — only for WATCHING items with progress */}
                {progressFraction !== null && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                        <ProgressBar
                            fraction={progressFraction}
                            size="sm"
                            color={PROGRESS_COLORS[item.type] ?? 'var(--accent-cyan)'}
                        />
                    </div>
                )}
            </div>

            {/* ⋮ context menu — placed OUTSIDE the overflow-hidden poster div so the dropdown is never clipped */}
            {showContextMenu && (
                <PosterContextMenu
                    item={item}
                    currentStatus={activeStatus as any}
                    onStatusChange={(newStatus: Status, newlySavedItem?: any) => {
                        setLocalStatus(newStatus)
                        if (newStatus === 'WATCHING' && newlySavedItem) {
                            setProgressPopupItem({
                                ...newlySavedItem,
                                tmdbId: newlySavedItem.tmdbId || item.tmdbId || item.id
                            })
                        }
                        onStatusChange?.(newStatus, newlySavedItem)
                    }}
                />
            )}

            {/* Info */}
            <div className="p-2.5">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{item.title}</p>
                <div className="flex items-center justify-between mt-1.5 gap-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 type-${item.type}`}>
                        {type.icon}
                        {type.label}
                    </span>
                    {renderMetric()}
                </div>
            </div>
        </GlassCard>
    )

    const wrappedCard = href ? <Link href={href} className="block">{cardContent}</Link> : cardContent

    return (
        <>
            {wrappedCard}

            {/* In Progress Mini Modal Overlay */}
            {progressPopupItem && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setProgressPopupItem(null)} />

                    {/* Modal Content */}
                    <div className="relative glass-card w-full max-w-sm p-6 rounded-2xl border border-accent-cyan/40 shadow-[0_0_40px_rgba(0,212,255,0.15)] animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => setProgressPopupItem(null)}
                            className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-lg font-display font-bold text-text-primary mb-1 pr-8">
                            {progressPopupItem.title}
                        </h3>
                        <p className="text-xs text-text-secondary mb-6 border-b border-border pb-3">
                            Set your current progress
                        </p>

                        <ProgressEditor
                            item={progressPopupItem}
                            onProgressSaved={() => {
                                setProgressPopupItem(null)
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
