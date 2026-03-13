import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { ListCard } from '@/components/ListCard'
import { Layers } from 'lucide-react'
import Link from 'next/link'
import { CreateListModal } from './CreateListModal'

export const dynamic = 'force-dynamic'

export default async function ListsPage({ searchParams }: { searchParams: { filter?: string } }) {
    const session = await getServerSession(authOptions)

    const filter = searchParams.filter || 'popular'

    let whereClause: any = { isPublic: true }
    let orderByClause: any = { createdAt: 'desc' }

    if (filter === 'my') {
        if (!session?.user?.id) redirect('/auth/login?callbackUrl=/lists?filter=my')
        whereClause = { userId: session.user.id }
    } else if (filter === 'popular') {
        orderByClause = { likes: { _count: 'desc' } }
    } else if (filter === 'featured') {
        whereClause = { isPublic: true, isFeatured: true }
    }

    const lists = await prisma.list.findMany({
        where: whereClause,
        take: 30,
        orderBy: orderByClause,
        include: {
            user: { select: { name: true, image: true, username: true } },
            items: { take: 4, orderBy: { order: 'asc' } },
            _count: { select: { items: true, likes: true } },
            likes: true
        }
    })

    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-accent-cyan/20 flex items-center justify-center mb-4">
                            <Layers size={24} className="text-accent-cyan" />
                        </div>
                        <h1 className="text-4xl font-display font-bold text-text-primary mb-2">Community Loops</h1>
                        <p className="text-text-secondary">Curated collections from the community. Find your next obsession.</p>
                    </div>

                    <CreateListModal />
                </div>

                <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    <Link href="/lists?filter=popular" className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === 'popular' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-muted hover:text-text-primary bg-bg-card border border-border/50'}`}>
                        Trending
                    </Link>
                    <Link href="/lists?filter=recent" className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === 'recent' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-muted hover:text-text-primary bg-bg-card border border-border/50'}`}>
                        Recent
                    </Link>
                    <Link href="/lists?filter=featured" className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === 'featured' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-muted hover:text-text-primary bg-bg-card border border-border/50'}`}>
                        Staff Picks
                    </Link>
                    {session && (
                        <>
                            <div className="w-px h-6 bg-border mx-2" />
                            <Link href="/lists?filter=my" className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === 'my' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-muted hover:text-text-primary bg-bg-card border border-border/50'}`}>
                                My Collections
                            </Link>
                        </>
                    )}
                </div>

                {lists.length === 0 ? (
                    <div className="text-center py-20 bg-bg-card/30 border border-dashed border-border rounded-3xl">
                        <Layers size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-text-secondary">No lists found in this category.</p>
                        {session && <p className="text-xs text-text-muted mt-2">Start curating your first list using the button above!</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {lists.map((list) => (
                            <ListCard key={list.id} list={list} currentUserId={session?.user?.id} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
