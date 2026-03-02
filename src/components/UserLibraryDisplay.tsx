import { prisma } from '@/lib/prisma'
import { PosterCard } from '@/components/PosterCard'

interface Props {
    userId: string
    hideRatings: boolean
}

export async function UserLibraryDisplay({ userId, hideRatings }: Props) {
    // Fetch all media for this user, sorted by most recently interacted
    const items = await prisma.mediaItem.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 50 // Limit to recent 50 for the profile preview
    })

    if (items.length === 0) {
        return (
            <div className="glass-card p-12 text-center rounded-2xl border border-border">
                <p className="text-text-secondary">This library is currently empty.</p>
            </div>
        )
    }

    // Grouping by status
    const watching = items.filter(i => i.status === 'WATCHING')
    const completed = items.filter(i => i.status === 'COMPLETED')
    const planned = items.filter(i => i.status === 'PLANNED')

    return (
        <div className="space-y-12">
            {watching.length > 0 && (
                <section>
                    <h3 className="text-xl font-bold font-display text-text-primary mb-4 border-b border-border pb-2">Currently Watching / Playing</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {watching.map(item => (
                            <PosterCard
                                key={item.id}
                                // @ts-ignore
                                item={{ ...item, userRating: hideRatings ? null : item.userRating }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {completed.length > 0 && (
                <section>
                    <h3 className="text-xl font-bold font-display text-text-primary mb-4 border-b border-border pb-2">Recently Completed</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {completed.map(item => (
                            <PosterCard
                                key={item.id}
                                // @ts-ignore
                                item={{ ...item, userRating: hideRatings ? null : item.userRating }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {planned.length > 0 && (
                <section>
                    <h3 className="text-xl font-bold font-display text-text-primary mb-4 border-b border-border pb-2">Plan to Watch / Play</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {planned.map(item => (
                            <PosterCard
                                key={item.id}
                                // @ts-ignore
                                item={{ ...item, userRating: hideRatings ? null : item.userRating }}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
