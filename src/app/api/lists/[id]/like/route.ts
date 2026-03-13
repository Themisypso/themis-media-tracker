import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const list = await prisma.list.findUnique({
            where: { id: params.id },
            include: { likes: true }
        })

        if (!list) {
            return new NextResponse('List not found', { status: 404 })
        }

        const existingLike = list.likes.find((l: any) => l.userId === session.user.id)

        if (existingLike) {
            // Unlike
            await prisma.listLike.delete({
                where: { id: existingLike.id }
            })
            return NextResponse.json({ liked: false })
        } else {
            // Like
            await prisma.listLike.create({
                data: {
                    userId: session.user.id,
                    listId: list.id
                }
            })

            if (list.userId !== session.user.id) {
                await prisma.notification.create({
                    data: {
                        userId: list.userId,
                        actorId: session.user.id,
                        type: 'LIKE_LIST',
                        referenceId: list.id
                    }
                })
            }

            return NextResponse.json({ liked: true })
        }
    } catch (error) {
        console.error('[LIST_LIKE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
