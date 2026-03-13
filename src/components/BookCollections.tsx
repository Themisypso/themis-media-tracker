'use client'

import Link from 'next/link'

const COLLECTIONS = [
    {
        id: 'Classics',
        label: 'World Classics',
        icon: '📚',
        desc: 'Timeless works of literature',
        gradient: 'from-blue-900/60 to-purple-900/60',
        border: 'border-purple-500/30',
        glow: 'hover:shadow-purple-500/20',
    },
    {
        id: 'Philosophy',
        label: 'Philosophy',
        icon: '🤔',
        desc: 'Great thinkers, great ideas',
        gradient: 'from-indigo-900/60 to-slate-800/60',
        border: 'border-indigo-500/30',
        glow: 'hover:shadow-indigo-500/20',
    },
    {
        id: 'Science Fiction',
        label: 'Science Fiction',
        icon: '🛸',
        desc: 'Worlds beyond imagination',
        gradient: 'from-cyan-900/60 to-blue-900/60',
        border: 'border-cyan-500/30',
        glow: 'hover:shadow-cyan-500/20',
    },
    {
        id: 'History',
        label: 'Historical Literature',
        icon: '📜',
        desc: 'Epochs, empires, and events',
        gradient: 'from-amber-900/60 to-orange-900/60',
        border: 'border-amber-500/30',
        glow: 'hover:shadow-amber-500/20',
    },
    {
        id: 'Mystery',
        label: 'Mystery',
        icon: '🔎',
        desc: 'Whodunits and noir thrillers',
        gradient: 'from-slate-800/60 to-zinc-900/60',
        border: 'border-slate-500/30',
        glow: 'hover:shadow-slate-500/20',
    },
    {
        id: 'Romance',
        label: 'Romance',
        icon: '❤️',
        desc: 'Love stories across centuries',
        gradient: 'from-rose-900/60 to-pink-900/60',
        border: 'border-rose-500/30',
        glow: 'hover:shadow-rose-500/20',
    },
] as const

export function BookCollections() {
    return (
        <div className="mb-10">
            <h2 className="text-xl font-display font-bold text-text-primary mb-4 flex items-center gap-2">
                ✨ Collections
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {COLLECTIONS.map(col => (
                    <Link
                        key={col.id}
                        href={`/books?category=${encodeURIComponent(col.id)}`}
                        className={`group relative p-4 rounded-2xl border ${col.border} bg-gradient-to-br ${col.gradient} backdrop-blur-sm hover:shadow-xl ${col.glow} transition-all duration-300 hover:-translate-y-1 flex flex-col gap-2`}
                    >
                        <span className="text-3xl">{col.icon}</span>
                        <div>
                            <p className="text-sm font-bold text-text-primary group-hover:text-white transition-colors">{col.label}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">{col.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
