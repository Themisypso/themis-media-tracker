'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Filter, Loader2, Search, Gamepad2, Star, Monitor } from 'lucide-react'
import Link from 'next/link'
import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import { PosterContextMenu } from '@/components/PosterContextMenu'

const sortOptions = [
    { value: '-popularity', label: '🔥 Most Popular' },
    { value: '-rating', label: '⭐ Highest Rated' },
    { value: '-metacritic', label: '🏆 Metacritic Score' },
    { value: '-released', label: '🆕 Newest Releases' },
    { value: 'released', label: '📅 Oldest Releases' },
    { value: 'name', label: '🔤 Title (A-Z)' },
    { value: '-name', label: '🔤 Title (Z-A)' },
]

const gameGenres = [
    { id: 'action', name: '💥 Action' },
    { id: 'adventure', name: '🗺️ Adventure' },
    { id: 'rpg', name: '⚔️ RPG' },
    { id: 'shooter', name: '🎯 Shooter' },
    { id: 'strategy', name: '🧠 Strategy' },
    { id: 'simulation', name: '🏙️ Simulation' },
    { id: 'puzzle', name: '🧩 Puzzle' },
    { id: 'sports', name: '⚽ Sports' },
    { id: 'racing', name: '🏎️ Racing' },
    { id: 'fighting', name: '🥊 Fighting' },
    { id: 'horror', name: '😱 Horror' },
    { id: 'platformer', name: '🎮 Platformer' },
    { id: 'indie', name: '💡 Indie' },
    { id: 'casual', name: '☕ Casual' },
    { id: 'arcade', name: '🕹️ Arcade' },
    { id: 'card', name: '🃏 Card' },
]

const platformOptions = [
    { id: '4', name: '🖥️ PC' },
    { id: '187', name: '🎮 PS5' },
    { id: '18', name: '🎮 PS4' },
    { id: '186', name: '🟩 Xbox Series' },
    { id: '1', name: '🟩 Xbox One' },
    { id: '7', name: '🎮 Nintendo Switch' },
    { id: '3', name: '📱 iOS' },
    { id: '21', name: '📱 Android' },
]

interface GameCard {
    id: number
    slug: string
    title: string
    posterUrl: string | null
    releaseYear: number | null
    genres: string[]
    platforms: string[]
    rating: number | null
    metacritic: number | null
    type: string
    tmdbId: null
}

