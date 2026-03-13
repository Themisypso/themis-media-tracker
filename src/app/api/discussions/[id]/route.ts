import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/discussions/[id] — thread detail with paginated comments
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        const { searchParams } = new URL(req.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const cursor = searchParams.get('cursor') || undefined

        const thread = await prisma.discussionThread.findUnique({
            where: { id: params.id },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { comments: true } }
            }
        })

        if (!thread) return new NextResponse('Not Found', { status: 404 })

        // Fetch top-level comments with likes + replies
        const comments = await prisma.comment.findMany({
            where: { discussionThreadId: params.id, parentId: null },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { likes: true, replies: true } },
                likes: session?.user?.id ? { where: { userId: session.user.id }, select: { id: true } } : false,
                replies: {
                    take: 10,
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
        const nextCursor = hasMore ? data[data.length - 1]?.id : null

        return NextResponse.json({ thread, comments: data, nextCursor })
    } catch (error) {
        console.error('[DISCUSSION_DETAIL_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// DELETE /api/discussions/[id] — delete thread (author or mod)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

        const thread = await prisma.discussionThread.findUnique({ where: { id: params.id } })
        if (!thread) return new NextResponse('Not Found', { status: 404 })

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        const isAuthor = thread.userId === session.user.id
        const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

        if (!isAuthor && !isMod) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        await prisma.discussionThread.delete({ where: { id: params.id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[DISCUSSION_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
