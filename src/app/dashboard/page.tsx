'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Clock, Film, Tv, Gamepad2, TrendingUp, CheckCircle, Eye, BookMarked, X } from 'lucide-react'
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
}

const TYPE_COLORS: Record<string, string> = {
    ANIME: '#ff9500', MOVIE: '#00d4ff', TVSHOW: '#a78bfa', GAME: '#00ff9d'
}
const STATUS_COLORS: Record<string, string> = {
    WATCHING: '#00d4ff', COMPLETED: '#00ff9d', PLANNED: '#a78bfa', DROPPED: '#ff2d7a'
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card px-4 py-3 text-xs">
                <p className="text-[#8899aa] mb-1">{label}</p>
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

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (session) {
            fetch('/api/analytics').then(r => r.json()).then(d => {
                setAnalytics(d)
                setLoading(false)
            })
        }
    }, [session])

    if (status === 'loading' || !session) return null

    const typeChartData = analytics ? Object.entries(analytics.typeStats).map(([type, data]) => ({
        name: type, value: data.totalMinutes, count: data.count,
    })).filter(d => d.value > 0) : []

    const yearlyChartData = analytics ? Object.entries(analytics.yearlyStats).sort().map(([year, minutes]) => ({
        year, minutes, hours: Math.round(minutes / 60 * 10) / 10
    })) : []

    const statusData = analytics ? Object.entries(analytics.statusStats).filter(([, v]) => v > 0).map(([s, count]) => ({
        name: s, value: count
    })) : []

    return (
        <div className="min-h-screen" style={{ background: '#080c14' }}>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-display font-bold text-[#e8edf5]">
                        Welcome back, <span style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {session.user?.name?.split(' ')[0] || 'Tracker'}
                        </span>
                    </h1>
                    <p className="text-sm text-[#8899aa] mt-1">Here&apos;s your media consumption overview</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl shimmer" />)}
                    </div>
                ) : (
                    <>
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
                                            <p className="text-xs text-[#8899aa] mb-2 font-medium">{label}</p>
                                            <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
                                        </div>
                                        <div className="p-2 rounded-lg" style={{ background: `${color}18`, color }}>
                                            {icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts row */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* Pie chart: by type */}
                            <div className="glass-card p-6">
                                <h2 className="font-display font-semibold text-[#e8edf5] mb-4">Media Breakdown</h2>
                                {typeChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={typeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                                                {typeChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#8899aa'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => [`${Math.round(v / 60 * 10) / 10}h`, 'Time']} contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                                            <Legend formatter={name => <span style={{ color: TYPE_COLORS[name] || '#8899aa', fontSize: 12 }}>{name}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[260px] flex items-center justify-center text-[#4a5568] text-sm">Add media to see breakdown</div>
                                )}
                            </div>

                            {/* Bar chart: by type hours */}
                            <div className="glass-card p-6">
                                <h2 className="font-display font-semibold text-[#e8edf5] mb-4">Hours by Type</h2>
                                {typeChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={typeChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                                            <XAxis dataKey="name" tick={{ fill: '#8899aa', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {typeChartData.map(entry => (
                                                    <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#8899aa'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[260px] flex items-center justify-center text-[#4a5568] text-sm">Add media to see chart</div>
                                )}
                            </div>
                        </div>

                        {/* Yearly Chart */}
                        {yearlyChartData.length > 0 && (
                            <div className="glass-card p-6 mb-6">
                                <h2 className="font-display font-semibold text-[#e8edf5] mb-4">Yearly Consumption</h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={yearlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                                        <XAxis dataKey="year" tick={{ fill: '#8899aa', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#8899aa', fontSize: 12 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
                                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} formatter={(v: number) => [`${Math.round(v / 60 * 10) / 10}h`, 'Total time']} labelStyle={{ color: '#8899aa' }} />
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
                                <h2 className="font-display font-semibold text-[#e8edf5] mb-4">Status Overview</h2>
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
                                <Film size={48} className="text-[#4a5568] mx-auto mb-4" />
                                <h3 className="font-display text-lg font-semibold text-[#e8edf5] mb-2">Your library is empty</h3>
                                <p className="text-[#8899aa] text-sm mb-6">Start adding anime, movies, shows and games to see your stats here.</p>
                                <a href="/search" className="btn-primary inline-flex items-center gap-2">
                                    Add your first title
                                </a>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
