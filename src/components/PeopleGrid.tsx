'use client'

import { useState, useMemo, useEffect } from 'react'
import { PersonCard, Person } from '@/components/PersonCard'
import { PersonDetailModal } from '@/components/PersonDetailModal'
import { Search, ArrowUpDown, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PeopleGridProps {
    people: Person[]
    favoriteIds: number[]
    isLoggedIn: boolean
    children?: React.ReactNode
}

export function PeopleGrid({ people, favoriteIds, isLoggedIn, children }: PeopleGridProps) {
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('popularity_desc')
    const [searchResults, setSearchResults] = useState<Person[]>([])
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`/api/tmdb/people?query=${encodeURIComponent(searchTerm)}`)
                if (res.ok) {
                    const data = await res.json()
                    setSearchResults(data.results || [])
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsSearching(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm])

    const sortedAndFilteredPeople = useMemo(() => {
        let result = searchTerm ? [...searchResults] : [...people]

        // 1. Filter locally ONLY if we are NOT using the TMDB global search
        if (searchTerm && searchResults.length === 0 && !isSearching) {
            // we let TMDB handle search results, no local filtering needed for the text.
        }

        // 2. Sort
        result.sort((a, b) => {
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
            if (sortBy === 'name_desc') return b.name.localeCompare(a.name)

            // Default: popularity desc
            const popA = a.popularity || 0
            const popB = b.popularity || 0
            return popB - popA
        })

        return result
    }, [people, searchResults, searchTerm, sortBy, isSearching])

    return (
        <>
            <div className="space-y-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 relative z-20">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search loaded people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-card border border-border text-text-primary text-sm rounded-xl py-2 pl-10 pr-3 focus:border-accent-cyan outline-none transition-colors"
                        />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-bg-card border border-border text-text-primary text-sm rounded-xl py-2 pl-10 pr-3 focus:border-accent-cyan outline-none transition-colors appearance-none"
                        >
                            <option value="popularity_desc">Popularity (High-Low)</option>
                            <option value="name_asc">Name (A-Z)</option>
                            <option value="name_desc">Name (Z-A)</option>
                        </select>
                    </div>
                </div>

                {isSearching ? (
                    <div className="py-24 flex justify-center w-full">
                        <Loader2 size={32} className="text-accent-cyan animate-spin" />
                    </div>
                ) : sortedAndFilteredPeople.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
                        {sortedAndFilteredPeople.map((person) => (
                            <div key={person.id} className="relative">
                                <Link href={`/person/${person.id}`} className="block h-full cursor-pointer">
                                    <PersonCard person={person} />
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-text-muted">No people found.</div>
                )}

                {!searchTerm && children}
            </div>

            <PersonDetailModal
                personId={selectedPersonId}
                onClose={() => setSelectedPersonId(null)}
            />
        </>
    )
}
