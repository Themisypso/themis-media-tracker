'use client'

import { useState } from 'react'
import { UserPlus, Clock, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export type FriendStatus = 'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS'

interface FriendButtonProps {
    targetUserId: string
    initialStatus: FriendStatus
    small?: boolean
}

export function FriendButton({ targetUserId, initialStatus, small = false }: FriendButtonProps) {
    const [status, setStatus] = useState<FriendStatus>(initialStatus)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const sendRequest = async () => {
        if (status !== 'NOT_FRIENDS') return
        setLoading(true)
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId }),
            })
            if (!res.ok) throw new Error(await res.text())
            setStatus('PENDING_SENT')
            toast.success('Friend request sent!')
        } catch (error: any) {
            toast.error(error.message || 'Failed to send request')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'FRIENDS') {
        return (
            <button disabled className={`flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-80 bg-bg-secondary text-green-400 border border-green-400/30 ${small ? 'px-3 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'}`}>
                <Check size={16} /> Friends
            </button>
        )
    }

    if (status === 'PENDING_SENT') {
        return (
            <button disabled className={`flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-80 bg-bg-secondary text-text-secondary border border-border ${small ? 'px-3 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'}`}>
                <Clock size={16} /> Request Sent
            </button>
        )
    }

    if (status === 'PENDING_RECEIVED') {
        return (
            <button disabled className={`flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-80 bg-accent-purple/20 text-accent-purple border border-accent-purple/50 ${small ? 'px-3 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'}`}>
                <Clock size={16} /> Pending Reply
            </button>
        )
    }

    return (
        <button
            onClick={sendRequest}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-50 bg-bg-secondary hover:bg-bg-card border border-border hover:border-text-primary text-text-primary ${small ? 'px-3 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'}`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Add Friend
        </button>
    )
}
