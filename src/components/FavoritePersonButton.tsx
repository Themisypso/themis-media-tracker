'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface FavoriteButtonProps {
    person: {
        id: number
        name: string
        profileUrl: string | null
        knownForDepartment: string
    }
    initialFavorited?: boolean
}

export function FavoritePersonButton({ person, initialFavorited = false }: FavoriteButtonProps) {
    const { data: session } = useSession()
    const [favorited, setFavorited] = useState(initialFavorited)
    const [loading, setLoading] = useState(false)

    if (!session) return null

    async function toggle() {
        setLoading(true)
        try {
            if (favorited) {
                const res = await fetch(`/api/people/favorites?tmdbPersonId=${person.id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error()
                setFavorited(false)
                toast.success('Removed from favorites')
            } else {
                const res = await fetch('/api/people/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tmdbPersonId: person.id,
                        name: person.name,
                        profileUrl: person.profileUrl,
                        knownForDepartment: person.knownForDepartment,
                    }),
                })
                if (!res.ok) throw new Error()
                setFavorited(true)
                toast.success('Added to favorites!')
            }
        } catch {
            toast.error('Something went wrong')
        }
        setLoading(false)
    }

    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle() }}
            disabled={loading}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border z-10"
            style={{
                background: favorited ? 'rgba(255,50,100,0.9)' : 'rgba(0,0,0,0.7)',
                borderColor: favorited ? 'rgba(255,50,100,0.5)' : 'rgba(255,255,255,0.1)',
                boxShadow: favorited ? '0 0 10px rgba(255,50,100,0.4)' : 'none',
            }}
        >
            {loading
                ? <Loader2 size={12} className="animate-spin text-white" />
                : <Heart size={12} fill={favorited ? 'white' : 'none'} className="text-white" />
            }
        </button>
    )
}
