'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Star, Loader2, BookOpen, Filter, Heart, X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import { PosterContextMenu } from './PosterContextMenu'

const sortOptions = [
    { value: 'relevance', label: '🔍 Most Relevant' },
    { value: 'newest', label: '🆕 Newest First' },
    { value: 'title', label: '🔤 Title (A-Z)' },
]

const categoryOptions = [
    { id: 'Fiction', name: '📖 Fiction' },
    { id: 'Fantasy', name: '🧙 Fantasy' },
    { id: 'Science Fiction', name: '🛸 Sci-Fi' },
    { id: 'Mystery', name: '🔎 Mystery' },
    { id: 'Thriller', name: '🔪 Thriller' },
    { id: 'Romance', name: '❤️ Romance' },
    { id: 'History', name: '📜 History' },
    { id: 'Biography', name: '👤 Biography' },
    { id: 'Self-help', name: '💡 Self-Help' },
    { id: 'Science', name: '🔬 Science' },
    { id: 'Philosophy', name: '🤔 Philosophy' },
    { id: 'Comics', name: '💥 Comics' },
    { id: 'Horror', name: '😱 Horror' },
    { id: 'Travel', name: '✈️ Travel' },
    { id: 'Cooking', name: '🍳 Cooking' },
    { id: 'Children', name: '🧸 Children' },
    { id: 'Poetry', name: '🎭 Poetry' },
    { id: 'Classics', name: '🏛️ Classics' },
]

