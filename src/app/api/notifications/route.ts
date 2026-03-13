import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ notifications: [] })

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                actor: { select: { name: true, image: true, username: true } }
            }
        })
        return NextResponse.json({ notifications })
    } catch (e) {
        console.error("Notifications API Error", e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
