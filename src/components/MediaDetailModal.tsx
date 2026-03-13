'use client'

import { useState, useEffect } from 'react'
import { X, Star, Clock, Film, ExternalLink, Trash2, Save, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProgressEditor } from './ProgressEditor'
import { ProgressBar } from './ProgressBar'
import { calcProgressFraction, formatProgressLabel } from '@/lib/utils/media'

interface MediaItem {
    id: string
    title: string
    type: string
    status: string
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
    // Progress fields
    progress?: number | null
    pageCount?: number | null
}

interface MediaDetailModalProps {
    item: MediaItem
    onClose: () => void
    onUpdate: (updated: MediaItem) => void
    onDelete: (id: string) => void
}

const STATUS_OPTIONS = ['WATCHING', 'COMPLETED', 'PLANNED', 'DROPPED'] as const
const STATUS_LABELS: Record<string, string> = {
    WATCHING: '▶ In Progress', COMPLETED: '✓ Completed', PLANNED: '+ Planned', DROPPED: '✕ Dropped'
}

export function MediaDetailModal({ item, onClose, onUpdate, onDelete }: MediaDetailModalProps) {
    const [status, setStatus] = useState(item.status)
    const [rating, setRating] = useState(item.userRating ?? 0)
    const [hoverRating, setHoverRating] = useState(0)
    const [notes, setNotes] = useState(item.notes ?? '')
    const [episodeCount, setEpisodeCount] = useState(item.episodeCount ?? '')
    const [episodeDuration, setEpisodeDuration] = useState(item.episodeDuration ?? '')
    const [playtimeHours, setPlaytimeHours] = useState(item.playtimeHours ?? '')
    const [localItem, setLocalItem] = useState(item)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    async function handleSave() {
        setSaving(true)
        try {
            const body: Record<string, any> = { status, userRating: rating || null, notes: notes.trim() || null }
            if (item.type === 'ANIME' || item.type === 'TVSHOW') {
                body.episodeCount = episodeCount ? parseInt(String(episodeCount)) : null
                body.episodeDuration = episodeDuration ? parseInt(String(episodeDuration)) : null
            }
            if (item.type === 'GAME') body.playtimeHours = playtimeHours ? parseFloat(String(playtimeHours)) : null

            const res = await fetch(`/api/media/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Saved!')
            onUpdate(data.item)
        } catch (e: any) {
            toast.error(e.message || 'Failed to save')
        }
        setSaving(false)
    }

    async function handleDelete() {
        if (!confirm(`Remove "${item.title}" from your library?`)) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast.success('Removed from library')
            onDelete(item.id)
            onClose()
        } catch {
            toast.error('Failed to remove')
        }
        setDeleting(false)
    }

    function formatTime(min: number | null) {
        if (!min) return null
        const h = Math.floor(min / 60); const m = min % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    const progressFraction = calcProgressFraction(localItem)
    const progressLabel = formatProgressLabel(localItem)

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: 860 }}>
                {/* Backdrop header */}
                {item.backdropUrl && (
                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        <img src={item.backdropUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-secondary" />
                        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className={`flex gap-6 p-6 ${!item.backdropUrl ? 'pt-6' : 'pt-2'}`}>
                    {/* Poster */}
                    <div className="flex-shrink-0">
                        {!item.backdropUrl && (
                            <div className="flex justify-end mb-2">
                                <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:text-text-primary transition-colors hover:bg-bg-hover">
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                        <div className="w-36 rounded-xl overflow-hidden shadow-card flex-shrink-0" style={{ minWidth: 144 }}>
                            {item.posterUrl ? (
                                <img src={item.posterUrl} alt={item.title} className="w-full aspect-[2/3] object-cover" />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-bg-hover flex items-center justify-center">
                                    <Film size={32} className="text-text-muted" />
                                </div>
                            )}
                        </div>

                        {/* Mini progress bar under poster */}
                        {progressFraction !== null && (
                            <div className="mt-2 space-y-1">
                                <ProgressBar fraction={progressFraction} size="md" />
                                <p className="text-[9px] text-text-muted text-center font-mono">{progressLabel}</p>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <div>
                            <h2 className="text-xl font-display font-bold text-text-primary">{item.title}</h2>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {item.releaseYear && <span className="text-sm text-text-secondary">{item.releaseYear}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full type-${item.type}`}>{item.type}</span>
                                {item.tmdbRating && <span className="text-sm text-[#ffd700]">★ {item.tmdbRating} TMDB</span>}
                                {item.imdbId && (
                                    <a href={`https://www.imdb.com/title/${item.imdbId}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-[#f5c518] hover:underline">
                                        <ExternalLink size={10} /> IMDb
                                    </a>
                                )}
                            </div>
                            {item.genres.length > 0 && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {item.genres.map(g => (
                                        <span key={g} className="text-xs px-2 py-0.5 rounded bg-bg-hover text-text-secondary border border-border">{g}</span>
                                    ))}
                                </div>
                            )}
                            {item.overview && (
                                <p className="text-xs text-text-secondary mt-3 line-clamp-3 leading-relaxed">{item.overview}</p>
                            )}
                        </div>

                        <div className="cyber-line my-4" />

                        {/* Editable fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Status */}
                            <div>
                                <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="input-cyber" id={`status-${item.id}`}>
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Episode fields for anime/TV */}
                            {(item.type === 'ANIME' || item.type === 'TVSHOW') && (
                                <>
                                    <div>
                                        <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Total Episodes</label>
                                        <input type="number" min="0" value={episodeCount} onChange={e => setEpisodeCount(e.target.value as any)}
                                            className="input-cyber" placeholder="e.g. 48" id={`eps-${item.id}`} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Episode Duration (min)</label>
                                        <input type="number" min="1" value={episodeDuration} onChange={e => setEpisodeDuration(e.target.value as any)}
                                            className="input-cyber" placeholder="e.g. 24" id={`dur-${item.id}`} />
                                    </div>
                                </>
                            )}

                            {/* Playtime for games */}
                            {item.type === 'GAME' && (
                                <div>
                                    <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Playtime (hours)</label>
                                    <input type="number" min="0" step="0.5" value={playtimeHours} onChange={e => setPlaytimeHours(e.target.value as any)}
                                        className="input-cyber" placeholder="e.g. 120" id={`play-${item.id}`} />
                                </div>
                            )}

                            {/* Runtime info for movies */}
                            {item.type === 'MOVIE' && item.runtime && (
                                <div>
                                    <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Runtime</label>
                                    <div className="input-cyber flex items-center gap-2 text-text-secondary">
                                        <Clock size={14} /> {formatTime(item.runtime)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── Progress Editor ─────────────────────────────────────────────────── */}
                        {(status === 'WATCHING') && (
                            <div className="mt-4">
                                <label className="block text-xs text-text-secondary mb-2 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp size={11} /> Progress
                                </label>
                                <div className="glass-card p-3 rounded-xl border border-border">
                                    <ProgressEditor
                                        item={localItem}
                                        onProgressSaved={(updated) => setLocalItem(prev => ({ ...prev, ...updated }))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Star Rating */}
                        <div className="mt-4">
                            <label className="block text-xs text-text-secondary mb-2 font-medium uppercase tracking-wider">Your Rating</label>
                            <div className="flex gap-1">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                    <button key={n} type="button"
                                        onClick={() => setRating(rating === n ? 0 : n)}
                                        onMouseEnter={() => setHoverRating(n)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="star"
                                        style={{ color: n <= (hoverRating || rating) ? '#ffd700' : 'var(--border-bright)' }}
                                        aria-label={`Rate ${n}`}
                                    >★</button>
                                ))}
                                {(rating > 0) && <span className="text-sm text-[#ffd700] ml-2 self-center font-bold">{rating}/10</span>}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-4">
                            <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                placeholder="Your thoughts..." className="input-cyber resize-none" id={`notes-${item.id}`} />
                        </div>

                        {/* Total time */}
                        {item.totalTimeMinutes && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                                <Clock size={14} className="text-accent-cyan" />
                                <span>Calculated time: <span className="text-accent-cyan font-semibold">{formatTime(item.totalTimeMinutes)}</span></span>
                            </div>
                        )}

                        {/* Quotes Section */}
                        <div className="mt-6 border-t border-border pt-4">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Quotes</h3>
                            <QuotesSection mediaId={item.id} />
                        </div>

                        {/* Similar Recommendations Section */}
                        {item.tmdbId && (item.type === 'MOVIE' || item.type === 'TVSHOW') && (
                            <div className="mt-6 border-t border-border pt-4">
                                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Similar Titles</h3>
                                <SimilarTitles mediaId={item.tmdbId} type={item.type} />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-5">
                            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                                <Save size={15} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
                                <Trash2 size={15} />
                                {deleting ? '...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuotesSection({ mediaId }: { mediaId: string }) {
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch(`/api/media/${mediaId}/quotes`)
            .then(res => res.json())
            .then(data => {
                setQuotes(Array.isArray(data) ? data : [])
                setLoading(false)
            }).catch(() => setLoading(false))
    }, [mediaId])

    async function addQuote() {
        if (!content.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/media/${mediaId}/quotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim() })
            })
            if (!res.ok) throw new Error()
            const newQuote = await res.json()
            setQuotes(prev => [newQuote, ...prev])
            setContent('')
        } catch {
            toast.error('Failed to add quote')
        }
        setSaving(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Add a memorable quote..."
                    className="input-cyber flex-1 text-sm bg-bg-secondary border-border"
                    onKeyDown={e => e.key === 'Enter' && addQuote()}
                />
                <button
                    onClick={addQuote}
                    disabled={saving || !content.trim()}
                    className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
                >
                    {saving ? 'Adding...' : 'Add Quote'}
                </button>
            </div>

            {loading ? (
                <div className="h-10 rounded-xl shimmer"></div>
            ) : quotes.length === 0 ? (
                <p className="text-xs text-text-muted italic">No quotes added yet. Save your favorite lines here!</p>
            ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {quotes.map(q => (
                        <li key={q.id} className="p-3 glass-card rounded-lg text-sm text-text-primary border-l-2 border-l-accent-cyan italic">
                            "{q.content}"
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function SimilarTitles({ mediaId, type }: { mediaId: string, type: string }) {
    const [similar, setSimilar] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch recommendations from TMDB route
        const endpoint = type === 'MOVIE' ? `/api/tmdb/movie/${mediaId}` : `/api/tmdb/tv/${mediaId}`
        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                if (data.recommendations?.results) {
                    setSimilar(data.recommendations.results.slice(0, 5))
                }
                setLoading(false)
            }).catch(() => setLoading(false))
    }, [mediaId, type])

    if (loading) return <div className="h-24 rounded-xl shimmer"></div>
    if (similar.length === 0) return <p className="text-xs text-text-muted">No similar titles found.</p>

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {similar.map(item => (
                <a
                    key={item.id}
                    href={`/media/${item.id}?type=${type.toLowerCase()}`}
                    className="flex-shrink-0 w-20 group relative overflow-hidden rounded-md"
                    title={item.title || item.name}
                >
                    {item.poster_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w154${item.poster_path}`}
                            alt=""
                            className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full aspect-[2/3] bg-bg-hover"></div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <ExternalLink size={16} className="text-white" />
                    </div>
                </a>
            ))}
        </div>
    )
}
