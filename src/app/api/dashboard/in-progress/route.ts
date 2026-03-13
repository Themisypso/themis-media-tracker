import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard/in-progress
 *
 * Returns up to 8 WATCHING items where progress > 0,
 * ordered by most-recently-progressed first.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const items = await prisma.mediaItem.findMany({
            where: {
                userId: session.user.id,
                status: 'WATCHING',
                progress: { gt: 0 },
            },
            orderBy: [
                { lastProgressAt: 'desc' },
                { updatedAt: 'desc' },
            ],
            take: 8,
            select: {
                id: true,
                title: true,
                type: true,
                posterUrl: true,
                progress: true,
                pageCount: true,
                episodeCount: true,
                runtime: true,
                lastProgressAt: true,
                tmdbId: true,
                rawgId: true,
                bookId: true,
            },
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error('[IN_PROGRESS_GET]', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
