import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const tmdbId = params.id
        const body = await req.json()
        const { content } = body

        if (!content || !content.trim()) {
            return new NextResponse('Content is required', { status: 400 })
        }

        // Find or create the discussion thread
        let thread = await prisma.discussionThread.findFirst({
            where: { tmdbId }
        })

        if (!thread) {
            thread = await prisma.discussionThread.create({
                data: { tmdbId }
            })
        }

        // Create the comment
        const comment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                discussionThreadId: thread.id,
                content: content.trim()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true
                    }
                }
            }
        })

        const participants = await prisma.comment.findMany({
            where: { discussionThreadId: thread.id },
            select: { userId: true },
            distinct: ['userId']
        })

        const participantIds = participants
            .map(p => p.userId)
            .filter(id => id !== session.user.id)

        if (participantIds.length > 0) {
            await prisma.notification.createMany({
                data: participantIds.map(userId => ({
                    userId,
                    actorId: session.user.id,
                    type: 'COMMENT_DISCUSSION',
                    referenceId: thread.tmdbId
                }))
            })
        }

        return NextResponse.json(comment)
    } catch (error) {
        console.error('[DISCUSSION_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
