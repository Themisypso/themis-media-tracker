import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Star, Film, Tv, Calendar, MapPin, ExternalLink, Clapperboard, Heart, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { PersonCreditsClient } from '@/components/PersonCreditsClient'

export const dynamic = 'force-dynamic'

async function getPersonData(id: string) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    try {
        const res = await fetch(`${baseUrl}/api/tmdb/person/${id}`, { next: { revalidate: 3600 } })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export default async function PersonPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    const data = await getPersonData(params.id)

    if (!data) notFound()

    const color = '#00d4ff' // Default cyan for persons

    function getAge(birthday: string, deathday?: string | null) {
        const birth = new Date(birthday)
        const end = deathday ? new Date(deathday) : new Date()
        let age = end.getFullYear() - birth.getFullYear()
        const m = end.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
        return age
    }

    return (
        <main className="min-h-screen bg-bg-primary pb-20">
            <Navbar />

            {/* Background Header / Gradient */}
            <div className="relative h-[35vh] min-h-[300px] w-full mt-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-bg-primary to-[#16213e]" />
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, ${color}22 0%, transparent 50%), radial-gradient(circle at 80% 50%, #7b2fff22 0%, transparent 50%)`
                }} />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative -mt-32 z-10">
                <div className="flex flex-col md:flex-row gap-10">
                    {/* Left Column: Photo & Stats */}
                    <div className="w-64 flex-shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-border bg-bg-secondary w-full group relative">
                            {data.profileUrl ? (
                                <img src={data.profileUrl} alt={data.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <UserIcon size={64} className="text-text-muted opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Side Info Card */}
                        <div className="mt-8 glass-card p-6 rounded-2xl border border-border space-y-6">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Personal Info</h4>
                                <div className="space-y-4">
                                    {data.birthday && (
                                        <div className="flex items-start gap-3">
                                            <Calendar size={14} className="mt-0.5 text-accent-cyan" />
                                            <div>
                                                <p className="text-xs font-bold text-text-primary">Born</p>
                                                <p className="text-[11px] text-text-secondary">
                                                    {new Date(data.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    {' '}({getAge(data.birthday, data.deathday)} {data.deathday ? 'years' : 'yo'})
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {data.deathday && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-accent-pink font-bold">†</div>
                                            <div>
                                                <p className="text-xs font-bold text-accent-pink">Passed Away</p>
                                                <p className="text-[11px] text-text-secondary">
                                                    {new Date(data.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {data.placeOfBirth && (
                                        <div className="flex items-start gap-3">
                                            <MapPin size={14} className="mt-0.5 text-accent-cyan" />
                                            <div>
                                                <p className="text-xs font-bold text-text-primary">Place of Birth</p>
                                                <p className="text-[11px] text-text-secondary leading-tight">{data.placeOfBirth}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-3">Popularity</h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-bg-secondary h-1.5 rounded-full overflow-hidden border border-border">
                                        <div className="h-full bg-accent-cyan shadow-[0_0_8px_#00d4ff]" style={{ width: `${Math.min(100, (data.popularity / 200) * 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-text-primary">{data.popularity}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bio & Credits */}
                    <div className="flex-1 min-w-0 pt-6 md:pt-12">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                            <span className="text-xs px-3 py-1 rounded-full font-bold tracking-widest uppercase bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan shadow-[0_0_10px_rgba(0,212,255,0.1)]">{data.knownForDepartment}</span>
                            {data.imdbId && (
                                <a href={`https://www.imdb.com/name/${data.imdbId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#f5c518] hover:bg-[#f5c518]/10 px-2 py-1 rounded-md transition-colors font-bold border border-[#f5c518]/30">
                                    <ExternalLink size={12} /> IMDb Profile
                                </a>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-7xl font-display font-extrabold text-[#e8edf5] mb-8 drop-shadow-md tracking-tight leading-tight text-center md:text-left">{data.name}</h1>

                        {/* Biography */}
                        {data.biography && (
                            <div className="mb-14 glass-card p-8 rounded-2xl border border-border/50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Clapperboard size={80} />
                                </div>
                                <h3 className="text-xl font-display font-bold text-[#e8edf5] mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-accent-cyan rounded-full" />
                                    Biography
                                </h3>
                                <p className="text-[#8899aa] leading-relaxed text-lg whitespace-pre-line relative z-10">{data.biography}</p>
                            </div>
                        )}

                        {/* Credits Section - Client Side for Tabs & Library Actions */}
                        <PersonCreditsClient
                            initialData={data}
                            isLoggedIn={!!session}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
