'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PosterCard } from '@/components/PosterCard'
import { Filter, Loader2, Search, X } from 'lucide-react'

interface BrowseMediaProps {
    type: 'movie' | 'tv'
    title: string
    description: string
    baseFilters?: {
        genres?: string
        withKeywords?: string
        withoutKeywords?: string
        withOriginCountry?: string
    }
}

const movieSortOptions = [
    { value: 'popularity.desc', label: '🔥 Most Popular' },
    { value: 'vote_average.desc', label: '⭐ Highest Rated' },
    { value: 'vote_count.desc', label: '📊 Most Voted' },
    { value: 'revenue.desc', label: '💰 Box Office' },
    { value: 'primary_release_date.desc', label: '🆕 Newest' },
    { value: 'primary_release_date.asc', label: '📜 Oldest' },
    { value: 'original_title.asc', label: '🔤 Title (A-Z)' },
]

const tvSortOptions = [
    { value: 'popularity.desc', label: '🔥 Most Popular' },
    { value: 'vote_average.desc', label: '⭐ Highest Rated' },
    { value: 'vote_count.desc', label: '📊 Most Voted' },
    { value: 'first_air_date.desc', label: '🆕 Newest' },
    { value: 'first_air_date.asc', label: '📜 Oldest' },
    { value: 'name.asc', label: '🔤 Title (A-Z)' },
]

const movieGenres = [
    { id: '28', name: '💥 Action' }, { id: '12', name: '🗺️ Adventure' }, { id: '16', name: '🎨 Animation' },
    { id: '35', name: '😂 Comedy' }, { id: '80', name: '🕵️ Crime' }, { id: '99', name: '🌍 Documentary' },
    { id: '18', name: '🎭 Drama' }, { id: '10751', name: '👨‍👩‍👧‍👦 Family' }, { id: '14', name: '🧙 Fantasy' },
    { id: '36', name: '📜 History' }, { id: '27', name: '🧟 Horror' }, { id: '10402', name: '🎵 Music' },
    { id: '9648', name: '🔎 Mystery' }, { id: '10749', name: '❤️ Romance' }, { id: '878', name: '🛸 Sci-Fi' },
    { id: '53', name: '🔪 Thriller' }, { id: '10752', name: '🪖 War' }, { id: '37', name: '🤠 Western' },
]

const tvGenres = [
    { id: '10759', name: '💥 Action & Adv' }, { id: '16', name: '🎨 Animation' }, { id: '35', name: '😂 Comedy' },
    { id: '80', name: '🕵️ Crime' }, { id: '99', name: '🌍 Documentary' }, { id: '18', name: '🎭 Drama' },
    { id: '10751', name: '👨‍👩‍👧‍👦 Family' }, { id: '10762', name: '🧸 Kids' }, { id: '9648', name: '🔎 Mystery' },
    { id: '10764', name: '📺 Reality' }, { id: '10765', name: '🛸 Sci-Fi & Fantasy' }, { id: '10768', name: '🪖 War & Politics' },
]

const runtimeOptions = [
    { value: '', label: 'Any Runtime' },
    { value: '90', label: '< 90 min' },
    { value: '120', label: '< 2 hours' },
    { value: '180', label: '< 3 hours' },
]

