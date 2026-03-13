'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BookOpen, Star, Loader2, Heart } from 'lucide-react'
import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import { PosterContextMenu } from './PosterContextMenu'

interface Book {
    volumeId: string
    title: string
    authors: string[]
    thumbnail: string | null
    publishedYear: number | null
    averageRating: number | null
    pageCount: number | null
}

interface ColumnProps {
    title: string
    icon: React.ReactNode
    query: string
    langRestrict?: string
}

function BookCard({ book }: { book: Book }) {
    const { isFavorited, toggleFavorite } = useMediaFavorites()
    const fav = isFavorited(book.volumeId)

    return (
        <div className="relative group flex items-start gap-3 p-2 rounded-xl hover:bg-bg-hover transition-colors">
            <Link href={`/books/${book.volumeId}`} className="block flex-shrink-0">
                <div className="relative w-16 h-24 rounded-md overflow-hidden bg-bg-secondary border border-border shadow-sm group-hover:border-[var(--accent-pink)]/40 transition-all">
                    {book.thumbnail ? (
                        <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <BookOpen size={20} className="text-text-muted opacity-40" />
                        </div>
                    )}
                </div>
            </Link>
            <div className="flex-1 min-w-0 py-1">
                <Link href={`/books/${book.volumeId}`} className="block">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-[var(--accent-pink)] transition-colors pr-6">
                        {book.title}
                    </p>
                </Link>
                <p className="text-[11px] text-text-muted truncate mt-0.5">{book.authors.slice(0, 2).join(', ')}</p>
                <div className="flex items-center gap-2 mt-2">
                    {book.publishedYear && <p className="text-[10px] text-text-muted">{book.publishedYear}</p>}
                    {book.averageRating && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#ffd700]">
                            <Star size={10} fill="currentColor" /> {book.averageRating}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.preventDefault()
                    toggleFavorite({ tmdbId: book.volumeId, title: book.title, type: 'BOOK', posterUrl: book.thumbnail, releaseYear: book.publishedYear })
                }}
                className={`absolute top-2 right-9 p-1.5 rounded-full z-[61] transition-all shadow backdrop-blur-sm ${fav ? 'bg-accent-pink/90 text-white opacity-100' : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60'}`}
            >
                <Heart size={14} className={fav ? 'fill-current' : ''} />
            </button>

            <PosterContextMenu
                item={{
                    title: book.title,
                    type: 'BOOK',
                    bookId: book.volumeId,
                    posterUrl: book.thumbnail,
                    releaseYear: book.publishedYear,
                    genres: [],
                }}
                currentStatus={null}
            />
        </div>
    )
}

function BookColumn({ title, icon, query, langRestrict }: ColumnProps) {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBooks = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ q: query, orderBy: 'relevance' })
            if (langRestrict) params.set('langRestrict', langRestrict)

            const res = await fetch(`/api/books/search?${params}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setBooks((data.results || []).slice(0, 10)) // display top 10
        } catch { }
        setLoading(false)
    }, [query, langRestrict])

    useEffect(() => {
        fetchBooks()
    }, [fetchBooks])

    return (
        <div className="flex flex-col h-full bg-bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-bg-secondary/30 flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <h3 className="font-display font-bold text-base text-text-primary uppercase tracking-wide">
                    {title}
                </h3>
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-y-auto min-h-[400px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-[var(--accent-pink)]" size={24} />
                    </div>
                ) : books.length > 0 ? (
                    books.map((book, idx) => <BookCard key={`${book.volumeId}-${idx}`} book={book} />)
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 p-4 text-center">
                        <BookOpen size={32} className="mb-2" />
                        <p className="text-sm">No books found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export function LocalizedBookColumns() {
    const [localeLang, setLocaleLang] = useState('en')

    useEffect(() => {
        if (typeof navigator !== 'undefined') {
            const code = navigator.language.split('-')[0].toLowerCase()
            setLocaleLang(code)
        }
    }, [])

    const isTr = localeLang === 'tr'

    return (
        <div className="mb-12">
            <h2 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
                🏛️ Library Highlights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
                <BookColumn
                    title="World Classics"
                    icon="🌍"
                    query="subject:classics"
                />
                <BookColumn
                    title="Comics"
                    icon="💥"
                    query="subject:comics"
                />
                <BookColumn
                    title={isTr ? "Tarih" : "History"}
                    icon="📜"
                    query={isTr ? "tarih" : "subject:history"}
                    langRestrict={isTr ? "tr" : undefined}
                />
            </div>
        </div>
    )
}
