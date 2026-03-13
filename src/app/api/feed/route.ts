import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'following' // 'following' | 'global' | 'user'
    const targetUserId = searchParams.get('userId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const cursor = searchParams.get('cursor')

    let whereClause: any = {}

    if (filter === 'user' && targetUserId) {
        whereClause.userId = targetUserId
    } else if (filter === 'following') {
        const following = await prisma.follows.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true }
        })
        const matchIds = [session.user.id, ...following.map(f => f.followingId)]
        whereClause.userId = { in: matchIds }
    } else {
        // global feed = everyone
        whereClause.userId = { not: undefined }
    }

    // Exclude private users unless it's the current user looking at their own feed
    if (filter !== 'user' || targetUserId !== session.user.id) {
        whereClause.user = {
            settings: {
                isPublic: true,
                hideActivity: false
            }
        }
    }

    try {
        const activities = await prisma.activity.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, name: true, username: true, image: true }
                },
                media: {
                    select: { id: true, title: true, type: true, posterUrl: true, releaseYear: true, tmdbId: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
        })

        const hasMore = activities.length > limit
        const page = hasMore ? activities.slice(0, limit) : activities
        const nextCursor = hasMore ? page[page.length - 1].id : null

        return NextResponse.json({ activities: page, hasMore, nextCursor })
    } catch (error) {
        console.error('[FEED_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
