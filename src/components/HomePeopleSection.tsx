'use client'

import { useState } from 'react'
import { PersonCard, Person } from '@/components/PersonCard'
import { PersonDetailModal } from '@/components/PersonDetailModal'

interface HomePeopleSectionProps {
    people: Person[]
}

export function HomePeopleSection({ people }: HomePeopleSectionProps) {
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

    return (
        <>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                {people.map((person) => (
                    <div key={person.id} className="flex-none w-32 sm:w-36">
                        <div onClick={() => setSelectedPersonId(person.id)} className="cursor-pointer">
                            <PersonCard person={person} />
                        </div>
                    </div>
                ))}
            </div>

            <PersonDetailModal
                personId={selectedPersonId}
                onClose={() => setSelectedPersonId(null)}
            />
        </>
    )
}
