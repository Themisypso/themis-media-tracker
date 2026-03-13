import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const quote = await prisma.quote.findUnique({
            where: { id: params.id },
            include: { likes: true }
        })

        if (!quote) {
            return new NextResponse('Quote not found', { status: 404 })
        }

        const existingLike = quote.likes.find((l: any) => l.userId === session.user.id)

        if (existingLike) {
            // Unlike
            await prisma.quoteLike.delete({
                where: { id: existingLike.id }
            })
            return NextResponse.json({ liked: false })
        } else {
            // Like
            await prisma.quoteLike.create({
                data: {
                    userId: session.user.id,
                    quoteId: quote.id
                }
            })

            if (quote.userId !== session.user.id) {
                await prisma.notification.create({
                    data: {
                        userId: quote.userId,
                        actorId: session.user.id,
                        type: 'LIKE_QUOTE',
                        referenceId: quote.id
                    }
                })
            }

            return NextResponse.json({ liked: true })
        }
    } catch (error) {
        console.error('[QUOTE_LIKE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
