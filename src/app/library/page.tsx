'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PosterCard } from '@/components/PosterCard'
import { PersonCard, Person } from '@/components/PersonCard'
import { MediaDetailModal } from '@/components/MediaDetailModal'
import {
    Loader2, Search, Tv, Film, Gamepad2, BookOpen, Users, LayoutGrid,
    Eye, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { PersonDetailModal } from '@/components/PersonDetailModal'

interface MediaItem {
    id: string
    title: string
    type: string
    status?: string | null
    posterUrl: string | null
    backdropUrl?: string | null
    userRating?: number | null
    notes?: string | null
    releaseYear: number | null
    totalTimeMinutes?: number | null
    runtime?: number | null
    episodeCount?: number | null
    episodeDuration?: number | null
    playtimeHours?: number | null
    genres: string[]
    overview?: string | null
    tmdbRating?: number | null
    imdbId?: string | null
    tmdbId?: string | null
    progress?: number | null
    pageCount?: number | null
}

const TABS = [
    { key: 'ALL', label: 'All', icon: <LayoutGrid size={14} /> },
    { key: 'ANIME', label: 'Anime', icon: <Tv size={14} /> },
    { key: 'MOVIE', label: 'Movies', icon: <Film size={14} /> },
    { key: 'TVSHOW', label: 'TV Shows', icon: <Tv size={14} /> },
    { key: 'GAME', label: 'Games', icon: <Gamepad2 size={14} /> },
    { key: 'BOOK', label: 'Books', icon: <BookOpen size={14} /> },
    { key: 'PEOPLE', label: 'People', icon: <Users size={14} /> },
] as const

type TabKey = typeof TABS[number]['key']

const MEDIA_TYPES = [
    { key: 'ANIME', label: 'Anime', color: '#ff9500', icon: <Tv size={16} /> },
    { key: 'MOVIE', label: 'Movies', color: '#00d4ff', icon: <Film size={16} /> },
    { key: 'TVSHOW', label: 'TV Shows', color: '#a78bfa', icon: <Tv size={16} /> },
    { key: 'GAME', label: 'Games', color: '#00ff9d', icon: <Gamepad2 size={16} /> },
    { key: 'BOOK', label: 'Books', color: '#ff6b9d', icon: <BookOpen size={16} /> },
]

const STATUS_PILLS = [
    { key: 'ALL', label: 'All', color: '#e8edf5', icon: <LayoutGrid size={12} /> },
    { key: 'WATCHING', label: 'In Progress', color: '#00d4ff', icon: <Eye size={12} /> },
    { key: 'COMPLETED', label: 'Completed', color: '#00ff9d', icon: <CheckCircle size={12} /> },
    { key: 'PLANNED', label: 'Planned', color: '#a78bfa', icon: <Clock size={12} /> },
    { key: 'DROPPED', label: 'Dropped', color: '#ff2d7a', icon: <XCircle size={12} /> },
]

const tabColor: Record<string, string> = {
    ALL: '#e8edf5', ANIME: '#ff9500', MOVIE: '#00d4ff', TVSHOW: '#a78bfa',
    GAME: '#00ff9d', BOOK: '#ff6b9d', PEOPLE: '#7b2fff',
}

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen cyber-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-accent-cyan" size={32} />
            </div>
        }>
            <LibraryContent />
        </Suspense>
    )
}

