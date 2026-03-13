'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Users, Loader2, Copy, Check, Film, Tv, Sparkles } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface MatchData {
    id: string
    title: string
    type: string
    posterUrl: string | null
    tmdbId: string | null
    statuses: { userId: string, status: string, rating: number | null }[]
}

interface Participant {
    id: string
    userId: string
    user: { id: string, name: string | null, username: string | null, image: string | null }
}

interface SyncData {
    session: { id: string, code: string, hostId: string, participants: Participant[] }
    matches: {
        exact: MatchData[]
        planToWatch: MatchData[]
    }
}

export default function SharedLibraryRoom() {
    const params = useParams()
    const router = useRouter()
    const code = params.code as string

    const [data, setData] = useState<SyncData | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const fetchSync = async () => {
            try {
                const res = await fetch(`/api/shared-session/${code}/sync`)
                if (res.status === 403) {
                    toast.error('You must join the room first')
                    router.push('/shared-library')
                    return
                }
                if (!res.ok) throw new Error()
                const json = await res.json()
                setData(json)
            } catch {
                // ignore parsing errors on unmount
            } finally {
                setLoading(false)
            }
        }

        fetchSync()
        timerRef.current = setInterval(fetchSync, 4000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [code, router])

    const copyCode = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        toast.success('Room code copied!')
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading && !data) {
        return (
            <main className="min-h-screen cyber-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={48} className="animate-spin text-accent-cyan" />
                </div>
            </main>
        )
    }

    if (!data) return null

    return (
        <main className="min-h-screen cyber-bg flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 mt-16 animate-fade-in">
                {/* Header info */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 glass-card p-6 rounded-3xl border border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-accent-cyan rounded-2xl flex items-center justify-center shadow-lg">
                            <Users size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-text-primary">Shared Session</h1>
                            <p className="text-text-secondary flex items-center gap-2">
                                Room Code:
                                <span className="font-mono bg-bg-secondary px-2 py-0.5 rounded text-accent-cyan font-bold tracking-widest">{code}</span>
                                <button onClick={copyCode} className="text-text-muted hover:text-white transition-colors">
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Participants Row */}
                    <div className="flex flex-col md:items-end">
                        <p className="text-sm text-text-muted mb-2 font-medium">Participants</p>
                        <div className="flex -space-x-3 overflow-hidden p-1">
                            {data.session.participants.map(p => (
                                <img
                                    key={p.id}
                                    src={p.user.image || `https://ui-avatars.com/api/?name=${p.user.name || p.user.username}&background=random`}
                                    alt={p.user.name || ''}
                                    className="w-10 h-10 rounded-full border-2 border-bg-card object-cover"
                                    title={p.user.name || p.user.username || ''}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {data.session.participants.length < 2 && (
                    <div className="text-center py-20 px-4 glass-card rounded-3xl border border-border border-dashed">
                        <Loader2 size={48} className="mx-auto mb-6 text-accent-purple animate-spin" />
                        <h2 className="text-2xl font-bold font-display text-text-primary mb-2">Waiting for friends...</h2>
                        <p className="text-text-secondary max-w-sm mx-auto">
                            Share the room code <span className="font-mono text-accent-cyan font-bold">{code}</span> for others to join. Results will appear here automatically when someone joins.
                        </p>
                    </div>
                )}

                {data.session.participants.length >= 2 && (
                    <div className="space-y-12">
                        {/* Mutual Plan to Watch */}
                        <section>
                            <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-6 text-text-primary">
                                <Sparkles className="text-accent-pink" /> Perfect Matches to Watch
                            </h2>
                            {data.matches.planToWatch.length === 0 ? (
                                <p className="text-text-muted bg-bg-secondary/30 p-4 rounded-xl border border-border text-center">
                                    No mutual "Plan to Watch" items found.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {data.matches.planToWatch.map(item => (
                                        <Link key={item.id} href={`/media/${item.tmdbId}?type=${item.type.toLowerCase()}`} className="glass-card group flex flex-col rounded-xl overflow-hidden border border-border hover:border-accent-pink transition-colors">
                                            <div className="aspect-[2/3] w-full bg-bg-secondary relative">
                                                {item.posterUrl ? (
                                                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full p-4 text-center text-xs text-text-muted">{item.title}</div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-accent-pink text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow">
                                                    Mutual
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="font-bold text-sm text-text-primary truncate">{item.title}</p>
                                                <p className="text-xs text-text-muted capitalize">{item.type.toLowerCase()}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Exact Matches (Anything else they share) */}
                        <section>
                            <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-6 text-text-primary">
                                <Film className="text-accent-cyan" /> Other Mutual Media
                            </h2>
                            {data.matches.exact.length === 0 ? (
                                <p className="text-text-muted bg-bg-secondary/30 p-4 rounded-xl border border-border text-center">
                                    No other shared items in your libraries.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {data.matches.exact.map(item => (
                                        <Link key={item.id} href={`/media/${item.tmdbId}?type=${item.type.toLowerCase()}`} className="glass-card group flex flex-col rounded-xl overflow-hidden border border-border hover:border-accent-cyan transition-colors">
                                            <div className="aspect-[2/3] w-full bg-bg-secondary overflow-hidden">
                                                {item.posterUrl ? (
                                                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full p-4 text-center text-xs text-text-muted">{item.title}</div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="font-bold text-sm text-text-primary truncate">{item.title}</p>
                                                <p className="text-xs text-text-muted capitalize">{item.type.toLowerCase()}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </main>
    )
}
