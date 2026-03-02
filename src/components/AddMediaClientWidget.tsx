'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
    baseItem: any;
}

export function AddMediaClientWidget({ baseItem }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('PLANNED')
    const [rating, setRating] = useState(0)

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="btn-primary w-full flex items-center justify-center py-3 text-sm font-medium">
                <Plus size={16} className="mr-2" /> Add to Library
            </button>
        )
    }

    async function handleSave() {
        setLoading(true)
        try {
            const payload = {
                title: baseItem.title,
                type: baseItem.type,
                status,
                tmdbId: baseItem.tmdbId,
                imdbId: baseItem.imdbId,
                posterUrl: baseItem.posterUrl,
                backdropUrl: baseItem.backdropUrl,
                genres: baseItem.genres,
                releaseYear: baseItem.releaseYear,
                overview: baseItem.overview,
                tmdbRating: baseItem.tmdbRating,
                runtime: baseItem.runtime,
                episodeCount: baseItem.episodeCount,
                userRating: rating > 0 ? rating : null,
            }

            const res = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Successfully added to your library!')
            router.refresh() // Refresh the page to show "Already in Library"
        } catch (e: any) {
            toast.error(e.message || 'Failed to add')
        }
        setLoading(false)
    }

    return (
        <div className="glass-card p-4 rounded-xl border border-border mt-2 animate-fade-in shadow-card text-left">
            <h4 className="text-sm font-bold text-text-primary mb-3">Add to Library</h4>

            <label className="block text-xs text-text-secondary mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-cyber w-full mb-4">
                <option value="WATCHING">Watching / Playing</option>
                <option value="COMPLETED">Completed</option>
                <option value="PLANNED">Planned</option>
                <option value="DROPPED">Dropped</option>
            </select>

            <label className="block text-xs text-text-secondary mb-1">Your Rating</label>
            <div className="flex gap-1 mb-5 bg-bg-secondary p-2.5 rounded-lg border border-border justify-center overflow-x-auto scrollbar-none">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button key={n} type="button" onClick={() => setRating(rating === n ? 0 : n)}
                        className="text-lg hover:scale-125 transition-transform px-0.5"
                        style={{ color: n <= rating ? '#ffd700' : 'var(--border-bright)' }}>
                        ★
                    </button>
                ))}
            </div>

            <div className="flex gap-3">
                <button onClick={() => setOpen(false)} disabled={loading} className="px-4 py-2 rounded-lg text-sm bg-bg-hover text-text-secondary border border-border flex-1 font-medium hover:bg-bg-card transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={loading} className="btn-primary py-2 flex-1 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                </button>
            </div>
        </div>
    )
}
