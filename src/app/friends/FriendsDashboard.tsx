'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, UserMinus, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserObj {
    id: string
    name: string | null
    username: string | null
    image: string | null
}

interface RequestObj {
    id: string
    sender?: UserObj
    receiver?: UserObj
}

export function FriendsDashboard() {
    const [friends, setFriends] = useState<UserObj[]>([])
    const [pendingReceived, setPendingReceived] = useState<RequestObj[]>([])
    const [pendingSent, setPendingSent] = useState<RequestObj[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/friends')
            if (res.ok) {
                const data = await res.json()
                setFriends(data.friends)
                setPendingReceived(data.pendingReceived)
                setPendingSent(data.pendingSent)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (reqId: string) => {
        try {
            const res = await fetch('/api/friends/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: reqId })
            })
            if (!res.ok) throw new Error()
            toast.success('Request accepted')
            fetchData()
        } catch {
            toast.error('Failed to accept request')
        }
    }

    const handleReject = async (reqId: string) => {
        try {
            const res = await fetch('/api/friends/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: reqId })
            })
            if (!res.ok) throw new Error()
            toast.success('Request rejected')
            fetchData()
        } catch {
            toast.error('Failed to reject request')
        }
    }

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent-cyan" size={32} /></div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Pending Received */}
                {pendingReceived.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <span className="bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded text-sm">{pendingReceived.length}</span>
                            Pending Requests
                        </h2>
                        <div className="space-y-3">
                            {pendingReceived.map(req => (
                                <div key={req.id} className="glass-card p-4 rounded-xl border border-accent-purple/30 flex items-center justify-between">
                                    <Link href={`/user/${req.sender?.username}`} className="flex items-center gap-3">
                                        {req.sender?.image ? (
                                            <img src={req.sender.image} alt="" className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-accent-purple">
                                                {req.sender?.name?.[0] || req.sender?.username?.[0]}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-text-primary">{req.sender?.name || req.sender?.username}</p>
                                            <p className="text-sm text-text-muted">@{req.sender?.username}</p>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAccept(req.id)} className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors">
                                            <Check size={18} />
                                        </button>
                                        <button onClick={() => handleReject(req.id)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* My Friends */}
                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Users size={20} className="text-accent-cyan" /> My Friends
                        <span className="text-sm text-text-muted font-normal">({friends.length})</span>
                    </h2>
                    {friends.length === 0 ? (
                        <div className="glass-card p-8 rounded-xl border border-border text-center text-text-muted">
                            You haven't added any friends yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {friends.map(friend => (
                                <Link key={friend.id} href={`/user/${friend.username}`} className="glass-card p-4 rounded-xl border border-border/50 hover:border-accent-cyan transition-all flex items-center gap-3">
                                    {friend.image ? (
                                        <img src={friend.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-accent-cyan">
                                            {friend.name?.[0] || friend.username?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-text-primary truncate">{friend.name || friend.username}</p>
                                        <p className="text-xs text-text-muted truncate">@{friend.username}</p>
                                    </div>
                                    <button className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                        <UserMinus size={16} />
                                    </button>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="lg:col-span-1">
                {/* Sent Requests */}
                {pendingSent.length > 0 && (
                    <div className="glass-card p-6 rounded-xl border border-border">
                        <h3 className="font-bold text-text-primary mb-4">Sent Requests <span className="text-text-muted">({pendingSent.length})</span></h3>
                        <div className="space-y-3">
                            {pendingSent.map(req => (
                                <div key={req.id} className="flex items-center justify-between gap-2">
                                    <Link href={`/user/${req.receiver?.username}`} className="flex items-center gap-2 min-w-0">
                                        {req.receiver?.image ? (
                                            <img src={req.receiver.image} alt="" className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-bold text-text-secondary">
                                                {req.receiver?.username?.[0]}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-text-secondary truncate">@{req.receiver?.username}</span>
                                    </Link>
                                    <span className="text-[10px] uppercase font-bold text-text-muted bg-bg-secondary px-2 py-1 rounded">Pending</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
