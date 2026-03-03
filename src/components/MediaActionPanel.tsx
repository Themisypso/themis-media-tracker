'use client'

import { useState } from 'react'
import { Plus, Loader2, Heart, Edit2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import { AddMediaClientWidget } from './AddMediaClientWidget'
import Link from 'next/link'

export function MediaActionPanel({ baseItem, userMediaItem, session, urlId }: any) {
    const router = useRouter()
    const { isFavorited, toggleFavorite } = useMediaFavorites()
    const [loading, setLoading] = useState(false)
    const [editing, setEditing] = useState(false)

    const [status, setStatus] = useState(userMediaItem?.status || 'PLANNED')

    const isFav = isFavorited(baseItem?.tmdbId?.toString())

    if (!session) {
        return (
            <Link href={`/auth/login?callbackUrl=/media/${urlId}`} className="btn-primary w-full flex items-center justify-center py-4 text-sm font-bold shadow-lg shadow-accent-cyan/20 tracking-wider">
                SIGN IN TO TRACK
            </Link>
        )
    }

    if (!userMediaItem) {
        return (
            <div className="bg-bg-card rounded-xl border border-border p-2">
                <AddMediaClientWidget baseItem={baseItem} />
            </div>
        )
    }

    async function handleUpdate() {
        setLoading(true)
        try {
            const res = await fetch(`/api/media/${userMediaItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (!res.ok) throw new Error()
            toast.success('Library updated!')
            setEditing(false)
            router.refresh()
        } catch {
            toast.error('Failed to update library')
        }
        setLoading(false)
    }

    if (editing) {
        return (
            <div className="bg-bg-card rounded-xl border border-border p-4 animate-fade-in shadow-card text-left mt-4">
                <h4 className="text-sm font-bold text-text-primary mb-3">Update Tracking</h4>

                <label className="block text-xs text-text-secondary mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input-cyber w-full mb-4">
                    <option value="WATCHING">Watching / Playing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PLANNED">Planned</option>
                    <option value="DROPPED">Dropped</option>
                </select>

                <div className="flex gap-3 mt-5">
                    <button onClick={() => { setEditing(false); setStatus(userMediaItem.status); }} disabled={loading} className="px-4 py-2 rounded-lg text-sm bg-bg-hover text-text-secondary border border-border flex-1 font-medium hover:bg-bg-card transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={loading} className="btn-primary py-2 flex-1 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3 mt-4">
            <div className="w-full flex justify-between items-center py-4 px-5 text-sm font-medium rounded-xl border border-border-bright bg-bg-card shadow-lg">
                <div className="flex flex-col">
                    <span className="text-accent-cyan font-bold tracking-wide">✓ IN LIBRARY</span>
                    <span className="text-xs text-text-secondary mt-1">{userMediaItem.status.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setEditing(true)} className="p-2 hover:bg-bg-hover rounded-lg text-text-secondary hover:text-accent-cyan transition-colors" title="Edit tracking">
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>

            {/* Favorite Button */}
            <button
                onClick={() => toggleFavorite({ tmdbId: baseItem.tmdbId?.toString() || '', title: baseItem.title, type: baseItem.type, posterUrl: baseItem.posterUrl, releaseYear: baseItem.releaseYear })}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-bold tracking-wide transition-all ${isFav
                    ? 'bg-[#ff3264]/10 border-[#ff3264]/50 text-[#ff3264] hover:bg-[#ff3264]/20'
                    : 'bg-bg-card border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
                    }`}
            >
                <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                {isFav ? 'FAVORITED' : 'ADD TO FAVORITES'}
            </button>
        </div>
    )
}
