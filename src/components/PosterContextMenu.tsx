'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Loader2, ListPlus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { STATUS_OPTIONS, type Status } from './StatusIconBar'
import { upsertLibraryStatus } from '@/lib/utils/library'
import { AddToListModal } from './AddToListModal'

interface PosterContextMenuProps {
    /** The item as it exists in the browse / explore feeds */
    item: {
        id?: string | null
        tmdbId?: string | number | null
        rawgId?: number | null
        bookId?: string | null
        title: string
        type: string
        posterUrl?: string | null
        releaseYear?: number | null
        genres?: string[]
        overview?: string | null
        tmdbRating?: number | null
        runtime?: number | null
        episodeCount?: number | null
    }
    currentStatus?: Status | null
    onStatusChange?: (newStatus: Status, newlySavedItem?: any) => void
}

export function PosterContextMenu({ item, currentStatus, onStatusChange }: PosterContextMenuProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showAddToList, setShowAddToList] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [open])

    async function selectStatus(status: Status) {
        if (!session) {
            toast.error('Sign in to track media')
            setOpen(false)
            return
        }

        setSaving(true)
        setOpen(false)

        const opt = STATUS_OPTIONS.find(o => o.value === status)
        const result = await upsertLibraryStatus(item, status, opt?.label ?? status)
        if (result) {
            onStatusChange?.(status, result)
        }

        setSaving(false)
    }

    return (
        <div ref={menuRef} className="absolute top-2 right-2 z-[60]">
            <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
                className={`p-1.5 rounded-full backdrop-blur-[2px] shadow-lg transition-all border border-white/10 ${open
                    ? 'bg-accent-cyan text-bg-dark border-transparent scale-110'
                    : 'bg-black/40 text-white/90 opacity-0 group-hover:opacity-100 hover:bg-black/60 hover:scale-105'
                    }`}
                aria-label="Media options"
            >
                {saving
                    ? <Loader2 size={14} className="animate-spin" />
                    : <MoreVertical size={14} />
                }
            </button>

            {open && (
                <div className="absolute right-0 top-[120%] mt-1 w-44 glass-card rounded-xl border border-border/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[9999]">
                    <div className="p-1">
                        {STATUS_OPTIONS.map(opt => {
                            const isActive = currentStatus === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    disabled={isActive}
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); selectStatus(opt.value) }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left group/btn ${isActive
                                        ? 'bg-accent-cyan/10 ' + (opt.activeClass.split(' ').find(c => c.startsWith('text-')) ?? 'text-white') + ' cursor-default shadow-[inset_2px_0_0_var(--accent-cyan)]'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center transition-transform group-hover/btn:scale-110 ${isActive ? '' : 'opacity-70 group-hover/btn:opacity-100'}`}>
                                        {opt.icon}
                                    </div>
                                    <span className="flex-1">{opt.label}</span>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shadow-[0_0_8px_currentColor]" />}
                                </button>
                            );
                        })}

                        <div className="h-px bg-border/50 my-1 w-full mx-1" style={{ width: 'calc(100% - 8px)' }} />

                        <button
                            onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                setOpen(false)
                                setShowAddToList(true)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover/50 transition-all text-left"
                        >
                            <div className="flex items-center justify-center opacity-70">
                                <ListPlus size={14} />
                            </div>
                            <span className="flex-1">Add to List...</span>
                        </button>
                    </div>
                </div>
            )}

            {showAddToList && (
                <AddToListModal item={item} onClose={() => setShowAddToList(false)} />
            )}
        </div>
    )
}
