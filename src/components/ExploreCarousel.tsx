'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'

interface MediaItem {
    id: string
    title: string
    type: string
    posterUrl: string | null
    releaseYear: number | null
    tmdbRating?: number | null
}

interface ExploreCarouselProps {
    title: string
    icon: React.ReactNode
    endpoint?: string
    items?: MediaItem[]
    description?: string
}

export function ExploreCarousel({ title, icon, endpoint, items: initialItems, description }: ExploreCarouselProps) {
    const [items, setItems] = useState<MediaItem[]>(initialItems || [])
    const [loading, setLoading] = useState(!initialItems && !!endpoint)

    useEffect(() => {
        if (initialItems) {
            setItems(initialItems)
            setLoading(false)
            return
        }
        if (!endpoint) return

        setLoading(true)
        fetch(endpoint)
            .then(r => r.json())
            .then(data => {
                const results = data.results || data
                if (Array.isArray(results)) setItems(results)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [endpoint, initialItems])

    if (loading) {
        return (
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="shimmer w-8 h-8 rounded-lg" />
                        <div className="shimmer w-48 h-6 rounded" />
                    </div>
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex-shrink-0 w-36 md:w-44 aspect-[2/3] rounded-xl shimmer" />
                    ))}
                </div>
            </div>
        )
    }

    if (items.length === 0) return null

    return (
        <section className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-display text-xl font-bold flex items-center gap-2 text-text-primary">
                        {icon} {title}
                    </h2>
                    {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 -mx-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent snap-x">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/media/${item.id}?type=${item.type.toLowerCase()}`}
                        className="flex-shrink-0 w-36 md:w-44 bg-bg-card rounded-xl overflow-hidden border border-border hover:border-accent-cyan transition-all shadow-card group hover:-translate-y-1 snap-start"
                    >
                        <div className="relative aspect-[2/3] w-full bg-bg-secondary">
                            {item.posterUrl ? (
                                <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center h-full p-4 text-center text-xs text-text-muted">{item.title}</div>
                            )}

                            {item.tmdbRating && (
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                                    <Star size={10} className="fill-yellow-400" />
                                    {item.tmdbRating.toFixed(1)}
                                </div>
                            )}
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

                {/* Final "Explore All" card */}
                <Link
                    href={`/explore?type=${items[0]?.type === 'ANIME' ? 'ANIME' : 'ALL'}`}
                    className="flex-shrink-0 w-36 md:w-44 bg-bg-secondary/30 rounded-xl border border-dashed border-border flex flex-col items-center justify-center group hover:bg-bg-secondary/50 transition-all snap-start"
                >
                    <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ChevronRight className="text-text-muted group-hover:text-accent-cyan" />
                    </div>
                    <span className="text-xs font-bold text-text-muted group-hover:text-text-primary">Explore All</span>
                </Link>
            </div>
        </section>
    )
}
