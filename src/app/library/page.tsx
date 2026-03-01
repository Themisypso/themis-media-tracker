'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PosterCard } from '@/components/PosterCard'
import { MediaDetailModal } from '@/components/MediaDetailModal'
import { Loader2, Search, Filter } from 'lucide-react'

// Same item interface to stay consistent
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

const TYPES = ['ALL', 'ANIME', 'MOVIE', 'TVSHOW', 'GAME']
const STATUSES = ['ALL', 'WATCHING', 'COMPLETED', 'PLANNED', 'DROPPED']

export default function LibraryPage() {
    const { data: session, status: sessionStatus } = useSession()
    const router = useRouter()

    const [items, setItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)

    const [typeFilter, setTypeFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')

    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

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

    if (sessionStatus === 'loading' || !session) return null

    // Filter and sort
    const filteredItems = items
        .filter(item => typeFilter === 'ALL' || item.type === typeFilter)
        .filter(item => statusFilter === 'ALL' || item.status === statusFilter)
        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0)
            if (sortBy === 'title') return a.title.localeCompare(b.title)
            // default: createdAt (assuming API returns them in descending order, we don't strictly recreate here, 
            // but if we needed to sort by id or if we had a raw createdAt field:
            return 0
        })

    return (
        <div className="min-h-screen cyber-bg">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-[#e8edf5]">Your Library</h1>
                        <p className="text-sm text-[#8899aa] mt-1">{filteredItems.length} items</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                            <input
                                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Filter titles..." className="input-cyber pl-8 py-1.5 text-sm w-full md:w-48"
                            />
                        </div>

                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-cyber py-1.5 text-sm w-full md:w-auto cursor-pointer">
                            {TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
                        </select>

                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-cyber py-1.5 text-sm w-full md:w-auto cursor-pointer">
                            {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s === 'WATCHING' ? 'Watching / Playing' : s}</option>)}
                        </select>

                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-cyber py-1.5 text-sm w-full md:w-auto cursor-pointer">
                            <option value="createdAt">Date added</option>
                            <option value="rating">Highest rated</option>
                            <option value="title">Alphabetical</option>
                        </select>
                    </div>
                </div>

                {loading ? (
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
