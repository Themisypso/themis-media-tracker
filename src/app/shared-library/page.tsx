'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Users, Plus, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SharedLibraryHub() {
    const router = useRouter()
    const [joinCode, setJoinCode] = useState('')
    const [loadingCreate, setLoadingCreate] = useState(false)
    const [loadingJoin, setLoadingJoin] = useState(false)

    const handleCreate = async () => {
        setLoadingCreate(true)
        try {
            const res = await fetch('/api/shared-session/create', { method: 'POST' })
            if (!res.ok) throw new Error('Failed to create session')
            const data = await res.json()
            toast.success('Room created!')
            router.push(`/shared-library/${data.code}`)
        } catch {
            toast.error('Could not create room')
            setLoadingCreate(false)
        }
    }

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!joinCode || joinCode.length < 5) return
        setLoadingJoin(true)
        try {
            const res = await fetch(`/api/shared-session/${joinCode.toUpperCase()}/join`, { method: 'POST' })
            if (!res.ok) {
                if (res.status === 404) toast.error('Room not found')
                else toast.error('Failed to join room')
                setLoadingJoin(false)
                return
            }
            toast.success('Joined room!')
            router.push(`/shared-library/${joinCode.toUpperCase()}`)
        } catch {
            toast.error('Network error')
            setLoadingJoin(false)
        }
    }

    return (
        <main className="min-h-screen cyber-bg flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 mt-16 animate-fade-in">
                <div className="glass-card max-w-2xl w-full p-8 md:p-12 rounded-3xl border border-border shadow-card relative overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-cyan/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-accent-purple/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="text-center relative z-10 mb-12">
                        <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users size={32} className="text-accent-cyan" />
                        </div>
                        <h1 className="text-4xl font-display font-bold text-text-primary mb-4">Shared Library</h1>
                        <p className="text-text-secondary text-lg max-w-md mx-auto">
                            Jump into a room with your friends to find out which movies and shows you've both watched or plan to watch.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        {/* Join Room */}
                        <div className="bg-bg-secondary/50 p-6 rounded-2xl border border-border flex flex-col">
                            <h2 className="text-xl font-bold text-text-primary mb-2">Join a Room</h2>
                            <p className="text-sm text-text-muted mb-6">Enter a 6-character room code to join your friends.</p>
                            <form onSubmit={handleJoin} className="mt-auto flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. A1B2C3"
                                    maxLength={6}
                                    className="w-full text-center tracking-widest uppercase font-mono font-bold text-lg bg-bg-primary border border-border p-3 rounded-xl focus:outline-none focus:border-accent-cyan transition-colors"
                                />
                                <button type="submit" disabled={loadingJoin || joinCode.length < 5} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                                    {loadingJoin ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                    Join Room
                                </button>
                            </form>
                        </div>

                        {/* Create Room */}
                        <div className="bg-bg-secondary/50 p-6 rounded-2xl border border-accent-purple/30 flex flex-col text-center">
                            <h2 className="text-xl font-bold text-text-primary mb-2">Create a Room</h2>
                            <p className="text-sm text-text-muted mb-6">Start a new shared session and invite your friends via code.</p>
                            <button onClick={handleCreate} disabled={loadingCreate} className="mt-auto w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-accent-purple to-[#ff3264] hover:brightness-110 shadow-[0_0_15px_rgba(123,47,255,0.3)] flex items-center justify-center gap-2 transition-all">
                                {loadingCreate ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                Create New Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
