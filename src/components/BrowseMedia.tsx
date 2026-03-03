'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PosterCard } from '@/components/PosterCard'
import { Filter, Loader2, Search } from 'lucide-react'

interface BrowseMediaProps {
    type: 'movie' | 'tv'
    title: string
    description: string
    baseFilters?: {
        genres?: string
        withKeywords?: string
        withOriginCountry?: string
    }
}

const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'primary_release_date.desc', label: 'Newest Releases' },
    { value: 'primary_release_date.asc', label: 'Oldest Releases' },
    { value: 'original_title.asc', label: 'Title (A-Z)' },
]

const tvSortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'first_air_date.desc', label: 'Newest Releases' },
    { value: 'first_air_date.asc', label: 'Oldest Releases' },
    { value: 'name.asc', label: 'Title (A-Z)' },
]

const movieGenres = [
    { id: '28', name: '💥 Action' }, { id: '12', name: '🗺️ Adventure' }, { id: '16', name: '🎨 Animation' },
    { id: '35', name: '😂 Comedy' }, { id: '80', name: '🕵️ Crime' }, { id: '99', name: '🌍 Documentary' },
    { id: '18', name: '🎭 Drama' }, { id: '10751', name: '👨‍👩‍👧‍👦 Family' }, { id: '14', name: '🧙‍♂️ Fantasy' },
    { id: '36', name: '📜 History' }, { id: '27', name: '🧟 Horror' }, { id: '10402', name: '🎵 Music' },
    { id: '9648', name: '🔎 Mystery' }, { id: '10749', name: '❤️ Romance' }, { id: '878', name: '🛸 Sci-Fi' },
    { id: '53', name: '🔪 Thriller' }, { id: '10752', name: '🪖 War' }, { id: '37', name: '🤠 Western' }
]

const tvGenres = [
    { id: '10759', name: '💥 Action & Adv' }, { id: '16', name: '🎨 Animation' }, { id: '35', name: '😂 Comedy' },
    { id: '80', name: '🕵️ Crime' }, { id: '99', name: '🌍 Documentary' }, { id: '18', name: '🎭 Drama' },
    { id: '10751', name: '👨‍👩‍👧‍👦 Family' }, { id: '10762', name: '🧸 Kids' }, { id: '9648', name: '🔎 Mystery' },
    { id: '10764', name: '📺 Reality' }, { id: '10765', name: '🛸 Sci-Fi & Fantasy' }, { id: '10768', name: '🪖 War & Politics' }
]

