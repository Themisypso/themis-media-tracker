import { Navbar } from '@/components/Navbar'
import { PeopleGrid } from '@/components/PeopleGrid'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Filter, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DEPARTMENTS = [
    { id: 'all', label: 'All Departments' },
    { id: 'Acting', label: '🎭 Acting' },
    { id: 'Directing', label: '🎬 Directing' },
    { id: 'Writing', label: '✍️ Writing' },
    { id: 'Production', label: '🎙️ Production' },
    { id: 'Sound', label: '🎵 Sound' },
    { id: 'Camera', label: '📷 Camera' },
]

const PAGES_TO_FETCH = Array.from({ length: 20 }, (_, i) => String(i + 1))

const deptColor: Record<string, string> = {
    Acting: '#00d4ff',
    Directing: '#7b2fff',
    Writing: '#00ff9d',
    Production: '#ff9500',
    Sound: '#ff6b9d',
    Camera: '#a78bfa',
}

async function getPeople(dept: string, page: number) {
    const API_KEY = process.env.TMDB_API_KEY
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/person/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
            { next: { revalidate: 3600 } }
        )
        if (!res.ok) return []
        const data = await res.json()
        let results = (data.results || []).map((person: any) => ({
            id: person.id,
            name: person.name,
            profileUrl: person.profile_path
                ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                : null,
            knownForDepartment: person.known_for_department || 'Acting',
            popularity: Math.round(person.popularity),
            knownFor: (person.known_for || []).slice(0, 3).map((k: any) => ({
                title: k.title || k.name,
                mediaType: k.media_type,
                posterUrl: k.poster_path ? `https://image.tmdb.org/t/p/w92${k.poster_path}` : null,
            })),
        }))
        if (dept !== 'all') {
            results = results.filter((p: any) => p.knownForDepartment === dept)
        }
        return results
    } catch {
        return []
    }
}

