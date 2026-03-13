'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, ChevronUp, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProgressBar } from './ProgressBar'
import { EpisodeSelector } from './EpisodeSelector'
import { calcProgressFraction, formatProgressLabel } from '@/lib/utils/media'

export interface ProgressEditorItem {
    id: string
    type: string
    progress?: number | null
    runtime?: number | null
    episodeCount?: number | null
    pageCount?: number | null
    // Used by EpisodeSelector
    tmdbId?: string | null
    seasonCount?: number | null
    playtimeHours?: number | null
}

interface ProgressEditorProps {
    item: ProgressEditorItem
    onProgressSaved?: (updatedItem: any) => void
}

/** Convert hours/minutes/seconds to total minutes (no rounding below 1 min) */
function hmsToMinutes(h: number, m: number, s: number): number {
    return Math.floor(h * 60 + m + s / 60)
}

function minutesToHms(totalMinutes: number): { h: number; m: number; s: number } {
    const h = Math.floor(totalMinutes / 60)
    const m = Math.floor(totalMinutes % 60)
    return { h, m, s: 0 }
}

export function ProgressEditor({ item, onProgressSaved }: ProgressEditorProps) {
    const [value, setValue] = useState<number>(item.type === 'GAME' ? (item.playtimeHours ?? 0) : (item.progress ?? 0))
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE')
    const debounceRef = useRef<NodeJS.Timeout>()

    // Movie: hours + minutes + seconds breakdown
    const initHms = minutesToHms(item.progress ?? 0)
    const [movieH, setMovieH] = useState(initHms.h)
    const [movieM, setMovieM] = useState(initHms.m)
    const [movieS, setMovieS] = useState(0)

    // TV: season (display only) + episode
    const [tvSeason, setTvSeason] = useState(1)
    const [tvEpisode, setTvEpisode] = useState(item.progress ?? 0)
    const [fetchedSeasonCount, setFetchedSeasonCount] = useState<number | null>(item.seasonCount ?? null)

    useEffect(() => {
        if ((item.type === 'TVSHOW' || item.type === 'ANIME') && item.tmdbId && !fetchedSeasonCount) {
            fetch(`/api/tmdb/details/${item.tmdbId}?type=tv`)
                .then(r => r.json())
                .then(d => {
                    if (d.seasonCount) setFetchedSeasonCount(d.seasonCount)
                })
                .catch(() => { })
        }
    }, [item.type, item.tmdbId, fetchedSeasonCount])

    const fraction = calcProgressFraction({ ...item, progress: value })
    const label = formatProgressLabel({ ...item, progress: value })

    async function handleInstantSave(overrideValue: number) {
        setSaveStatus('SAVING')
        const payload: any = { mediaId: item.id, type: item.type }
        if (item.type === 'MOVIE') payload.progressMinutes = overrideValue
        else if (item.type === 'BOOK') payload.currentPage = overrideValue
        else if (item.type === 'GAME') payload.playtimeHours = overrideValue
        else if (item.type === 'TVSHOW' || item.type === 'ANIME') payload.currentEpisode = overrideValue

        try {
            const res = await fetch('/api/media/progress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                setSaveStatus('SAVED')
                setTimeout(() => setSaveStatus('IDLE'), 2000)
                if (data.statusChanged) toast.success(`Status → ${data.newStatus}`)
                onProgressSaved?.(data.item)
            } else {
                setSaveStatus('IDLE')
            }
        } catch {
            setSaveStatus('IDLE')
        }
    }

    function triggerAutoSave(newVal: number) {
        setValue(newVal)
        clearTimeout(debounceRef.current!)
        debounceRef.current = setTimeout(() => {
            handleInstantSave(newVal)
        }, 800)
    }

    function renderSaveStatus() {
        return (
            <div className="flex justify-end mt-1 h-4">
                {saveStatus === 'SAVING' && <span className="text-[10px] text-text-muted flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
                {saveStatus === 'SAVED' && <span className="text-[10px] text-accent-cyan flex items-center gap-1"><Check size={10} /> Saved</span>}
            </div>
        )
    }

    // ─── MOVIE — h/m/s inputs ─────────────────────────────────────────────────
    if (item.type === 'MOVIE') {
        const totalRuntime = item.runtime ?? 300
        const fraction = calcProgressFraction({ ...item, progress: value })
        const runtimeHms = minutesToHms(totalRuntime)

        const onHmsChange = (h: number, m: number, s: number) => {
            setMovieH(h); setMovieM(m); setMovieS(s)
            triggerAutoSave(hmsToMinutes(h, m, s))
        }

        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Watch Progress</span>
                    <span className="text-accent-cyan font-mono">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-[10px] text-text-muted w-4">h</label>
                    <input type="number" min={0} max={runtimeHms.h + 1} value={movieH}
                        onChange={e => onHmsChange(Number(e.target.value), movieM, movieS)}
                        className="input-cyber flex-1 text-center font-mono text-sm" />
                    <label className="text-[10px] text-text-muted w-4">m</label>
                    <input type="number" min={0} max={59} value={movieM}
                        onChange={e => onHmsChange(movieH, Number(e.target.value), movieS)}
                        className="input-cyber flex-1 text-center font-mono text-sm" />
                    <label className="text-[10px] text-text-muted w-4">s</label>
                    <input type="number" min={0} max={59} value={movieS}
                        onChange={e => onHmsChange(movieH, movieM, Number(e.target.value))}
                        className="input-cyber flex-1 text-center font-mono text-sm" />
                </div>
                <p className="text-[10px] text-text-muted text-right mb-1">
                    Total: {runtimeHms.h}h {runtimeHms.m}m
                </p>
                {fraction !== null && <ProgressBar fraction={fraction} size="md" />}
                {renderSaveStatus()}
            </div>
        )
    }

    // ─── TV / ANIME — season + episode picker (WATCHING & DROPPED both need this) ──────
    if (item.type === 'TVSHOW' || item.type === 'ANIME') {
        const maxEp = item.episodeCount ?? 9999
        const fraction = calcProgressFraction({ ...item, progress: tvEpisode })

        const onEpisodeChange = (n: number) => {
            const clamped = Math.min(maxEp, Math.max(0, n))
            setTvEpisode(clamped)
            triggerAutoSave(clamped)
        }

        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Episode Progress</span>
                    <span className="text-accent-cyan font-mono">
                        S{tvSeason} E{tvEpisode}{item.episodeCount ? ` / ${item.episodeCount}` : ''}
                    </span>
                </div>

                {/* Season selector (if show has multiple seasons) */}
                {(fetchedSeasonCount ?? 1) > 1 && !item.tmdbId && (
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-text-muted w-14 flex-shrink-0">Season</label>
                        <select value={tvSeason} onChange={e => setTvSeason(Number(e.target.value))}
                            className="input-cyber text-sm flex-1">
                            {Array.from({ length: fetchedSeasonCount ?? 1 }, (_, i) => i + 1).map(s =>
                                <option key={s} value={s}>Season {s}</option>
                            )}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => onEpisodeChange(tvEpisode - 1)} disabled={tvEpisode <= 0}
                        className="p-2 rounded-lg bg-bg-secondary border border-border text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors disabled:opacity-30">
                        <ChevronDown size={16} />
                    </button>
                    <input type="number" min={0} max={maxEp} value={tvEpisode}
                        onChange={e => onEpisodeChange(Number(e.target.value))}
                        className="input-cyber flex-1 text-center font-mono"
                        aria-label="Current episode number" />
                    <button type="button" onClick={() => onEpisodeChange(tvEpisode + 1)} disabled={tvEpisode >= maxEp}
                        className="p-2 rounded-lg bg-bg-secondary border border-border text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors disabled:opacity-30">
                        <ChevronUp size={16} />
                    </button>
                </div>

                {/* Episode picker from TMDB — handles its own instant-save per episode */}
                {item.tmdbId && (
                    <EpisodeSelector
                        mediaItemId={item.id}
                        mediaType={item.type}
                        tmdbId={item.tmdbId}
                        totalSeasons={fetchedSeasonCount}
                        currentEpisode={tvEpisode}
                        autoExpand={true}
                        onProgressUpdate={(ep, _season) => {
                            setTvSeason(_season)
                            // Skip triggerAutoSave here, EpisodeSelector handles its own fetching
                            setTvEpisode(ep)
                            setValue(ep)
                        }}
                    />
                )}

                {fraction !== null && <ProgressBar fraction={fraction} size="md" />}
                {renderSaveStatus()}
            </div>
        )
    }

    // ─── BOOK — page number input ─────────────────────────────────────────────
    if (item.type === 'BOOK') {
        const max = item.pageCount ?? 99999
        const fraction = calcProgressFraction({ ...item, progress: value })
        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
                    <span>Reading Progress</span>
                    <span className="text-accent-cyan font-mono">{label ?? `Page ${value}`}</span>
                </div>
                <input type="number" min={0} max={max} value={value === 0 ? '' : value}
                    onChange={e => triggerAutoSave(e.target.value === '' ? 0 : Math.min(max, Math.max(0, Number(e.target.value))))}
                    className="input-cyber w-full" placeholder={`Page (max ${max})`} />
                {fraction !== null && <ProgressBar fraction={fraction} size="md" color="#00ff9d" />}
                {renderSaveStatus()}
            </div>
        )
    }

    // ─── GAME — actual hours input ─────────────────────────────────────────────
    if (item.type === 'GAME') {
        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
                    <span>Playtime Hours</span>
                    <span className="text-accent-cyan font-mono font-bold">{value}h</span>
                </div>
                <input type="number" min={0} step="0.5" value={value === 0 ? '' : value}
                    onChange={e => triggerAutoSave(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="input-cyber w-full" placeholder="Hours played..." />
                {renderSaveStatus()}
            </div>
        )
    }

    return null
}
