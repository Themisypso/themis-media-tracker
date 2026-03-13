'use client'

import { useState, useEffect } from 'react'
import { Layers, Trash2, Star } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import toast from 'react-hot-toast'

export default function AdminListsPage() {
    const [lists, setLists] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLists()
    }, [])

    async function fetchLists() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/lists')
            const data = await res.json()
            setLists(data.lists || [])
        } catch (e) {
            toast.error("Failed to fetch lists")
        }
        setLoading(false)
    }

    async function toggleFeature(id: string, currentlyFeatured: boolean) {
        try {
            const res = await fetch(`/api/admin/lists/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured: !currentlyFeatured })
            })
            if (res.ok) {
                toast.success(currentlyFeatured ? "List unfeatured" : "List featured on homepage!")
                setLists(prev => prev.map(l => l.id === id ? { ...l, isFeatured: !currentlyFeatured } : l))
            } else {
                toast.error("Failed to update list")
            }
        } catch (e) {
            toast.error("Failed to update list")
        }
    }

    async function deleteList(id: string) {
        if (!confirm("Are you sure you want to delete this list?")) return

        try {
            const res = await fetch(`/api/admin/lists/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("List deleted")
                setLists(prev => prev.filter(l => l.id !== id))
            } else {
                toast.error("Failed to delete list")
            }
        } catch (e) {
            toast.error("Failed to delete list")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-cyan/15 border border-accent-cyan/30">
                    <Layers size={20} className="text-accent-cyan" />
                </div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-text-primary">Manage Lists</h1>
                    <p className="text-sm text-text-secondary">Feature or remove user lists.</p>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-bg-secondary rounded-xl" />
                    <div className="h-24 bg-bg-secondary rounded-xl" />
                </div>
            ) : lists.length === 0 ? (
                <div className="text-center py-20 text-text-muted bg-bg-card/20 border border-dashed border-border rounded-2xl">
                    <p>No lists found on the platform.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {lists.map(list => (
                        <GlassCard key={list.id} className="p-4 flex flex-col gap-4 justify-between leading-snug">
                            <div>
                                <h3 className="font-bold text-lg text-text-primary mb-1">{list.title}</h3>
                                {list.description && <p className="text-sm text-text-secondary line-clamp-2 mb-2">{list.description}</p>}
                                <p className="text-xs text-text-muted flex items-center gap-2">
                                    <span className="text-accent-purple">@{list.user.username}</span>
                                    <span>•</span>
                                    <span>{list.items?.length || 0} items</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pt-2 border-t border-border/50">
                                <button
                                    onClick={() => toggleFeature(list.id, list.isFeatured)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border
                                        ${list.isFeatured
                                            ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50 hover:bg-accent-cyan/30'
                                            : 'bg-bg-secondary text-text-muted border-border hover:border-text-muted hover:text-white'
                                        }`}
                                >
                                    <Star size={14} className={list.isFeatured ? 'fill-current' : ''} />
                                    {list.isFeatured ? 'Featured' : 'Feature'}
                                </button>

                                <button
                                    onClick={() => deleteList(list.id)}
                                    className="p-1.5 rounded-lg bg-bg-secondary text-accent-pink border border-transparent hover:border-accent-pink/50 transition-colors ml-auto"
                                    title="Delete List"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}
