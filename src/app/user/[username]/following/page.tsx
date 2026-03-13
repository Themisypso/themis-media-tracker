import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Users } from 'lucide-react'

export default async function FollowingPage({ params }: { params: { username: string } }) {
    const user = await prisma.user.findFirst({
        where: { OR: [{ username: params.username }, { id: params.username }] },
        include: {
            following: {
                include: {
                    following: { select: { id: true, name: true, username: true, image: true, settings: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!user) notFound()

    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-12 mt-16 animate-fade-in whitespace-nowrap overflow-x-hidden">
                <Link href={`/user/${user.username || user.id}`} className="text-accent-cyan hover:underline mb-6 inline-block text-sm font-semibold">
                    &larr; Back to Profile
                </Link>
                <div className="flex items-center gap-3 mb-8">
                    <Users className="text-[#00d4ff]" size={32} />
                    <h1 className="text-3xl font-display font-bold text-text-primary">
                        Following
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.following.map(f => (
                        <Link key={f.following.id} href={`/user/${f.following.username || f.following.id}`} className="glass-card p-4 rounded-xl flex items-center gap-4 border border-border/50 hover:border-[#00d4ff] hover:-translate-y-0.5 transition-all">
                            {f.following.image ? (
                                <img src={f.following.image} alt={f.following.name || ''} className="w-12 h-12 rounded-full object-cover border border-border" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center font-bold text-xl text-[#00d4ff]">
                                    {f.following.name?.[0]?.toUpperCase() || f.following.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-text-primary text-sm truncate">{f.following.name || f.following.username}</p>
                                <p className="text-xs text-text-muted truncate">@{f.following.username}</p>
                            </div>
                        </Link>
                    ))}
                    {user.following.length === 0 && (
                        <p className="text-text-muted col-span-2 glass-card p-8 text-center rounded-xl border border-border">Not following anyone yet.</p>
                    )}
                </div>
            </div>
        </main>
    )
}
