'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Film, Tv, Sparkles, Gamepad2, BookOpen, Home, Users, ActivitySquare, Quote, Layers, BarChart } from 'lucide-react'
import { ActivityFeed } from '@/components/ActivityFeed'
import { QuoteCard } from '@/components/QuoteCard'
import { ListCard } from '@/components/ListCard'
import { motion, AnimatePresence } from 'framer-motion'

interface MediaItem {
    id: string
    title: string
    type: string
    status: string
    posterUrl: string | null
    releaseYear: number | null
    tmdbId: string | null
    rawgId?: string | null
    bookId?: string | null
}

interface FavoriteMedia {
    id: string; title: string; type: string; posterUrl: string | null; tmdbId: string
}

interface FavoritePerson {
    id: string; name: string; profileUrl: string | null; knownForDepartment: string | null; tmdbPersonId: number
}

interface Props {
    userId: string
    currentUserId?: string
    mediaItems: MediaItem[]
    favoriteMedia: FavoriteMedia[]
    favoritePeople: FavoritePerson[]
    quotes?: any[]
    lists?: any[]
}

const TABS = [
    { key: 'activity', label: 'Activity', icon: ActivitySquare, color: '#00d4ff' },
    { key: 'home', label: 'Overview', icon: Home, color: '#e8edf5' },
    { key: 'lists', label: 'Lists', icon: Layers, color: '#00d4ff' },
    { key: 'favorites', label: 'Favorites', icon: Heart, color: '#ff3264' },
    { key: 'quotes', label: 'Quotes', icon: Quote, color: '#facc15' },
    { key: 'stats', label: 'Stats', icon: BarChart, color: '#a78bfa' },
    { key: 'MOVIE', label: 'Movies', icon: Film, color: '#00d4ff' },
    { key: 'TVSHOW', label: 'TV Shows', icon: Tv, color: '#a78bfa' },
    { key: 'ANIME', label: 'Anime', icon: Sparkles, color: '#ff9500' },
    { key: 'GAME', label: 'Games', icon: Gamepad2, color: '#00ff9d' },
    { key: 'BOOK', label: 'Books', icon: BookOpen, color: '#ff6b9d' },
] as const

type TabKey = typeof TABS[number]['key']

const STATUS_GROUPS = [
    { key: 'WATCHING', label: 'In Progress' },
    { key: 'PLANNED', label: 'Plan to Watch' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'DROPPED', label: 'Dropped' },
]

/** Maps a tracked MediaItem to its correct detail page URL */
function mediaHref(item: MediaItem): string {
    if (item.type === 'GAME') {
        if (item.rawgId) return `/games/${item.rawgId}`
        return '/games'
    }
    if (item.type === 'BOOK') {
        if (item.bookId) return `/books/${item.bookId}`
        return '/books'
    }
    if (item.tmdbId) {
        const tmdbType = item.type === 'MOVIE' ? 'movie' : 'tv'
        return `/media/${item.tmdbId}?type=${tmdbType}`
    }
    return '/library'
}

/** Maps a FavoriteMedia DB row to its correct detail page URL */
function favMediaHref(media: FavoriteMedia): string {
    if (media.type === 'GAME') return `/games/${media.tmdbId}`
    if (media.type === 'BOOK') return `/books/${media.tmdbId}`
    const tmdbType = media.type === 'MOVIE' ? 'movie' : 'tv'
    return `/media/${media.tmdbId}?type=${tmdbType}`
}

function PosterGrid({ items, color }: { items: MediaItem[], color: string }) {
    if (items.length === 0) return null
    return (
        <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x">
            {items.map(item => (
                <Link key={item.id} href={mediaHref(item)} className="flex-shrink-0 w-28 group snap-start">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-bg-secondary border border-border group-hover:border-current transition-colors mb-1.5"
                        style={{ '--tw-border-opacity': 1 } as any}>
                        {item.posterUrl ? (
                            <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-muted text-xs text-center p-2">{item.title}</div>
                        )}
                    </div>
                    <p className="text-xs font-medium text-text-primary truncate group-hover:text-accent-cyan transition-colors">{item.title}</p>
                    {item.releaseYear && <p className="text-[10px] text-text-muted">{item.releaseYear}</p>}
                </Link>
            ))}
        </div>
    )
}

