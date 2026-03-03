import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Star, Clock, Film, Tv, Gamepad2, Users, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MediaActionPanel } from '@/components/MediaActionPanel'
import { MediaCastCrew } from '@/components/MediaCastCrew'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

async function getTmdbData(id: string, type: string) {
    if (!type || (type !== 'MOVIE' && type !== 'TVSHOW' && type !== 'movie' && type !== 'tv')) return null
    const tmdbType = (type === 'MOVIE' || type === 'movie') ? 'movie' : 'tv'

    try {
        const res = await fetch(`${TMDB_BASE}/${tmdbType}/${id}?api_key=${API_KEY}&append_to_response=credits`)
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export default async function PublicMediaPage({ params, searchParams }: { params: { id: string }, searchParams: { type?: string } }) {
    const session = await getServerSession(authOptions)

    // 1. First try to find it in our local database (CUID)
    let baseItem = await prisma.mediaItem.findUnique({
        where: { id: params.id }
    })

    let tmdbData: any = null
    let fetchedFromTmdb = false

    // 2. If not found locally, OR if we want to enrich the local item with full cast/crew, let's fetch TMDB
    // For this rewrite, we will always fetch TMDB if tmdbId is available, or if params.id IS the tmdbId
    const targetTmdbId = baseItem?.tmdbId || params.id
    const targetType = baseItem?.type || searchParams.type

    if (targetTmdbId && targetType) {
        tmdbData = await getTmdbData(targetTmdbId, targetType as string)
    }

    // 3. If neither local DB item nor TMDB data exists, 404
    if (!baseItem && !tmdbData) {
        notFound()
    }

    // 4. Construct unified display item
    const displayItem = {
        id: baseItem?.id || params.id, // For TMDB fallback, use tmdbId as local ID dummy
        tmdbId: baseItem?.tmdbId || params.id,
        title: baseItem?.title || tmdbData?.title || tmdbData?.name,
        type: baseItem?.type || (searchParams.type?.toUpperCase() === 'TV' ? 'TVSHOW' : searchParams.type?.toUpperCase() || 'MOVIE'),
        posterUrl: baseItem?.posterUrl || (tmdbData?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null),
        backdropUrl: baseItem?.backdropUrl || (tmdbData?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : null),
        releaseYear: baseItem?.releaseYear || (tmdbData?.release_date ? parseInt(tmdbData.release_date) : tmdbData?.first_air_date ? parseInt(tmdbData.first_air_date) : null),
        overview: baseItem?.overview || tmdbData?.overview,
        tmdbRating: baseItem?.tmdbRating || (tmdbData?.vote_average ? Math.round(tmdbData.vote_average * 10) / 10 : null),
        runtime: baseItem?.runtime || tmdbData?.runtime || (tmdbData?.episode_run_time?.[0]),
        genres: baseItem?.genres?.length ? baseItem.genres : (tmdbData?.genres?.map((g: any) => g.name) || []),
        imdbId: baseItem?.imdbId || tmdbData?.imdb_id,
        status: baseItem?.status
    }

    // 5. Check if logged-in user already tracks it (only matters if we fell back to TMDB)
    let userMediaItem = null
    if (session?.user?.id && displayItem.tmdbId) {
        userMediaItem = await prisma.mediaItem.findUnique({
            where: { userId_tmdbId: { userId: session.user.id, tmdbId: displayItem.tmdbId } }
        })
    }

    // We pass userMediaItem as baseItem to the Add Widget if they already track it, OR the displayItem if new
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

    // 7. Format time helper
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
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 min-w-0 pt-6 md:pt-16 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-bold tracking-widest uppercase bg-bg-secondary border border-border`}>{displayItem.type}</span>
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
                                {displayItem.genres.map((g: any) => (
                                    <span key={typeof g === 'string' ? g : g.name} className="text-xs font-medium px-4 py-1.5 rounded-full bg-bg-card text-[#8899aa] border border-border shadow-sm">{typeof g === 'string' ? g : g.name}</span>
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

                        {/* Cast & Crew Section */}
                        <MediaCastCrew credits={tmdbData?.credits} type={displayItem.type} />
                    </div>
                </div>
            </main>
        </div>
    )
}
