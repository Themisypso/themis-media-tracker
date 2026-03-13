import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const { targetUserId } = await req.json()
    if (!targetUserId || targetUserId === session.user.id) {
        return new NextResponse('Invalid target user', { status: 400 })
    }

    try {
        // Toggle follow logic
        const existing = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: targetUserId,
                }
            }
        })

        if (existing) {
            // Unfollow
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: session.user.id,
                        followingId: targetUserId,
                    }
                }
            })
            return NextResponse.json({ followed: false })
        } else {
            // Follow
            await prisma.follows.create({
                data: {
                    followerId: session.user.id,
                    followingId: targetUserId,
                }
            })
            return NextResponse.json({ followed: true })
        }
    } catch (error) {
        console.error('[FOLLOW_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
