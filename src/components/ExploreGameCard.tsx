'use client'

import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import Link from 'next/link'
import { Gamepad2, Heart } from 'lucide-react'

interface Props {
    id: number
    slug: string
    title: string
    posterUrl: string | null
    releaseYear: number | null
    metacritic: number | null
}

export function ExploreGameCard({ id, slug, title, posterUrl, releaseYear, metacritic }: Props) {
    const { isFavorited, toggleFavorite } = useMediaFavorites()
    const fav = isFavorited(String(id))

    return (
        <Link href={`/games/${slug}`} className="group block">
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-bg-secondary border border-border group-hover:border-[#00ff9d]/50 transition-colors mb-2 relative">
                {posterUrl
                    ? <img src={posterUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="flex items-center justify-center h-full"><Gamepad2 size={24} className="text-text-muted opacity-50" /></div>}

                {metacritic && (
                    <span className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6c3] text-black">{metacritic}</span>
                )}

                {/* Heart */}
                <button
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite({ tmdbId: String(id), title, type: 'GAME', posterUrl, releaseYear })
                    }}
                    className={`absolute top-1.5 left-1.5 p-1.5 rounded-full z-10 transition-all shadow-lg backdrop-blur-sm
                        ${fav ? 'bg-accent-pink/90 text-white' : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100 hover:bg-black/60'}`}
                >
                    <Heart size={13} className={fav ? 'fill-current' : ''} />
                </button>
            </div>
            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-[#00ff9d] transition-colors">{title}</p>
            <p className="text-xs text-text-muted">{releaseYear || '—'}</p>
        </Link>
    )
}
