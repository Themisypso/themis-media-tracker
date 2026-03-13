import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { ProfileTabs } from '@/components/ProfileTabs'
import { Globe, Lock, Twitter, Instagram, CalendarDays } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FollowButton } from '@/components/FollowButton'
import { FriendButton, FriendStatus } from '@/components/FriendButton'
import Link from 'next/link'

interface Props {
    params: { username: string }
}

// React.cache deduplicates this call — generateMetadata and the page
// component both call this function but it only runs one DB query per render.
const getUser = cache(async (slug: string) => {
    return prisma.user.findFirst({
        // @ts-ignore
        where: { OR: [{ username: slug }, { id: slug }] },
        include: {
            settings: true,
            quotes: { orderBy: { createdAt: 'desc' }, take: 15, include: { media: true, user: { select: { username: true, name: true, image: true } }, likes: true, _count: { select: { likes: true, comments: true } } } },
            favoritePeople: { orderBy: { createdAt: 'desc' }, take: 20 },
            favoriteMedia: { orderBy: { createdAt: 'desc' }, take: 20 },
            lists: {
                where: { isPublic: true },
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: { select: { username: true, name: true, image: true } },
                    items: { take: 4, orderBy: { order: 'asc' } },
                    _count: { select: { items: true, likes: true } }
                }
            },
            _count: { select: { mediaItems: true, followers: true, following: true } }
        }
    })
})

export async function generateMetadata({ params }: Props) {
    const user = await getUser(params.username)
    if (!user) return { title: 'User Not Found' }
    const userObj = user as any;
    return {
        title: `${userObj.name || userObj.username} - Themis`,
        description: userObj.settings?.bio || 'Check out my media library on Themis!'
    }
}

