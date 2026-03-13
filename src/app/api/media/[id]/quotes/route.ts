import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await req.json()
        const { content, reference } = body

        if (!content) {
            return new NextResponse('Content is required', { status: 400 })
        }

        const mediaItem = await prisma.mediaItem.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            }
        })

        if (!mediaItem) {
            return new NextResponse('Media item not found in your library', { status: 404 })
        }

        const quote = await prisma.quote.create({
            data: {
                userId: session.user.id,
                mediaId: mediaItem.id,
                content,
                reference
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type: 'QUOTE',
                mediaId: mediaItem.id,
                referenceId: quote.id,
                content: content
            }
        })

        return NextResponse.json(quote)
    } catch (error) {
        console.error('[QUOTES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const quotes = await prisma.quote.findMany({
            where: {
                mediaId: params.id,
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(quotes)
    } catch (error) {
        console.error('[QUOTES_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
