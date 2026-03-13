'use client'

import { useState, useRef } from 'react'
import { MessageSquareQuote, X, ImagePlus, Video, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddQuoteCTAProps {
    tmdbId: string
    type: string
    title: string
    posterUrl?: string | null
    backdropUrl?: string | null
    releaseYear?: number | null
}

export function AddQuoteCTA({ tmdbId, type, title, posterUrl, backdropUrl, releaseYear }: AddQuoteCTAProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState('')
    const [reference, setReference] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
    const [attachmentType, setAttachmentType] = useState<'NONE' | 'IMAGE' | 'VIDEO'>('NONE')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        if (!isImage && !isVideo) {
            setUploadError('Only images and videos are supported.')
            return
        }
        if (file.size > 20 * 1024 * 1024) {
            setUploadError('File must be under 20MB.')
            return
        }

        setUploadError(null)
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()
            setAttachmentUrl(data.url)
            setAttachmentType(isImage ? 'IMAGE' : 'VIDEO')
        } catch {
            setUploadError('Upload failed. Please try again.')
        }
        setUploading(false)
    }

    const removeAttachment = () => {
        setAttachmentUrl(null)
        setAttachmentType('NONE')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        setIsOpen(false)
        setContent('')
        setReference('')
        removeAttachment()
        setUploadError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tmdbId, type, title, posterUrl, backdropUrl, releaseYear,
                    content, reference,
                    mediaUrl: attachmentUrl || undefined,
                    attachmentType
                })
            })

            if (res.ok) {
                handleClose()
                router.refresh()
            } else {
                console.error('Failed to add quote')
            }
        } catch (error) {
            console.error('Error adding quote:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-accent-pink/50 text-accent-pink bg-accent-pink/5 hover:bg-accent-pink/10 transition-colors font-semibold"
            >
                <MessageSquareQuote size={18} /> Add a Quote
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-border flex items-center justify-between bg-bg-secondary/50">
                            <h3 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
                                <MessageSquareQuote size={20} className="text-accent-pink" /> Add a Quote
                            </h3>
                            <button onClick={handleClose} className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-primary transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                            {/* Quote Text */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Quote Content *</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write the iconic dialogue here..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink resize-none transition-shadow font-serif italic text-lg"
                                />
                            </div>

                            {/* Reference */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Reference / Context (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Season 2 Episode 4, or Page 42"
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition-shadow"
                                />
                            </div>

                            {/* Attachment */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                                    <ImagePlus size={15} /> Attach Image or Video (Optional)
                                </label>

                                {attachmentUrl ? (
                                    <div className="relative rounded-xl overflow-hidden border border-border/60 group">
                                        {attachmentType === 'IMAGE' ? (
                                            <img src={attachmentUrl} alt="attachment preview" className="w-full max-h-48 object-contain bg-bg-secondary" />
                                        ) : (
                                            <video src={attachmentUrl} controls className="w-full max-h-48 bg-bg-secondary" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={removeAttachment}
                                            className="absolute top-2 right-2 p-1.5 bg-bg-primary/80 rounded-lg text-destructive hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full border border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 text-text-muted hover:border-accent-pink/50 hover:text-accent-pink transition-colors disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <><Loader2 size={20} className="animate-spin" /><span className="text-sm">Uploading...</span></>
                                        ) : (
                                            <><div className="flex gap-3 text-xl"><ImagePlus size={20} /><Video size={20} /></div><span className="text-sm">Click to upload image or video</span><span className="text-xs opacity-60">Max 20MB</span></>
                                        )}
                                    </button>
                                )}

                                {uploadError && <p className="text-xs text-red-400 mt-1.5">{uploadError}</p>}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-3.5 rounded-xl font-semibold text-text-secondary hover:bg-bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !content.trim()}
                                    className="flex-1 py-3.5 rounded-xl font-bold bg-accent-pink text-white hover:bg-accent-pink/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Posting…</> : 'Post Quote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
