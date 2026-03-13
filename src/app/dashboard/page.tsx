'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { InProgressCard } from '@/components/InProgressCard'
import { RecommendationsCarousel } from '@/components/RecommendationsCarousel'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Clock, Film, Tv, Gamepad2, TrendingUp, CheckCircle, Eye, BookMarked, X, PlayCircle, Sparkles, Users } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Analytics {
    overview: {
        totalItems: number
        totalWatchHours: number
        totalPlayHours: number
        totalHours: number
    }
    typeStats: Record<string, { count: number; totalMinutes: number }>
    statusStats: Record<string, number>
    yearlyStats: Record<string, number>
    topGames?: { id: string; title: string; totalTimeMinutes: number; posterUrl: string | null }[]
    topGenres?: { name: string; count: number }[]
    favoritePeople?: { id: string; name: string; profileUrl: string | null; knownForDepartment: string | null }[]
}

const TYPE_COLORS: Record<string, string> = {
    ANIME: '#ff9500', MOVIE: '#00d4ff', TVSHOW: '#a78bfa', GAME: '#00ff9d', BOOK: '#ff6b9d'
}
const STATUS_COLORS: Record<string, string> = {
    WATCHING: '#00d4ff', COMPLETED: '#00ff9d', PLANNED: '#a78bfa', DROPPED: '#ff2d7a'
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card px-4 py-3 text-xs">
                <p className="text-text-secondary mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.fill || p.color }}>{p.name}: <span className="font-bold">{Math.round(p.value / 60 * 10) / 10}h</span></p>
                ))}
            </div>
        )
    }
    return null
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [inProgress, setInProgress] = useState<any[]>([])

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (session) {
            fetch('/api/analytics').then(async r => {
                if (!r.ok) return null
                try { return await r.json() } catch { return null }
            }).then(d => {
                if (d) setAnalytics(d)
                setLoading(false)
            }).catch(() => setLoading(false))
            fetch('/api/dashboard/in-progress').then(async r => {
                if (!r.ok) return []
                try { return await r.json() } catch { return [] }
            }).then(d => {
                if (Array.isArray(d)) setInProgress(d)
            }).catch(() => { })
        }
    }, [session])

    if (status === 'loading' || !session) return null

    const typeChartData = analytics ? Object.entries(analytics.typeStats).map(([type, data]) => ({
        name: type, value: data.totalMinutes, count: data.count,
    })).filter(d => d.count > 0) : []

    const yearlyChartData = analytics ? Object.entries(analytics.yearlyStats).sort().map(([year, minutes]) => ({
        year, minutes, hours: Math.round(minutes / 60 * 10) / 10
    })) : []

    const statusData = analytics ? Object.entries(analytics.statusStats).filter(([, v]) => v > 0).map(([s, count]) => ({
        name: s, value: count
    })) : []

    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-display font-bold text-text-primary">
                        Welcome back, <span className="bg-gradient-to-br from-accent-cyan to-accent-purple text-transparent bg-clip-text">
                            {session.user?.name?.split(' ')[0] || 'Tracker'}
                        </span>
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">Here&apos;s your media consumption overview</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl shimmer" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Main Stats Area */}
                        <div className="xl:col-span-3">
                            {/* ─── In Progress Section ─────────────────────────────────────────── */}
                            {inProgress.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <PlayCircle size={18} className="text-accent-cyan" />
                                        <h2 className="font-display font-semibold text-text-primary">Continue Watching</h2>
                                        <span className="text-xs text-text-muted ml-1">{inProgress.length} active</span>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                        {inProgress.map(item => (
                                            <InProgressCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <RecommendationsCarousel />

                            {/* Stats cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Total Watch Time', value: `${analytics?.overview.totalWatchHours}h`, icon: <Clock size={20} />, color: '#00d4ff', glow: 'stat-glow-cyan' },
                                    { label: 'Total Play Time', value: `${analytics?.overview.totalPlayHours}h`, icon: <Gamepad2 size={20} />, color: '#7b2fff', glow: 'stat-glow-purple' },
                                    { label: 'Combined Hours', value: `${analytics?.overview.totalHours}h`, icon: <TrendingUp size={20} />, color: '#ff2d7a', glow: 'stat-glow-pink' },
                                    { label: 'Items Tracked', value: `${analytics?.overview.totalItems}`, icon: <Film size={20} />, color: '#00ff9d', glow: 'stat-glow-green' },
                                ].map(({ label, value, icon, color, glow }) => (
                                    <div key={label} className={`glass-card p-5 ${glow}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs text-text-secondary mb-2 font-medium">{label}</p>
                                                <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
                                            </div>
                                            <div className="p-2 rounded-lg" style={{ background: `${color}18`, color }}>
                                                {icon}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Top Played Games Section */}
                            {analytics?.topGames && analytics.topGames.length > 0 && (
                                <div className="glass-card p-6 mb-8 animate-fade-in">
                                    <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Gamepad2 size={20} className="text-[#00ff9d]" />
                                        Top Played Games
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {analytics.topGames.map((game, i) => (
                                            <div key={game.id} className="flex items-center gap-4 bg-bg-secondary p-4 rounded-xl border border-border hover:border-[#00ff9d]/30 transition-colors">
                                                <div className="text-xl font-display font-bold text-text-muted w-6 text-center">{i + 1}</div>
                                                {game.posterUrl ? (
                                                    <img src={game.posterUrl} alt={game.title} className="w-12 h-16 object-cover rounded-md flex-shrink-0 shadow-md" />
                                                ) : (
                                                    <div className="w-12 h-16 bg-bg-card rounded-md flex items-center justify-center flex-shrink-0 border border-border/50">
                                                        <Gamepad2 size={24} className="text-text-muted" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-text-primary truncate text-sm">{game.title}</h3>
                                                    <p className="text-xs text-text-secondary mt-1 font-mono text-[#00ff9d]">
                                                        {Math.round((game.totalTimeMinutes ?? 0) / 60)} hours
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Top Genres Section */}
                                {analytics?.topGenres && analytics.topGenres.length > 0 && (
                                    <div className="glass-card p-6 animate-fade-in">
                                        <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                            <Sparkles size={20} className="text-accent-pink" />
                                            Your Top Genres
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {analytics.topGenres.map((genre, i) => (
                                                <div key={genre.name} className="px-3 py-1.5 rounded-full bg-bg-secondary border border-border flex items-center gap-2 text-sm text-text-primary">
                                                    <span className="font-bold text-accent-pink">#{i + 1}</span>
                                                    {genre.name}
                                                    <span className="text-xs text-text-muted">({genre.count})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Favorite People Section */}
                                {analytics?.favoritePeople && analytics.favoritePeople.length > 0 && (
                                    <div className="glass-card p-6 animate-fade-in">
                                        <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                            <Users size={20} className="text-accent-cyan" />
                                            Favorite Actors & Directors
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {analytics.favoritePeople.map((person) => (
                                                <div key={person.id} className="flex items-center gap-3 bg-bg-secondary p-2 pr-3 rounded-full border border-border hover:border-accent-cyan transition-colors">
                                                    {person.profileUrl ? (
                                                        <img src={person.profileUrl} alt={person.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-bg-card rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-accent-cyan">
                                                            {person.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-xs text-text-primary truncate">{person.name}</p>
                                                        <p className="text-[10px] text-text-muted capitalize">{person.knownForDepartment || 'Person'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Charts row */}
                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                {/* Pie chart: by type */}
                                <div className="glass-card p-6">
                                    <h2 className="font-display font-semibold text-text-primary mb-4">Media Breakdown</h2>
                                    {typeChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={typeChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                                                    {typeChartData.map((entry) => (
                                                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || 'var(--text-secondary)'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: number) => [`${v} items`, 'Count']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                                                <Legend formatter={name => <span style={{ color: TYPE_COLORS[name] || 'var(--text-secondary)', fontSize: 12 }}>{name}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">Add media to see breakdown</div>
                                    )}
                                </div>

                                {/* Bar chart: by type hours */}
                                <div className="glass-card p-6">
                                    <h2 className="font-display font-semibold text-text-primary mb-4">Hours by Type</h2>
                                    {typeChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={typeChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {typeChartData.map(entry => (
                                                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || 'var(--text-secondary)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">Add media to see chart</div>
                                    )}
                                </div>
                            </div>

                            {/* Yearly Chart */}
                            {yearlyChartData.length > 0 && (
                                <div className="glass-card p-6 mb-6">
                                    <h2 className="font-display font-semibold text-text-primary mb-4">Yearly Consumption</h2>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={yearlyChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: number) => [`${Math.round(v / 60 * 10) / 10}h`, 'Total time']} labelStyle={{ color: 'var(--text-secondary)' }} />
                                            <Bar dataKey="minutes" fill="url(#yearGrad)" radius={[4, 4, 0, 0]} />
                                            <defs>
                                                <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#00d4ff" />
                                                    <stop offset="100%" stopColor="#7b2fff" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Status breakdown */}
                            {statusData.length > 0 && (
                                <div className="glass-card p-6">
                                    <h2 className="font-display font-semibold text-text-primary mb-4">Status Overview</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {statusData.map(({ name, value }) => (
                                            <div key={name} className={`rounded-xl p-4 text-center status-${name}`} style={{ background: `${STATUS_COLORS[name]}12` }}>
                                                <p className="text-2xl font-bold">{value}</p>
                                                <p className="text-xs mt-1 capitalize">{name.toLowerCase()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analytics?.overview.totalItems === 0 && (
                                <div className="text-center py-20 glass-card">
                                    <Film size={48} className="text-text-muted mx-auto mb-4" />
                                    <h3 className="font-display text-lg font-semibold text-text-primary mb-2">Your library is empty</h3>
                                    <p className="text-text-secondary text-sm mb-6">Start adding anime, movies, shows and games to see your stats here.</p>
                                    <a href="/search" className="btn-primary inline-flex items-center gap-2">
                                        Add your first title
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Friend Activity Sidebar */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="sticky top-24">
                                <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-accent-cyan" />
                                    Friend Activity
                                </h2>
                                <div className="bg-bg-card rounded-2xl border border-border p-4 shadow-lg h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                    <ActivityFeed filter="following" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
