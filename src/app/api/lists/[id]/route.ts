import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    const list = await prisma.list.findUnique({
        where: { id: params.id },
        include: {
            items: { orderBy: { order: 'asc' } },
            user: { select: { id: true, name: true, username: true, image: true } }
        }
    })

    if (!list) return new NextResponse('Not found', { status: 404 })

    // Privacy check
    if (!list.isPublic && list.userId !== session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 403 })
    }

    return NextResponse.json(list)
}

export async function PATCH(
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
        const { title, description, isPublic } = body

        const updated = await prisma.list.update({
            where: { id: params.id },
            data: { title, description, isPublic }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('[LIST_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
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

        await prisma.list.delete({ where: { id: params.id } })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[LIST_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
