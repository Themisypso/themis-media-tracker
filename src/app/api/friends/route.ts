import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        // Get friends
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { user1Id: session.user.id },
                    { user2Id: session.user.id }
                ]
            },
            include: {
                user1: { select: { id: true, name: true, username: true, image: true } },
                user2: { select: { id: true, name: true, username: true, image: true } }
            }
        })

        const friends = friendships.map(f => f.user1Id === session.user.id ? f.user2 : f.user1)

        // Get pending requests received
        const pendingReceived = await prisma.friendRequest.findMany({
            where: { receiverId: session.user.id, status: 'PENDING' },
            include: {
                sender: { select: { id: true, name: true, username: true, image: true } }
            }
        })

        // Get pending requests sent
        const pendingSent = await prisma.friendRequest.findMany({
            where: { senderId: session.user.id, status: 'PENDING' },
            include: {
                receiver: { select: { id: true, name: true, username: true, image: true } }
            }
        })

        return NextResponse.json({ friends, pendingReceived, pendingSent })
    } catch (error) {
        console.error('[FRIENDS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const { targetUserId } = await req.json()
    if (!targetUserId || targetUserId === session.user.id) {
        return new NextResponse('Invalid target user', { status: 400 })
    }

    try {
        // Check if already friends
        const existingFriend = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: session.user.id, user2Id: targetUserId },
                    { user1Id: targetUserId, user2Id: session.user.id }
                ]
            }
        })
        if (existingFriend) return new NextResponse('Already friends', { status: 400 })

        // Check if request already exists
        const existingReq = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: session.user.id, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: session.user.id }
                ],
                status: 'PENDING'
            }
        })
        if (existingReq) return new NextResponse('Request already pending', { status: 400 })

        const request = await prisma.friendRequest.create({
            data: {
                senderId: session.user.id,
                receiverId: targetUserId,
            }
        })

        return NextResponse.json(request)
    } catch (error) {
        console.error('[FRIENDS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
