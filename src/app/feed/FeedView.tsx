'use client'

import { useState } from 'react'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Users, Globe } from 'lucide-react'

export function FeedView() {
    const [filter, setFilter] = useState<'following' | 'global'>('following')

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-bg-secondary/50 rounded-xl border border-border w-fit pb-0 overflow-hidden">
                <button
                    onClick={() => setFilter('following')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${filter === 'following' ? 'bg-bg-card text-accent-cyan shadow-sm border border-border/50' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'}`}
                >
                    <Users size={16} /> Following
                </button>
                <button
                    onClick={() => setFilter('global')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${filter === 'global' ? 'bg-bg-card text-[#a78bfa] shadow-sm border border-border/50' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'}`}
                >
                    <Globe size={16} /> Global Explorer
                </button>
            </div>

            <ActivityFeed filter={filter} />
        </div>
    )
}
