'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PersonDetailModal } from '@/components/PersonDetailModal'

interface CastMember {
    id: number
    name: string
    character?: string
    profile_path?: string | null
}

interface CrewMember {
    id: number
    name: string
    job: string
    department: string
    profile_path?: string | null
}

interface MediaCastCrewProps {
    credits: {
        cast?: CastMember[]
        crew?: CrewMember[]
    }
    type: string
}

export function MediaCastCrew({ credits, type }: MediaCastCrewProps) {
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)
    const [showAllCast, setShowAllCast] = useState(false)

    const cast = credits?.cast || []
    const crew = credits?.crew || []

    const directors = Array.from(new Map(
        crew.filter(c => c.job === 'Director').map(d => [d.id, d])
    ).values())

    const writers = Array.from(new Map(
        crew.filter(c => ['Writer', 'Screenplay', 'Story', 'Author'].includes(c.job) || c.department === 'Writing')
            .map(w => [w.id, w])
    ).values())

    const producers = Array.from(new Map(
        crew.filter(c => c.job === 'Producer' || c.job === 'Executive Producer')
            .map(p => [p.id, p])
    ).values()).slice(0, 5)

    const INITIAL_CAST = 12
    const displayedCast = showAllCast ? cast : cast.slice(0, INITIAL_CAST)
    const castTitle = type === 'ANIME' ? 'Voice Actors' : 'Top Cast'

    if (cast.length === 0 && crew.length === 0) return null

    function PersonRow({ person, role }: { person: CastMember | CrewMember; role: string }) {
        return (
            <div
                onClick={() => setSelectedPersonId(person.id)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg-hover transition-colors cursor-pointer group border border-transparent hover:border-border"
            >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0 flex items-center justify-center border border-border group-hover:border-accent-cyan transition-colors">
                    {person.profile_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                            className="w-full h-full object-cover object-top"
                            alt={person.name}
                            loading="lazy"
                        />
                    ) : (
                        <span className="text-sm font-bold text-text-muted">{person.name.charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-text-primary group-hover:text-accent-cyan truncate transition-colors">{person.name}</p>
                    <p className="text-xs text-text-secondary truncate">{role}</p>
                </div>
            </div>
        )
    }

    function CrewSection({ title, people }: { title: string; people: CrewMember[] }) {
        if (people.length === 0) return null
        return (
            <div>
                <h4 className="text-xs uppercase tracking-widest font-bold text-text-muted mb-3">{title}</h4>
                <div className="space-y-1">
                    {people.map(p => <PersonRow key={`${title}-${p.id}`} person={p} role={p.job} />)}
                </div>
            </div>
        )
    }

    return (
        <div className="mb-14 fade-in">
            <h3 className="text-xl font-display font-bold text-text-primary mb-6">Cast &amp; Crew</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Crew */}
                <div className="space-y-6">
                    <CrewSection title="Director" people={directors} />
                    <CrewSection title="Writer" people={writers} />
                    <CrewSection title="Producer" people={producers} />
                </div>

                {/* Right 2 Cols: Cast */}
                {displayedCast.length > 0 && (
                    <div className="col-span-1 lg:col-span-2">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-text-muted mb-3">{castTitle}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {displayedCast.map(actor => (
                                <PersonRow key={`cast-${actor.id}`} person={actor} role={'character' in actor ? (actor as CastMember).character || '' : ''} />
                            ))}
                        </div>

                        {cast.length > INITIAL_CAST && (
                            <button
                                onClick={() => setShowAllCast(v => !v)}
                                className="mt-4 flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-cyan transition-colors font-medium"
                            >
                                {showAllCast
                                    ? <><ChevronUp size={14} /> Show less</>
                                    : <><ChevronDown size={14} /> Show all {cast.length} cast members</>
                                }
                            </button>
                        )}
                    </div>
                )}
            </div>

            <PersonDetailModal personId={selectedPersonId} onClose={() => setSelectedPersonId(null)} />
        </div>
    )
}