function LibraryContent() {
    const { data: session, status: sessionStatus } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [items, setItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)

    const initialTab = (searchParams.get('tab') as TabKey) || 'ALL'
    const [activeTab, setActiveTab] = useState<TabKey>(
        TABS.some(t => t.key === initialTab) ? initialTab : 'ALL'
    )
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

    // ALL tab: expanded type key (for the type breakdown accordion)
    const [expandedType, setExpandedType] = useState<string | null>(null)

    // People tab state
    const [people, setPeople] = useState<Person[]>([])
    const [peopleLoading, setPeopleLoading] = useState(false)
    const [showAllFavorites, setShowAllFavorites] = useState(false)

    // PEOPLE tab TMDB sections
    const [popularActors, setPopularActors] = useState<Person[]>([])
    const [popularDirectors, setPopularDirectors] = useState<Person[]>([])
    const [popularPeopleLoading, setPopularPeopleLoading] = useState(false)
    const [showAllActors, setShowAllActors] = useState(false)
    const [showAllDirectors, setShowAllDirectors] = useState(false)
    const PEOPLE_DEFAULT_COUNT = 12

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') router.push('/auth/login')
    }, [sessionStatus, router])

    useEffect(() => {
        if (session) {
            fetch('/api/media?limit=200')
                .then(res => res.json())
                .then(data => {
                    setItems(data.items || [])
                    setHasMore(data.hasMore ?? false)
                    setNextCursor(data.nextCursor ?? null)
                    setLoading(false)
                })
        }
    }, [session])

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return
        setLoadingMore(true)
        try {
            const res = await fetch(`/api/media?limit=100&cursor=${nextCursor}`)
            const data = await res.json()
            setItems(prev => [...prev, ...(data.items || [])])
            setHasMore(data.hasMore ?? false)
            setNextCursor(data.nextCursor ?? null)
        } catch { }
        setLoadingMore(false)
    }

    // Load user's favorite people
    useEffect(() => {
        if (!session) return
        setPeopleLoading(true)
        fetch('/api/people/favorites')
            .then(res => res.json())
            .then(data => {
                const mapped = (Array.isArray(data) ? data : []).map((f: any) => ({
                    id: f.tmdbPersonId,
                    name: f.name,
                    profileUrl: f.profileUrl,
                    knownForDepartment: f.knownForDepartment || 'Acting',
                    knownFor: [],
                }))
                setPeople(mapped)
                setPeopleLoading(false)
            })
            .catch(() => setPeopleLoading(false))
    }, [session])

    // Load TMDB popular actors + directors when PEOPLE tab is active
    useEffect(() => {
        if (!session || activeTab !== 'PEOPLE') return
        if (popularActors.length > 0 || popularPeopleLoading) return
        setPopularPeopleLoading(true)
        Promise.all([
            fetch('/api/people/popular?dept=Acting').then(r => r.json()).catch(() => []),
            fetch('/api/people/popular?dept=Directing').then(r => r.json()).catch(() => []),
        ]).then(([actors, directors]) => {
            setPopularActors(Array.isArray(actors) ? actors.slice(0, 24) : [])
            setPopularDirectors(Array.isArray(directors) ? directors.slice(0, 16) : [])
        }).finally(() => setPopularPeopleLoading(false))
    }, [session, activeTab, popularActors.length, popularPeopleLoading])

    if (sessionStatus === 'loading' || !session) return null

    const isPeopleTab = activeTab === 'PEOPLE'

    // Convert a favorite person into a mock MediaItem shape for the unified PosterCard grid
    const peopleAsMediaItems = people.map(p => ({
        id: `person-${p.id}`,
        title: p.name,
        type: 'PEOPLE', // Pseudo-type so PosterCard handles it
        status: 'COMPLETED', // Arbitrary status to bypass filters if needed
        posterUrl: p.profileUrl,
        userRating: null,
        // other fields
        genres: [],
        createdAt: new Date().toISOString(), // Fallback
    })) as any[]

    // Filter and sort media items
    const rawItems = activeTab === 'ALL' && statusFilter === 'ALL'
        ? [...items, ...peopleAsMediaItems]
        : items

    const filteredItems = rawItems
        .filter(item => activeTab === 'ALL' || item.type === activeTab)
        .filter(item => statusFilter === 'ALL' || item.type === 'PEOPLE' || item.status === statusFilter)
        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0)
            if (sortBy === 'title') return a.title.localeCompare(b.title)
            return 0
        })

    const accentColor = tabColor[activeTab] || '#e8edf5'

    // Type breakdown for ALL tab matrix
    const typeBreakdown = MEDIA_TYPES.map(mt => {
        const typeItems = items.filter(i => i.type === mt.key)
        return {
            ...mt,
            total: typeItems.length,
            watching: typeItems.filter(i => i.status === 'WATCHING').length,
            completed: typeItems.filter(i => i.status === 'COMPLETED').length,
            planned: typeItems.filter(i => i.status === 'PLANNED').length,
            dropped: typeItems.filter(i => i.status === 'DROPPED').length,
            topPosters: typeItems.filter(i => i.posterUrl).slice(0, 3).map(i => i.posterUrl!),
        }
    })

    return (
        <div className="min-h-screen cyber-bg">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-[#e8edf5]">Your Library</h1>
                        <p className="text-sm text-[#8899aa] mt-1">
                            {isPeopleTab
                                ? `${people.length} favorites`
                                : `${filteredItems.length} items`}
                        </p>
                    </div>

                    {/* Filters — hide for People tab */}
                    {!isPeopleTab && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input
                                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Filter titles..." className="input-cyber pl-8 py-1.5 text-sm w-full md:w-48"
                                />
                            </div>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-cyber py-1.5 text-sm cursor-pointer">
                                <option value="createdAt">Date added</option>
                                <option value="rating">Highest rated</option>
                                <option value="title">Alphabetical</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Tab Bar */}
                <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-2 scrollbar-none">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key
                        const color = tabColor[tab.key]
                        const count = tab.key === 'PEOPLE'
                            ? people.length
                            : tab.key === 'ALL'
                                ? items.length + people.length
                                : items.filter(i => i.type === tab.key).length
                        return (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveTab(tab.key); setStatusFilter('ALL') }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border"
                                style={isActive ? {
                                    background: `${color}18`, borderColor: `${color}55`,
                                    color, boxShadow: `0 0 12px ${color}22`,
                                } : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#6b7a8d' }}
                            >
                                {tab.icon}
                                {tab.label}
                                {count > 0 && (
                                    <span className="text-[9px] px-1 py-0.5 rounded" style={{
                                        background: isActive ? `${color}33` : 'rgba(255,255,255,0.05)',
                                        color: isActive ? color : '#4a5568'
                                    }}>{count}</span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Status Pills — shown for all non-PEOPLE tabs */}
                {!isPeopleTab && (
                    <div className="flex items-center gap-2 mb-6 flex-wrap">
                        {STATUS_PILLS.map(pill => {
                            const isActive = statusFilter === pill.key
                            const count = pill.key === 'ALL'
                                ? items.filter(i => activeTab === 'ALL' || i.type === activeTab).length
                                : items.filter(i => (activeTab === 'ALL' || i.type === activeTab) && i.status === pill.key).length
                            return (
                                <button
                                    key={pill.key}
                                    onClick={() => setStatusFilter(pill.key)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                                    style={isActive ? {
                                        background: `${pill.color}18`,
                                        borderColor: `${pill.color}55`,
                                        color: pill.color,
                                        boxShadow: `0 0 8px ${pill.color}20`,
                                    } : {
                                        background: 'transparent',
                                        borderColor: 'rgba(255,255,255,0.08)',
                                        color: '#4a5568',
                                    }}
                                >
                                    {pill.icon}
                                    {pill.label}
                                    <span className="text-[10px] opacity-70">{count}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* ── ALL TAB: Type Breakdown Matrix ────────────────────────────────── */}
                {activeTab === 'ALL' && !searchQuery && statusFilter === 'ALL' && !loading && (
                    <div className="mb-8">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-text-muted mb-3">Library Overview</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {typeBreakdown.filter(t => t.total > 0).map(mt => {
                                const isExpanded = expandedType === mt.key
                                return (
                                    <div key={mt.key}
                                        className="glass-card rounded-xl border border-border overflow-hidden transition-all"
                                        style={{ borderColor: isExpanded ? `${mt.color}44` : undefined }}
                                    >
                                        {/* Header row */}
                                        <button
                                            onClick={() => setExpandedType(isExpanded ? null : mt.key)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-bg-hover transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: mt.color }}>{mt.icon}</span>
                                                <span className="text-xs font-bold text-text-primary">{mt.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold" style={{ color: mt.color }}>{mt.total}</span>
                                                {isExpanded ? <ChevronUp size={12} className="text-text-muted" /> : <ChevronDown size={12} className="text-text-muted" />}
                                            </div>
                                        </button>

                                        {/* Mini poster strip */}
                                        {mt.topPosters.length > 0 && (
                                            <div className="flex gap-1 px-2 pb-2">
                                                {mt.topPosters.map((url, i) => (
                                                    <div key={i} className="flex-1 aspect-[2/3] rounded overflow-hidden bg-bg-secondary">
                                                        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Expanded status breakdown */}
                                        {isExpanded && (
                                            <div className="divide-y divide-border/40 border-t border-border/40">
                                                {[
                                                    { key: 'WATCHING', label: 'In Progress', count: mt.watching, color: '#00d4ff' },
                                                    { key: 'COMPLETED', label: 'Completed', count: mt.completed, color: '#00ff9d' },
                                                    { key: 'PLANNED', label: 'Planned', count: mt.planned, color: '#a78bfa' },
                                                    { key: 'DROPPED', label: 'Dropped', count: mt.dropped, color: '#ff2d7a' },
                                                ].map(s => (
                                                    <button
                                                        key={s.key}
                                                        disabled={s.count === 0}
                                                        onClick={() => {
                                                            setActiveTab(mt.key as TabKey)
                                                            setStatusFilter(s.key)
                                                            setExpandedType(null)
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                                                    >
                                                        <span style={{ color: s.count > 0 ? s.color : '#4a5568' }}>{s.label}</span>
                                                        <span className="font-bold text-text-primary">{s.count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── CONTENT ──────────────────────────────────────────────────────── */}
                {isPeopleTab ? (
                    <div className="space-y-10">
                        {/* My Favorites */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                    <Users size={14} /> My Favorites
                                    {people.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7b2fff]/20 text-[#7b2fff]">{people.length}</span>
                                    )}
                                </h3>
                                {people.length > PEOPLE_DEFAULT_COUNT && (
                                    <button onClick={() => setShowAllFavorites(v => !v)}
                                        className="text-xs text-text-muted hover:text-accent-cyan transition-colors">
                                        {showAllFavorites ? 'Show Less' : `Show All (${people.length})`}
                                    </button>
                                )}
                            </div>
                            {peopleLoading ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl shimmer" />)}
                                </div>
                            ) : people.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {(showAllFavorites ? people : people.slice(0, PEOPLE_DEFAULT_COUNT)).map(person => (
                                        <PersonCard
                                            key={person.id}
                                            person={person}
                                            onClick={() => setSelectedPersonId(person.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 glass-card rounded-2xl border border-border">
                                    <Users size={36} className="text-[#4a5568] mx-auto mb-3" />
                                    <p className="text-sm text-[#8899aa]">Browse the <a href="/people" className="text-[#7b2fff] hover:underline">People</a> page and click ♥ to add favorites.</p>
                                </div>
                            )}
                        </div>

                        {/* Popular Actors */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                    <span style={{ color: '#00d4ff' }}>🎭</span> Popular Actors
                                </h3>
                                {popularActors.length > PEOPLE_DEFAULT_COUNT && (
                                    <button onClick={() => setShowAllActors(v => !v)}
                                        className="text-xs text-text-muted hover:text-accent-cyan transition-colors">
                                        {showAllActors ? 'Show Less' : `Show All (${popularActors.length})`}
                                    </button>
                                )}
                            </div>
                            {popularPeopleLoading ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {[...Array(12)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl shimmer" />)}
                                </div>
                            ) : popularActors.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {(showAllActors ? popularActors : popularActors.slice(0, PEOPLE_DEFAULT_COUNT)).map(person => (
                                        <PersonCard
                                            key={person.id}
                                            person={person}
                                            onClick={() => setSelectedPersonId(person.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-text-muted">No actors loaded.</p>
                            )}
                        </div>

                        {/* Popular Directors */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                    <span style={{ color: '#7b2fff' }}>🎬</span> Popular Directors
                                </h3>
                                {popularDirectors.length > PEOPLE_DEFAULT_COUNT && (
                                    <button onClick={() => setShowAllDirectors(v => !v)}
                                        className="text-xs text-text-muted hover:text-[#7b2fff] transition-colors">
                                        {showAllDirectors ? 'Show Less' : `Show All (${popularDirectors.length})`}
                                    </button>
                                )}
                            </div>
                            {popularPeopleLoading ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {[...Array(8)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl shimmer" />)}
                                </div>
                            ) : popularDirectors.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {(showAllDirectors ? popularDirectors : popularDirectors.slice(0, PEOPLE_DEFAULT_COUNT)).map(person => (
                                        <PersonCard
                                            key={person.id}
                                            person={person}
                                            onClick={() => setSelectedPersonId(person.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-text-muted">No directors loaded.</p>
                            )}
                        </div>
                    </div>
                ) : loading ? (
                    <div className="poster-grid">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-xl shimmer" />
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <>
                        <div className="poster-grid">
                            {filteredItems.map(item => {
                                if (item.type === 'PEOPLE') {
                                    // Recover original person object
                                    const p = people.find(x => `person-${x.id}` === item.id)
                                    if (!p) return null
                                    return (
                                        <PersonCard
                                            key={item.id}
                                            person={p}
                                            onClick={() => setSelectedPersonId(p.id)}
                                        />
                                    )
                                }
                                return <PosterCard key={item.id} item={item} onClick={setSelectedItem} />
                            })}
                        </div>
                        {hasMore && !searchQuery && statusFilter === 'ALL' && activeTab === 'ALL' && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-border text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-all disabled:opacity-50"
                                >
                                    {loadingMore ? <><Loader2 size={16} className="animate-spin" /> Loading...</> : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 glass-card">
                        <LayoutGrid size={48} className="text-[#4a5568] mx-auto mb-4" />
                        <h3 className="font-display text-lg font-semibold text-[#e8edf5] mb-2">No items found</h3>
                        <p className="text-[#8899aa] text-sm">Update your filters or add some new titles.</p>
                    </div>
                )}
            </main>

            {selectedItem && (
                <MediaDetailModal
                    item={selectedItem as any}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={(updated) => {
                        setItems(items.map(i => i.id === updated.id ? updated : i))
                        setSelectedItem(updated)
                    }}
                    onDelete={(id) => {
                        setItems(items.filter(i => i.id !== id))
                        setSelectedItem(null)
                    }}
                />
            )}

            <PersonDetailModal
                personId={selectedPersonId}
                onClose={() => setSelectedPersonId(null)}
            />
        </div>
    )
}
