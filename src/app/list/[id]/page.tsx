import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { PosterCard } from '@/components/PosterCard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Lock, Globe, List as ListIcon, User as UserIcon } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'

export default async function ListViewPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    const list = await prisma.list.findUnique({
        where: { id: params.id },
        include: {
            user: { select: { id: true, username: true, name: true, image: true } },
            items: { orderBy: { order: 'asc' } }
        }
    })

    if (!list) notFound()

    // Privacy check
    const isOwner = session?.user?.id === list.userId
    if (!list.isPublic && !isOwner) {
        redirect('/') // Unauthorized
    }

    // Convert ListItems to standard PosterCard props structure
    const mappedItems = list.items.map(item => ({
        id: item.id,
        tmdbId: item.tmdbId,
        rawgId: item.rawgId,
        bookId: item.bookId,
        type: item.mediaType,
        title: item.title,
        posterUrl: item.posterUrl,
    }))

    return (
        <div className="min-h-screen cyber-bg pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12 bg-bg-card/60 backdrop-blur-xl border border-border/50 p-6 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-accent-cyan/15 transition-colors duration-1000" />

                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="bg-bg-secondary/50 p-2.5 rounded-xl border border-border/50 text-accent-cyan shadow-sm"><ListIcon size={24} /></span>
                            {list.isPublic ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold bg-accent-cyan/10 text-accent-cyan px-3 py-1.5 rounded-full border border-accent-cyan/20 uppercase tracking-widest"><Globe size={12} /> Public List</span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-bold bg-accent-pink/10 text-accent-pink px-3 py-1.5 rounded-full border border-accent-pink/20 uppercase tracking-widest"><Lock size={12} /> Private List</span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-text-primary mb-4 leading-[1.1] tracking-tight">
                            {list.title}
                        </h1>

                        <p className="text-text-secondary text-base md:text-lg mb-6 max-w-2xl leading-relaxed">
                            {list.description || 'No description provided for this collection.'}
                        </p>

                        <div className="flex items-center gap-4 border-t border-border pt-6">
                            <Link href={`/user/${list.user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                {list.user.image ? (
                                    <img src={list.user.image} alt={list.user.name || 'User'} className="w-10 h-10 rounded-full border border-border" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-accent-pink">
                                        <UserIcon size={20} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-text-primary leading-tight">{list.user.name}</p>
                                    <p className="text-xs text-text-muted mt-0.5">@{list.user.username}</p>
                                </div>
                            </Link>

                            <div className="h-8 w-px bg-border mx-2" />

                            <div>
                                <p className="text-xs text-text-muted mb-0.5">Items</p>
                                <p className="text-sm font-bold text-text-primary">{list.items.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {mappedItems.length === 0 ? (
                    <div className="py-20 text-center glass-card border border-border rounded-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-bg-hover border border-border flex items-center justify-center mx-auto mb-4 text-text-secondary">
                            <ListIcon size={24} />
                        </div>
                        <h3 className="text-xl font-display font-medium text-text-primary mb-2">This list is empty</h3>
                        <p className="text-text-muted">
                            {isOwner ? "You haven't added any items yet. Start adding items from media pages!" : "The author hasn't added any items to this list yet."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
                            <h2 className="text-xl font-display font-bold text-text-primary">Items ({mappedItems.length})</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {mappedItems.map((item, index) => {
                                // Create a pseudo media object for the poster card
                                const mediaObj: any = {
                                    id: item.id,
                                    tmdbId: item.tmdbId,
                                    rawgId: item.rawgId ? parseInt(item.rawgId) : null,
                                    bookId: item.bookId,
                                    title: item.title,
                                    posterUrl: item.posterUrl,
                                    type: item.type,
                                    status: 'PLANNED',
                                    genres: [],
                                    releaseYear: null
                                }

                                // Route to detail page based on type
                                let href = ''
                                if (item.type === 'GAME') href = `/media/${item.rawgId}?type=game`
                                else href = `/media/${item.tmdbId}?type=${item.type.toLowerCase()}`

                                return (
                                    <div key={item.id} className="relative group">
                                        <div className="absolute -left-2 -top-2 w-7 h-7 bg-bg-card border border-border rounded-full flex items-center justify-center text-xs font-bold text-text-primary shadow-lg z-20 group-hover:scale-110 transition-transform group-hover:bg-accent-pink group-hover:border-accent-pink group-hover:text-white">
                                            {index + 1}
                                        </div>
                                        <PosterCard item={mediaObj} href={href} hideStatus showContextMenu={false} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
