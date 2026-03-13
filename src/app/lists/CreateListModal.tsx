'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Globe, Lock, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function CreateListModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const isPublic = formData.get('isPublic') === 'true'

        try {
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, isPublic })
            })

            if (!res.ok) throw new Error('Failed to create list')

            const list = await res.json()
            toast.success('List created!')
            setIsOpen(false)
            router.push(`/list/${list.id}`) // Navigate directly to new list
        } catch (error) {
            toast.error('Could not create list')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-pink text-white font-bold rounded-xl shadow-[0_0_15px_rgba(255,45,122,0.4)] hover:shadow-[0_0_25px_rgba(255,45,122,0.6)] hover:-translate-y-0.5 transition-all"
            >
                <Plus size={18} /> Create List
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-bg-secondary/50">
                            <h2 className="text-xl font-bold text-text-primary">Create New List</h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-bg-hover rounded-full text-text-muted hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">List Title <span className="text-accent-pink">*</span></label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        required
                                        maxLength={100}
                                        placeholder="E.g., Favorite Sci-Fi Movies..."
                                        className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        maxLength={500}
                                        placeholder="What is this list about?"
                                        className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Privacy Settings</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="cursor-pointer relative">
                                            <input type="radio" name="isPublic" value="true" defaultChecked className="peer sr-only" />
                                            <div className="flex flex-col items-center gap-2 p-3 bg-bg-secondary border border-border rounded-xl peer-checked:border-accent-cyan peer-checked:bg-accent-cyan/10 transition-all text-text-muted peer-checked:text-accent-cyan">
                                                <Globe size={24} />
                                                <span className="text-sm font-medium">Public</span>
                                            </div>
                                        </label>
                                        <label className="cursor-pointer relative">
                                            <input type="radio" name="isPublic" value="false" className="peer sr-only" />
                                            <div className="flex flex-col items-center gap-2 p-3 bg-bg-secondary border border-border rounded-xl peer-checked:border-accent-pink peer-checked:bg-accent-pink/10 transition-all text-text-muted peer-checked:text-accent-pink">
                                                <Lock size={24} />
                                                <span className="text-sm font-medium">Private</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-2.5 bg-bg-secondary hover:bg-bg-hover text-text-primary font-medium rounded-xl transition-colors shrink-0"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-2.5 bg-accent-pink hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-[0_0_10px_rgba(255,45,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Create List'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
