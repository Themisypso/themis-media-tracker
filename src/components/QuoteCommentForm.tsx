'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

export function QuoteCommentForm({ quoteId }: { quoteId: string }) {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/quotes/${quoteId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim() })
            })
            if (!res.ok) throw new Error('Failed to comment')

            setContent('')
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 flex gap-3 relative">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-bg-primary border border-border rounded-xl p-4 pr-14 text-sm resize-none focus:outline-none focus:border-accent-cyan transition-colors h-24"
                disabled={isSubmitting}
            />
            <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="absolute right-3 bottom-3 p-2 bg-accent-cyan text-bg-primary rounded-lg hover:bg-[#00b8e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send size={16} className={isSubmitting ? 'animate-pulse' : ''} />
            </button>
        </form>
    )
}
