import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/discussions/[id]/like — toggle like on a comment
// Body: { commentId: string }
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { commentId } = body

        if (!commentId) return new NextResponse('commentId required', { status: 400 })

        const existing = await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId: session.user.id, commentId } }
        })

        if (existing) {
            await prisma.commentLike.delete({ where: { id: existing.id } })
            return NextResponse.json({ liked: false })
        }

        await prisma.commentLike.create({
            data: { userId: session.user.id, commentId }
        })

        // Notify comment author
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true }
        })
        if (comment && comment.userId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: comment.userId,
                    actorId: session.user.id,
                    type: 'LIKE_COMMENT',
                    referenceId: commentId
                }
            }).catch(() => { }) // non-fatal
        }

        return NextResponse.json({ liked: true })
    } catch (error) {
        console.error('[DISCUSSION_LIKE_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
