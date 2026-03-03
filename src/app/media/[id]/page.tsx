import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Star, Clock, Film, Tv, Gamepad2, Users, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AddMediaClientWidget } from '@/components/AddMediaClientWidget'

export default async function PublicMediaPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    // 1. Fetch the requested item
    const baseItem = await prisma.mediaItem.findUnique({
        where: { id: params.id }
    })

    if (!baseItem) notFound()

    // 2. Fetch global platform stats for this specific TMDB/external ID
    let avgPlatformRating: number | null = null
    let totalTracked = 1

    if (baseItem.tmdbId) {
        const stats = await prisma.mediaItem.aggregate({
            where: { tmdbId: baseItem.tmdbId },
            _avg: { userRating: true },
            _count: { id: true }
        })
        avgPlatformRating = stats._avg.userRating ? Math.round(stats._avg.userRating * 10) / 10 : null
        totalTracked = stats._count.id
    }

    // 2.5 Check if logged in user already tracks it
    let userMediaItem = null
    if (session?.user?.id && baseItem.tmdbId) {
        userMediaItem = await prisma.mediaItem.findUnique({
            where: { userId_tmdbId: { userId: session.user.id, tmdbId: baseItem.tmdbId } }
        })
    }

    // 3. Optional: Fetch public reviews (notes from users with public profiles)
    let publicReviews: any[] = []
    if (baseItem.tmdbId) {
        publicReviews = await prisma.mediaItem.findMany({
            where: {
                tmdbId: baseItem.tmdbId,
                notes: { not: null },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                notes: true,
                userRating: true,
                createdAt: true,
                user: { select: { id: true, name: true, username: true, image: true } }
            }
        })
    }

    function formatTime(min: number | null) {
        if (!min) return null
        const h = Math.floor(min / 60)
        const m = min % 60
        return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
    }

    return (
        <div className="min-h-screen cyber-bg pb-20">
            <Navbar />

            {/* Backdrop Header */}
            <div className="relative h-[40vh] min-h-[300px] w-full mt-4">
                {baseItem.backdropUrl ? (
                    <>
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${baseItem.backdropUrl})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-bg-secondary to-bg-primary" />
                )}
            </div>

            <main className="max-w-5xl mx-auto px-6 relative -mt-32">
                <Link href="/explore" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors font-medium">
                    <ArrowLeft size={16} /> Back to Explore
                </Link>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column: Poster & Actions */}
                    <div className="w-48 shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-card border border-border bg-bg-secondary w-full">
                            {baseItem.posterUrl ? (
                                <img src={baseItem.posterUrl} alt={baseItem.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                    <Film size={32} className="text-text-muted" />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            {session ? (
                                userMediaItem ? (
                                    <div className="w-full flex flex-col items-center justify-center py-3 text-sm font-medium rounded-xl border border-border bg-bg-card shadow-sm">
                                        <span className="text-accent-cyan mb-1 font-bold">✓ In your Library</span>
                                        <span className="text-xs text-text-secondary">Rating: {userMediaItem.userRating ? `★ ${userMediaItem.userRating}` : 'Unrated'}</span>
                                    </div>
                                ) : (
                                    <AddMediaClientWidget baseItem={baseItem} />
                                )
                            ) : (
                                <Link href={`/auth/login?callbackUrl=/media/${baseItem.id}`} className="btn-primary w-full flex items-center justify-center py-3 text-sm font-medium">
                                    Sign In to Track
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 min-w-0 pt-2 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium type-${baseItem.type}`}>{baseItem.type}</span>
                            {baseItem.releaseYear && <span className="text-sm font-medium text-text-secondary">{baseItem.releaseYear}</span>}
                            {baseItem.imdbId && (
                                <a href={`https://www.imdb.com/title/${baseItem.imdbId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#f5c518] hover:underline font-bold">
                                    <ExternalLink size={12} /> IMDb
                                </a>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">{baseItem.title}</h1>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                            {baseItem.tmdbRating && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-sm">
                                    <Star size={14} className="text-[#ffd700]" fill="currentColor" />
                                    <span className="font-bold text-text-primary">{baseItem.tmdbRating}</span>
                                    <span className="text-text-muted text-xs">TMDB</span>
                                </div>
                            )}
                            {avgPlatformRating && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30 text-sm">
                                    <Star size={14} className="text-[#ffd700]" fill="currentColor" />
                                    <span className="font-bold text-[#ffd700]">{avgPlatformRating}</span>
                                    <span className="text-[#ffd700]/70 text-xs">Platform</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-sm text-text-secondary">
                                <Users size={14} />
                                <span className="font-medium text-text-primary">{totalTracked}</span> tracking
                            </div>
                            {baseItem.runtime && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-sm text-text-secondary">
                                    <Clock size={14} />
                                    <span className="font-medium text-text-primary">{formatTime(baseItem.runtime)}</span>
                                </div>
                            )}
                        </div>

                        {/* Genres */}
                        {baseItem.genres && baseItem.genres.length > 0 && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                                {baseItem.genres.map(g => (
                                    <span key={g} className="text-xs px-3 py-1 rounded-full bg-bg-hover text-text-secondary border border-border">{g}</span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {baseItem.overview && (
                            <div className="mb-12">
                                <h3 className="text-lg font-display font-semibold text-text-primary mb-3">Overview</h3>
                                <p className="text-text-secondary leading-relaxed max-w-3xl">{baseItem.overview}</p>
                            </div>
                        )}

                        {/* Reviews (Read Only) */}
                        <div className="mb-12">
                            <h3 className="text-lg font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                Recent Reviews
                                <span className="text-xs py-0.5 px-2 rounded-full bg-bg-hover text-text-secondary font-normal border border-border">{publicReviews.length}</span>
                            </h3>

                            {publicReviews.length > 0 ? (
                                <div className="grid gap-4 max-w-3xl">
                                    {publicReviews.map(review => (
                                        <div key={review.id} className="p-4 rounded-xl bg-bg-card border border-border">
                                            <div className="flex items-start justify-between mb-3">
                                                <Link href={`/user/${review.user.username || review.user.id}`} className="flex items-center gap-3 group">
                                                    {review.user.image ? (
                                                        <img src={review.user.image} alt={review.user.name || 'User'} className="w-8 h-8 rounded-full border border-border group-hover:border-accent-cyan transition-colors" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-bg-hover border border-border group-hover:border-accent-cyan transition-colors flex items-center justify-center">
                                                            <span className="text-xs font-bold text-text-secondary">{(review.user.name || 'U').charAt(0)}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary group-hover:text-accent-cyan transition-colors">{review.user.name || 'Anonymous User'}</p>
                                                        <p className="text-[10px] text-text-muted">{review.user.username ? `@${review.user.username}` : new Date(review.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </Link>
                                                {review.userRating && (
                                                    <div className="flex items-center gap-1 text-[#ffd700] text-sm bg-black/40 px-2 py-1 rounded-lg">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="font-bold">{review.userRating}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{review.notes}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center glass-card border border-border rounded-xl">
                                    <p className="text-text-muted mb-2">No public reviews yet.</p>
                                    {!session && (
                                        <Link href={`/auth/login?callbackUrl=/media/${baseItem.id}`} className="text-sm text-accent-cyan hover:underline">
                                            Log in to write the first review
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
