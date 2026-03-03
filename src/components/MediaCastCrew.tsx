'use client'

import { useState } from 'react'
import { PersonDetailModal } from '@/components/PersonDetailModal'

interface MediaCastCrewProps {
    credits: {
        cast?: any[]
        crew?: any[]
    }
    type: string
}

export function MediaCastCrew({ credits, type }: MediaCastCrewProps) {
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

    const cast = credits?.cast || []
    const crew = credits?.crew || []

    const directors = crew.filter(c => c.job === 'Director')
    const writers = crew.filter(c => c.department === 'Writing' || c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story')

    // Deduplicate directors/writers
    const uniqueDirectors = Array.from(new Map(directors.map(d => [d.id, d])).values())
    const uniqueWriters = Array.from(new Map(writers.map(w => [w.id, w])).values())

    const topCast = cast.slice(0, 12)

    const castTitle = type === 'ANIME' ? 'Voice Actors' : 'Top Cast'

    if (cast.length === 0 && crew.length === 0) return null

    function PersonRow({ person, role }: { person: any, role: string }) {
        return (
            <div
                onClick={() => setSelectedPersonId(person.id)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg-hover transition-colors cursor-pointer group border border-transparent hover:border-border"
            >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0 flex items-center justify-center border border-border group-hover:border-accent-cyan transition-colors">
                    {person.profile_path ? (
                        <div className="w-[85%] h-[85%] rounded-full overflow-hidden">
                            <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} className="w-full h-full object-cover object-top" alt={person.name} />
                        </div>
                    ) : (
                        <span className="text-sm font-bold text-text-muted">{person.name.charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#e8edf5] group-hover:text-accent-cyan truncate transition-colors">{person.name}</p>
                    <p className="text-xs text-[#8899aa] truncate">{role}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-14 fade-in">
            <h3 className="text-xl font-display font-bold text-[#e8edf5] mb-6">Cast & Crew</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Director & Writer */}
                <div className="space-y-6">
                    {uniqueDirectors.length > 0 && (
                        <div>
                            <h4 className="text-xs uppercase tracking-widest font-bold text-[#4a5568] mb-3">Director</h4>
                            <div className="space-y-1">
                                {uniqueDirectors.map(d => <PersonRow key={`dir-${d.id}`} person={d} role={d.job} />)}
                            </div>
                        </div>
                    )}

                    {uniqueWriters.length > 0 && (
                        <div>
                            <h4 className="text-xs uppercase tracking-widest font-bold text-[#4a5568] mb-3">Writer</h4>
                            <div className="space-y-1">
                                {uniqueWriters.map(w => <PersonRow key={`wri-${w.id}`} person={w} role={w.job} />)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle & Right Col: Top Cast */}
                {topCast.length > 0 && (
                    <div className="col-span-1 lg:col-span-2">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-[#4a5568] mb-3">{castTitle}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {topCast.map(actor => (
                                <PersonRow key={`ast-${actor.id}`} person={actor} role={actor.character} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <PersonDetailModal
                personId={selectedPersonId}
                onClose={() => setSelectedPersonId(null)}
            />
        </div>
    )
}
