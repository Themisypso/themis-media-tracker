'use client'

import { User, Clapperboard, Tv, Heart } from 'lucide-react'
import Link from 'next/link'
import { usePersonFavorites } from '@/hooks/usePersonFavorites'

export interface Person {
    id: number
    name: string
    profileUrl: string | null
    knownForDepartment: string
    popularity?: number
    knownFor?: { title: string; mediaType: string; posterUrl: string | null }[]
}

interface PersonCardProps {
    person: Person
    href?: string
}

const deptColor: Record<string, string> = {
    Acting: '#00d4ff',
    Directing: '#7b2fff',
    Writing: '#00ff9d',
    Production: '#ff9500',
    'Sound': '#ff6b9d',
    'Crew': '#a78bfa',
}

export function PersonCard({ person, href }: PersonCardProps) {
    const color = deptColor[person.knownForDepartment] || '#8899aa'
    const { isFavorited, toggleFavorite } = usePersonFavorites()
    const fav = isFavorited(person.id)

    const cardContent = (
        <div className="group relative cursor-pointer rounded-xl overflow-hidden border border-border hover:border-border-bright transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover bg-bg-card">
            {/* Profile Image */}
            <div className="relative aspect-[2/3] overflow-hidden bg-bg-secondary">
                {person.profileUrl ? (
                    <img
                        src={person.profileUrl}
                        alt={person.name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{
                            background: `linear-gradient(135deg, ${color}22 0%, ${color}08 50%, rgba(10,14,26,0.9) 100%)`,
                        }}
                    >
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold"
                            style={{
                                background: `linear-gradient(135deg, ${color}44, ${color}11)`,
                                border: `2px solid ${color}55`,
                                color,
                            }}
                        >
                            {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-[10px] text-[#6b7a8d] text-center px-3 truncate w-full">{person.name}</p>
                    </div>
                )}

                {/* Favorite badge top-left */}
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(person)
                    }}
                    className={`absolute top-2 left-2 p-1.5 rounded-full z-10 transition-all duration-300 shadow-lg backdrop-blur-sm
                        ${fav ? 'bg-accent-pink/90 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100'}
                    `}
                >
                    <Heart size={14} className={fav ? 'fill-current' : ''} />
                </button>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Known For — shown on hover */}
                {person.knownFor && person.knownFor.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-[9px] text-[#8899aa] mb-1 font-medium uppercase tracking-wider">Known for</p>
                        <div className="space-y-0.5">
                            {person.knownFor.slice(0, 2).map((k, i) => (
                                <p key={i} className="text-[10px] text-white truncate font-medium">
                                    {k.title}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Department badge */}
                <span
                    className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                >
                    {person.knownForDepartment}
                </span>
            </div>

            {/* Info */}
            <div className="p-2.5">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{person.name}</p>
                <div className="flex items-center gap-1 mt-1">
                    <Clapperboard size={9} style={{ color }} />
                    <span className="text-[9px]" style={{ color }}>{person.knownForDepartment}</span>
                </div>
            </div>
        </div>
    )

    if (href) {
        return <Link href={href} className="block">{cardContent}</Link>
    }

    return cardContent
}
