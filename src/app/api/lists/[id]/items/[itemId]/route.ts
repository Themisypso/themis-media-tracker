import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    req: Request,
    { params }: { params: { id: string, itemId: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const list = await prisma.list.findUnique({ where: { id: params.id } })
        if (!list || list.userId !== session.user.id) {
            return new NextResponse('Unauthorized', { status: 403 })
        }

        const item = await prisma.listItem.findUnique({ where: { id: params.itemId } })
        if (!item || item.listId !== params.id) {
            return new NextResponse('Not found', { status: 404 })
        }

        await prisma.listItem.delete({ where: { id: params.itemId } })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[LIST_ITEM_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
