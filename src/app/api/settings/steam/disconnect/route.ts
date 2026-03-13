import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Unlink the Steam ID from the user's account
        await prisma.user.update({
            where: { id: session.user.id },
            data: { steamId: null } as any
        })

        return NextResponse.json({ success: true, message: 'Steam account disconnected' })
    } catch (error: any) {
        console.error('[STEAM_DISCONNECT]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
