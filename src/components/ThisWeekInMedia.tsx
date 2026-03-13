'use client'

import { useState } from 'react'
import { Film, Tv, Clapperboard, Gamepad2 } from 'lucide-react'
import Link from 'next/link'

interface MediaItem {
    id: string
    tmdbId: string | null
    title: string | null
    type: string
    posterUrl: string | null
}

interface Props {
    movies: MediaItem[]
    tvShows: MediaItem[]
    anime: MediaItem[]
    games: MediaItem[]
}

const TABS = [
    { key: 'movies', label: 'Movies', icon: Film, color: 'text-accent-cyan', active: 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan' },
    { key: 'tvShows', label: 'TV Shows', icon: Tv, color: 'text-accent-purple', active: 'bg-accent-purple/10 border-accent-purple/40 text-accent-purple' },
    { key: 'anime', label: 'Anime', icon: Clapperboard, color: 'text-accent-pink', active: 'bg-accent-pink/10 border-accent-pink/40 text-accent-pink' },
    { key: 'games', label: 'Games', icon: Gamepad2, color: 'text-[#00ff9d]', active: 'bg-[#00ff9d]/10 border-[#00ff9d]/40 text-[#00ff9d]' },
] as const

function mediaHref(item: MediaItem) {
    const typeMap: Record<string, string> = { MOVIE: 'movie', TVSHOW: 'tv', ANIME: 'anime', GAME: 'game', BOOK: 'book' }
    return `/media/${item.tmdbId}?type=${typeMap[item.type] || 'movie'}`
}

export function ThisWeekInMedia({ movies, tvShows, anime, games }: Props) {
    const [activeTab, setActiveTab] = useState<'movies' | 'tvShows' | 'anime' | 'games'>('movies')

    const dataMap = { movies, tvShows, anime, games }
    const items = dataMap[activeTab]

    if (movies.length === 0 && tvShows.length === 0 && anime.length === 0 && games.length === 0) {
        return null
    }

    return (
        <section className="pt-8">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-display font-bold text-text-primary">This Week in Media</h2>
            </div>

            {/* Tab Row */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {TABS.map(({ key, label, icon: Icon, active }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap shrink-0 ${activeTab === key
                                ? active + ' shadow-sm'
                                : 'text-text-muted border-border/40 hover:border-border hover:text-text-secondary bg-transparent'
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {items.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border/50 rounded-2xl text-text-muted text-sm">
                    No {TABS.find(t => t.key === activeTab)?.label} tracked this week yet.
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {items.map(item => (
                        <Link
                            key={item.id}
                            href={mediaHref(item)}
                            className="group relative rounded-xl overflow-hidden border border-border/40 hover:border-accent-cyan/40 transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="aspect-[2/3] bg-bg-secondary">
                                {item.posterUrl ? (
                                    <img
                                        src={item.posterUrl}
                                        alt={item.title || ''}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                                        <Film size={20} />
                                    </div>
                                )}
                                {/* Hover overlay with title */}
                                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-2">{item.title}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}
