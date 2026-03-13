'use client'

import Link from 'next/link'
import { Play, BookOpen, Film, Tv, Gamepad2 } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { calcProgressFraction, formatProgressLabel } from '@/lib/utils/media'

interface InProgressItem {
    id: string
    title: string
    type: string
    posterUrl: string | null
    progress: number | null
    pageCount: number | null
    episodeCount: number | null
    runtime: number | null
    lastProgressAt: string | null
    tmdbId?: string | null
    rawgId?: string | null
    bookId?: string | null
}

interface InProgressCardProps {
    item: InProgressItem
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    MOVIE: <Film size={13} />,
    TVSHOW: <Tv size={13} />,
    ANIME: <Tv size={13} />,
    BOOK: <BookOpen size={13} />,
    GAME: <Gamepad2 size={13} />,
}

const TYPE_COLORS: Record<string, string> = {
    MOVIE: 'var(--accent-cyan)',
    TVSHOW: 'var(--accent-purple)',
    ANIME: '#ff9500',
    BOOK: '#00ff9d',
    GAME: 'var(--accent-pink)',
}

function relativeTime(dateStr: string | null): string {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export function InProgressCard({ item }: InProgressCardProps) {
    const fraction = calcProgressFraction(item)
    const label = formatProgressLabel(item)
    const color = TYPE_COLORS[item.type] ?? 'var(--accent-cyan)'

    // Determine the "Continue" link based on media type
    let href = '/library'
    if (item.type === 'GAME' && item.rawgId) {
        href = `/games/${item.rawgId}`
    } else if (item.type === 'BOOK' && item.bookId) {
        href = `/books/${item.bookId}`
    } else if (item.id) {
        href = `/media/${item.id}?type=${item.type}`
    }

    return (
        <div className="glass-card rounded-2xl border border-border hover:border-accent-cyan/50 transition-all group flex gap-4 p-3 min-w-[240px] max-w-[280px] flex-shrink-0">
            {/* Poster thumbnail */}
            <div className="relative w-14 flex-shrink-0 rounded-xl overflow-hidden bg-bg-secondary aspect-[2/3] self-center">
                {item.posterUrl ? (
                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                        {TYPE_ICONS[item.type]}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                        <span className={`text-[9px] flex items-center gap-1 font-medium px-1.5 py-0.5 rounded type-${item.type}`}>
                            {TYPE_ICONS[item.type]} {item.type}
                        </span>
                        {item.lastProgressAt && (
                            <span className="text-[9px] text-text-muted">{relativeTime(item.lastProgressAt)}</span>
                        )}
                    </div>

                    <h4 className="text-xs font-semibold text-text-primary truncate leading-snug mt-1 mb-2">
                        {item.title}
                    </h4>
                </div>

                {/* Progress bar + label */}
                <div className="space-y-1.5">
                    {fraction !== null && (
                        <ProgressBar fraction={fraction} size="md" color={color} />
                    )}
                    {label && (
                        <p className="text-[10px] text-text-secondary font-mono">{label}</p>
                    )}
                </div>

                {/* Continue button */}
                <Link
                    href={href}
                    className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-accent-cyan transition-colors group-hover:text-accent-cyan"
                >
                    <Play size={10} className="fill-current" />
                    Continue
                </Link>
            </div>
        </div>
    )
}
