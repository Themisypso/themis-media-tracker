'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Plus, List as ListIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AddToListModalProps {
    item: any
    onClose: () => void
}

export function AddToListModal({ item, onClose }: AddToListModalProps) {
    const [lists, setLists] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/lists')
            .then(r => r.json())
            .then(data => {
                setLists(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => {
                toast.error('Failed to load lists')
                setLoading(false)
            })
    }, [])

    async function addToList(listId: string) {
        setSaving(listId)
        try {
            const res = await fetch(`/api/lists/${listId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tmdbId: item.tmdbId ? String(item.tmdbId) : null,
                    rawgId: item.rawgId ? String(item.rawgId) : null,
                    bookId: item.bookId || null,
                    mediaType: item.type,
                    title: item.title,
                    posterUrl: item.posterUrl
                })
            })

            if (!res.ok) throw new Error('Failed')

            toast.success('Added to list!')
            setTimeout(() => onClose(), 500)
        } catch (error) {
            toast.error('Could not add to list')
            setSaving(null)
        }
    }

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onClose()
                }}
            />

            <div
                className="relative glass-card w-full max-w-sm rounded-2xl border border-border bg-bg-card shadow-2xl animate-slide-up flex flex-col max-h-[80vh]"
                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
                <div className="flex items-center justify-between p-4 border-b border-border bg-bg-secondary/50 rounded-t-2xl shrink-0">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <ListIcon size={18} className="text-accent-pink" /> Add to List
                    </h2>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onClose()
                        }}
                        className="p-1.5 hover:bg-bg-hover rounded-full text-text-muted hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <p className="text-xs text-text-secondary mb-4">Adding <strong className="text-text-primary">{item.title}</strong> to:</p>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-accent-pink" />
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-sm text-text-muted mb-3">You don't have any lists yet.</p>
                            <Link href="/lists" onClick={onClose} className="text-xs font-bold text-accent-cyan hover:underline">
                                Go create a list
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {lists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => addToList(list.id)}
                                    disabled={saving !== null}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-bg-secondary hover:border-accent-pink hover:bg-bg-hover transition-all text-left disabled:opacity-50 group"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-text-primary truncate">{list.title}</p>
                                        <p className="text-[10px] text-text-muted mt-0.5">{list._count?.items || 0} items</p>
                                    </div>
                                    <div className="shrink-0 text-text-muted group-hover:text-accent-pink transition-colors">
                                        {saving === list.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
