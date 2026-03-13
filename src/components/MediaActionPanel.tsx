'use client'

import { useState } from 'react'
import { Loader2, Heart, TrendingUp, Pencil, Check, ListPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMediaFavorites } from '@/hooks/useMediaFavorites'
import { AddMediaClientWidget } from './AddMediaClientWidget'
import { AddToListModal } from './AddToListModal'
import { ProgressEditor } from './ProgressEditor'
import { ProgressBar } from './ProgressBar'
import { StatusIconBar, type Status } from './StatusIconBar'
import { calcProgressFraction, formatProgressLabel } from '@/lib/utils/media'
import Link from 'next/link'

export function MediaActionPanel({ baseItem, userMediaItem, session, urlId }: any) {
    const { isFavorited, toggleFavorite } = useMediaFavorites()
    const [localItem, setLocalItem] = useState(userMediaItem)
    const [editing, setEditing] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<Status | null>(null)
    const [saving, setSaving] = useState(false)
    const [showAddToList, setShowAddToList] = useState(false)

    const isFav = isFavorited(baseItem?.tmdbId?.toString())

    if (!session) {
        return (
            <Link href={`/auth/login?callbackUrl=/media/${urlId}`}
                className="btn-primary w-full flex items-center justify-center py-4 text-sm font-bold shadow-lg shadow-accent-cyan/20 tracking-wider">
                SIGN IN TO TRACK
            </Link>
        )
    }

    // ─── Not in library ───────────────────────────────────────────────────────
    if (!localItem) {
        return (
            <div className="space-y-3">
                <div className="bg-bg-card rounded-xl border border-border p-2">
                    <AddMediaClientWidget
                        baseItem={baseItem}
                        onAdded={(item) => {
                            setLocalItem(item)
                            // If added as WATCHING, immediately open progress editor
                            if (item.status === 'WATCHING') setEditing(true)
                        }}
                    />
                </div>
                <FavoriteButton item={baseItem} isFav={isFav} toggleFavorite={toggleFavorite} />
                <button
                    onClick={() => setShowAddToList(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-bg-card font-bold tracking-wide transition-all text-text-secondary hover:border-text-muted hover:text-text-primary"
                >
                    <ListPlus size={18} />
                    ADD TO LIST
                </button>

                {showAddToList && (
                    <AddToListModal item={baseItem} onClose={() => setShowAddToList(false)} />
                )}
            </div>
        )
    }

    // ─── Status update (auto-save on icon click) ──────────────────────────────
    async function handleStatusChange(newStatus: Status) {
        // If clicking the already-active status, just open the editor
        if (newStatus === localItem.status && !editing) {
            setEditing(true)
            return
        }
        // Optimistically open progress editor for WATCHING or DROPPED immediately
        if (newStatus === 'WATCHING' || newStatus === 'DROPPED') {
            setEditing(true)
        }
        setPendingStatus(newStatus)
        setSaving(true)
        try {
            const res = await fetch(`/api/media/${localItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!res.ok) throw new Error()
            setLocalItem({ ...localItem, status: newStatus })
            toast.success(`Status → ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`)
        } catch {
            toast.error('Failed to update status')
            // Revert optimistic edit open only if the current status wasn't already WATCHING/DROPPED
            if (localItem.status !== 'WATCHING' && localItem.status !== 'DROPPED') {
                setEditing(false)
            }
        }
        setSaving(false)
        setPendingStatus(null)
    }

    const progressFraction = calcProgressFraction(localItem)
    const progressLabel = formatProgressLabel(localItem)

    // ─── Editing panel ────────────────────────────────────────────────────────
    if (editing) {
        return (
            <div className="bg-bg-card rounded-xl border border-border p-4 animate-fade-in shadow-card text-left mt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text-primary">Update Tracking</h4>
                    <button onClick={() => setEditing(false)}
                        className="text-text-muted hover:text-text-secondary text-xs transition-colors">✕ Close</button>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold">Status</label>
                    <StatusIconBar value={localItem.status} onChange={handleStatusChange} disabled={saving} />
                </div>

                {/* Progress editor — shown inline when WATCHING or DROPPED */}
                {(localItem.status === 'WATCHING' || localItem.status === 'DROPPED') && (
                    <div>
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                            <TrendingUp size={10} /> {localItem.status === 'DROPPED' ? 'Last Point' : 'Progress'}
                        </label>
                        <ProgressEditor
                            item={{
                                ...localItem,
                                tmdbId: baseItem.tmdbId ?? localItem.tmdbId ?? null,
                                seasonCount: baseItem.seasonCount ?? localItem.seasonCount ?? null,
                            }}
                            onProgressSaved={(updated) => {
                                setLocalItem({ ...localItem, ...updated })
                            }}
                        />
                    </div>
                )}

                <button onClick={() => setEditing(false)}
                    className="w-full py-2 rounded-lg text-sm border border-border text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors flex items-center justify-center gap-1.5">
                    <Check size={14} /> Done
                </button>
            </div>
        )
    }

    // ─── Default view ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-3 mt-4">
            {/* Status card */}
            <div className="w-full py-3 px-4 text-sm font-medium rounded-xl border border-border-bright bg-bg-card shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-accent-cyan font-bold tracking-wide text-xs">✓ IN LIBRARY</span>
                    <button onClick={() => setEditing(true)}
                        className="p-1.5 hover:bg-bg-hover rounded-lg text-text-secondary hover:text-accent-cyan transition-colors"
                        title="Edit tracking">
                        <Pencil size={14} />
                    </button>
                </div>

                {/* Quick status bar (read-only click = open editor) */}
                <StatusIconBar
                    value={localItem.status}
                    onChange={handleStatusChange}
                    disabled={saving}
                />
            </div>

            {/* Inline progress bar for WATCHING with progress */}
            {localItem.status === 'WATCHING' && progressFraction !== null && (
                <button onClick={() => setEditing(true)}
                    className="w-full glass-card p-3 rounded-xl border border-border hover:border-accent-cyan/50 transition-all text-left group">
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mb-1.5">
                        <span className="flex items-center gap-1"><TrendingUp size={10} /> Progress</span>
                        <span className="text-accent-cyan font-mono">{progressLabel}</span>
                    </div>
                    <ProgressBar fraction={progressFraction} size="md" />
                    <p className="text-[9px] text-text-muted mt-1.5 group-hover:text-accent-cyan transition-colors">Click to update</p>
                </button>
            )}

            {/* Quick log-progress chip for WATCHING with no progress yet */}
            {localItem.status === 'WATCHING' && progressFraction === null && (
                <button onClick={() => setEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-text-muted hover:border-accent-cyan hover:text-accent-cyan transition-all text-xs font-medium">
                    <TrendingUp size={14} /> Log Progress
                </button>
            )}

            <FavoriteButton item={baseItem} isFav={isFav} toggleFavorite={toggleFavorite} />

            <button
                onClick={() => setShowAddToList(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-bg-card font-bold tracking-wide transition-all text-text-secondary hover:border-text-muted hover:text-text-primary"
            >
                <ListPlus size={18} />
                ADD TO LIST
            </button>

            {showAddToList && (
                <AddToListModal item={baseItem} onClose={() => setShowAddToList(false)} />
            )}
        </div>
    )
}

function FavoriteButton({ item, isFav, toggleFavorite }: any) {
    return (
        <button
            onClick={() => toggleFavorite({
                tmdbId: item.tmdbId?.toString() || String(item.rawgId || item.bookId || ''),
                title: item.title, type: item.type,
                posterUrl: item.posterUrl, releaseYear: item.releaseYear,
            })}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-bold tracking-wide transition-all ${isFav
                ? 'bg-accent-pink/10 border-accent-pink/50 text-accent-pink hover:bg-accent-pink/20'
                : 'bg-bg-card border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
                }`}
        >
            <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
            {isFav ? 'FAVORITED' : 'ADD TO FAVORITES'}
        </button>
    )
}
