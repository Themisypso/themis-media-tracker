'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clapperboard, Mail, Lock, User, Loader2, Chrome } from 'lucide-react'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Account created! Signing you in...')
            await signIn('credentials', { email, password, redirect: false })
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.message || 'Registration failed')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 cyber-bg relative">
            <div className="absolute top-4 right-4">
                <ThemeSwitcher />
            </div>
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
                    <h1 className="text-2xl font-display font-bold text-[#e8edf5]">Create your account</h1>
                    <p className="text-sm text-[#8899aa] mt-1">Start tracking your media journey</p>
                </div>

                <div className="glass-card p-8" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-lg border border-[#1e2a3a] bg-[#111827] text-[#e8edf5] hover:bg-[#1a2235] hover:border-[#2a3f5a] transition-all text-sm font-medium"
                        id="google-register-btn"
                    >
                        <Chrome size={16} className="text-[#4285f4]" />
                        Continue with Google
                    </button>

                    <div className="relative mb-5">
                        <div className="cyber-line" />
                        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111827] px-3 text-xs text-[#8899aa]">or</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Name</label>
                            <div className="relative">
                                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                    placeholder="Your display name" className="input-cyber pl-9" id="register-name" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568] font-bold text-sm">@</span>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required
                                    placeholder="unique_nickname" className="input-cyber pl-9" id="register-username" maxLength={20} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="you@example.com" className="input-cyber pl-9" id="register-email" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                    placeholder="Min. 8 characters" className="input-cyber pl-9" id="register-password" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2" id="register-submit">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-[#8899aa] mt-6">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-[#00d4ff] hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
