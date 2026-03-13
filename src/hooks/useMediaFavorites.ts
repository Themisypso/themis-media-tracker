'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Module-level shared cache — deduplicates fetches across components on the same session
let globalFavorites: Set<string> | null = null
let cachedUserId: string | null = null
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
    listeners.forEach(l => l())
}

function clearGlobalCache() {
    globalFavorites = null
    cachedUserId = null
    fetchPromise = null
}

export function useMediaFavorites() {
    const { data: session } = useSession()
    const [favorites, setFavorites] = useState<Set<string>>(globalFavorites || new Set())

    useEffect(() => {
        const userId = session?.user?.id

        // If there is no user, or the logged-in user changed, clear stale cache
        if (!userId || (cachedUserId && cachedUserId !== userId)) {
            clearGlobalCache()
            setFavorites(new Set())
        }

        if (!userId) return

        if (!globalFavorites) {
            cachedUserId = userId
            if (!fetchPromise) {
                fetchPromise = fetch('/api/media/favorites')
                    .then(res => res.json())
                    .then(data => {
                        globalFavorites = new Set(data)
                        setFavorites(globalFavorites)
                        notifyListeners()
                    })
                    .catch(console.error)
                    .finally(() => { fetchPromise = null })
            }
        } else {
            setFavorites(globalFavorites)
        }

        const listener = () => setFavorites(new Set(globalFavorites))
        listeners.add(listener)
        return () => { listeners.delete(listener) }
    }, [session?.user?.id])

    const toggleFavorite = async (item: {
        tmdbId: string
        title: string
        type: string
        posterUrl: string | null
        releaseYear: number | null
    }) => {
        if (!session?.user || !globalFavorites) return

        const isFav = globalFavorites.has(item.tmdbId)

        // Optimistic update
        if (isFav) {
            globalFavorites.delete(item.tmdbId)
        } else {
            globalFavorites.add(item.tmdbId)
        }
        notifyListeners()

        try {
            if (isFav) {
                await fetch(`/api/media/favorites?tmdbId=${item.tmdbId}`, { method: 'DELETE' })
            } else {
                await fetch('/api/media/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                })
            }
        } catch (error) {
            // Revert on error
            if (isFav) {
                globalFavorites.add(item.tmdbId)
            } else {
                globalFavorites.delete(item.tmdbId)
            }
            notifyListeners()
            console.error('Failed to toggle favorite', error)
        }
    }

    const isFavorited = (tmdbId: string | null | undefined) => {
        if (!tmdbId || !globalFavorites) return false
        return globalFavorites.has(tmdbId)
    }

    return { isFavorited, toggleFavorite }
}
