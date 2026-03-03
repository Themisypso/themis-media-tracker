import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')

    if (!username || username.length < 3) {
        return NextResponse.json({ available: false, error: 'Username too short' })
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
        return NextResponse.json({ available: false, error: 'Invalid characters' })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    return NextResponse.json({ available: !existing })
}