const languageOptions = [
    { value: '', label: 'Any Language' },
    { value: 'en', label: 'English' },
    { value: 'tr', label: 'Turkish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'es', label: 'Spanish' },
    { value: 'it', label: 'Italian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'ru', label: 'Russian' },
]

const pageCountOptions = [
    { value: '', label: 'Any Length' },
    { value: '0-100', label: '< 100 pages' },
    { value: '100-300', label: '100 – 300 pages' },
    { value: '300-500', label: '300 – 500 pages' },
    { value: '500-9999', label: '500+ pages' },
]

interface Book {
    volumeId: string; title: string; authors: string[]; thumbnail: string | null
    publishedYear: number | null; averageRating: number | null; pageCount: number | null
    categories: string[]; language?: string
}

export function BrowseBooks() {
    const searchParams = useSearchParams()
    const queryCategory = searchParams.get('category')

    const [items, setItems] = useState<Book[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const [sortBy, setSortBy] = useState('relevance')
    const [selectedCategories, setSelectedCategories] = useState<string[]>(queryCategory ? [queryCategory] : [])
    const [language, setLanguage] = useState('')
    const [pageCountRange, setPageCountRange] = useState('')
    const [searchTerm, setSearchTerm] = useState('bestseller')
    const [inputVal, setInputVal] = useState('')

    // Sync state if URL changes (e.g. user clicks a Collection card)
    useEffect(() => {
        if (queryCategory) {
            setSelectedCategories([queryCategory])
            setSearchTerm('bestseller')
            setInputVal('')
        }
    }, [queryCategory])

    const debounceRef = useRef<NodeJS.Timeout>()
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

    function toggleCategory(id: string) {
        setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
    }

    function resetFilters() {
        setSelectedCategories([])
        setLanguage('')
        setPageCountRange('')
        setSortBy('relevance')
        setInputVal('')
        setSearchTerm('bestseller')
    }

    const fetchBooks = useCallback(async (pageNum: number, reset = false) => {
        setLoading(true)
        try {
            const subjectParts = selectedCategories.map(c => `subject:${c}`)
            const q = [searchTerm || 'bestseller', ...subjectParts].join('+')
            const params = new URLSearchParams({ q, page: String(pageNum), orderBy: sortBy })
            if (language) params.set('langRestrict', language)
            if (pageCountRange) params.set('pageCount', pageCountRange)

            const res = await fetch(`/api/books/search?${params}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setItems(prev => reset ? data.results : [...prev, ...data.results])
            setHasMore(data.hasMore)
        } catch { /* silent */ }
        setLoading(false)
    }, [searchTerm, selectedCategories, sortBy, language, pageCountRange])

    useEffect(() => { setItems([]); setPage(1); setHasMore(true); fetchBooks(1, true) },
        [searchTerm, selectedCategories, sortBy, language, pageCountRange])

    useEffect(() => { if (page > 1) fetchBooks(page, false) }, [page, fetchBooks])

    function onSearchInput(val: string) {
        setInputVal(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setSearchTerm(val || 'bestseller'), 500)
    }

    const activeFilters = selectedCategories.length + (language ? 1 : 0) + (pageCountRange ? 1 : 0)

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
                    <BookOpen className="text-[var(--accent-pink)]" size={28} /> Discover Books
                </h1>
                <p className="text-text-secondary mt-1">Browse and discover books powered by Google Books.</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <aside className="flex-shrink-0 w-60 hidden lg:block">
                    <div className="sticky top-24 space-y-4">
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                                    <Filter size={11} /> Filters
                                    {activeFilters > 0 && <span className="text-accent-cyan bg-accent-cyan/15 px-1.5 rounded-full">{activeFilters}</span>}
                                </h3>
                                {activeFilters > 0 && (
                                    <button onClick={resetFilters} className="text-[10px] text-text-muted hover:text-accent-pink flex items-center gap-0.5">
                                        <X size={10} /> Reset
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Search</label>
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    <input type="text" placeholder="Search books..." value={inputVal}
                                        onChange={e => onSearchInput(e.target.value)}
                                        className="input-cyber pl-8 text-sm w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-4 rounded-xl border border-border space-y-3">
                            <div>
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Sort By</h3>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-cyber w-full text-sm">
                                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">🌍 Language</h3>
                                <select value={language} onChange={e => setLanguage(e.target.value)} className="input-cyber w-full text-sm">
                                    {languageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">📄 Page Count</h3>
                                <select value={pageCountRange} onChange={e => setPageCountRange(e.target.value)} className="input-cyber w-full text-sm">
                                    {pageCountOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="glass-card p-4 rounded-xl border border-border">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                                📚 Genre {selectedCategories.length > 0 && <span className="text-accent-cyan">({selectedCategories.length})</span>}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {categoryOptions.map(c => {
                                    const active = selectedCategories.includes(c.id)
                                    return (
                                        <button key={c.id} onClick={() => toggleCategory(c.id)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active
                                                ? 'bg-[var(--accent-pink)]/15 border-[var(--accent-pink)]/50 text-[var(--accent-pink)]'
                                                : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'}`}>
                                            {c.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Grid */}
                <div className="flex-1 min-w-0">
                    {/* Active category tags */}
                    {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedCategories.map(id => {
                                const cat = categoryOptions.find(c => c.id === id)
                                return cat ? (
                                    <span key={id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--accent-pink)]/10 border border-[var(--accent-pink)]/40 text-[var(--accent-pink)]">
                                        {cat.name}
                                        <button onClick={() => toggleCategory(id)}><X size={10} /></button>
                                    </span>
                                ) : null
                            })}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {items.map((book, idx) => {
                            const fav = isFavorited(book.volumeId)
                            const isLast = idx === items.length - 1
                            return (
                                <div key={`${book.volumeId}-${idx}`} ref={isLast ? lastItemRef : undefined} className="relative group">
                                    <Link href={`/books/${book.volumeId}`} className="block">
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-secondary border border-border shadow-card mb-2 group-hover:border-[var(--accent-pink)]/40 transition-all">
                                            {book.thumbnail
                                                ? <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                : <div className="flex items-center justify-center h-full"><BookOpen size={32} className="text-text-muted opacity-40" /></div>}
                                            {book.averageRating && (
                                                <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-[#ffd700]">
                                                    <Star size={8} fill="currentColor" />{book.averageRating}
                                                </div>
                                            )}
                                            <button onClick={e => { e.preventDefault(); toggleFavorite({ tmdbId: book.volumeId, title: book.title, type: 'BOOK', posterUrl: book.thumbnail, releaseYear: book.publishedYear }) }}
                                                className={`absolute top-2 left-2 p-1.5 rounded-full z-10 transition-all shadow backdrop-blur-sm ${fav ? 'bg-accent-pink/90 text-white opacity-100' : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60'}`}>
                                                <Heart size={13} className={fav ? 'fill-current' : ''} />
                                            </button>
                                        </div>
                                    </Link>

                                    <PosterContextMenu
                                        item={{
                                            title: book.title,
                                            type: 'BOOK',
                                            bookId: book.volumeId,
                                            posterUrl: book.thumbnail,
                                            releaseYear: book.publishedYear,
                                            genres: book.categories,
                                            overview: null,
                                        }}
                                        currentStatus={null}
                                    />

                                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-[var(--accent-pink)] transition-colors">{book.title}</p>
                                    <p className="text-[11px] text-text-muted truncate">{book.authors.slice(0, 2).join(', ')}</p>
                                    {book.publishedYear && <p className="text-[10px] text-text-muted mt-0.5">{book.publishedYear}</p>}
                                </div>
                            )
                        })}
                    </div>

                    {loading && <div className="py-12 flex justify-center"><Loader2 size={32} className="text-[var(--accent-pink)] animate-spin" /></div>}
                    {!loading && items.length === 0 && (
                        <div className="py-24 text-center glass-card rounded-2xl border border-border max-w-md mx-auto">
                            <BookOpen size={40} className="text-text-muted mx-auto mb-3 opacity-50" />
                            <h3 className="text-xl font-bold text-text-primary">No books found</h3>
                            <p className="text-sm text-text-secondary mt-2">Try a different search or genre.</p>
                        </div>
                    )}
                    {!loading && !hasMore && items.length > 0 && (
                        <div className="py-12 text-center text-text-muted text-sm">You&apos;ve reached the end of the list.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
