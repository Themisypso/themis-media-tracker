'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function NotificationDropdown() {
    const { data, mutate } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 })
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const notifications = data?.notifications || []
    const unreadCount = notifications.filter((n: any) => !n.isRead).length

    const handleOpen = () => {
        setIsOpen(!isOpen)
        if (!isOpen && unreadCount > 0) {
            // Mark as read
            fetch('/api/notifications/read', { method: 'POST' }).then(() => mutate())
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-lg bg-bg-card border border-border hover:border-border-bright transition-all text-text-secondary hover:text-white"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-pink text-[9px] font-bold text-white shadow-glow-pink">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-card animate-slide-down flex flex-col shadow-card overflow-hidden" style={{ zIndex: 100 }}>
                    <div className="px-4 py-3 border-b border-border bg-bg-card/90 backdrop-blur-md flex justify-between items-center z-10">
                        <h3 className="font-bold text-sm text-text-primary">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar relative z-0">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-text-muted text-sm">
                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((n: any) => (
                                <Link
                                    key={n.id}
                                    href={n.type === 'MENTION' || n.type === 'COMMENT_DISCUSSION' ? `/discussions/${n.referenceId}` : '/feed'}
                                    className={`block p-4 border-b border-border/50 hover:bg-bg-hover transition-colors ${!n.isRead ? 'bg-accent-cyan/10' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className="flex gap-3">
                                        {n.actor.image ? (
                                            <img src={n.actor.image} alt="" className="w-8 h-8 rounded-full bg-bg-secondary object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-bg-secondary flex justify-center items-center text-xs font-bold">
                                                {n.actor.name?.[0] || 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-text-primary leading-tight">
                                                <span className="font-bold text-white">{n.actor.name}</span>{' '}
                                                {n.type === 'LIKE_QUOTE' && 'liked your quote.'}
                                                {n.type === 'LIKE_LIST' && 'liked your list.'}
                                                {n.type === 'COMMENT_QUOTE' && 'commented on your quote.'}
                                                {n.type === 'COMMENT_DISCUSSION' && 'replied to the discussion.'}
                                                {n.type === 'MENTION' && 'mentioned you.'}
                                                {n.type === 'REPLY' && 'replied to your comment.'}
                                            </p>
                                            <p className="text-[10px] text-accent-cyan/70 mt-1">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
