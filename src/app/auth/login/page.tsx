'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clapperboard, Mail, Lock, Loader2, Chrome } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const result = await signIn('credentials', {
                email, password, redirect: false,
            })
            if (result?.error) throw new Error('Invalid email or password')
            toast.success('Welcome back!')
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.message || 'Sign in failed')
        }
        setLoading(false)
    }

    async function handleGoogle() {
        setGoogleLoading(true)
        await signIn('google', { callbackUrl: '/dashboard' })
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 cyber-bg">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)' }}>
                            <Clapperboard size={22} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Themis
                        </span>
                    </Link>
                    <h1 className="text-2xl font-display font-bold text-[#e8edf5]">Welcome back</h1>
                    <p className="text-sm text-[#8899aa] mt-1">Sign in to your media tracker</p>
                </div>

                <div className="glass-card p-8" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>
                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-lg border border-[#1e2a3a] bg-[#111827] text-[#e8edf5] hover:bg-[#1a2235] hover:border-[#2a3f5a] transition-all text-sm font-medium"
                        id="google-signin-btn"
                    >
                        {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <Chrome size={16} className="text-[#4285f4]" />}
                        Continue with Google
                    </button>

                    <div className="relative mb-5">
                        <div className="cyber-line" />
                        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111827] px-3 text-xs text-[#8899aa]">or</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    required placeholder="you@example.com"
                                    className="input-cyber pl-9" id="login-email"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#8899aa] mb-1.5 font-medium uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                                <input
                                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    required placeholder="••••••••"
                                    className="input-cyber pl-9" id="login-password"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2" id="login-submit">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-[#8899aa] mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" className="text-[#00d4ff] hover:underline">Create one</Link>
                </p>
            </div>
        </div>
    )
}
