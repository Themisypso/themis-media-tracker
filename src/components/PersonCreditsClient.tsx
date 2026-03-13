'use client'

import { useState } from 'react'
import { Film, Clapperboard, Star, Check, Plus, Loader2, Tv } from 'lucide-react'
import toast from 'react-hot-toast'

interface Credit {
    id: number
    title: string
    posterUrl: string | null
    releaseDate: string | null
    voteAverage: number | null
    mediaType: string
    character?: string | null
    job?: string | null
    department?: string | null
    episodeCount?: number | null
}

interface PersonCreditsClientProps {
    initialData: {
        id: number
        castCredits: Credit[]
        crewCredits: Credit[]
    }
    isLoggedIn: boolean
}

export function PersonCreditsClient({ initialData, isLoggedIn }: PersonCreditsClientProps) {
    const [activeTab, setActiveTab] = useState<'cast' | 'crew'>(initialData.castCredits.length > 0 ? 'cast' : 'crew')
    const [addingCredit, setAddingCredit] = useState<number | null>(null)
    const [addedCredits, setAddedCredits] = useState<Set<number>>(new Set())

    async function addCreditToLibrary(credit: any, status: 'PLANNED' | 'COMPLETED') {
        if (!isLoggedIn) {
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

    const credits = activeTab === 'cast' ? initialData.castCredits : initialData.crewCredits

    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-bg-card/50 p-1.5 rounded-2xl border border-border w-fit mx-auto md:mx-0">
                {initialData.castCredits.length > 0 && (
                    <button
                        onClick={() => setActiveTab('cast')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
                            ${activeTab === 'cast'
                                ? 'bg-accent-cyan text-black shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
                    >
                        <Film size={16} />
                        Acting Credits ({initialData.castCredits.length})
                    </button>
                )}
                {initialData.crewCredits.length > 0 && (
                    <button
                        onClick={() => setActiveTab('crew')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
                            ${activeTab === 'crew'
                                ? 'bg-[#7b2fff] text-white shadow-[0_0_20px_rgba(123,47,255,0.3)]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
                    >
                        <Clapperboard size={16} />
                        Crew Credits ({initialData.crewCredits.length})
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {credits.map((credit, idx) => {
                    const isAdded = addedCredits.has(credit.id)
                    const isAdding = addingCredit === credit.id

                    return (
                        <div key={`${credit.id}-${idx}`} className="glass-card flex gap-4 p-4 rounded-2xl border border-border hover:border-accent-cyan/50 transition-all group/card">
                            {/* Small Poster */}
                            <div className="w-16 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-bg-primary shadow-lg">
                                {credit.posterUrl ? (
                                    <img src={credit.posterUrl} alt={credit.title} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                        {credit.mediaType === 'tv' ? <Tv size={20} /> : <Film size={20} />}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="font-bold text-text-primary text-sm truncate group-hover/card:text-accent-cyan transition-colors">{credit.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {activeTab === 'cast' ? (
                                            <p className="text-[11px] text-accent-cyan font-medium truncate italic opacity-80">
                                                {credit.character ? `as ${credit.character}` : 'Unknown Role'}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-accent-purple font-medium truncate opacity-80">
                                                {credit.job || credit.department || 'Crew'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {credit.releaseDate && (
                                            <span className="text-[10px] text-text-muted font-bold px-1.5 py-0.5 rounded bg-bg-secondary border border-border">
                                                {credit.releaseDate.split('-')[0]}
                                            </span>
                                        )}
                                        {credit.voteAverage && credit.voteAverage > 0 && (
                                            <span className="text-[10px] text-[#ffd700] flex items-center gap-1 font-bold">
                                                <Star size={10} fill="currentColor" /> {credit.voteAverage}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-text-muted font-bold opacity-60 uppercase">
                                            {credit.mediaType === 'tv' ? 'TV' : 'Movie'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {isLoggedIn && (
                                    <div className="flex gap-2 mt-3">
                                        {isAdded ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/20">
                                                <Check size={12} /> Added
                                            </div>
                                        ) : isAdding ? (
                                            <div className="px-3 py-1">
                                                <Loader2 size={16} className="animate-spin text-accent-cyan" />
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => addCreditToLibrary(credit, 'COMPLETED')}
                                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan hover:text-black transition-all"
                                                >
                                                    Mark Watched
                                                </button>
                                                <button
                                                    onClick={() => addCreditToLibrary(credit, 'PLANNED')}
                                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-bg-secondary border border-border text-text-secondary hover:border-accent-purple hover:text-accent-purple transition-all"
                                                >
                                                    <Plus size={10} className="inline mr-1" /> Watchlist
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
