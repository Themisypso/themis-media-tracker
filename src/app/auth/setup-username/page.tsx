'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Clapperboard, AtSign, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SetupUsernamePage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [username, setUsername] = useState('')
    const [checking, setChecking] = useState(false)
    const [available, setAvailable] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)

    // Redirect if not logged in
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    // Debounced availability check
    useEffect(() => {
        if (!username || username.length < 3) {
            setAvailable(null)
            return
        }

        const timer = setTimeout(async () => {
            setChecking(true)
            try {
                const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
                const data = await res.json()
                setAvailable(data.available)
            } catch {
                setAvailable(null)
            }
            setChecking(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [username])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!available) return

        setSaving(true)
        try {
            const res = await fetch('/api/auth/setup-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(`Welcome, @${username}!`)
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.message || 'Failed to set username')
        }
        setSaving(false)
    }

    if (status === 'loading') {
        return <div className="min-h-screen cyber-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-accent-cyan" size={32} />
        </div>
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 cyber-bg relative">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)' }}>
                            <Clapperboard size={22} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Themis
                        </span>
                    </Link>
                    <h1 className="text-2xl font-display font-bold text-[#e8edf5]">Choose your username</h1>
                    <p className="text-sm text-[#8899aa] mt-2">
                        Pick a unique handle for your profile. <br />
                        <span className="text-accent-pink font-semibold">This cannot be changed later.</span>
                    </p>
                </div>

                <div className="glass-card p-8" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Username</label>
                            <div className="relative">
                                <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    placeholder="your_unique_handle"
                                    className="input-cyber pl-9 pr-9 w-full"
                                    id="setup-username"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {checking && <Loader2 size={15} className="animate-spin text-text-muted" />}
                                    {!checking && available === true && <CheckCircle2 size={15} className="text-green-400" />}
                                    {!checking && available === false && <XCircle size={15} className="text-accent-pink" />}
                                </div>
                            </div>
                            <div className="mt-1.5 h-4">
                                {username.length >= 3 && !checking && available === true && (
                                    <p className="text-xs text-green-400">✓ @{username} is available</p>
                                )}
                                {username.length >= 3 && !checking && available === false && (
                                    <p className="text-xs text-accent-pink">✗ @{username} is already taken</p>
                                )}
                                {username.length > 0 && username.length < 3 && (
                                    <p className="text-xs text-text-muted">Minimum 3 characters</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!available || saving || checking}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            id="setup-username-submit"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                            {saving ? 'Setting up...' : 'Confirm Username'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-[#8899aa] mt-6">
                    Your username will be visible on your public profile page.
                </p>
            </div>
        </div>
    )
}
