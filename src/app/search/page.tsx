'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { SearchBar } from '@/components/SearchBar'
import { GameSearch } from '@/components/GameSearch'
import { Search, Info, Plus, Loader2, Film } from 'lucide-react'
import toast from 'react-hot-toast'

function SearchContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const autoSelectId = searchParams.get('select')
    const autoSelectType = searchParams.get('type')

    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedDetails, setSelectedDetails] = useState<any | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (autoSelectId && autoSelectType) {
            loadDetails(autoSelectId, autoSelectType)
        }
    }, [autoSelectId, autoSelectType])

    async function loadDetails(id: string, type: string) {
        setLoadingId(id)
        try {
            const res = await fetch(`/api/tmdb/details/${id}?type=${type}`)
            if (!res.ok) throw new Error('Details failed')
            const data = await res.json()
            setSelectedDetails(data)
        } catch {
            toast.error('Could not load details')
        }
        setLoadingId(null)
    }

    async function handleAddTMDB(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedDetails) return

        // Map tmdb details to our model
        const formData = new FormData(e.target as HTMLFormElement)
        const userStatus = formData.get('status') as string

        // Infer our type from TMDB type
        let type = 'MOVIE'
        if (selectedDetails.mediaType === 'tv') {
            // Check genres for Animation/Anime to classify as ANIME
            const isAnime = selectedDetails.genres.some((g: string) => g.toLowerCase().includes('animation'))
            type = isAnime ? 'ANIME' : 'TVSHOW'
        } else if (selectedDetails.mediaType === 'movie') {
            const isAnime = selectedDetails.genres.some((g: string) => g.toLowerCase().includes('animation'))
            type = isAnime ? 'ANIME' : 'MOVIE'
        }

        const payload = {
            title: selectedDetails.title,
            type,
            status: userStatus,
            tmdbId: String(selectedDetails.id),
            imdbId: selectedDetails.imdbId,
            posterUrl: selectedDetails.posterUrl,
            backdropUrl: selectedDetails.backdropUrl,
            genres: selectedDetails.genres,
            releaseYear: selectedDetails.releaseYear,
            overview: selectedDetails.overview,
            tmdbRating: selectedDetails.tmdbRating,
            runtime: selectedDetails.runtime,
            episodeCount: selectedDetails.episodeCount,
        }

        try {
            const res = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Added to your library!')
            router.push('/library')
        } catch (err: any) {
            toast.error(err.message || 'Failed to add')
        }
    }

    if (status === 'loading' || !session) return null

    return (
        <>
            <div className="mb-8 max-w-2xl mx-auto">
                <h1 className="text-2xl font-display font-bold text-[#e8edf5] mb-4 text-center">Find & Add Media</h1>
                <SearchBar
                    placeholder="Search for anime, movies, or TV shows (via TMDB)..."
                    navigateOnSelect={true}
                    className="w-full text-lg"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
                {/* TMDB Results / Selected Detail pane */}
                <div className="glass-card p-6 min-h-[400px]">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#1e2a3a]">
                        <Search className="text-[#00d4ff]" size={20} />
                        <h2 className="font-display font-semibold text-lg text-[#e8edf5]">TMDB Search Result</h2>
                    </div>

                    {loadingId ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[#8899aa]">
                            <Loader2 size={32} className="animate-spin mb-4 text-[#00d4ff]" />
                            <p>Fetching full details...</p>
                        </div>
                    ) : selectedDetails ? (
                        <div className="animate-fade-in">
                            <div className="flex gap-5 mb-6 text-sm">
                                <div className="w-32 rounded-lg overflow-hidden flex-shrink-0 shadow-glow-cyan border border-[#1e2a3a]">
                                    {selectedDetails.posterUrl ? (
                                        <img src={selectedDetails.posterUrl} alt="" className="w-full aspect-[2/3] object-cover" />
                                    ) : <div className="w-full h-48 bg-[#1a2235]" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-display text-[#e8edf5] mb-2">{selectedDetails.title}</h3>
                                    <div className="text-[#8899aa] space-y-1">
                                        <p>Year: {selectedDetails.releaseYear || 'Unknown'}</p>
                                        <p>Type: {selectedDetails.mediaType.toUpperCase()}</p>
                                        {selectedDetails.tmdbRating && <p className="text-[#ffd700]">★ {selectedDetails.tmdbRating}</p>}
                                        {selectedDetails.runtime && <p>Duration: {selectedDetails.runtime} min</p>}
                                        {selectedDetails.episodeCount && <p>Episodes: {selectedDetails.episodeCount}</p>}
                                    </div>
                                    <div className="mt-3 flex gap-1 flex-wrap">
                                        {selectedDetails.genres.slice(0, 3).map((g: string) => (
                                            <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-[#1a2235]">{g}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleAddTMDB} className="bg-[#080c14] p-4 rounded-xl border border-[#1e2a3a]">
                                <label className="block text-xs text-[#8899aa] mb-2 font-medium">Initial Status</label>
                                <div className="flex gap-3 mb-4">
                                    <select name="status" className="input-cyber flex-1" defaultValue="PLANNED">
                                        <option value="WATCHING">Watching</option>
                                        <option value="PLANNED">Planned To Watch</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="DROPPED">Dropped</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                                    <Plus size={16} /> Add to Library
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-[#4a5568] text-center">
                            <Info size={40} className="mb-4" />
                            <p>Type above to search TMDB for anime, movies, and shows.</p>
                            <p className="text-sm mt-2 max-w-xs">Data like cover art, genres, and metadata will be automatically imported.</p>
                        </div>
                    )}
                </div>

                <GameSearch />
            </div>

        </>
    )
}

export default function SearchPage() {
    return (
        <div className="min-h-screen cyber-bg">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={
                    <div className="flex h-[400px] items-center justify-center text-[#00d4ff]">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                }>
                    <SearchContent />
                </Suspense>
            </main>
        </div>
    )
}