export default async function PeoplePage({
    searchParams,
}: {
    searchParams: { dept?: string; page?: string }
}) {
    const dept = searchParams.dept || 'all'
    const page = Math.max(1, Math.min(5, Number(searchParams.page) || 1))

    const session = await getServerSession(authOptions)

    // Fetch people from TMDB (fetch multiple pages if filtering by dept)
    let people: any[] = []
    if (dept !== 'all') {
        // Fetch 20 pages to get enough results after filtering by department
        const results = await Promise.all(
            PAGES_TO_FETCH.map(p => getPeople(dept, Number(p)))
        )
        // No slice cap — return all found (up to 400 before filter, typically 30–120 after)
        people = results.flat()
    } else {
        people = await getPeople('all', page)
    }

    // Get user's favorites if logged in
    let favoriteIdsList: number[] = []
    if (session?.user?.id) {
        // Cast to any to bypass un-generated schema typings during hot-reloads
        const favorites = await (prisma as any).favoritePerson.findMany({
            where: { userId: session.user.id },
            select: { tmdbPersonId: true },
        })
        favoriteIdsList = favorites.map((f: { tmdbPersonId: number }) => f.tmdbPersonId)
    }

    const totalLabel = dept !== 'all'
        ? `${DEPARTMENTS.find(d => d.id === dept)?.label || dept}`
        : `Page ${page} of Popular People`

    return (
        <div className="min-h-screen cyber-bg pb-20">
            <Navbar />

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,47,255,0.15)', border: '1px solid rgba(123,47,255,0.35)' }}>
                            <Users size={18} style={{ color: '#7b2fff' }} />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-[#e8edf5]">People</h1>
                    </div>
                    <p className="text-[#8899aa] text-sm">
                        Discover popular actors, directors and creatives from TMDB.{' '}
                        {session && <span className="text-[#7b2fff]">Click ♥ to add to your favorites.</span>}
                    </p>
                </div>

                <div className="flex gap-8">
                    {/* LEFT SIDEBAR */}
                    <div className="hidden md:block w-64 flex-shrink-0">
                        <div className="md:sticky md:top-24 glass-card p-6 rounded-2xl border border-border space-y-6 shadow-xl backdrop-blur-xl bg-opacity-95">
                            <div className="flex items-center gap-2 text-text-primary font-bold text-lg mb-2">
                                <Filter size={18} className="text-accent-cyan" /> Filters
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Department</label>
                                <div className="space-y-1">
                                    {DEPARTMENTS.map(d => {
                                        const isActive = dept === d.id
                                        const color = deptColor[d.id] || '#8899aa'
                                        return (
                                            <Link
                                                key={d.id}
                                                href={`/people?dept=${d.id}`}
                                                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 border"
                                                style={isActive ? {
                                                    background: `${color}18`,
                                                    borderColor: `${color}44`,
                                                    color,
                                                } : {
                                                    background: 'transparent',
                                                    borderColor: 'transparent',
                                                    color: '#6b7a8d',
                                                }}
                                            >
                                                <span>{d.label}</span>
                                                {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Page navigation (only for all dept) */}
                            {dept === 'all' && (
                                <div className="space-y-2">
                                    <label className="block text-[10px] text-text-muted uppercase tracking-wider px-1 font-bold">Page</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[1, 2, 3, 4, 5].map(p => (
                                            <Link
                                                key={p}
                                                href={`/people?dept=all&page=${p}`}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border"
                                                style={page === p ? {
                                                    background: 'rgba(123,47,255,0.2)',
                                                    borderColor: 'rgba(123,47,255,0.5)',
                                                    color: '#7b2fff',
                                                } : {
                                                    background: 'transparent',
                                                    borderColor: 'rgba(255,255,255,0.06)',
                                                    color: '#6b7a8d',
                                                }}
                                            >
                                                {p}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 min-w-0">
                        {/* Sort/Filter info bar */}
                        <div className="flex items-center justify-between mb-6 glass-card px-4 py-3 rounded-xl border border-border">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-[#7b2fff]" />
                                <span className="text-sm text-[#e8edf5] font-medium">{totalLabel}</span>
                                <span className="text-[#4a5568]">•</span>
                                <span className="text-xs text-[#8899aa]">Sorted by popularity ↓</span>
                            </div>
                            <span className="text-xs text-[#4a5568]">{people.length} results</span>
                        </div>

                        {/* Mobile department pills */}
                        <div className="flex lg:hidden gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
                            {DEPARTMENTS.map(d => {
                                const isActive = dept === d.id
                                const color = deptColor[d.id] || '#8899aa'
                                return (
                                    <Link
                                        key={d.id}
                                        href={`/people?dept=${d.id}`}
                                        className="flex-none px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all"
                                        style={isActive ? {
                                            background: `${color}18`,
                                            borderColor: `${color}44`,
                                            color,
                                        } : {
                                            background: 'transparent',
                                            borderColor: 'rgba(255,255,255,0.08)',
                                            color: '#6b7a8d',
                                        }}
                                    >
                                        {d.label}
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Person Grid */}
                        {people.length > 0 ? (
                            <PeopleGrid
                                people={people}
                                favoriteIds={favoriteIdsList}
                                isLoggedIn={!!session}
                            >
                                {/* Bottom pagination (all dept only) */}
                                {dept === 'all' && (
                                    <div className="flex justify-center gap-2 mt-10">
                                        {[1, 2, 3, 4, 5].map(p => (
                                            <Link
                                                key={p}
                                                href={`/people?dept=all&page=${p}`}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all border"
                                                style={page === p ? {
                                                    background: 'rgba(123,47,255,0.2)',
                                                    borderColor: 'rgba(123,47,255,0.5)',
                                                    color: '#7b2fff',
                                                    boxShadow: '0 0 12px rgba(123,47,255,0.2)',
                                                } : {
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderColor: 'rgba(255,255,255,0.06)',
                                                    color: '#6b7a8d',
                                                }}
                                            >
                                                {p}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </PeopleGrid>
                        ) : (
                            <div className="py-24 text-center glass-card rounded-2xl border border-border">
                                <Users size={40} className="text-[#4a5568] mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-[#e8edf5] mb-1">No people found</h3>
                                <p className="text-sm text-[#8899aa]">Try a different department filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
