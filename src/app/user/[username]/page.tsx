import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { UserLibraryDisplay } from '@/components/UserLibraryDisplay'
import { Globe, Lock, Twitter, Instagram, Clapperboard, CalendarDays, Heart } from 'lucide-react'
import Link from 'next/link'

interface Props {
    params: { username: string }
}

export async function generateMetadata({ params }: Props) {
    const user = await prisma.user.findUnique({
        where: { username: params.username } as any,
        // @ts-ignore
        include: { settings: true }
    })
    if (!user) return { title: 'User Not Found' }
    return {
        // @ts-ignore
        title: `${user.name || user.username} - Themis Media Tracker`,
        // @ts-ignore
        description: user.settings?.bio || 'Check out my media library on Themis Media Tracker!'
    }
}

export default async function UserProfilePage({ params }: Props) {
    // Try to find by username first, then fallback to id
    let user = await prisma.user.findUnique({
        where: { username: params.username },
        include: {
            settings: true,
            favoritePeople: {
                orderBy: { createdAt: 'desc' },
                take: 12,
            },
            favoriteMedia: {
                orderBy: { createdAt: 'desc' },
                take: 12,
            },
            _count: {
                select: {
                    mediaItems: true,
                    followers: true,
                    following: true,
                }
            }
        }
    } as any)

    // Fallback: if not found by username, try finding by user ID
    if (!user) {
        user = await prisma.user.findUnique({
            where: { id: params.username },
            include: {
                settings: true,
                favoritePeople: {
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                },
                favoriteMedia: {
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                },
                _count: {
                    select: {
                        mediaItems: true,
                        followers: true,
                        following: true,
                    }
                }
            }
        } as any)
    }

    if (!user) notFound()

    // @ts-ignore
    const isPublic = user.settings?.isPublic !== false // default true

    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in mt-16">

                {/* Header Profile Section */}
                <div className="glass-card p-8 rounded-3xl border border-border shadow-card flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent-purple/20 blur-[100px] rounded-full pointer-events-none" />

                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-full border-4 border-bg-card shadow-xl overflow-hidden bg-bg-secondary relative z-10">
                        {user.image ? (
                            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-accent-cyan to-accent-purple text-white">
                                {user.name?.[0]?.toUpperCase() || (user as any).username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left z-10">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-1">
                            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary">
                                {user.name || (user as any).username}
                            </h1>
                            {!isPublic && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-bg-secondary border border-border rounded-full text-xs font-medium text-text-secondary">
                                    <Lock size={12} />
                                    Private Profile
                                </span>
                            )}
                        </div>
                        <p className="text-text-muted text-sm mb-4">@{(user as any).username}</p>

                        {/* Bio */}
                        {/* @ts-ignore */}
                        {user.settings?.bio && (
                            <p className="text-text-secondary text-base leading-relaxed max-w-2xl mb-6">
                                {/* @ts-ignore */}
                                {user.settings.bio}
                            </p>
                        )}

                        {/* Stats Summary */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
                            <div className="flex flex-col items-center md:items-start text-text-secondary">
                                {/* @ts-ignore */}
                                <span className="font-bold text-lg text-text-primary">{user._count.mediaItems}</span>
                                <span>Library Items</span>
                            </div>
                            <div className="w-px h-8 bg-border hidden sm:block" />
                            <div className="flex flex-col items-center md:items-start text-text-secondary">
                                {/* @ts-ignore */}
                                <span className="font-bold text-lg text-text-primary">{user._count.followers}</span>
                                <span>Followers</span>
                            </div>
                            <div className="w-px h-8 bg-border hidden sm:block" />
                            <div className="flex flex-col items-center md:items-start text-text-secondary">
                                {/* @ts-ignore */}
                                <span className="font-bold text-lg text-text-primary">{user._count.following}</span>
                                <span>Following</span>
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 z-10 self-center md:self-start">
                        {/* @ts-ignore */}
                        {user.settings?.website && (
                            <a
                                // @ts-ignore
                                href={user.settings.website}
                                target="_blank" rel="noreferrer" className="p-3 bg-bg-secondary border border-border rounded-xl hover:border-accent-cyan transition-colors group">
                                <Globe size={18} className="text-text-secondary group-hover:text-accent-cyan transition-colors" />
                            </a>
                        )}
                        {/* @ts-ignore */}
                        {user.settings?.twitter && (
                            <a
                                // @ts-ignore
                                href={`https://twitter.com/${user.settings.twitter.replace('@', '')}`}
                                target="_blank" rel="noreferrer" className="p-3 bg-bg-secondary border border-border rounded-xl hover:border-accent-cyan transition-colors group">
                                <Twitter size={18} className="text-text-secondary group-hover:text-accent-cyan transition-colors" />
                            </a>
                        )}
                        {/* @ts-ignore */}
                        {user.settings?.instagram && (
                            <a
                                // @ts-ignore
                                href={`https://instagram.com/${user.settings.instagram.replace('@', '')}`}
                                target="_blank" rel="noreferrer" className="p-3 bg-bg-secondary border border-border rounded-xl hover:border-accent-purple transition-colors group">
                                <Instagram size={18} className="text-text-secondary group-hover:text-accent-purple transition-colors" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="mt-12">
                    {
                        isPublic ? (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8" >
                                <div className="space-y-12 min-w-0">
                                    {/* Favorites Horizontal Scroll */}
                                    {/* @ts-ignore */}
                                    {((user.favoritePeople?.length ?? 0) > 0 || (user.favoriteMedia?.length ?? 0) > 0) && (
                                        <div>
                                            <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2 mb-6">
                                                <Heart size={20} className="text-[#ff3264]" />
                                                Favorites
                                            </h2>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar items-stretch snap-x">
                                                {/* Map Media Favorites */}
                                                {/* @ts-ignore */}
                                                {user.favoriteMedia?.map((media: any) => (
                                                    <Link key={media.id} href={`/media/${media.tmdbId}?type=${media.type.toLowerCase()}`} className="flex-shrink-0 w-32 group snap-start">
                                                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-border group-hover:border-accent-cyan transition-colors relative bg-bg-secondary">
                                                            {media.posterUrl ? (
                                                                <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full h-full text-text-muted text-xs text-center p-2">{media.title}</div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-cyan transition-colors">{media.title}</p>
                                                        <p className="text-xs text-text-muted capitalize">{media.type.toLowerCase()}</p>
                                                    </Link>
                                                ))}

                                                {/* Map People Favorites */}
                                                {/* @ts-ignore */}
                                                {user.favoritePeople?.map((person: any) => (
                                                    <Link key={person.id} href={`/people?search=${encodeURIComponent(person.name)}`} className="flex-shrink-0 w-32 group snap-start">
                                                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-border group-hover:border-accent-purple transition-colors relative bg-bg-secondary">
                                                            {person.profileUrl ? (
                                                                <img src={person.profileUrl} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full h-full text-text-muted text-xs text-center p-2">{person.name}</div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-purple transition-colors">{person.name}</p>
                                                        <p className="text-xs text-text-muted">{person.knownForDepartment || 'Actor'}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2 mb-6">
                                            <Clapperboard size={20} className="text-accent-cyan" />
                                            Library Overview
                                        </h2>

                                        <UserLibraryDisplay
                                            userId={user.id}
                                            // @ts-ignore
                                            hideRatings={user.settings?.hideRatings ?? false}
                                        />
                                    </div>
                                </div>

                                <aside className="space-y-6">
                                    <div className="glass-card p-6 rounded-2xl border border-border">
                                        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                                            <CalendarDays size={16} className="text-accent-purple" />
                                            Member Since
                                        </h3>
                                        <p className="text-text-secondary text-sm">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                </aside>
                            </div>
                        ) : (
                            <div className="glass-card p-16 text-center rounded-3xl border border-border flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
                                    <Lock size={24} className="text-text-secondary" />
                                </div>
                                <h2 className="text-2xl font-bold font-display text-text-primary mb-2">This profile is private</h2>
                                <p className="text-text-secondary max-w-md">
                                    {user.name || (user as any).username} has chosen to keep their library and activity private.
                                </p>
                            </div>
                        )}
                </div>
            </div>
        </main>
    )
}
