'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Film, Tv, Gamepad2, BookOpen, User } from 'lucide-react'
import Image from 'next/image'

interface SearchResult {
    id: number
    title: string
    mediaType: string
    posterUrl: string | null
    releaseYear: number | null
    tmdbRating: number | null
    overview: string
}

interface SearchBarProps {
    onSelect?: (result: SearchResult) => void
    placeholder?: string
    className?: string
    navigateOnSelect?: boolean
}

const typeIcons: Record<string, React.ReactNode> = {
    movie: <Film size={12} />,
    tv: <Tv size={12} />,
    game: <Gamepad2 size={12} />,
    book: <BookOpen size={12} />,
    person: <User size={12} />
}

const typeLabels: Record<string, string> = {
    movie: 'Movie',
    tv: 'TV Show',
    book: 'Book',
    game: 'Game',
    person: 'Person'
}

export function SearchBar({ onSelect, placeholder = 'Search anime, movies, shows...', className = '', navigateOnSelect = false }: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout>()
    const router = useRouter()

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            setOpen(false)
            return
        }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data.results || [])
                setOpen(true)
            } catch { }
            setLoading(false)
        }, 350)
        return () => clearTimeout(debounceRef.current)
    }, [query])

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function handleSelect(result: SearchResult) {
        if (onSelect) onSelect(result)
        if (navigateOnSelect) {
            if (result.mediaType === 'person') {
                router.push(`/person/${result.id}`)
            } else {
                router.push(`/search?select=${result.id}&type=${result.mediaType}`)
            }
        }
        setOpen(false)
        setQuery('')
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    className="input-cyber pl-9 pr-9"
                    aria-label="Search media"
                    id="global-search"
                />
                {loading && (
                    <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-cyan animate-spin" />
                )}
            </div>

            {open && results.length > 0 && (
                <div className="search-dropdown animate-slide-down">
                    {results.map(result => (
                        <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-bg-hover transition-colors text-left border-b border-border last:border-0"
                        >
                            {result.posterUrl ? (
                                <img src={result.posterUrl} alt={result.title} className="w-10 h-14 object-cover rounded flex-shrink-0" style={{ minWidth: 40 }} />
                            ) : (
                                <div className="w-10 h-14 bg-bg-hover rounded flex-shrink-0 flex items-center justify-center">
                                    <Film size={16} className="text-text-muted" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">{result.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {result.releaseYear && <span className="text-xs text-text-secondary">{result.releaseYear}</span>}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 type-${result.mediaType === 'tv' ? 'TVSHOW' : result.mediaType.toUpperCase()}`}>
                                        {typeIcons[result.mediaType]}
                                        {typeLabels[result.mediaType] || result.mediaType}
                                    </span>
                                    {result.tmdbRating && (
                                        <span className="text-xs text-[#ffd700]">★ {result.tmdbRating}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {open && query.length >= 2 && !loading && results.length === 0 && (
                <div className="search-dropdown p-4 text-center text-sm text-text-secondary">
                    No results found for &ldquo;{query}&rdquo;
                </div>
            )}
        </div>
    )
}
