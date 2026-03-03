'use client'

import { useState, useEffect, useRef } from 'react'
import { Gamepad2, Search, Loader2, Plus, Star, Monitor, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface RawgGame {
    id: number
    slug: string
    title: string
    coverUrl: string | null
    releaseYear: number | null
    genres: string[]
    platforms: string[]
    rating: number | null
    metacritic: number | null
}

export function GameSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<RawgGame[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<RawgGame | null>(null)
    const [adding, setAdding] = useState(false)
    const [status, setStatus] = useState('PLANNED')
    const debounceRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/rawg/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data.results || [])
            } catch {
                toast.error('Failed to search RAWG')
            }
            setLoading(false)
        }, 400)
        return () => clearTimeout(debounceRef.current)
    }, [query])

    async function handleAdd() {
        if (!selected) return
        setAdding(true)
        try {
            const payload = {
                title: selected.title,
                type: 'GAME',
                status,
                rawgId: selected.slug,
                posterUrl: selected.coverUrl,
                genres: selected.genres,
                releaseYear: selected.releaseYear,
                tmdbRating: selected.rating,
            }
            const res = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`"${selected.title}" added to your library!`)
            setSelected(null)
            setQuery('')
            setResults([])
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || 'Failed to add game')
        }
        setAdding(false)
    }

    return (
        <div className="glass-card p-6 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#1e2a3a]">
                <Gamepad2 className="text-[#00ff9d]" size={20} />
                <h2 className="font-display font-semibold text-lg text-[#e8edf5]">RAWG Game Search</h2>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(null) }}
                    placeholder="Search for a game (e.g. Cyberpunk 2077)..."
                    className="input-cyber pl-9 pr-9 w-full"
                    id="rawg-search-input"
                />
                {loading && (
                    <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00ff9d] animate-spin" />
                )}
            </div>

            {/* Results List */}
            {!selected && results.length > 0 && (
                <div className="flex flex-col gap-1 mb-4 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {results.map(game => (
                        <button
                            key={game.id}
                            onClick={() => setSelected(game)}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-bg-secondary hover:bg-bg-hover border border-transparent hover:border-[#00ff9d]/40 transition-all text-left group"
                        >
                            {game.coverUrl ? (
                                <img src={game.coverUrl} alt={game.title} className="w-12 h-9 object-cover rounded-md flex-shrink-0 border border-border" />
                            ) : (
                                <div className="w-12 h-9 rounded-md bg-bg-hover flex items-center justify-center flex-shrink-0">
                                    <Gamepad2 size={14} className="text-text-muted" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate group-hover:text-[#00ff9d] transition-colors">{game.title}</p>
                                <p className="text-[11px] text-text-muted">
                                    {game.releaseYear || '—'} {game.genres.length > 0 && `· ${game.genres.slice(0, 2).join(', ')}`}
                                </p>
                            </div>
                            {game.metacritic && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#6c3] text-black flex-shrink-0">{game.metacritic}</span>
                            )}
                            <ChevronRight size={14} className="text-text-muted group-hover:text-[#00ff9d] transition-colors flex-shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {/* No results */}
            {!loading && query.length >= 2 && results.length === 0 && !selected && (
                <p className="text-sm text-text-secondary text-center py-6">No games found for &ldquo;{query}&rdquo;</p>
            )}

            {/* Empty state */}
            {!query && !selected && (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center py-8">
                    <Gamepad2 size={40} className="mb-4 opacity-40" />
                    <p className="text-sm">Powered by RAWG.io — the world&apos;s largest game database.</p>
                    <p className="text-xs mt-2">Cover art, genres, platforms and ratings auto-imported.</p>
                </div>
            )}

            {/* Selected Game Detail */}
            {selected && (
                <div className="animate-fade-in">
                    <button onClick={() => setSelected(null)} className="text-xs text-text-muted hover:text-text-secondary mb-3 flex items-center gap-1 transition-colors">
                        ← Back to results
                    </button>
                    <div className="flex gap-4 mb-5">
                        {selected.coverUrl && (
                            <img
                                src={selected.coverUrl}
                                alt={selected.title}
                                className="w-32 h-20 object-cover rounded-xl flex-shrink-0 border border-border shadow-card"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold font-display text-[#e8edf5] mb-1">{selected.title}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                                {selected.releaseYear && <span>{selected.releaseYear}</span>}
                                {selected.metacritic && (
                                    <span className="flex items-center gap-1 font-bold text-[#6c3]">
                                        MC: {selected.metacritic}
                                    </span>
                                )}
                                {selected.rating && (
                                    <span className="flex items-center gap-1 text-[#ffd700]">
                                        <Star size={11} fill="currentColor" /> {selected.rating}/10
                                    </span>
                                )}
                            </div>
                            {selected.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selected.genres.slice(0, 4).map(g => (
                                        <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-[#1a2235] text-text-muted border border-border">{g}</span>
                                    ))}
                                </div>
                            )}
                            {selected.platforms.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-text-muted">
                                    <Monitor size={11} />
                                    {selected.platforms.slice(0, 3).join(' · ')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#080c14] p-4 rounded-xl border border-[#1e2a3a]">
                        <label className="block text-xs text-[#8899aa] mb-2 font-medium">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="input-cyber w-full mb-4">
                            <option value="WATCHING">Currently Playing</option>
                            <option value="PLANNED">Plan to Play</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DROPPED">Dropped</option>
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={adding}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Add to Library
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
