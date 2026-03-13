import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/discussions/[id]/comment — add a comment (optionally a reply)
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { content, parentId } = body

        if (!content?.trim()) return new NextResponse('Content required', { status: 400 })

        // Validate the thread exists
        const thread = await prisma.discussionThread.findUnique({ where: { id: params.id } })
        if (!thread) return new NextResponse('Thread not found', { status: 404 })

        // If replying, validate parent belongs to this thread
        if (parentId) {
            const parent = await prisma.comment.findFirst({
                where: { id: parentId, discussionThreadId: params.id }
            })
            if (!parent) return new NextResponse('Parent comment not found', { status: 404 })
        }

        const comment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                discussionThreadId: params.id,
                parentId: parentId || null,
                content: content.trim()
            },
            include: {
                user: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { likes: true, replies: true } }
            }
        })

        // Update thread updatedAt
        await prisma.discussionThread.update({
            where: { id: params.id },
            data: { updatedAt: new Date() }
        })

        // Notify thread participants (excluding poster)
        const participants = await prisma.comment.findMany({
            where: { discussionThreadId: params.id },
            select: { userId: true },
            distinct: ['userId']
        })
        const toNotify = participants
            .map(p => p.userId)
            .filter(id => id !== session.user.id)

        if (toNotify.length > 0) {
            await prisma.notification.createMany({
                data: toNotify.map(userId => ({
                    userId,
                    actorId: session.user.id,
                    type: 'COMMENT_DISCUSSION' as const,
                    referenceId: params.id
                })),
                skipDuplicates: true
            })
        }

        return NextResponse.json(comment)
    } catch (error) {
        console.error('[DISCUSSION_COMMENT_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