export function BrowseMedia({ type, title, description, baseFilters }: BrowseMediaProps) {
    const [items, setItems] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    // Filters
    const [sortBy, setSortBy] = useState('popularity.desc')
    const [selectedGenre, setSelectedGenre] = useState('')
    const [minRating, setMinRating] = useState('')
    const [startYear, setStartYear] = useState('')
    const [endYear, setEndYear] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const observerReq = useRef<IntersectionObserver | null>(null)
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return
        if (observerReq.current) observerReq.current.disconnect()
        observerReq.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1)
            }
        })
        if (node) observerReq.current.observe(node)
    }, [loading, hasMore])

    const fetchItems = useCallback(async (pageNum: number, reset: boolean = false) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('type', type)
            params.append('page', String(pageNum))
            params.append('sort', sortBy)

            // Build genres: combine user selected with base
            const allGenres = []
            if (baseFilters?.genres) allGenres.push(baseFilters.genres)
            if (selectedGenre) allGenres.push(selectedGenre)
            if (allGenres.length > 0) params.append('genres', allGenres.join(','))

            if (minRating) params.append('minRating', minRating)
            if (startYear) params.append('startYear', startYear)
            if (endYear) params.append('endYear', endYear)

            // Base specific
            if (baseFilters?.withKeywords) params.append('withKeywords', baseFilters.withKeywords)
            if (baseFilters?.withOriginCountry) params.append('withOriginCountry', baseFilters.withOriginCountry)

            if (searchTerm) params.append('query', searchTerm)

            const res = await fetch(`/api/tmdb/discover?${params.toString()}`)
            if (!res.ok) throw new Error('Fetch failed')

            const data = await res.json()

            setItems(prev => {
                if (reset) return data.results

                // Avoid duplicates
                const newItems = [...prev]
                const prevIds = new Set(newItems.map(i => i.id))
                for (const item of data.results) {
                    if (!prevIds.has(item.id)) {
                        newItems.push(item)
                    }
                }
                return newItems
            })

            setHasMore(pageNum < data.totalPages && pageNum < 50) // TMDB limit
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }, [type, sortBy, selectedGenre, minRating, startYear, endYear, searchTerm, baseFilters])

    // Initial load and filter changes
    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1)
            setHasMore(true)
            fetchItems(1, true)
        }, 300)

        return () => clearTimeout(timeout)
    }, [fetchItems])

    // Pagination load
    useEffect(() => {
        if (page > 1) {
            fetchItems(page, false)
        }
    }, [page, fetchItems])

    const currentSortOptions = type === 'tv' ? tvSortOptions : sortOptions
    const currentGenres = type === 'tv' ? tvGenres : movieGenres

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex flex-col md:flex-row gap-8 items-start">
            {/* Left Sidebar */}
            <div className="w-full md:w-[260px] flex-shrink-0">
                <div className="md:sticky md:top-24 glass-card p-6 rounded-2xl border border-border space-y-6 shadow-xl backdrop-blur-xl bg-opacity-95">
                    <div className="flex items-center gap-2 text-text-primary font-bold text-lg mb-2">
                        <Filter size={18} className="text-accent-cyan" /> Filters
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Search</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder={`Find ${type === 'movie' ? 'movies' : 'series'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2.5 pl-10 pr-3 focus:border-accent-cyan outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2.5 px-3 focus:border-accent-cyan outline-none transition-colors"
                        >
                            {currentSortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Genre</label>
                        <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2.5 px-3 focus:border-accent-cyan outline-none transition-colors"
                        >
                            <option value="">All Genres</option>
                            {currentGenres.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Years</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="From"
                                value={startYear}
                                onChange={(e) => setStartYear(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2.5 px-3 focus:border-accent-cyan outline-none transition-colors"
                            />
                            <span className="text-text-muted">-</span>
                            <input
                                type="number"
                                placeholder="To"
                                value={endYear}
                                onChange={(e) => setEndYear(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2.5 px-3 focus:border-accent-cyan outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Min Rating</label>
                        <select
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2.5 px-3 focus:border-accent-cyan outline-none transition-colors"
                        >
                            <option value="">Any</option>
                            <option value="9">9.0+</option>
                            <option value="8">8.0+</option>
                            <option value="7">7.0+</option>
                            <option value="6">6.0+</option>
                            <option value="5">5.0+</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-text-primary mb-2">{title}</h1>
                    <p className="text-text-secondary">{description}</p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-5">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1
                        return (
                            <div key={`${item.id}-${index}`} ref={isLast ? lastElementRef : null}>
                                <PosterCard item={item} href={`/media/${item.id}?type=${item.type}`} hideStatus={true} />
                            </div>
                        )
                    })}
                </div>

                {/* Loading / Empty State */}
                {loading && (
                    <div className="py-12 flex justify-center w-full">
                        <Loader2 size={32} className="text-accent-cyan animate-spin" />
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="py-24 text-center glass-card rounded-2xl border border-border max-w-md mx-auto">
                        <Search size={40} className="text-[#4a5568] mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-[#e8edf5]">No results found</h3>
                        <p className="text-sm text-[#8899aa] mt-2"><p className="text-sm text-[#8899aa] mt-2">
  Try adjusting your filters to find what you&apos;re looking for.
</p>	</p>
                    </div>
                )}

                {!loading && !hasMore && items.length > 0 && (
                    <div className="py-12 text-center text-text-muted text-sm">
                       <p>
 			 You&apos;ve reached the end of the list.
			</p>
                    </div>
                )}
            </div>
        </div>
    )
}
