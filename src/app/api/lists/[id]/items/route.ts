import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const list = await prisma.list.findUnique({ where: { id: params.id } })
        if (!list || list.userId !== session.user.id) {
            return new NextResponse('Unauthorized', { status: 403 })
        }

        const body = await req.json()
        const { tmdbId, rawgId, bookId, mediaType, title, posterUrl } = body

        if (!mediaType || !title) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Get max order
        const maxOrderAgg = await prisma.listItem.aggregate({
            where: { listId: params.id },
            _max: { order: true }
        })
        const maxOrder = maxOrderAgg._max.order ?? -1

        const item = await prisma.listItem.create({
            data: {
                listId: params.id,
                tmdbId,
                rawgId,
                bookId,
                mediaType,
                title,
                posterUrl,
                order: maxOrder + 1
            }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('[LIST_ITEM_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
