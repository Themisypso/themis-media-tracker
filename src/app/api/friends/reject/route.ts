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

        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[FRIENDS_REJECT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