export function ProfileTabs({ userId, currentUserId, mediaItems, favoriteMedia, favoritePeople, quotes = [], lists = [] }: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('activity')

    const currentTab = TABS.find(t => t.key === activeTab)!

    return (
        <div className="mt-8">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 no-scrollbar border-b border-border">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key
                    const isMediaType = ['MOVIE', 'TVSHOW', 'ANIME', 'GAME', 'BOOK'].includes(tab.key)
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
                            style={isActive
                                ? { color: tab.color, borderBottomColor: tab.color }
                                : { color: '#6b7a8d', borderBottomColor: 'transparent' }}
                        >
                            <Icon size={14} />
                            {tab.label}
                            {isMediaType && (
                                <span className="text-[9px] px-1 py-0.5 rounded ml-0.5"
                                    style={{ background: isActive ? `${tab.color}22` : 'rgba(255,255,255,0.05)', color: isActive ? tab.color : '#4a5568' }}>
                                    {mediaItems.filter(i => i.type === tab.key).length}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div className="max-w-3xl mx-auto">
                            <ActivityFeed filter="user" targetUserId={userId} />
                        </div>
                    )}

                    {/* Home Tab */}
                    {activeTab === 'home' && (
                        <div className="space-y-10">
                            {/* Activity Pulse Section */}
                            <section className="bg-gradient-to-br from-bg-card/40 to-bg-card/10 border border-border/50 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <ActivitySquare size={80} className="text-accent-cyan" />
                                </div>
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <ActivitySquare size={18} className="text-accent-cyan" /> Activity Pulse
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab('activity')}
                                        className="text-xs font-bold text-accent-cyan hover:underline"
                                    >
                                        View Full Feed
                                    </button>
                                </div>
                                <div className="relative z-10">
                                    <ActivityFeed filter="user" targetUserId={userId} take={3} hideHeader />
                                </div>
                            </section>

                            {/* Recently Completed (all types) */}
                            {(() => {
                                const completed = mediaItems.filter(i => i.status === 'COMPLETED').slice(0, 20)
                                if (completed.length === 0) return null
                                return (
                                    <section>
                                        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                            <span style={{ color: '#00d4ff' }}>✅</span> Recently Completed
                                        </h3>
                                        <PosterGrid items={completed} color="#00d4ff" />
                                    </section>
                                )
                            })()}

                            {/* Watching / In Progress */}
                            {(() => {
                                const watching = mediaItems.filter(i => i.status === 'WATCHING').slice(0, 20)
                                if (watching.length === 0) return null
                                return (
                                    <section>
                                        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                            <span style={{ color: '#a78bfa' }}>▶</span> Continue Watching
                                        </h3>
                                        <PosterGrid items={watching} color="#a78bfa" />
                                    </section>
                                )
                            })()}

                            {mediaItems.length === 0 && favoriteMedia.length === 0 && favoritePeople.length === 0 && (
                                <div className="text-center py-20 text-text-muted">
                                    <p>No activity yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lists Tab */}
                    {activeTab === 'lists' && (
                        <div className="space-y-8">
                            {lists && lists.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {lists.map(list => (
                                        <ListCard key={list.id} list={list} currentUserId={currentUserId || ''} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-text-muted bg-bg-card/20 border border-dashed border-border rounded-3xl">
                                    <Layers className="mx-auto mb-4 opacity-20" size={48} />
                                    <p>No public lists created yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Favorites Tab */}
                    {activeTab === 'favorites' && (
                        <div className="space-y-10">
                            {favoriteMedia.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                                        <Heart size={16} className="text-[#ff3264]" /> Favorite Media
                                    </h3>
                                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x">
                                        {favoriteMedia.map(media => (
                                            <Link key={media.id} href={favMediaHref(media)} className="flex-shrink-0 w-28 group snap-start">
                                                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-bg-secondary border border-border group-hover:border-[#ff3264] transition-colors mb-1.5">
                                                    {media.posterUrl
                                                        ? <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        : <div className="flex items-center justify-center h-full text-text-muted text-xs text-center p-2">{media.title}</div>}
                                                </div>
                                                <p className="text-xs font-medium text-text-primary truncate group-hover:text-[#ff3264] transition-colors">{media.title}</p>
                                                <p className="text-[10px] text-text-muted capitalize">{media.type.toLowerCase()}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {favoritePeople.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                                        <Users size={16} className="text-accent-purple" /> Favorite People
                                    </h3>
                                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x">
                                        {favoritePeople.map(person => (
                                            <Link key={person.id} href={`/person/${person.tmdbPersonId}`} className="flex-shrink-0 w-28 group snap-start">
                                                <div className="aspect-square rounded-full overflow-hidden bg-bg-secondary border-2 border-border group-hover:border-accent-purple transition-colors mb-2 mx-auto w-20 h-20">
                                                    {person.profileUrl
                                                        ? <img src={person.profileUrl} alt={person.name} className="w-full h-full object-cover object-top" />
                                                        : <div className="flex items-center justify-center h-full font-bold text-xl text-text-muted">{person.name[0]}</div>}
                                                </div>
                                                <p className="text-xs font-medium text-text-primary truncate text-center group-hover:text-accent-purple transition-colors">{person.name}</p>
                                                <p className="text-[10px] text-text-muted text-center">{person.knownForDepartment || 'Actor'}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {favoriteMedia.length === 0 && favoritePeople.length === 0 && (
                                <div className="text-center py-20 text-text-muted bg-bg-card/20 border border-dashed border-border rounded-3xl">
                                    <Heart className="mx-auto mb-4 opacity-20" size={48} />
                                    <p>No favorites added yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quotes Tab */}
                    {activeTab === 'quotes' && (
                        <div className="space-y-6">
                            {quotes && quotes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {quotes.map(quote => (
                                        <QuoteCard key={quote.id} quote={quote} currentUserId={currentUserId || ''} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-text-muted bg-bg-card/20 border border-dashed border-border rounded-3xl">
                                    <Quote className="mx-auto mb-4 opacity-20" size={48} />
                                    <p>No quotes saved yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-6">Library Statistics</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="glass-card p-6 rounded-2xl border border-border text-center bg-bg-card/40">
                                    <div className="text-3xl font-black text-white mb-1">{mediaItems.length}</div>
                                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Tracked</div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl border border-border text-center bg-bg-card/40">
                                    <div className="text-3xl font-black text-[#00ff9d] mb-1">{mediaItems.filter(m => m.status === 'COMPLETED').length}</div>
                                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Completed</div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl border border-border text-center bg-bg-card/40">
                                    <div className="text-3xl font-black text-accent-cyan mb-1">{mediaItems.filter(m => m.status === 'WATCHING').length}</div>
                                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">In Progress</div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl border border-border text-center bg-bg-card/40">
                                    <div className="text-3xl font-black text-accent-pink mb-1">{favoriteMedia.length + favoritePeople.length}</div>
                                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Favorites</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Type Tabs */}
                    {['MOVIE', 'TVSHOW', 'ANIME', 'GAME', 'BOOK'].includes(activeTab) && (
                        <div className="space-y-10">
                            {STATUS_GROUPS.map(({ key: statusKey, label }) => {
                                const items = mediaItems.filter(i => i.type === activeTab && i.status === statusKey)
                                if (items.length === 0) return null
                                return (
                                    <section key={statusKey}>
                                        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: currentTab.color }}>
                                            {label}
                                            <span className="text-xs text-text-muted font-normal">({items.length})</span>
                                        </h3>
                                        <PosterGrid items={items} color={currentTab.color} />
                                    </section>
                                )
                            })}

                            {mediaItems.filter(i => i.type === activeTab).length === 0 && (
                                <div className="text-center py-20 text-text-muted">
                                    <p className="text-sm">No {currentTab.label.toLowerCase()} tracked yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
