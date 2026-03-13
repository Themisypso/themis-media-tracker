import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        // Generate short 6-character code
        const code = crypto.randomBytes(3).toString('hex').toUpperCase()

        const sessionObj = await prisma.sharedSession.create({
            data: {
                code,
                hostId: session.user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                participants: {
                    create: {
                        userId: session.user.id
                    }
                }
            }
        })

        return NextResponse.json({ code: sessionObj.code })
    } catch (error) {
        console.error('[SHARED_SESSION_CREATE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
