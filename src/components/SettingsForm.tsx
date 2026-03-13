'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Save, Loader2, Globe, Lock, User, Link as LinkIcon, Image as ImageIcon, Gamepad2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
    initialSettings: any
    user: any
}

export function SettingsForm({ initialSettings, user }: Props) {
    const router = useRouter()
    const { update } = useSession()

    const searchParams = useSearchParams()

    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [avatar, setAvatar] = useState(user?.image || null)

    // Steam Integration State
    const [verifyingSteam, setVerifyingSteam] = useState(false)
    const [syncingSteam, setSyncingSteam] = useState(false)

    useEffect(() => {
        if (searchParams.get('steam_connected') === 'true') {
            update() // refresh session so user.steamId becomes available if using jwt
            toast.success('Steam connected successfully!')
            // Clean up URL
            window.history.replaceState(null, '', '/settings')
        }
        if (searchParams.get('error') === 'steam_failed') {
            toast.error('Failed to connect Steam. Please try again.')
            window.history.replaceState(null, '', '/settings')
        }
    }, [searchParams, update])

    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: initialSettings?.bio || '',
        website: initialSettings?.website || '',
        twitter: initialSettings?.twitter || '',
        instagram: initialSettings?.instagram || '',
        isPublic: initialSettings?.isPublic ?? true,
        hideRatings: initialSettings?.hideRatings ?? false,
        hideActivity: initialSettings?.hideActivity ?? false,
        showSteamProfile: initialSettings?.showSteamProfile ?? true,
        language: initialSettings?.language || 'EN',
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const data = new FormData()
            data.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            setAvatar(json.url)
            await update({ image: json.url })

            toast.success('Avatar updated successfully!')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload image')
        }
        setUploading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await update({ name: formData.name })

            toast.success('Settings saved successfully!')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to save settings')
        }
        setSaving(false)
    }

    const handleSteamConnect = async () => {
        setVerifyingSteam(true)
        await signIn('steam', { callbackUrl: '/settings?steam_connected=true' })
    }

    const handleSteamDisconnect = async () => {
        setSyncingSteam(true)
        try {
            const res = await fetch('/api/settings/steam/disconnect', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await update() // Refresh session
            toast.success('Steam account unlinked successfully.')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to disconnect Steam')
        }
        setSyncingSteam(false)
    }

    const handleSteamSync = async () => {
        setSyncingSteam(true)
        try {
            const res = await fetch('/api/steam/sync', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`Sync complete! Updated ${data.updatedCount} games.`)
        } catch (err: any) {
            toast.error(err.message || 'Failed to sync Steam')
        }
        setSyncingSteam(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in text-left">
            {/* Profile Section */}
            <section className="glass-card p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-6 text-text-primary">
                    <User size={18} className="text-accent-cyan" />
                    <h2 className="text-lg font-bold font-display">Public Profile</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-border/50">
                    <div className="w-24 h-24 rounded-full bg-bg-secondary border border-border overflow-hidden flex-shrink-0 relative group">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
                        )}
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer">
                            <ImageIcon size={20} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="btn-secondary px-4 py-2 cursor-pointer inline-flex items-center gap-2 text-sm">
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                            {uploading ? 'Uploading...' : 'Change Avatar'}
                            <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                        <p className="text-xs text-text-muted mt-2">Recommended: 256x256px JPG or PNG</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Display Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-cyber w-full"
                                placeholder="Your display name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">@</span>
                                <input
                                    type="text"
                                    value={user?.username || ''}
                                    disabled={true}
                                    className="input-cyber w-full pl-8 bg-bg-secondary/50 text-text-muted cursor-not-allowed border-none"
                                    title="Contact admin to change your immutable username"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="input-cyber w-full resize-none leading-relaxed"
                            placeholder="Tell the world about your taste in media..."
                        />
                    </div>
                </div>
            </section>

            {/* Social Links Section */}
            <section className="glass-card p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-6 text-text-primary">
                    <LinkIcon size={18} className="text-accent-purple" />
                    <h2 className="text-lg font-bold font-display">Social Links</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Website</label>
                        <input type="url" name="website" value={formData.website} onChange={handleChange} className="input-cyber w-full" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Twitter</label>
                        <input type="text" name="twitter" value={formData.twitter} onChange={handleChange} className="input-cyber w-full" placeholder="@username" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Instagram</label>
                        <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} className="input-cyber w-full" placeholder="@username" />
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section className="glass-card p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-6 text-text-primary">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png"
                        alt="Steam" className="w-5 h-5 object-contain" />
                    <h2 className="text-lg font-bold font-display">Gaming & Integrations</h2>
                </div>

                <div className="space-y-4">
                    {!user?.steamId && (
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Steam Connection</label>
                            <button
                                type="button"
                                onClick={handleSteamConnect}
                                disabled={verifyingSteam}
                                className="sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#171a21] text-white hover:bg-[#2a475e] hover:border-[#66c0f4] transition-all text-sm font-medium"
                            >
                                {verifyingSteam ? <Loader2 size={16} className="animate-spin text-[#66c0f4]" /> : (
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png"
                                        alt="" className="w-5 h-5 object-contain" />
                                )}
                                Connect with Steam
                            </button>
                        </div>
                    )}
                    {user?.steamId && (
                        <div className="mt-4 p-4 rounded-xl border border-accent-cyan/30 bg-accent-cyan/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all animate-fade-in shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                            <div>
                                <p className="text-sm font-bold text-accent-cyan">Steam Connected ✅</p>
                                <p className="text-[10px] uppercase tracking-wider text-text-muted mt-1 font-mono">{user.steamId}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleSteamSync}
                                    disabled={syncingSteam}
                                    className="px-6 py-3 rounded-xl bg-accent-cyan text-bg-dark font-bold hover:bg-accent-cyan/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {syncingSteam ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <div className="relative w-5 h-5 flex items-center justify-center">
                                            <img
                                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png"
                                                alt="Steam Logo"
                                                className="w-full h-full object-contain filter invert brightness-0 group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                    )}
                                    Sync Library & Playtime
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSteamDisconnect}
                                    disabled={syncingSteam}
                                    className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Privacy Section */}
            <section className="glass-card p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-6 text-text-primary">
                    <Lock size={18} className="#ff9500" style={{ color: '#ff9500' }} />
                    <h2 className="text-lg font-bold font-display">Privacy & Display</h2>
                </div>

                <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent-cyan/30 transition-colors">
                        <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-600 text-accent-cyan focus:ring-accent-cyan bg-bg-card" />
                        <div>
                            <div className="text-sm font-semibold text-text-primary">Public Profile</div>
                            <div className="text-xs text-text-secondary mt-1">Allow anyone to view your library and stats on your profile page.</div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent-cyan/30 transition-colors">
                        <input type="checkbox" name="hideRatings" checked={formData.hideRatings} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-600 text-accent-cyan focus:ring-accent-cyan bg-bg-card" />
                        <div>
                            <div className="text-sm font-semibold text-text-primary">Hide Ratings</div>
                            <div className="text-xs text-text-secondary mt-1">Keep your 1-10 personal ratings private, even if your library is public.</div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent-cyan/30 transition-colors">
                        <input type="checkbox" name="hideActivity" checked={formData.hideActivity} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-600 text-accent-cyan focus:ring-accent-cyan bg-bg-card" />
                        <div>
                            <div className="text-sm font-semibold text-text-primary">Hide Activity Feed</div>
                            <div className="text-xs text-text-secondary mt-1">Prevent your actions (adding/rating) from appearing in the global social feed.</div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent-cyan/30 transition-colors">
                        <input type="checkbox" name="showSteamProfile" checked={formData.showSteamProfile} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-600 text-accent-cyan focus:ring-accent-cyan bg-bg-card" />
                        <div>
                            <div className="text-sm font-semibold text-text-primary">Show Steam Link</div>
                            <div className="text-xs text-text-secondary mt-1">Display your connected Steam account on your public profile page.</div>
                        </div>
                    </label>
                </div>
            </section>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="btn-primary px-8 py-3 flex items-center justify-center gap-2 min-w-[160px]">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Settings</>}
                </button>
            </div>
        </form >
    )
}
