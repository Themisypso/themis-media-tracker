'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Star } from 'lucide-react'

interface RecItem {
    id: string
    title: string
    type: string
    posterUrl: string | null
    releaseYear: number | null
    rating: number | null
    overview: string | null
}

export function RecommendationsCarousel() {
    const [recs, setRecs] = useState<RecItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/recommendations')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setRecs(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="mb-12">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4 text-text-primary">
                    <Sparkles className="text-accent-pink" /> Recommended For You
                </h2>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex-shrink-0 w-36 md:w-44 aspect-[2/3] rounded-xl shimmer" />
                    ))}
                </div>
            </div>
        )
    }

    if (recs.length === 0) return null

    return (
        <section className="mb-12 animate-fade-in relative z-10 w-full overflow-hidden">
            <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4 text-text-primary">
                <Sparkles className="text-accent-pink" />
                Recommended For You
                <span className="text-xs font-normal text-text-muted bg-bg-secondary px-2 py-0.5 rounded-full border border-border">Based on your favorites</span>
            </h2>

            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 -mx-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent snap-x">
                {recs.map((item) => (
                    <Link
                        key={item.id}
                        href={`/media/${item.id}?type=${item.type.toLowerCase()}`}
                        className="flex-shrink-0 w-36 md:w-44 bg-bg-card rounded-xl overflow-hidden border border-border hover:border-accent-pink transition-all shadow-card group hover:-translate-y-1 snap-start"
                    >
                        <div className="relative aspect-[2/3] w-full bg-bg-secondary">
                            {item.posterUrl ? (
                                <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center h-full p-4 text-center text-xs text-text-muted">{item.title}</div>
                            )}
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <div className="absolute bottom-2 left-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                <p className="text-[10px] text-white line-clamp-2 leading-tight drop-shadow-md">
                                    {item.overview || 'No overview available.'}
                                </p>
                            </div>

                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                                <Star size={10} className="fill-yellow-400" />
                                {item.rating ? item.rating.toFixed(1) : 'NR'}
                            </div>
                        </div>
                        <div className="p-3">
                            <p className="font-bold text-sm text-text-primary truncate" title={item.title}>{item.title}</p>
                            <div className="flex items-center justify-between mt-1 text-[11px] text-text-muted">
                                <p className="capitalize text-accent-cyan font-semibold">{item.type.toLowerCase()}</p>
                                <p>{item.releaseYear}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
