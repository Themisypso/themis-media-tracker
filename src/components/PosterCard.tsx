'use client'

import { Film, Star, Clock, Tv, Gamepad2 } from 'lucide-react'

interface MediaItem {
    id: string
    title: string
    type: string
    status: string
    posterUrl: string | null
    backdropUrl: string | null
    userRating: number | null
    notes: string | null
    releaseYear: number | null
    totalTimeMinutes: number | null
    runtime: number | null
    episodeCount: number | null
    episodeDuration: number | null
    playtimeHours: number | null
    genres: string[]
    overview: string | null
    tmdbRating: number | null
    imdbId: string | null
}

interface PosterCardProps {
    item: MediaItem
    onClick: (item: MediaItem) => void
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    ANIME: { label: 'Anime', icon: <Tv size={11} /> },
    MOVIE: { label: 'Movie', icon: <Film size={11} /> },
    TVSHOW: { label: 'TV Show', icon: <Tv size={11} /> },
    GAME: { label: 'Game', icon: <Gamepad2 size={11} /> },
}

export function PosterCard({ item, onClick }: PosterCardProps) {
    const type = typeConfig[item.type] || { label: item.type, icon: <Film size={11} /> }

    function formatTime(min: number | null) {
        if (!min) return null
        const h = Math.floor(min / 60)
        const m = min % 60
        return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
    }

    return (
        <div
            onClick={() => onClick(item)}
            className="group relative cursor-pointer rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#2a3f5a] transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            style={{ background: '#111827' }}
        >
            {/* Poster */}
            <div className="relative aspect-[2/3] overflow-hidden bg-[#0d1117]">
                {item.posterUrl ? (
                    <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff22, #7b2fff22)', border: '1px solid #1e2a3a' }}>
                            {type.icon}
                        </div>
                        <p className="text-xs text-[#4a5568] text-center px-2 truncate">{item.title}</p>
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status badge top-right */}
                <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium status-${item.status}`}>
                    {item.status === 'WATCHING' ? '▶ Watching' :
                        item.status === 'COMPLETED' ? '✓ Done' :
                            item.status === 'PLANNED' ? '+ Planned' : '✕ Dropped'}
                </span>

                {/* Rating badge top-left */}
                {item.userRating && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-black/70 text-[#ffd700]">
                        <Star size={9} fill="currentColor" />
                        {item.userRating}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-2.5">
                <p className="text-xs font-semibold text-[#e8edf5] truncate leading-tight">{item.title}</p>
                <div className="flex items-center justify-between mt-1.5 gap-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 type-${item.type}`}>
                        {type.icon}
                        {type.label}
                    </span>
                    {item.totalTimeMinutes && (
                        <span className="flex items-center gap-0.5 text-[9px] text-[#8899aa]">
                            <Clock size={9} />
                            {formatTime(item.totalTimeMinutes)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
