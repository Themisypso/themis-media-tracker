import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const { requestId } = await req.json()
    if (!requestId) return new NextResponse('Missing request ID', { status: 400 })

    try {
        const request = await prisma.friendRequest.findUnique({
            where: { id: requestId }
        })

        if (!request || request.receiverId !== session.user.id || request.status !== 'PENDING') {
            return new NextResponse('Invalid request', { status: 400 })
        }

        // Transaction to update request and create friendship
        await prisma.$transaction([
            prisma.friendRequest.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' }
            }),
            prisma.friendship.create({
                data: {
                    user1Id: request.senderId,
                    user2Id: request.receiverId,
                }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[FRIENDS_ACCEPT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
