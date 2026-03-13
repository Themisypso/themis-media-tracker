'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Circle, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Episode {
    number: number
    name: string
    airDate: string | null
    runtime: number | null
    stillPath: string | null
}

interface EpisodeSelectorProps {
    /** Local DB id of the MediaItem (needed for the progress PATCH) */
    mediaItemId: string
    mediaType: string
    tmdbId: string
    totalSeasons?: number | null
    currentEpisode?: number
    autoExpand?: boolean
    /** Called when an episode is marked — parent can update its display */
    onProgressUpdate?: (episode: number, season: number) => void
}

export function EpisodeSelector({
    mediaItemId,
    mediaType,
    tmdbId,
    totalSeasons,
    currentEpisode = 0,
    autoExpand = false,
    onProgressUpdate,
}: EpisodeSelectorProps) {
    const [expanded, setExpanded] = useState(autoExpand)
    const [season, setSeason] = useState(1)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(false)
    const [savingEp, setSavingEp] = useState<number | null>(null)
    const [localWatched, setLocalWatched] = useState(currentEpisode)
    const [serverWatched, setServerWatched] = useState(currentEpisode)
    const debounceRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        return () => clearTimeout(debounceRef.current)
    }, [])

    const maxSeasons = totalSeasons ?? 1

    useEffect(() => {
        if (!expanded) return
        setLoading(true)
        fetch(`/api/tmdb/seasons/${tmdbId}?season=${season}`)
            .then(r => r.json())
            .then(d => { setEpisodes(d.episodes || []); setLoading(false) })
            .catch(() => { toast.error('Failed to load episodes'); setLoading(false) })
    }, [tmdbId, season, expanded])

    function markEpisode(epNumber: number) {
        // Optimistic update
        setLocalWatched(epNumber)
        setSavingEp(epNumber)

        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch('/api/media/progress', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mediaId: mediaItemId,
                        type: mediaType,
                        currentEpisode: epNumber,
                    }),
                })

                let data
                const contentType = res.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json()
                } else {
                    const text = await res.text()
                    throw new Error('Server error: invalid response')
                }

                if (!res.ok) throw new Error(data.error || 'Failed')

                setServerWatched(epNumber)
                if (data.statusChanged) toast.success(`Status → ${data.newStatus}`)
                onProgressUpdate?.(epNumber, season)
            } catch (e: any) {
                setLocalWatched(serverWatched) // rollback
                toast.error(e.message || 'Could not save progress')
            } finally {
                setSavingEp(curr => (curr === epNumber ? null : curr))
            }
        }, 500)
    }

    return (
        <div className="space-y-2">
            {/* Toggle button */}
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between text-xs text-text-secondary hover:text-accent-cyan transition-colors py-2 px-3 rounded-xl border border-dashed border-border hover:border-accent-cyan"
            >
                <span className="flex items-center gap-1.5">
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expanded ? 'Hide episode list' : 'Pick from episode list'}
                </span>
                {localWatched > 0 && (
                    <span className="text-accent-cyan font-mono text-[10px]">Ep {localWatched}</span>
                )}
            </button>

            {expanded && (
                <div className="animate-fade-in space-y-2">
                    {/* Season switcher */}
                    {maxSeasons > 1 && (
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold flex-shrink-0">Season</label>
                            <div className="flex gap-1 flex-wrap flex-1">
                                {Array.from({ length: maxSeasons }, (_, i) => i + 1).map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSeason(s)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${season === s
                                            ? 'bg-accent-cyan/15 border-accent-cyan/60 text-accent-cyan'
                                            : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary'}`}
                                    >
                                        S{s}
                                    </button>
                                ))}
                            </div>

                            {episodes.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const maxEp = Math.max(...episodes.map(e => e.number))
                                        if (maxEp > 0) markEpisode(maxEp)
                                    }}
                                    disabled={savingEp !== null}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan hover:text-bg-dark transition-all flex items-center gap-1 ml-auto flex-shrink-0"
                                    title="Mark entire season as watched"
                                >
                                    <CheckCircle size={10} /> Mark Season
                                </button>
                            )}
                        </div>
                    )}

                    {/* Check if season=1 and we need to show Mark Season even if there's only 1 season total */}
                    {maxSeasons === 1 && episodes.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const maxEp = Math.max(...episodes.map(e => e.number))
                                    if (maxEp > 0) markEpisode(maxEp)
                                }}
                                disabled={savingEp !== null}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan hover:text-bg-dark transition-all flex items-center gap-1 flex-shrink-0"
                                title="Mark entire season as watched"
                            >
                                <CheckCircle size={10} /> Mark Season
                            </button>
                        </div>
                    )}

                    {/* Episode list */}
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-bg-secondary divide-y divide-border/40">
                        {loading && (
                            <div className="py-8 flex justify-center">
                                <Loader2 size={20} className="animate-spin text-accent-cyan" />
                            </div>
                        )}
                        {!loading && episodes.map(ep => {
                            const isWatched = ep.number <= localWatched
                            const isSaving = savingEp === ep.number
                            const isCurrent = ep.number === localWatched

                            return (
                                <div
                                    key={ep.number}
                                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition-colors group/row ${isCurrent ? 'bg-accent-cyan/5' : ''}`}
                                >
                                    {/* Ep number */}
                                    <span className="text-[10px] font-mono text-text-muted w-6 text-right flex-shrink-0">
                                        {ep.number}
                                    </span>

                                    {/* Title + runtime */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs truncate ${isWatched ? 'text-text-secondary' : 'text-text-primary'}`}>
                                            {ep.name}
                                        </p>
                                        {ep.runtime && (
                                            <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                                <Clock size={8} /> {ep.runtime}m
                                            </p>
                                        )}
                                    </div>

                                    {/* ✔ instant mark button */}
                                    <button
                                        type="button"
                                        onClick={() => markEpisode(ep.number)}
                                        disabled={isSaving}
                                        aria-label={isWatched ? `Episode ${ep.number} watched` : `Mark episode ${ep.number} as watched`}
                                        className={`flex-shrink-0 p-1 rounded-full transition-all ${isWatched
                                            ? 'text-accent-cyan opacity-100'
                                            : 'text-text-muted opacity-0 group-hover/row:opacity-100 hover:text-accent-cyan'
                                            } disabled:opacity-40`}
                                    >
                                        {isSaving
                                            ? <Loader2 size={15} className="animate-spin" />
                                            : isWatched ? <CheckCircle size={15} /> : <Circle size={15} />
                                        }
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