export function BrowseGames() {
    const [items, setItems] = useState<GameCard[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const [sortBy, setSortBy] = useState('-popularity')
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [selectedPlatform, setSelectedPlatform] = useState('')
    const [startYear, setStartYear] = useState('')
    const [endYear, setEndYear] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const searchDebounce = useRef<NodeJS.Timeout>()

    function toggleGenre(id: string) {
        setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
    }

    const { isFavorited, toggleFavorite } = useMediaFavorites()

    const observerRef = useRef<IntersectionObserver | null>(null)
    const lastItemRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return
        if (observerRef.current) observerRef.current.disconnect()
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) setPage(p => p + 1)
        })
        if (node) observerRef.current.observe(node)
    }, [loading, hasMore])

    const fetchGames = useCallback(async (pageNum: number, reset = false) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('page', String(pageNum))
            params.set('sort', sortBy)
            if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','))
            if (selectedPlatform) params.set('platform', selectedPlatform)
            if (startYear) params.set('startYear', startYear)
            if (endYear) params.set('endYear', endYear)
            if (searchTerm) params.set('query', searchTerm)

            const res = await fetch(`/api/rawg/games?${params}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setItems(prev => reset ? data.results : [...prev, ...data.results])
            setHasMore(data.hasMore)
        } catch {
            console.error('[BROWSE_GAMES] Failed to fetch games')
        }
        setLoading(false)
    }, [sortBy, selectedGenres, selectedPlatform, startYear, endYear, searchTerm])

    // Reset on filter change
    useEffect(() => {
        setItems([])
        setPage(1)
        setHasMore(true)
        fetchGames(1, true)
    }, [sortBy, selectedGenres, selectedPlatform, startYear, endYear, searchTerm])

    // Paginate — fetchGames must be in the dep array to avoid stale closures
    useEffect(() => {
        if (page > 1) fetchGames(page, false)
    }, [page, fetchGames])

    function onSearchInput(val: string) {
        clearTimeout(searchDebounce.current)
        searchDebounce.current = setTimeout(() => setSearchTerm(val), 400)
    }

    function resetFilters() {
        setSortBy('-popularity')
        setSelectedGenres([])
        setSelectedPlatform('')
        setStartYear('')
        setEndYear('')
        setSearchTerm('')
    }

    const activeFiltersCount = [selectedPlatform, startYear, endYear].filter(Boolean).length + selectedGenres.length

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
                    <Gamepad2 className="text-[#00ff9d]" size={28} />
                    Discover Games
                </h1>
                <p className="text-text-secondary mt-1">Browse thousands of games powered by RAWG. Filter by genre, platform, and more.</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <aside className={`flex-shrink-0 w-64 transition-all ${sidebarOpen || 'hidden lg:block'}`}>
                    <div className="sticky top-24 space-y-6">
                        {/* Search */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Search size={12} /> Search
                            </h3>
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search games..."
                                    onChange={e => onSearchInput(e.target.value)}
                                    className="input-cyber pl-8 text-sm w-full"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Sort By</h3>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-cyber w-full text-sm">
                                {sortOptions.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Genre — multi-select chips */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                                🎮 Genre {selectedGenres.length > 0 && <span className="text-[#00ff9d]">({selectedGenres.length})</span>}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {gameGenres.map(g => {
                                    const active = selectedGenres.includes(g.id)
                                    return (
                                        <button
                                            key={g.id}
                                            onClick={() => toggleGenre(g.id)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active
                                                ? 'bg-[#00ff9d]/15 border-[#00ff9d]/50 text-[#00ff9d]'
                                                : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'}`}
                                        >{g.name}</button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Platform */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3"><Monitor size={12} className="inline mr-1" />Platform</h3>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setSelectedPlatform('')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${!selectedPlatform
                                        ? 'bg-[#00ff9d]/15 border-[#00ff9d]/50 text-[#00ff9d]'
                                        : 'border-border text-text-secondary hover:border-text-muted'}`}
                                >All</button>
                                {platformOptions.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlatform(selectedPlatform === p.id ? '' : p.id)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${selectedPlatform === p.id
                                            ? 'bg-[#00ff9d]/15 border-[#00ff9d]/50 text-[#00ff9d]'
                                            : 'border-border text-text-secondary hover:border-text-muted'}`}
                                    >{p.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Year Range */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">📅 Release Year</h3>
                            <div className="flex gap-2 items-center">
                                <input type="number" placeholder="From" min="1970" max="2030" value={startYear}
                                    onChange={e => setStartYear(e.target.value)}
                                    className="input-cyber text-sm text-center w-full" />
                                <span className="text-text-muted text-xs">—</span>
                                <input type="number" placeholder="To" min="1970" max="2030" value={endYear}
                                    onChange={e => setEndYear(e.target.value)}
                                    className="input-cyber text-sm text-center w-full" />
                            </div>
                        </div>

                        {activeFiltersCount > 0 && (
                            <button onClick={resetFilters} className="w-full py-2 rounded-lg text-sm text-text-secondary border border-border hover:border-text-muted transition-colors">
                                Reset Filters ({activeFiltersCount})
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Grid */}
                <div className="flex-1 min-w-0">
                    {/* Mobile filter toggle */}
                    <div className="flex items-center justify-between mb-4 lg:hidden">
                        <button onClick={() => setSidebarOpen(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">
                            <Filter size={14} />
                            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {items.map((game, idx) => {
                            const isFav = isFavorited(String(game.id))
                            const isLast = idx === items.length - 1
                            return (
                                <div
                                    key={`${game.id}-${idx}`}
                                    ref={isLast ? lastItemRef : undefined}
                                    className="relative group"
                                >
                                    {/* Poster */}
                                    <Link href={`/games/${game.slug}`} className="block">
                                        <div className="relative aspect-[16/9] rounded-xl bg-bg-secondary border border-border shadow-card mb-2 group-hover:border-[#00ff9d]/40 transition-all z-10 group-hover:z-50">
                                            {game.posterUrl ? (
                                                <img
                                                    src={game.posterUrl}
                                                    alt={game.title}
                                                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full rounded-xl">
                                                    <Gamepad2 size={32} className="text-text-muted opacity-50" />
                                                </div>
                                            )}
                                            {/* Metacritic badge */}
                                            {game.metacritic && (
                                                <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6c3] text-black shadow">
                                                    {game.metacritic}
                                                </div>
                                            )}
                                            {/* ⋮ Context menu */}
                                            <div className="absolute top-0 right-0 z-[60]">
                                                <PosterContextMenu
                                                    item={{
                                                        title: game.title,
                                                        type: 'GAME',
                                                        tmdbId: null,
                                                        rawgId: game.id,
                                                        posterUrl: game.posterUrl ?? null,
                                                        releaseYear: game.releaseYear ?? null,
                                                        genres: game.genres ?? [],
                                                    }}
                                                />
                                            </div>
                                            {/* Favorite heart */}
                                            <button
                                                onClick={e => {
                                                    e.preventDefault()
                                                    toggleFavorite({
                                                        tmdbId: String(game.id),
                                                        title: game.title,
                                                        type: 'GAME',
                                                        posterUrl: game.posterUrl ?? null,
                                                        releaseYear: game.releaseYear ?? null,
                                                    })
                                                }}
                                                className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isFav ? 'opacity-100 bg-[#ff3264]/80' : 'bg-black/50 hover:bg-[#ff3264]/70'}`}
                                            >
                                                <span className="text-xs">{isFav ? '❤️' : '🤍'}</span>
                                            </button>
                                        </div>
                                    </Link>
                                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-[#00ff9d] transition-colors">{game.title}</p>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[11px] text-text-muted">{game.releaseYear || '—'}</span>
                                        {game.rating && (
                                            <span className="text-[11px] text-[#ffd700] flex items-center gap-0.5">
                                                <Star size={10} fill="currentColor" />{game.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    {game.genres.length > 0 && (
                                        <p className="text-[10px] text-text-muted truncate mt-0.5">{game.genres.slice(0, 2).join(' · ')}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {loading && (
                        <div className="py-12 flex justify-center w-full">
                            <Loader2 size={32} className="text-[#00ff9d] animate-spin" />
                        </div>
                    )}

                    {!loading && items.length === 0 && (
                        <div className="py-24 text-center glass-card rounded-2xl border border-border max-w-md mx-auto">
                            <Gamepad2 size={40} className="text-text-muted mx-auto mb-3 opacity-50" />
                            <h3 className="text-xl font-bold text-text-primary">No games found</h3>
                            <p className="text-sm text-text-secondary mt-2">Try adjusting your filters or search term.</p>
                        </div>
                    )}

                    {!loading && !hasMore && items.length > 0 && (
                        <div className="py-12 text-center text-text-muted text-sm">
                            You&apos;ve reached the end of the list.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
