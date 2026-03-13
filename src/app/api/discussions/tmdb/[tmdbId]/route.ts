import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/discussions/tmdb/[tmdbId] — get or init thread for a TMDB item
export async function GET(req: Request, { params }: { params: { tmdbId: string } }) {
    try {
        const session = await getServerSession(authOptions)
        const { searchParams } = new URL(req.url)
        const cursor = searchParams.get('cursor') || undefined
        const limit = 30

        const thread = await prisma.discussionThread.findFirst({
            where: { tmdbId: params.tmdbId },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { comments: true } }
            }
        })

        if (!thread) {
            return NextResponse.json({ thread: null, comments: [], nextCursor: null })
        }

        const comments = await prisma.comment.findMany({
            where: { discussionThreadId: thread.id, parentId: null },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { likes: true, replies: true } },
                likes: session?.user?.id ? { where: { userId: session.user.id }, select: { id: true } } : false,
                replies: {
                    take: 5,
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: { select: { id: true, name: true, username: true, image: true } },
                        _count: { select: { likes: true } },
                        likes: session?.user?.id ? { where: { userId: session.user.id }, select: { id: true } } : false
                    }
                }
            }
        })

        const hasMore = comments.length > limit
        const data = hasMore ? comments.slice(0, limit) : comments

        return NextResponse.json({
            thread,
            comments: data,
            nextCursor: hasMore ? data[data.length - 1]?.id : null
        })
    } catch (error) {
        console.error('[TMDB_DISCUSSION_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
