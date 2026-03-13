import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { code: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const sharedSession = await prisma.sharedSession.findUnique({
            where: { code: params.code.toUpperCase() },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, username: true, image: true } }
                    }
                }
            }
        })

        if (!sharedSession) return new NextResponse('Session not found', { status: 404 })

        const participantIds = sharedSession.participants.map(p => p.userId)

        // Ensure user is in session
        if (!participantIds.includes(session.user.id)) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        // Fetch all media items for all participants (Movies/TV only for now to keep it sane)
        const allMedia = await prisma.mediaItem.findMany({
            where: {
                userId: { in: participantIds },
                type: { in: ['MOVIE', 'TVSHOW', 'ANIME'] }
            },
            select: {
                id: true,
                userId: true,
                tmdbId: true,
                title: true,
                type: true,
                posterUrl: true,
                status: true,
                userRating: true,
                releaseYear: true
            }
        })

        // Group by TMDB ID
        const mediaMap = new Map<string, typeof allMedia>()
        for (const item of allMedia) {
            if (!item.tmdbId) continue
            if (!mediaMap.has(item.tmdbId)) {
                mediaMap.set(item.tmdbId, [])
            }
            mediaMap.get(item.tmdbId)!.push(item)
        }

        const exactMatches: any[] = []
        const planToWatchMatches: any[] = []

        for (const [tmdbId, items] of Array.from(mediaMap.entries())) {
            // Check if ALL participants have this item
            const userIdsWithItem = new Set(items.map(i => i.userId))

            if (userIdsWithItem.size === participantIds.length && participantIds.length > 1) {
                // Determine the mutual status
                const allPlanned = items.every(i => i.status === 'PLANNED')
                const allCompleted = items.every(i => i.status === 'COMPLETED')

                const baseItem = items[0] // just take the first one for title/poster

                if (allPlanned) {
                    planToWatchMatches.push(baseItem)
                } else {
                    // Everyone has tracked it in some way, but exactly what? 
                    // To make it simple, we just put it in general "exactMatches"
                    exactMatches.push({
                        ...baseItem,
                        statuses: items.map(i => ({ userId: i.userId, status: i.status, rating: i.userRating }))
                    })
                }
            }
        }

        return NextResponse.json({
            session: sharedSession,
            matches: {
                exact: exactMatches,
                planToWatch: planToWatchMatches
            }
        })

    } catch (error) {
        console.error('[SESSION_SYNC]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