export default async function UserProfilePage({ params }: Props) {
    const user = await getUser(params.username)
    if (!user) notFound()

    const session = await getServerSession(authOptions)
    let isFollowing = false
    let friendStatus: FriendStatus = 'NOT_FRIENDS'

    if (session?.user?.id && user.id !== session.user.id) {
        // Follow status
        const follow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: user.id
                }
            }
        })
        isFollowing = !!follow

        // Friend status
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: session.user.id, user2Id: user.id },
                    { user1Id: user.id, user2Id: session.user.id }
                ]
            }
        })
        if (friendship) {
            friendStatus = 'FRIENDS'
        } else {
            const req = await prisma.friendRequest.findFirst({
                where: {
                    OR: [
                        { senderId: session.user.id, receiverId: user.id },
                        { senderId: user.id, receiverId: session.user.id }
                    ],
                    status: 'PENDING'
                }
            })
            if (req) friendStatus = req.senderId === session.user.id ? 'PENDING_SENT' : 'PENDING_RECEIVED'
        }
    }

    const userObj = user as any;
    const isPublic = userObj.settings?.isPublic !== false

    const allMediaItems = isPublic ? await prisma.mediaItem.findMany({
        where: { userId: userObj.id },
        select: {
            id: true, title: true, type: true, status: true,
            posterUrl: true, releaseYear: true, tmdbId: true,
            rawgId: true,
            bookId: true,
        },
        orderBy: { updatedAt: 'desc' },
    }) : []

    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />

            <div className="relative">
                {/* Cover Area */}
                <div className="h-48 md:h-64 w-full bg-gradient-to-br from-accent-purple/20 via-bg-secondary to-accent-cyan/20 relative overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                    {/* Dynamic Blobs */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                </div>

                {/* Profile Header Container */}
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 md:-mt-20 mb-12">
                        {/* Avatar */}
                        <div className="relative shrink-0 group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-bg-card p-1 shadow-2xl border border-border/50 group-hover:scale-[1.02] transition-transform duration-500">
                                {userObj.image ? (
                                    <img src={userObj.image} alt={userObj.name || userObj.username} className="w-full h-full object-cover rounded-[1.4rem]" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-bg-secondary to-bg-card rounded-[1.4rem] flex items-center justify-center text-4xl font-bold text-text-primary">
                                        {(userObj.name || userObj.username)?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Info & Actions */}
                        <div className="flex-1 pb-2">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight drop-shadow-sm">
                                            {userObj.name || userObj.username}
                                        </h1>
                                        {userObj.role === 'ADMIN' && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-[10px] font-black tracking-widest uppercase border border-accent-purple/30 backdrop-blur-md">Staff</span>
                                        )}
                                        {!isPublic && (
                                            <Lock size={16} className="text-text-muted" />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-text-muted font-bold text-sm">
                                        <span className="text-accent-cyan cursor-default">@{userObj.username}</span>
                                        <div className="flex items-center gap-1.5 opacity-70">
                                            <CalendarDays size={14} />
                                            Joined {new Date(userObj.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {session?.user?.id && userObj.id !== session.user.id ? (
                                        <>
                                            <FollowButton targetUserId={userObj.id} initialFollowing={isFollowing} />
                                            <FriendButton targetUserId={userObj.id} initialStatus={friendStatus} />
                                        </>
                                    ) : session?.user?.id === userObj.id && (
                                        <Link href="/settings" className="px-6 py-2.5 rounded-xl bg-bg-card border border-border hover:border-text-primary transition-all text-sm font-bold flex items-center gap-2">
                                            Edit Profile
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Bio Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
                        {/* Bio & Links */}
                        <div className="lg:col-span-8 space-y-8">
                            {userObj.settings?.bio && (
                                <p className="text-xl text-text-secondary leading-relaxed max-w-3xl whitespace-pre-line font-medium italic">
                                    "{userObj.settings.bio}"
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3">
                                {userObj.steamId && userObj.settings?.showSteamProfile && (
                                    <a href={`https://steamcommunity.com/profiles/${userObj.steamId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-card border border-border hover:border-[#66c0f4]/50 transition-all group">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png" alt="Steam" className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                                        <span className="text-sm font-bold">Steam</span>
                                    </a>
                                )}
                                {userObj.settings?.website && (
                                    <a href={userObj.settings.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-card border border-border hover:border-accent-cyan/50 hover:text-accent-cyan transition-all text-sm font-bold">
                                        <Globe size={18} /> Website
                                    </a>
                                )}
                                {userObj.settings?.twitter && (
                                    <a href={`https://twitter.com/${userObj.settings.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-card border border-border hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2] transition-all text-sm font-bold">
                                        <Twitter size={18} /> Twitter
                                    </a>
                                )}
                                {userObj.settings?.instagram && (
                                    <a href={`https://instagram.com/${userObj.settings.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-card border border-border hover:border-accent-pink/50 hover:text-accent-pink transition-all text-sm font-bold">
                                        <Instagram size={18} /> Instagram
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Social Stats Card */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24">
                            <div className="glass-card p-8 rounded-[2.5rem] border border-border/50 bg-bg-card/20 backdrop-blur-xl grid grid-cols-3 gap-2 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="text-center relative z-10">
                                    <div className="text-3xl font-display font-black text-white">{userObj._count?.mediaItems || 0}</div>
                                    <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Items</div>
                                </div>
                                <div className="text-center relative z-10">
                                    <div className="text-3xl font-display font-black text-white">{userObj._count?.followers || 0}</div>
                                    <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Fans</div>
                                </div>
                                <div className="text-center relative z-10">
                                    <div className="text-3xl font-display font-black text-white">{userObj._count?.following || 0}</div>
                                    <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Flows</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 pb-32">
                {isPublic ? (
                    <ProfileTabs
                        userId={userObj.id}
                        currentUserId={session?.user?.id}
                        mediaItems={allMediaItems as any}
                        favoriteMedia={userObj.favoriteMedia || []}
                        favoritePeople={userObj.favoritePeople || []}
                        quotes={userObj.quotes || []}
                        lists={userObj.lists || []}
                    />
                ) : (
                    <div className="glass-card p-24 text-center rounded-[3rem] border border-border/50 bg-bg-card/20 backdrop-blur-md flex flex-col items-center justify-center mt-8">
                        <div className="w-20 h-20 bg-bg-secondary/50 rounded-3xl flex items-center justify-center mb-8 border border-border animate-pulse">
                            <Lock size={32} className="text-text-muted" />
                        </div>
                        <h2 className="text-3xl font-black font-display text-white mb-4 tracking-tight">Private Access</h2>
                        <p className="text-text-secondary max-w-md text-lg">
                            {userObj.name || userObj.username} has kept their loops private. Follow them to request access.
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}
