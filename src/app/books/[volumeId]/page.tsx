import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Star, BookOpen, ArrowLeft, ExternalLink, BookMarked, Users, Calendar, Hash } from 'lucide-react'
import Link from 'next/link'
import { MediaActionPanel } from '@/components/MediaActionPanel'

const BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY

async function getBookDetail(volumeId: string) {
    try {
        const url = API_KEY
            ? `${BOOKS_BASE}/volumes/${volumeId}?key=${API_KEY}`
            : `${BOOKS_BASE}/volumes/${volumeId}`
        const res = await fetch(url, { next: { revalidate: 3600 } })
        if (!res.ok) return null
        const vol = await res.json()
        const info = vol.volumeInfo || {}
        const isbn = (info.industryIdentifiers || []).find(
            (i: any) => i.type === 'ISBN_13' || i.type === 'ISBN_10'
        )?.identifier ?? null
        return {
            volumeId: vol.id,
            title: info.title || 'Unknown Title',
            subtitle: info.subtitle || null,
            authors: info.authors || [],
            description: info.description?.replace(/<[^>]+>/g, '') || null,
            publishedDate: info.publishedDate || null,
            publishedYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
            pageCount: info.pageCount || null,
            categories: info.categories || [],
            thumbnail: info.imageLinks?.large?.replace('http://', 'https://')
                || info.imageLinks?.medium?.replace('http://', 'https://')
                || info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
            averageRating: info.averageRating || null,
            ratingsCount: info.ratingsCount || 0,
            isbn,
            publisher: info.publisher || null,
            language: info.language?.toUpperCase() || null,
            previewLink: info.previewLink || null,
            maturityRating: info.maturityRating?.replace('_', ' ') || null,
        }
    } catch { return null }
}

export async function generateMetadata({ params }: { params: { volumeId: string } }) {
    const book = await getBookDetail(params.volumeId)
    if (!book) return { title: 'Book Not Found' }
    return {
        title: `${book.title} - Themis`,
        description: book.description?.slice(0, 160),
    }
}

export default async function BookDetailPage({ params }: { params: { volumeId: string } }) {
    const session = await getServerSession(authOptions)
    const book = await getBookDetail(params.volumeId)
    if (!book) notFound()

    let userMediaItem: any = null
    if (session?.user?.id) {
        userMediaItem = await prisma.mediaItem.findFirst({
            where: { userId: session.user.id, bookId: params.volumeId } as any
        })
    }

    const widgetItem = {
        tmdbId: book.volumeId,
        title: book.title,
        type: 'BOOK',
        posterUrl: book.thumbnail,
        releaseYear: book.publishedYear,
        genres: book.categories,
        overview: book.description?.slice(0, 500) ?? null,
        tmdbRating: book.averageRating ? book.averageRating * 2 : null,
        bookId: book.volumeId,
        pageCount: book.pageCount,
    }

    return (
        <div className="min-h-screen cyber-bg">
            <Navbar />

            {/* Soft backdrop from cover */}
            {book.thumbnail && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <img src={book.thumbnail} alt="" className="w-full h-full object-cover opacity-10 blur-2xl scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/80 via-bg-primary/95 to-bg-primary" />
                </div>
            )}

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
                <Link href="/books" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Books
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
                    {/* Sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Cover */}
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-border shadow-2xl bg-bg-secondary">
                            {book.thumbnail
                                ? <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                                : <div className="flex items-center justify-center h-full"><BookOpen size={48} className="text-text-muted opacity-50" /></div>}
                        </div>

                        {/* Stats */}
                        <div className="glass-card rounded-xl border border-border p-4 space-y-3 text-sm">
                            {book.averageRating && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Rating</span>
                                    <span className="flex items-center gap-1 font-bold text-[#ffd700]">
                                        <Star size={13} fill="currentColor" /> {book.averageRating}/5
                                        {book.ratingsCount > 0 && <span className="text-text-muted font-normal text-xs">({book.ratingsCount.toLocaleString()})</span>}
                                    </span>
                                </div>
                            )}
                            {book.pageCount && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Pages</span>
                                    <span className="font-medium text-text-primary flex items-center gap-1"><BookMarked size={13} />{book.pageCount}</span>
                                </div>
                            )}
                            {book.publishedDate && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Published</span>
                                    <span className="font-medium text-text-primary flex items-center gap-1"><Calendar size={13} />{book.publishedDate}</span>
                                </div>
                            )}
                            {book.language && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Language</span>
                                    <span className="font-medium text-text-primary">{book.language}</span>
                                </div>
                            )}
                            {book.isbn && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">ISBN</span>
                                    <span className="font-mono text-xs text-text-primary">{book.isbn}</span>
                                </div>
                            )}
                            {book.maturityRating && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Rating</span>
                                    <span className="text-xs font-medium text-text-primary capitalize">{book.maturityRating.toLowerCase()}</span>
                                </div>
                            )}
                        </div>

                        {/* Track Panel */}
                        <MediaActionPanel
                            baseItem={widgetItem}
                            userMediaItem={userMediaItem}
                            session={session}
                            urlId={`book-${book.volumeId}`}
                        />

                        {book.previewLink && (
                            <a href={book.previewLink} target="_blank" rel="noreferrer"
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                                <ExternalLink size={14} /> Preview on Google Books
                            </a>
                        )}
                    </div>

                    {/* Main */}
                    <div className="space-y-7">
                        {/* Title + authors */}
                        <div>
                            <h1 className="text-4xl font-display font-bold text-text-primary leading-tight mb-1">{book.title}</h1>
                            {book.subtitle && <p className="text-xl text-text-secondary mb-3">{book.subtitle}</p>}
                            {book.authors.length > 0 && (
                                <p className="text-base text-text-secondary flex items-center gap-2">
                                    <Users size={15} className="text-[#ff6b9d]" />
                                    {book.authors.join(' · ')}
                                </p>
                            )}
                            {book.categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {book.categories.map((c: string) => (
                                        <span key={c} className="text-xs px-3 py-1 rounded-full bg-[#ff6b9d]/10 border border-[#ff6b9d]/30 text-[#ff6b9d] font-medium">{c}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Publisher */}
                        {book.publisher && (
                            <div className="glass-card rounded-xl border border-border p-5">
                                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Publisher</h2>
                                <p className="font-semibold text-text-primary">{book.publisher}</p>
                            </div>
                        )}

                        {/* Description */}
                        {book.description && (
                            <div className="glass-card rounded-xl border border-border p-5">
                                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Description</h2>
                                <p className="text-text-secondary text-sm leading-relaxed">{book.description}</p>
                            </div>
                        )}

                        {/* ISBN */}
                        {book.isbn && (
                            <div className="glass-card rounded-xl border border-border p-4">
                                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1"><Hash size={12} />ISBN</h2>
                                <p className="font-mono text-text-primary">{book.isbn}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
