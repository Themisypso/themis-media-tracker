'use client'

import { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
    targetUserId: string
    initialFollowing: boolean
}

export function FollowButton({ targetUserId, initialFollowing }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toggleFollow = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/users/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId }),
            })

            if (!res.ok) throw new Error('Failed to toggle follow')

            const data = await res.json()
            setIsFollowing(data.followed)
            toast.success(data.followed ? 'Following user' : 'Unfollowed user')
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={toggleFollow}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${isFollowing
                ? 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-card hover:border-accent-pink hover:text-accent-pink'
                : 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white hover:brightness-110 shadow-[0_4px_15px_rgba(0,212,255,0.3)]'
                }`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
                isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />
            )}
            {isFollowing ? 'Following' : 'Follow'}
        </button>
    )
}