export function BrowseMedia({ type, title, description, baseFilters }: BrowseMediaProps) {
    const [items, setItems] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const [sortBy, setSortBy] = useState('popularity.desc')
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [minRating, setMinRating] = useState('')
    const [maxRuntime, setMaxRuntime] = useState('')
    const [startYear, setStartYear] = useState('')
    const [endYear, setEndYear] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const observerReq = useRef<IntersectionObserver | null>(null)
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return
        if (observerReq.current) observerReq.current.disconnect()
        observerReq.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1)
        })
        if (node) observerReq.current.observe(node)
    }, [loading, hasMore])

    function toggleGenre(id: string) {
        setSelectedGenres(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        )
    }

    function resetFilters() {
        setSelectedGenres([])
        setMinRating('')
        setMaxRuntime('')
        setStartYear('')
        setEndYear('')
        setSearchTerm('')
        setSortBy('popularity.desc')
    }

    const fetchItems = useCallback(async (pageNum: number, reset: boolean = false) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('type', type)
            params.append('page', String(pageNum))
            params.append('sort', sortBy)

            const allGenres = [...(selectedGenres)]
            if (baseFilters?.genres) allGenres.unshift(baseFilters.genres)
            if (allGenres.length > 0) params.append('genres', allGenres.join(','))

            if (minRating) params.append('minRating', minRating)
            if (maxRuntime) params.append('maxRuntime', maxRuntime)
            if (startYear) params.append('startYear', startYear)
            if (endYear) params.append('endYear', endYear)
            if (baseFilters?.withKeywords) params.append('withKeywords', baseFilters.withKeywords)
            if (baseFilters?.withoutKeywords) params.append('withoutKeywords', baseFilters.withoutKeywords)
            if (baseFilters?.withOriginCountry) params.append('withOriginCountry', baseFilters.withOriginCountry)
            if (searchTerm) params.append('query', searchTerm)

            const res = await fetch(`/api/tmdb/discover?${params.toString()}`)
            if (!res.ok) throw new Error('Fetch failed')
            const data = await res.json()

            setItems(prev => {
                if (reset) return data.results
                const prevIds = new Set(prev.map((i: any) => i.id))
                return [...prev, ...data.results.filter((i: any) => !prevIds.has(i.id))]
            })
            setHasMore(pageNum < data.totalPages && pageNum < 50)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }, [type, sortBy, selectedGenres, minRating, maxRuntime, startYear, endYear, searchTerm, baseFilters])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1)
            setHasMore(true)
            fetchItems(1, true)
        }, 300)
        return () => clearTimeout(timeout)
    }, [fetchItems])

    useEffect(() => { if (page > 1) fetchItems(page, false) }, [page, fetchItems])

    const currentSortOptions = type === 'tv' ? tvSortOptions : movieSortOptions
    const currentGenres = type === 'tv' ? tvGenres : movieGenres
    const activeFilterCount = selectedGenres.length + (minRating ? 1 : 0) + (maxRuntime ? 1 : 0) +
        (startYear ? 1 : 0) + (endYear ? 1 : 0)

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex flex-col md:flex-row gap-8 items-start">
            {/* Left Sidebar */}
            <div className="w-full md:w-[260px] flex-shrink-0">
                <div className="md:sticky md:top-24 glass-card p-5 rounded-2xl border border-border space-y-5 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-primary font-bold">
                            <Filter size={16} className="text-accent-cyan" /> Filters
                            {activeFilterCount > 0 && (
                                <span className="text-[10px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded-full font-bold">{activeFilterCount}</span>
                            )}
                        </div>
                        {activeFilterCount > 0 && (
                            <button onClick={resetFilters} className="text-xs text-text-muted hover:text-accent-pink transition-colors flex items-center gap-1">
                                <X size={11} /> Reset
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Search</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input type="text" placeholder={`Find ${type === 'movie' ? 'movies' : 'series'}...`}
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2 pl-9 pr-3 focus:border-accent-cyan outline-none transition-colors" />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Sort By</label>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2 px-3 focus:border-accent-cyan outline-none transition-colors">
                            {currentSortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {/* Multi-select Genres */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">
                            Genre {selectedGenres.length > 0 && <span className="text-accent-cyan">({selectedGenres.length})</span>}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {currentGenres.map(g => {
                                const active = selectedGenres.includes(g.id)
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => toggleGenre(g.id)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${active
                                            ? 'bg-accent-cyan/15 border-accent-cyan/60 text-accent-cyan'
                                            : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
                                            }`}
                                    >
                                        {g.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Year range */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Year Range</label>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder="From" value={startYear} onChange={e => setStartYear(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2 px-3 focus:border-accent-cyan outline-none transition-colors" />
                            <span className="text-text-muted text-xs">–</span>
                            <input type="number" placeholder="To" value={endYear} onChange={e => setEndYear(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2 px-3 focus:border-accent-cyan outline-none transition-colors" />
                        </div>
                    </div>

                    {/* Min Rating */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Min Rating</label>
                        <select value={minRating} onChange={e => setMinRating(e.target.value)}
                            className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2 px-3 focus:border-accent-cyan outline-none transition-colors">
                            <option value="">Any</option>
                            {['9', '8', '7', '6', '5'].map(r => <option key={r} value={r}>{r}.0+</option>)}
                        </select>
                    </div>

                    {/* Max Runtime (movies only) */}
                    {type === 'movie' && (
                        <div className="space-y-1.5">
                            <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Runtime</label>
                            <select value={maxRuntime} onChange={e => setMaxRuntime(e.target.value)}
                                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl py-2 px-3 focus:border-accent-cyan outline-none transition-colors">
                                {runtimeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="mb-6">
                    <h1 className="text-4xl font-display font-bold text-text-primary mb-2">{title}</h1>
                    <p className="text-text-secondary">{description}</p>
                    {selectedGenres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedGenres.map(id => {
                                const g = currentGenres.find(x => x.id === id)
                                return g ? (
                                    <span key={id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/40 text-accent-cyan">
                                        {g.name}
                                        <button onClick={() => toggleGenre(id)} className="hover:text-white transition-colors"><X size={10} /></button>
                                    </span>
                                ) : null
                            })}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-5">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1
                        return (
                            <div key={`${item.id}-${index}`} ref={isLast ? lastElementRef : null}>
                                <PosterCard item={item} href={`/media/${item.id}?type=${item.type}`} hideStatus showContextMenu />
                            </div>
                        )
                    })}
                </div>

                {loading && <div className="py-12 flex justify-center"><Loader2 size={32} className="text-accent-cyan animate-spin" /></div>}

                {!loading && items.length === 0 && (
                    <div className="py-24 text-center glass-card rounded-2xl border border-border max-w-md mx-auto">
                        <Search size={40} className="text-text-muted mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-text-primary">No results found</h3>
                        <p className="text-sm text-text-secondary mt-2">Try adjusting your filters.</p>
                    </div>
                )}

                {!loading && !hasMore && items.length > 0 && (
                    <div className="py-12 text-center text-text-muted text-sm">You&apos;ve reached the end.</div>
                )}
            </div>
        </div>
    )
}
