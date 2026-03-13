'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, BookOpen, Star, Loader2, Plus, X, Users, Calendar, BookMarked, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface BookResult {
    volumeId: string; title: string; authors: string[]; thumbnail: string | null
    publishedYear: number | null; categories: string[]; averageRating: number | null
    pageCount: number | null; description: string | null; publisher: string | null
    isbn: string | null; largeThumbnail: string | null; previewLink: string | null
}

const STATUS_OPTIONS = [
    { value: 'PLANNED', label: '📋 Want to Read' },
    { value: 'WATCHING', label: '📖 Currently Reading' },
    { value: 'COMPLETED', label: '✅ Finished' },
    { value: 'DROPPED', label: '❌ Dropped' },
]

export function BookSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<BookResult[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<BookResult | null>(null)
    const [status, setStatus] = useState('PLANNED')
    const [saving, setSaving] = useState(false)
    const debounceRef = useRef<NodeJS.Timeout>()

    const search = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}&page=1`)
            const data = await res.json()
            setResults(data.results || [])
        } catch { toast.error('Search failed') }
        setLoading(false)
    }, [])

    function onInput(val: string) {
        setQuery(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(val), 400)
    }

    async function addToLibrary() {
        if (!selected) return
        setSaving(true)
        try {
            const res = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: selected.title,
                    type: 'BOOK',
                    status,
                    bookId: selected.volumeId,
                    posterUrl: selected.largeThumbnail || selected.thumbnail,
                    releaseYear: selected.publishedYear,
                    genres: selected.categories,
                    pageCount: selected.pageCount,
                    overview: selected.description?.slice(0, 1000) || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`"${selected.title}" added to your library!`)
            setSelected(null)
            setQuery('')
            setResults([])
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || 'Failed to add')
        }
        setSaving(false)
    }

    return (
        <div className="glass-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2 mb-5">
                <BookOpen size={20} className="text-[#ff6b9d]" /> Search Books
            </h2>

            {/* Search input */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={e => onInput(e.target.value)}
                    placeholder="Search by title, author, or ISBN..."
                    className="input-cyber pl-9 w-full"
                />
                {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff6b9d] animate-spin" />}
            </div>

            {/* Results list */}
            {!selected && results.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {results.map(book => (
                        <button key={book.volumeId} onClick={() => setSelected(book)}
                            className="w-full flex gap-3 items-start p-3 rounded-xl hover:bg-bg-hover border border-transparent hover:border-border transition-all text-left group">
                            <div className="w-10 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-bg-secondary border border-border">
                                {book.thumbnail
                                    ? <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                                    : <div className="flex items-center justify-center h-full"><BookOpen size={14} className="text-text-muted opacity-50" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate group-hover:text-[#ff6b9d] transition-colors">{book.title}</p>
                                <p className="text-xs text-text-muted truncate">{book.authors.join(', ')}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {book.publishedYear && <span className="text-[10px] text-text-muted">{book.publishedYear}</span>}
                                    {book.averageRating && (
                                        <span className="text-[10px] text-[#ffd700] flex items-center gap-0.5">
                                            <Star size={9} fill="currentColor" />{book.averageRating}
                                        </span>
                                    )}
                                    {book.pageCount && <span className="text-[10px] text-text-muted">{book.pageCount} pages</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Selected book detail */}
            {selected && (
                <div className="animate-fade-in">
                    <div className="flex gap-4 mb-5">
                        <div className="w-24 flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-bg-secondary border border-border shadow-lg">
                            {selected.largeThumbnail || selected.thumbnail
                                ? <img src={selected.largeThumbnail || selected.thumbnail!} alt={selected.title} className="w-full h-full object-cover" />
                                : <div className="flex items-center justify-center h-full"><BookOpen size={24} className="text-text-muted opacity-50" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-text-primary text-base leading-tight mb-1">{selected.title}</h3>
                            {selected.authors.length > 0 && (
                                <p className="text-sm text-text-secondary flex items-center gap-1 mb-2">
                                    <Users size={12} />{selected.authors.join(', ')}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                                {selected.publishedYear && <span className="flex items-center gap-0.5"><Calendar size={11} />{selected.publishedYear}</span>}
                                {selected.pageCount && <span className="flex items-center gap-0.5"><BookMarked size={11} />{selected.pageCount} pages</span>}
                                {selected.averageRating && <span className="flex items-center gap-0.5 text-[#ffd700]"><Star size={11} fill="currentColor" />{selected.averageRating}/5</span>}
                            </div>
                            {selected.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selected.categories.slice(0, 3).map(c => (
                                        <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff6b9d]/10 border border-[#ff6b9d]/30 text-[#ff6b9d]">{c}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selected.description && (
                        <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-3">{selected.description}</p>
                    )}

                    {/* Status picker */}
                    <div className="mb-4">
                        <label className="block text-xs text-text-secondary mb-2">Reading Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setStatus(opt.value)}
                                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-left ${status === opt.value
                                        ? 'bg-[#ff6b9d]/15 border-[#ff6b9d]/60 text-[#ff6b9d]'
                                        : 'border-border text-text-secondary hover:border-text-muted'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-hover transition-colors flex items-center justify-center gap-1.5">
                            <X size={14} /> Back
                        </button>
                        <button onClick={addToLibrary} disabled={saving}
                            className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 text-sm">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <><Bookmark size={15} /> Add to Library</>}
                        </button>
                    </div>
                </div>
            )}

            {!loading && query && results.length === 0 && !selected && (
                <p className="text-center text-text-muted text-sm py-6">No books found for &quot;{query}&quot;</p>
            )}
        </div>
    )
}
