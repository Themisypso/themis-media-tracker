'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PosterCard } from '@/components/PosterCard'
import { PersonCard, Person } from '@/components/PersonCard'
import { MediaDetailModal } from '@/components/MediaDetailModal'
import { Loader2, Search, Filter, Tv, Film, Gamepad2, BookOpen, Users, LayoutGrid } from 'lucide-react'

interface MediaItem {
    id: string
    title: string
    type: string
    status: string
    posterUrl: string | null
    backdropUrl: string | null
    userRating: number | null
    notes: string | null
    releaseYear: number | null
    totalTimeMinutes: number | null
    runtime: number | null
    episodeCount: number | null
    episodeDuration: number | null
    playtimeHours: number | null
    genres: string[]
    overview: string | null
    tmdbRating: number | null
    imdbId: string | null
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

const STATUSES = ['ALL', 'WATCHING', 'COMPLETED', 'PLANNED', 'DROPPED']

const tabColor: Record<string, string> = {
    ALL: '#e8edf5',
    ANIME: '#ff9500',
    MOVIE: '#00d4ff',
    TVSHOW: '#a78bfa',
    GAME: '#00ff9d',
    BOOK: '#ff6b9d',
    PEOPLE: '#7b2fff',
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

    const initialTab = (searchParams.get('tab') as TabKey) || 'ALL'
    const [activeTab, setActiveTab] = useState<TabKey>(
        TABS.some(t => t.key === initialTab) ? initialTab : 'ALL'
    )
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')

    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

    // People tab state
    const [people, setPeople] = useState<Person[]>([])
    const [peopleLoading, setPeopleLoading] = useState(false)
    const [peopleLoaded, setPeopleLoaded] = useState(false)

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') router.push('/auth/login')
    }, [sessionStatus, router])

    useEffect(() => {
        if (session) {
            fetch('/api/media')
                .then(res => res.json())
                .then(data => {
                    setItems(data.items || [])
                    setLoading(false)
                })
        }
    }, [session])

    // Load user's favorite people when People tab is first activated
    useEffect(() => {
        if (activeTab === 'PEOPLE' && !peopleLoaded) {
            setPeopleLoading(true)
            fetch('/api/people/favorites')
                .then(res => res.json())
                .then(data => {
                    // API returns FavoritePerson objects: { id, tmdbPersonId, name, profileUrl, knownForDepartment }
                    const mapped = (Array.isArray(data) ? data : []).map((f: any) => ({
                        id: f.tmdbPersonId,
                        name: f.name,
                        profileUrl: f.profileUrl,
                        knownForDepartment: f.knownForDepartment || 'Acting',
                        knownFor: [],
                    }))
                    setPeople(mapped)
                    setPeopleLoading(false)
                    setPeopleLoaded(true)
                })
                .catch(() => {
                    setPeopleLoading(false)
                    setPeopleLoaded(true)
                })
        }
    }, [activeTab, peopleLoaded])

    if (sessionStatus === 'loading' || !session) return null

    const isPeopleTab = activeTab === 'PEOPLE'

    // Filter and sort media items
    const filteredItems = items
        .filter(item => activeTab === 'ALL' || item.type === activeTab)
        .filter(item => statusFilter === 'ALL' || item.status === statusFilter)
        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0)
            if (sortBy === 'title') return a.title.localeCompare(b.title)
            return 0
        })

    const accentColor = tabColor[activeTab] || '#e8edf5'

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
                                ? `${people.length} popular people`
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

                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-cyber py-1.5 text-sm w-full md:w-auto cursor-pointer">
                                {STATUSES.map(s => (
                                    <option key={s} value={s}>
                                        {s === 'ALL' ? 'All Statuses' : s === 'WATCHING' ? 'Watching / Playing' : s}
                                    </option>
                                ))}
                            </select>

                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-cyber py-1.5 text-sm w-full md:w-auto cursor-pointer">
                                <option value="createdAt">Date added</option>
                                <option value="rating">Highest rated</option>
                                <option value="title">Alphabetical</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Tab Bar */}
                <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key
                        const color = tabColor[tab.key]
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border"
                                style={isActive ? {
                                    background: `${color}18`,
                                    borderColor: `${color}55`,
                                    color: color,
                                    boxShadow: `0 0 12px ${color}22`,
                                } : {
                                    background: 'transparent',
                                    borderColor: 'rgba(255,255,255,0.06)',
                                    color: '#6b7a8d',
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                                {tab.key !== 'PEOPLE' && tab.key !== 'ALL' && (
                                    <span className="text-[9px] px-1 py-0.5 rounded" style={{
                                        background: isActive ? `${color}33` : 'rgba(255,255,255,0.05)',
                                        color: isActive ? color : '#4a5568'
                                    }}>
                                        {items.filter(i => i.type === tab.key).length}
                                    </span>
                                )}
                                {tab.key === 'ALL' && (
                                    <span className="text-[9px] px-1 py-0.5 rounded" style={{
                                        background: isActive ? `${color}33` : 'rgba(255,255,255,0.05)',
                                        color: isActive ? color : '#4a5568'
                                    }}>
                                        {items.length}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Content */}
                {isPeopleTab ? (
                    // People Grid
                    peopleLoading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="aspect-[2/3] rounded-xl shimmer" />
                            ))}
                        </div>
                    ) : people.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {people.map(person => (
                                <PersonCard
                                    key={person.id}
                                    person={person}
                                    href={`/people`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass-card">
                            <Users size={48} className="text-[#4a5568] mx-auto mb-4" />
                            <h3 className="font-display text-lg font-semibold text-[#e8edf5] mb-2">No favorite people yet</h3>
                            <p className="text-[#8899aa] text-sm mb-4">Browse the People page and click ♥ to add actors and directors to your favorites.</p>
                            <a href="/people" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all" style={{ background: 'rgba(123,47,255,0.15)', border: '1px solid rgba(123,47,255,0.4)', color: '#7b2fff' }}>
                                Browse People
                            </a>
                        </div>
                    )
                ) : loading ? (
                    <div className="poster-grid">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-xl shimmer" />
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="poster-grid">
                        {filteredItems.map(item => (
                            <PosterCard key={item.id} item={item} onClick={setSelectedItem} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 glass-card">
                        <Filter size={48} className="text-[#4a5568] mx-auto mb-4" />
                        <h3 className="font-display text-lg font-semibold text-[#e8edf5] mb-2">No items found</h3>
                        <p className="text-[#8899aa] text-sm">Update your filters or search query, or add some new titles.</p>
                    </div>
                )}
            </main>

            {selectedItem && (
                <MediaDetailModal
                    item={selectedItem}
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
        </div>
    )
}
