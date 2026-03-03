'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

let globalPersonFavorites: Set<number> | null = null
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
    listeners.forEach(l => l())
}

export function usePersonFavorites() {
    const { data: session } = useSession()
    const [favorites, setFavorites] = useState<Set<number>>(globalPersonFavorites || new Set())

    useEffect(() => {
        if (!session?.user) return

        if (!globalPersonFavorites) {
            if (!fetchPromise) {
                fetchPromise = fetch('/api/people/favorites')
                    .then(res => res.json())
                    .then(data => {
                        const ids = (Array.isArray(data) ? data : []).map((f: any) => f.tmdbPersonId)
                        globalPersonFavorites = new Set(ids)
                        setFavorites(globalPersonFavorites)
                        notifyListeners()
                    })
                    .catch(console.error)
                    .finally(() => {
                        fetchPromise = null
                    })
            }
        } else {
            setFavorites(globalPersonFavorites)
        }

        const listener = () => setFavorites(new Set(globalPersonFavorites))
        listeners.add(listener)
        return () => { listeners.delete(listener) }
    }, [session])

    const toggleFavorite = async (person: { id: number, name: string, profileUrl: string | null, knownForDepartment: string }) => {
        if (!session?.user || !globalPersonFavorites) {
            toast.error('You must be logged in to favorite.')
            return
        }

        const isFav = globalPersonFavorites.has(person.id)

        // Optimistic update
        if (isFav) {
            globalPersonFavorites.delete(person.id)
        } else {
            globalPersonFavorites.add(person.id)
        }
        notifyListeners()

        try {
            if (isFav) {
                const res = await fetch(`/api/people/favorites?tmdbPersonId=${person.id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error()
                toast.success('Removed from favorites', { id: `fav-${person.id}` })
            } else {
                const res = await fetch('/api/people/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tmdbPersonId: person.id,
                        name: person.name,
                        profileUrl: person.profileUrl,
                        knownForDepartment: person.knownForDepartment
                    })
                })
                if (!res.ok) throw new Error()
                toast.success('Added to favorites!', { id: `fav-${person.id}` })
            }
        } catch (error) {
            // Revert on error
            if (isFav) {
                globalPersonFavorites.add(person.id)
            } else {
                globalPersonFavorites.delete(person.id)
            }
            notifyListeners()
            toast.error('Failed to update favorite')
            console.error(error)
        }
    }

    const isFavorited = (id: number | null | undefined) => {
        if (!id || !globalPersonFavorites) return false
        return globalPersonFavorites.has(id)
    }

    return { isFavorited, toggleFavorite }
}
