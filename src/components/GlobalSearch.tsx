'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Suggestion {
    id: string
    title: string
    type: string
    year?: number
    image?: string
}

export function GlobalSearch({ onSelect }: { onSelect?: () => void }) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    // Keyboard shortcut to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || e.key === '/') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault()
                document.getElementById('global-search-input')?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // Debounced fetch
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([])
            setLoading(false)
            return
        }

        const delayFn = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setSuggestions(data.items || [])
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(delayFn)
    }, [query])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            setOpen(false)
            onSelect?.()
            router.push(`/search?q=${encodeURIComponent(query)}`)
            setQuery('')
        }
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <form onSubmit={handleSubmit} className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-cyan transition-colors" size={16} />
                <input
                    id="global-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => {
                        if (query.trim()) setOpen(true)
                    }}
                    placeholder="Search movies, TV shows, anime, games... (Ctrl+K)"
                    className="w-full pl-10 pr-12 py-2.5 bg-bg-secondary/50 border border-border group-focus-within:border-accent-cyan group-focus-within:bg-bg-secondary rounded-full text-sm text-text-primary transition-all outline-none shadow-inner placeholder:text-text-muted/70"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {loading && <Loader2 size={14} className="animate-spin text-accent-cyan" />}
                    <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium text-text-muted bg-bg-primary border border-border rounded">
                        /
                    </kbd>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {open && query.trim() && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-bg-card border border-border rounded-xl shadow-card overflow-hidden z-[100] animate-slide-up origin-top text-left">
                    {suggestions.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto p-2">
                            {suggestions.map((item) => (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={item.type === 'PERSON' ? `/people/${item.id}` : `/${item.type.toLowerCase()}s/${item.id}`}
                                    onClick={() => {
                                        setOpen(false)
                                        setQuery('')
                                        onSelect?.()
                                    }}
                                    className="flex items-center gap-3 p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                                >
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-10 h-14 object-cover rounded bg-bg-primary" />
                                    ) : (
                                        <div className="w-10 h-14 rounded bg-bg-secondary flex items-center justify-center">
                                            <Search size={16} className="text-text-muted" />
                                        </div>
                                    )}
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium text-text-primary truncate">{item.title}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm border type-${item.type}`}>
                                                {item.type}
                                            </span>
                                            {item.year && <span className="text-xs text-text-muted">{item.year}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            <button
                                onClick={handleSubmit}
                                type="button"
                                className="w-full text-center p-2 text-sm text-accent-cyan hover:bg-accent-cyan/10 rounded-lg mt-1 transition-colors"
                            >
                                View all results for "{query}"
                            </button>
                        </div>
                    ) : !loading ? (
                        <div className="p-4 text-center text-sm text-text-muted">
                            No results found. Try a different term.
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}
