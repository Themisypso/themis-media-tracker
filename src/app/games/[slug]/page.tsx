import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Star, Clock, Monitor, ArrowLeft, ExternalLink, Gamepad2, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { MediaActionPanel } from '@/components/MediaActionPanel'

const RAWG_BASE = 'https://api.rawg.io/api'
const API_KEY = process.env.RAWG_API_KEY

async function getGameDetail(slug: string) {
    if (!API_KEY) return null
    try {
        const [gameRes, screenshotsRes] = await Promise.all([
            fetch(`${RAWG_BASE}/games/${slug}?key=${API_KEY}`, { next: { revalidate: 3600 } }),
            fetch(`${RAWG_BASE}/games/${slug}/screenshots?key=${API_KEY}`, { next: { revalidate: 3600 } }),
        ])
        if (!gameRes.ok) return null
        const game = await gameRes.json()
        const screenshots = screenshotsRes.ok ? (await screenshotsRes.json()).results || [] : []
        return {
            id: game.id,
            slug: game.slug,
            title: game.name,
            description: game.description_raw || null,
            coverUrl: game.background_image || null,
            releaseYear: game.released ? parseInt(game.released.split('-')[0]) : null,
            releaseDate: game.released || null,
            genres: (game.genres || []).map((g: any) => g.name),
            platforms: (game.platforms || []).map((p: any) => p.platform.name),
            developers: (game.developers || []).map((d: any) => d.name),
            publishers: (game.publishers || []).map((p: any) => p.name),
            tags: (game.tags || []).slice(0, 8).map((t: any) => t.name),
            rating: game.rating || null,
            metacritic: game.metacritic || null,
            playtime: game.playtime || null,
            website: game.website || null,
            screenshots: screenshots.slice(0, 6).map((s: any) => s.image),
            esrb: game.esrb_rating?.name || null,
        }
    } catch {
        return null
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const game = await getGameDetail(params.slug)
    if (!game) return { title: 'Game Not Found' }
    return {
        title: `${game.title} - Themis`,
        description: game.description?.slice(0, 160),
    }
}

export default async function GameDetailPage({ params }: { params: { slug: string } }) {
    const session = await getServerSession(authOptions)
    const game = await getGameDetail(params.slug)

    if (!game) notFound()

    // Check if the user has tracked this game (by rawgId = slug)
    let userMediaItem: any = null
    if (session?.user?.id) {
        userMediaItem = await prisma.mediaItem.findFirst({
            where: { userId: session.user.id, rawgId: game.slug } as any
        })
    }

    // Build a baseItem for MediaActionPanel
    const widgetItem = {
        tmdbId: String(game.id),
        title: game.title,
        type: 'GAME',
        posterUrl: game.coverUrl,
        releaseYear: game.releaseYear,
        genres: game.genres,
        overview: game.description?.slice(0, 500) ?? null,
        tmdbRating: game.rating ? game.rating * 2 : null, // rawg /5 -> /10
        rawgId: game.slug,
    }

    return (
        <div className="min-h-screen cyber-bg">
            <Navbar />

            {/* Backdrop */}
            {game.coverUrl && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <img src={game.coverUrl} alt="" className="w-full h-full object-cover opacity-10 blur-xl scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/80 via-bg-primary/95 to-bg-primary" />
                </div>
            )}

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
                <Link href="/games" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Games
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
                    {/* Sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Cover */}
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-2xl bg-bg-secondary">
                            {game.coverUrl ? (
                                <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Gamepad2 size={48} className="text-text-muted opacity-50" />
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="glass-card rounded-xl border border-border p-4 space-y-3 text-sm">
                            {game.metacritic && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Metacritic</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-sm ${game.metacritic >= 75 ? 'bg-[#6c3] text-black' : game.metacritic >= 50 ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'}`}>
                                        {game.metacritic}
                                    </span>
                                </div>
                            )}
                            {game.rating && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">RAWG Rating</span>
                                    <span className="flex items-center gap-1 font-bold text-[#ffd700]">
                                        <Star size={13} fill="currentColor" /> {game.rating.toFixed(1)}/5
                                    </span>
                                </div>
                            )}
                            {game.playtime && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Avg Playtime</span>
                                    <span className="flex items-center gap-1 font-medium text-text-primary">
                                        <Clock size={13} /> ~{game.playtime}h
                                    </span>
                                </div>
                            )}
                            {game.releaseDate && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Released</span>
                                    <span className="font-medium text-text-primary flex items-center gap-1">
                                        <Calendar size={13} /> {game.releaseDate}
                                    </span>
                                </div>
                            )}
                            {game.esrb && (
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">ESRB</span>
                                    <span className="font-medium text-text-primary">{game.esrb}</span>
                                </div>
                            )}
                        </div>

                        {/* Track / Action Panel */}
                        <MediaActionPanel
                            baseItem={widgetItem}
                            userMediaItem={userMediaItem}
                            session={session}
                            urlId={`game-${game.slug}`}
                        />

                        {game.website && (
                            <a href={game.website} target="_blank" rel="noreferrer"
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                                <ExternalLink size={14} /> Official Website
                            </a>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-text-primary mb-2">{game.title}</h1>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {game.genres.map((g: string) => (
                                    <span key={g} className="text-xs px-3 py-1 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] font-medium">{g}</span>
                                ))}
                            </div>
                        </div>

                        {/* Developer / Publisher */}
                        <div className="glass-card rounded-xl border border-border p-5">
                            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Users size={14} /> Credits
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {game.developers.length > 0 && (
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">Developer</p>
                                        <p className="font-semibold text-text-primary text-sm">{game.developers.join(', ')}</p>
                                    </div>
                                )}
                                {game.publishers.length > 0 && (
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">Publisher</p>
                                        <p className="font-semibold text-text-primary text-sm">{game.publishers.join(', ')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Platforms */}
                        {game.platforms.length > 0 && (
                            <div className="glass-card rounded-xl border border-border p-5">
                                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Monitor size={14} /> Platforms
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {game.platforms.map((p: string) => (
                                        <span key={p} className="text-xs px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-secondary">{p}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {game.description && (
                            <div className="glass-card rounded-xl border border-border p-5">
                                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">About</h2>
                                <p className="text-text-secondary text-sm leading-relaxed line-clamp-6">{game.description}</p>
                            </div>
                        )}

                        {/* Tags */}
                        {game.tags.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Tags</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {game.tags.map((t: string) => (
                                        <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-bg-secondary border border-border text-text-muted">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Screenshots */}
                        {game.screenshots.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Screenshots</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {game.screenshots.map((src: string, i: number) => (
                                        <a key={i} href={src} target="_blank" rel="noreferrer" className="block aspect-video rounded-xl overflow-hidden border border-border hover:border-[#00ff9d]/50 transition-colors group">
                                            <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
