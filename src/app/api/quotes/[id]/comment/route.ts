import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await req.json()
        const { content } = body

        if (!content || !content.trim()) {
            return new NextResponse('Content is required', { status: 400 })
        }

        const quote = await prisma.quote.findUnique({
            where: { id: params.id }
        })

        if (!quote) {
            return new NextResponse('Quote not found', { status: 404 })
        }

        const comment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                quoteId: quote.id,
                content: content.trim()
            },
            include: {
                user: { select: { username: true, image: true, name: true } }
            }
        })

        if (quote.userId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: quote.userId,
                    actorId: session.user.id,
                    type: 'COMMENT_QUOTE',
                    referenceId: quote.id
                }
            })
        }

        return NextResponse.json(comment)
    } catch (error) {
        console.error('[QUOTE_COMMENT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
