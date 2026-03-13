import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Star, Clock, Film, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MediaActionPanel } from '@/components/MediaActionPanel'
import { MediaCastCrew } from '@/components/MediaCastCrew'
import { MediaDiscussion } from '@/components/MediaDiscussion'
import { AddQuoteCTA } from '@/components/AddQuoteCTA'

/**
 * Fetch TMDB data through the internal proxy route.
 * This avoids embedding the raw API key in the server component fetch URL
 * and benefits from the LRU cache in /api/tmdb/details/[id].
 */
async function getTmdbData(id: string, type: string) {
    const upper = type?.toUpperCase()
    const isMovie = upper === 'MOVIE'
    const isTv = upper === 'TVSHOW' || upper === 'TV' || upper === 'ANIME'
    if (!isMovie && !isTv) return null
    const mediaType = isMovie ? 'movie' : 'tv'

    try {
        // Use NEXTAUTH_URL (configured for both dev and prod) as the base
        const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
        const res = await fetch(`${base}/api/tmdb/details/${id}?type=${mediaType}`, {
            next: { revalidate: 3600 }
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export default async function PublicMediaPage({ params, searchParams }: { params: { id: string }, searchParams: { type?: string } }) {
    const session = await getServerSession(authOptions)

    // 1. Try to find in local DB (CUID-based link from library)
    const baseItem = await prisma.mediaItem.findUnique({ where: { id: params.id } })

    // 2. Determine target TMDB ID and type, then fetch from our proxy
    const targetTmdbId = baseItem?.tmdbId || params.id
    const targetType = baseItem?.type || searchParams.type

    const tmdbData = (targetTmdbId && targetType) ? await getTmdbData(targetTmdbId, targetType as string) : null

    // 3. 404 if nothing found
    if (!baseItem && !tmdbData) notFound()

    // 4. Build unified display item — proxy returns a normalized shape
    const displayItem = {
        id: baseItem?.id || params.id,
        tmdbId: baseItem?.tmdbId || params.id,
        title: baseItem?.title || tmdbData?.title,
        type: baseItem?.type || tmdbData?.resolvedType || (searchParams.type?.toUpperCase() === 'TV' ? 'TVSHOW' : searchParams.type?.toUpperCase() || 'MOVIE'),
        posterUrl: baseItem?.posterUrl || tmdbData?.posterUrl || null,
        backdropUrl: baseItem?.backdropUrl || tmdbData?.backdropUrl || null,
        releaseYear: baseItem?.releaseYear || tmdbData?.releaseYear || null,
        overview: baseItem?.overview || tmdbData?.overview,
        tmdbRating: baseItem?.tmdbRating || tmdbData?.tmdbRating || null,
        runtime: baseItem?.runtime || tmdbData?.runtime || null,
        genres: baseItem?.genres?.length ? baseItem.genres : (tmdbData?.genres || []),
        imdbId: baseItem?.imdbId || tmdbData?.imdbId || null,
        status: baseItem?.status
    }

    // 5. Check if logged-in user already tracks it
    let userMediaItem = null
    if (session?.user?.id && displayItem.tmdbId) {
        userMediaItem = await prisma.mediaItem.findUnique({
            where: { userId_tmdbId: { userId: session.user.id, tmdbId: displayItem.tmdbId } }
        })
    }

    const widgetItem = userMediaItem || displayItem

    // 6. Platform stats
    let avgPlatformRating: number | null = null
    let totalTracked = 0
    if (displayItem.tmdbId) {
        const stats = await prisma.mediaItem.aggregate({
            where: { tmdbId: displayItem.tmdbId },
            _avg: { userRating: true },
            _count: { id: true }
        })
        avgPlatformRating = stats._avg.userRating ? Math.round(stats._avg.userRating * 10) / 10 : null
        totalTracked = stats._count.id
    }

    function formatTime(min: number | null) {
        if (!min) return null
        const h = Math.floor(min / 60)
        const m = min % 60
        return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />

            {/* Backdrop Header */}
            <div className="relative h-[50vh] min-h-[400px] w-full mt-0">
                {displayItem.backdropUrl ? (
                    <>
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${displayItem.backdropUrl})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/60 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-bg-secondary to-bg-primary" />
                )}
            </div>

            <main className="max-w-6xl mx-auto px-6 relative -mt-48 z-10">
                <div className="flex flex-col md:flex-row gap-10">
                    {/* Left Column: Poster & Actions */}
                    <div className="w-64 flex-shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-border bg-bg-secondary w-full">
                            {displayItem.posterUrl ? (
                                <img src={displayItem.posterUrl} alt={displayItem.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                    <Film size={40} className="text-text-muted" />
                                </div>
                            )}
                        </div>

                        <div className="mt-8 space-y-4">
                            <MediaActionPanel
                                baseItem={widgetItem}
                                userMediaItem={userMediaItem}
                                session={session}
                                urlId={params.id}
                            />
                            {session?.user && displayItem.tmdbId && (
                                <AddQuoteCTA
                                    tmdbId={displayItem.tmdbId}
                                    type={displayItem.type}
                                    title={displayItem.title as string}
                                    posterUrl={displayItem.posterUrl}
                                    backdropUrl={displayItem.backdropUrl}
                                    releaseYear={displayItem.releaseYear}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 min-w-0 pt-6 md:pt-16 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                            <span className="text-xs px-3 py-1 rounded-full font-bold tracking-widest uppercase bg-bg-secondary border border-border">{displayItem.type}</span>
                            {displayItem.releaseYear && <span className="text-sm font-medium text-[#8899aa]">{displayItem.releaseYear}</span>}
                            {displayItem.imdbId && (
                                <a href={`https://www.imdb.com/title/${displayItem.imdbId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#f5c518] hover:bg-[#f5c518]/10 px-2 py-1 rounded-md transition-colors font-bold border border-[#f5c518]/30">
                                    <ExternalLink size={12} /> IMDb
                                </a>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-[#e8edf5] mb-6 drop-shadow-md tracking-tight leading-tight">{displayItem.title}</h1>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-10">
                            {displayItem.tmdbRating && (
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-[#ffd700]" fill="currentColor" />
                                    <span className="font-bold text-lg text-[#e8edf5]">{displayItem.tmdbRating} <span className="text-sm text-[#8899aa] font-normal">TMDB</span></span>
                                </div>
                            )}
                            <div className="w-1.5 h-1.5 rounded-full bg-border md:block hidden" />
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-[#8899aa]" />
                                <span className="font-medium text-[#e8edf5]">{totalTracked} <span className="text-sm text-[#8899aa]">Trackers</span></span>
                            </div>
                            {displayItem.runtime && (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-border md:block hidden" />
                                    <div className="flex items-center gap-2 text-[#8899aa]">
                                        <Clock size={16} />
                                        <span className="font-medium">{formatTime(displayItem.runtime)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {displayItem.genres && displayItem.genres.length > 0 && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-10">
                                {displayItem.genres.map((g: string) => (
                                    <span key={g} className="text-xs font-medium px-4 py-1.5 rounded-full bg-bg-card text-[#8899aa] border border-border shadow-sm">{g}</span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {displayItem.overview && (
                            <div className="mb-14">
                                <h3 className="text-xl font-display font-bold text-[#e8edf5] mb-4">Synopsis</h3>
                                <p className="text-[#8899aa] leading-relaxed max-w-4xl text-lg">{displayItem.overview}</p>
                            </div>
                        )}

                        {/* Cast & Crew Section — tmdbData.credits from proxy already includes this */}
                        <MediaCastCrew credits={tmdbData?.credits} type={displayItem.type} />

                        {/* Discussion Section */}
                        {displayItem.tmdbId && (
                            <MediaDiscussion tmdbId={displayItem.tmdbId} title={displayItem.title} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
