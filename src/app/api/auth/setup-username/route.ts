import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await req.json()

    if (!username || username.length < 3 || username.length > 20) {
        return NextResponse.json({ error: 'Invalid username length' }, { status: 400 })
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
        return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
        return NextResponse.json({ error: 'This username is already taken' }, { status: 409 })
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { username },
        select: { id: true, username: true }
    })

    return NextResponse.json({ user })
}
