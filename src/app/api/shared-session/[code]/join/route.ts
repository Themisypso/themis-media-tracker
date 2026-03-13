import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { code: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const sharedSession = await prisma.sharedSession.findUnique({
            where: { code: params.code.toUpperCase() }
        })

        if (!sharedSession) return new NextResponse('Session not found', { status: 404 })

        await prisma.sharedSessionParticipant.upsert({
            where: {
                sessionId_userId: {
                    sessionId: sharedSession.id,
                    userId: session.user.id
                }
            },
            create: {
                sessionId: sharedSession.id,
                userId: session.user.id
            },
            update: {}
        })

        return NextResponse.json({ success: true, code: sharedSession.code })
    } catch (error) {
        console.error('[SHARED_SESSION_JOIN]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
