'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { X, Star, Film, Tv, Calendar, MapPin, ExternalLink, Loader2, Clapperboard, User as UserIcon, Heart, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PersonModalProps {
    personId: number | null
    onClose: () => void
}

const deptColor: Record<string, string> = {
    Acting: '#00d4ff',
    Directing: '#7b2fff',
    Writing: '#00ff9d',
    Production: '#ff9500',
    Sound: '#ff6b9d',
    Camera: '#a78bfa',
}

export function PersonDetailModal({ personId, onClose }: PersonModalProps) {
    const { data: session } = useSession()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'cast' | 'crew'>('cast')
    const [isFavorited, setIsFavorited] = useState(false)
    const [favLoading, setFavLoading] = useState(false)
    const [addingCredit, setAddingCredit] = useState<number | null>(null)
    const [addedCredits, setAddedCredits] = useState<Set<number>>(new Set())

    const fetchPerson = useCallback(async (id: number) => {
        setLoading(true)
        setData(null)
        setIsFavorited(false)
        setAddedCredits(new Set())
        try {
            const [personRes, favRes] = await Promise.all([
                fetch(`/api/tmdb/person/${id}`),
                session ? fetch(`/api/people/favorites`) : Promise.resolve(null),
            ])
            if (!personRes.ok) throw new Error('Failed')
            const d = await personRes.json()
            setData(d)
            setActiveTab(d.castCredits?.length > 0 ? 'cast' : 'crew')

            // Check if favorited
            if (favRes && favRes.ok) {
                const favData = await favRes.json()
                const favIds = (Array.isArray(favData) ? favData : []).map((f: any) => f.tmdbPersonId)
                setIsFavorited(favIds.includes(id))
            }
        } catch { }
        setLoading(false)
    }, [session])

    useEffect(() => {
        if (personId) {
            fetchPerson(personId)
            document.body.style.overflow = 'hidden'
        }
        return () => { document.body.style.overflow = '' }
    }, [personId, fetchPerson])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    async function toggleFavorite() {
        if (!session || !data) return
        setFavLoading(true)
        try {
            if (isFavorited) {
                await fetch(`/api/people/favorites?tmdbPersonId=${data.id}`, { method: 'DELETE' })
                setIsFavorited(false)
                toast.success('Removed from favorites')
            } else {
                await fetch('/api/people/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tmdbPersonId: data.id,
                        name: data.name,
                        profileUrl: data.profileUrl,
                        knownForDepartment: data.knownForDepartment,
                    }),
                })
                setIsFavorited(true)
                toast.success('Added to favorites!')
            }
        } catch {
            toast.error('Something went wrong')
        }
        setFavLoading(false)
    }

    async function addCreditToLibrary(credit: any, status: 'PLANNED' | 'COMPLETED') {
        if (!session) {
            toast.error('Please sign in first')
            return
        }
        setAddingCredit(credit.id)
        try {
            const type = credit.mediaType === 'tv' ? 'TVSHOW' : 'MOVIE'
            const res = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: credit.title,
                    type,
                    status,
                    tmdbId: String(credit.id),
                    posterUrl: credit.posterUrl?.replace('/w185', '/w342') || null,
                    releaseYear: credit.releaseDate ? parseInt(credit.releaseDate.split('-')[0]) : null,
                    tmdbRating: credit.voteAverage,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (res.status === 409) {
                    toast('Already in your library!', { icon: '📚' })
                } else {
                    throw new Error(data.error)
                }
            } else {
                setAddedCredits(prev => {
                    const n = new Set(Array.from(prev))
                    n.add(credit.id)
                    return n
                })
                toast.success(status === 'COMPLETED' ? 'Marked as watched!' : 'Added to watchlist!')
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to add')
        }
        setAddingCredit(null)
    }

    if (!personId) return null

    const color = deptColor[data?.knownForDepartment] || '#8899aa'

    function getAge(birthday: string, deathday?: string | null) {
        const birth = new Date(birthday)
        const end = deathday ? new Date(deathday) : new Date()
        let age = end.getFullYear() - birth.getFullYear()
        const m = end.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
        return age
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-3xl max-h-[90vh] glass-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-bg-primary/80 border border-border hover:border-[#ff3264] text-text-secondary hover:text-[#ff3264] transition-all"
                >
                    <X size={16} />
                </button>

                {loading ? (
                    <div className="flex items-center justify-center h-80">
                        <Loader2 size={32} className="animate-spin" style={{ color }} />
                    </div>
                ) : data ? (
                    <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
                        {/* Header */}
                        <div className="p-6 pb-0 flex flex-col sm:flex-row gap-6">
                            {/* Profile Photo */}
                            <div className="flex flex-col items-center sm:items-start gap-3">
                                <div className="w-32 h-44 flex-shrink-0 rounded-xl overflow-hidden border border-border shadow-lg">
                                    {data.profileUrl ? (
                                        <img src={data.profileUrl} alt={data.name} className="w-full h-full object-cover object-top" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-bg-secondary">
                                            <UserIcon size={40} style={{ color }} />
                                        </div>
                                    )}
                                </div>

                                {/* Favorite Button */}
                                {session && (
                                    <button
                                        onClick={toggleFavorite}
                                        disabled={favLoading}
                                        className="w-32 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border"
                                        style={isFavorited ? {
                                            background: 'rgba(255,50,100,0.15)',
                                            borderColor: 'rgba(255,50,100,0.4)',
                                            color: '#ff3264',
                                        } : {
                                            background: 'rgba(123,47,255,0.1)',
                                            borderColor: 'rgba(123,47,255,0.35)',
                                            color: '#7b2fff',
                                        }}
                                    >
                                        {favLoading ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <Heart size={12} fill={isFavorited ? 'currentColor' : 'none'} />
                                        )}
                                        {isFavorited ? 'Favorited' : 'Favorite'}
                                    </button>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                        style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                                    >
                                        {data.knownForDepartment}
                                    </span>
                                    {data.imdbId && (
                                        <a
                                            href={`https://www.imdb.com/name/${data.imdbId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-[#f5c518] hover:underline font-bold mr-2"
                                        >
                                            <ExternalLink size={10} /> IMDb
                                        </a>
                                    )}
                                    <Link
                                        href={`/person/${data.id}`}
                                        onClick={() => onClose()}
                                        className="flex items-center gap-1 text-[10px] text-accent-cyan hover:underline font-bold"
                                    >
                                        <ExternalLink size={10} /> View Full Profile
                                    </Link>
                                </div>

                                <h2 className="text-2xl font-display font-bold text-[#e8edf5] mb-2">{data.name}</h2>

                                {/* Meta info */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#8899aa] mb-3">
                                    {data.birthday && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {new Date(data.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            {' '}({getAge(data.birthday, data.deathday)} {data.deathday ? 'years' : 'yo'})
                                        </span>
                                    )}
                                    {data.deathday && (
                                        <span className="text-[#ff6b9d]">
                                            † {new Date(data.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                    {data.placeOfBirth && (
                                        <span className="flex items-center gap-1">
                                            <MapPin size={11} />
                                            {data.placeOfBirth}
                                        </span>
                                    )}
                                </div>

                                {/* Also Known As */}
                                {data.alsoKnownAs?.length > 0 && (
                                    <p className="text-[10px] text-[#4a5568] mb-3">
                                        Also known as: {data.alsoKnownAs.join(', ')}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                                    <div className="px-3 py-1.5 rounded-lg text-xs border border-border bg-bg-secondary">
                                        <span className="text-[#e8edf5] font-bold">{data.castCredits?.length || 0}</span>
                                        <span className="text-[#8899aa] ml-1">Acting</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg text-xs border border-border bg-bg-secondary">
                                        <span className="text-[#e8edf5] font-bold">{data.crewCredits?.length || 0}</span>
                                        <span className="text-[#8899aa] ml-1">Crew</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg text-xs border border-border bg-bg-secondary">
                                        <Star size={10} className="inline text-[#ffd700] mr-1" />
                                        <span className="text-[#e8edf5] font-bold">{data.popularity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Biography */}
                        {data.biography && (
                            <div className="px-6 py-4">
                                <p className="text-xs text-[#8899aa] leading-relaxed line-clamp-4">
                                    {data.biography}
                                </p>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="px-6 border-b border-border">
                            <div className="flex gap-1">
                                {data.castCredits?.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('cast')}
                                        className="px-4 py-2.5 text-xs font-semibold transition-all border-b-2"
                                        style={activeTab === 'cast' ? {
                                            color: '#00d4ff',
                                            borderColor: '#00d4ff',
                                        } : {
                                            color: '#6b7a8d',
                                            borderColor: 'transparent',
                                        }}
                                    >
                                        <Film size={12} className="inline mr-1.5" />
                                        Acting ({data.castCredits.length})
                                    </button>
                                )}
                                {data.crewCredits?.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('crew')}
                                        className="px-4 py-2.5 text-xs font-semibold transition-all border-b-2"
                                        style={activeTab === 'crew' ? {
                                            color: '#7b2fff',
                                            borderColor: '#7b2fff',
                                        } : {
                                            color: '#6b7a8d',
                                            borderColor: 'transparent',
                                        }}
                                    >
                                        <Clapperboard size={12} className="inline mr-1.5" />
                                        Crew ({data.crewCredits.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Credits Grid */}
                        <div className="p-6 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {(activeTab === 'cast' ? data.castCredits : data.crewCredits)?.map((credit: any, idx: number) => {
                                    const isAdded = addedCredits.has(credit.id)
                                    const isAdding = addingCredit === credit.id
                                    return (
                                        <div
                                            key={`${credit.id}-${idx}`}
                                            className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-border-bright bg-bg-secondary/50 transition-all group"
                                        >
                                            {/* Poster */}
                                            <div className="w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-bg-primary">
                                                {credit.posterUrl ? (
                                                    <img src={credit.posterUrl} alt={credit.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {credit.mediaType === 'tv' ? (
                                                            <Tv size={14} className="text-[#4a5568]" />
                                                        ) : (
                                                            <Film size={14} className="text-[#4a5568]" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-[#e8edf5] truncate">{credit.title}</p>
                                                {activeTab === 'cast' ? (
                                                    <p className="text-[10px] text-[#00d4ff] truncate mt-0.5">
                                                        {credit.character ? `as ${credit.character}` : 'Unknown Role'}
                                                        {credit.episodeCount ? ` · ${credit.episodeCount} eps` : ''}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-[#7b2fff] truncate mt-0.5">
                                                        {credit.job || credit.department || 'Crew'}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {credit.releaseDate && (
                                                        <span className="text-[9px] text-[#4a5568]">
                                                            {credit.releaseDate.split('-')[0]}
                                                        </span>
                                                    )}
                                                    {credit.voteAverage && credit.voteAverage > 0 && (
                                                        <span className="text-[9px] text-[#ffd700] flex items-center gap-0.5">
                                                            <Star size={8} fill="currentColor" /> {credit.voteAverage}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-[#4a5568] uppercase">
                                                        {credit.mediaType === 'tv' ? '📺 TV' : '🎬 Movie'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Add to Library buttons */}
                                            {session && (
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    {isAdded ? (
                                                        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold text-[#00ff9d]">
                                                            <Check size={10} /> Added
                                                        </div>
                                                    ) : isAdding ? (
                                                        <Loader2 size={14} className="animate-spin text-[#00d4ff] mx-auto" />
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => addCreditToLibrary(credit, 'COMPLETED')}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold border transition-all hover:scale-105"
                                                                style={{
                                                                    background: 'rgba(0,212,255,0.08)',
                                                                    borderColor: 'rgba(0,212,255,0.25)',
                                                                    color: '#00d4ff',
                                                                }}
                                                                title="Mark as watched"
                                                            >
                                                                <Check size={9} /> Watched
                                                            </button>
                                                            <button
                                                                onClick={() => addCreditToLibrary(credit, 'PLANNED')}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold border transition-all hover:scale-105"
                                                                style={{
                                                                    background: 'rgba(123,47,255,0.08)',
                                                                    borderColor: 'rgba(123,47,255,0.25)',
                                                                    color: '#7b2fff',
                                                                }}
                                                                title="Add to watchlist"
                                                            >
                                                                <Plus size={9} /> Watchlist
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-80 text-[#4a5568]">
                        <p>Could not load person details.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
