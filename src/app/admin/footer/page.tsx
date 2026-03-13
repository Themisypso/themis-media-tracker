'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, Save, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface FooterLink {
    id: string
    section: string
    label: string
    url: string
    order: number
}

const DEFAULT_SECTIONS = ['Product', 'Community', 'Company', 'Social']

export default function AdminFooterPage() {
    const [config, setConfig] = useState<FooterLink[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/footer')
            .then(r => r.json())
            .then(data => {
                setConfig(data || [])
                setLoading(false)
            })
            .catch(() => {
                toast.error('Failed to load config')
                setLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/footer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: config })
            })
            if (!res.ok) throw new Error('Save failed')
            toast.success('Footer updated successfully!')
        } catch (e) {
            toast.error('Failed to save config')
        }
        setSaving(false)
    }

    const addLink = (section: string) => {
        const sectionItems = config.filter(c => c.section === section)
        const newOrder = sectionItems.length > 0 ? Math.max(...sectionItems.map(s => s.order)) + 1 : 0
        const newLink: FooterLink = {
            id: 'new-' + Date.now(),
            section,
            label: 'New Link',
            url: '/',
            order: newOrder,
        }
        setConfig([...config, newLink])
    }

    const removeLink = (id: string) => {
        setConfig(config.filter(c => c.id !== id))
    }

    const updateLink = (id: string, field: keyof FooterLink, value: string) => {
        setConfig(config.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const moveLink = (id: string, dir: number) => {
        const idx = config.findIndex(c => c.id === id)
        if (idx < 0) return

        const targetSection = config[idx].section
        const sectionItems = config.filter(c => c.section === targetSection)
        const myIndexInSection = sectionItems.findIndex(c => c.id === id)
        const swapTarget = sectionItems[myIndexInSection + dir]

        if (!swapTarget) return
        const targetGlobalIdx = config.findIndex(c => c.id === swapTarget.id)

        const newConfig = [...config]
        const temp = newConfig[idx]
        newConfig[idx] = newConfig[targetGlobalIdx]
        newConfig[targetGlobalIdx] = temp
        setConfig(newConfig)
    }

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-accent-cyan" size={32} />
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between glass-card p-6 rounded-2xl border border-border bg-bg-card/20 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-display font-bold text-white mb-1">Footer Configuration</h1>
                    <p className="text-sm text-text-muted">Manage the links and sections in the global site footer.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-accent-cyan text-bg-dark font-bold rounded-xl hover:bg-[#00b8e6] transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEFAULT_SECTIONS.map(section => {
                    const sectionLinks = config.filter(c => c.section === section)

                    return (
                        <div key={section} className="glass-card p-6 rounded-2xl border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white text-lg">{section}</h3>
                                <button
                                    onClick={() => addLink(section)}
                                    className="p-1.5 rounded-lg text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {sectionLinks.length === 0 ? (
                                    <div className="text-sm text-text-muted flex items-center gap-2 p-3 border border-dashed border-border rounded-xl">
                                        <AlertCircle size={14} /> No links in this section.
                                    </div>
                                ) : (
                                    sectionLinks.map((link, idx) => (
                                        <div key={link.id} className="flex items-center gap-3 bg-bg-card/40 p-3 rounded-xl border border-border/50 group">
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <button onClick={() => moveLink(link.id, -1)} disabled={idx === 0} className="text-text-muted hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={14} /></button>
                                                <button onClick={() => moveLink(link.id, 1)} disabled={idx === sectionLinks.length - 1} className="text-text-muted hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={14} /></button>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={link.label}
                                                    onChange={e => updateLink(link.id, 'label', e.target.value)}
                                                    placeholder="Label"
                                                    className="input-cyber w-full text-sm py-1.5"
                                                />
                                                <input
                                                    type="text"
                                                    value={link.url}
                                                    onChange={e => updateLink(link.id, 'url', e.target.value)}
                                                    placeholder="URL (e.g., /about)"
                                                    className="input-cyber w-full text-sm py-1.5"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeLink(link.id)}
                                                className="shrink-0 p-2 text-text-muted hover:text-[#ff3264] hover:bg-[#ff3264]/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
