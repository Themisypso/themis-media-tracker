'use client'

import { useState, useEffect } from 'react'
import { Quote, Search, Trash2, Star, ShieldAlert } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import toast from 'react-hot-toast'

export default function AdminQuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchQuotes()
    }, [])

    async function fetchQuotes() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/quotes')
            const data = await res.json()
            setQuotes(data.quotes || [])
        } catch (e) {
            toast.error("Failed to fetch quotes")
        }
        setLoading(false)
    }

    async function toggleFeature(id: string, currentlyFeatured: boolean) {
        try {
            const res = await fetch(`/api/admin/quotes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured: !currentlyFeatured })
            })
            if (res.ok) {
                toast.success(currentlyFeatured ? "Quote unfeatured" : "Quote featured on homepage!")
                setQuotes(prev => prev.map(q => q.id === id ? { ...q, isFeatured: !currentlyFeatured } : q))
            } else {
                toast.error("Failed to update quote")
            }
        } catch (e) {
            toast.error("Failed to update quote")
        }
    }

    async function deleteQuote(id: string) {
        if (!confirm("Are you sure you want to delete this quote?")) return

        try {
            const res = await fetch(`/api/admin/quotes/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Quote deleted")
                setQuotes(prev => prev.filter(q => q.id !== id))
            } else {
                toast.error("Failed to delete quote")
            }
        } catch (e) {
            toast.error("Failed to delete quote")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#facc15]/15 border border-[#facc15]/30">
                    <Quote size={20} className="text-[#facc15]" />
                </div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-text-primary">Manage Quotes</h1>
                    <p className="text-sm text-text-secondary">Feature or remove user quotes.</p>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-bg-secondary rounded-xl" />
                    <div className="h-24 bg-bg-secondary rounded-xl" />
                </div>
            ) : quotes.length === 0 ? (
                <div className="text-center py-20 text-text-muted bg-bg-card/20 border border-dashed border-border rounded-2xl">
                    <p>No quotes found on the platform.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {quotes.map(quote => (
                        <GlassCard key={quote.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium mb-1 line-clamp-2">"{quote.content}"</p>
                                <p className="text-xs text-text-muted flex items-center gap-2">
                                    <span className="text-accent-cyan">@{quote.user.username}</span>
                                    <span>•</span>
                                    <span>{quote.media.title}</span>
                                    {quote.reference && (
                                        <>
                                            <span>•</span>
                                            <span>{quote.reference}</span>
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => toggleFeature(quote.id, quote.isFeatured)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border
                                        ${quote.isFeatured
                                            ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50 hover:bg-[#facc15]/30'
                                            : 'bg-bg-secondary text-text-muted border-border hover:border-text-muted hover:text-white'
                                        }`}
                                >
                                    <Star size={14} className={quote.isFeatured ? 'fill-current' : ''} />
                                    {quote.isFeatured ? 'Featured' : 'Feature'}
                                </button>

                                <button
                                    onClick={() => deleteQuote(quote.id)}
                                    className="p-1.5 rounded-lg bg-bg-secondary text-accent-pink border border-transparent hover:border-accent-pink/50 transition-colors"
                                    title="Delete Quote"
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
