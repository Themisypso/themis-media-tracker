import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get user's lists
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId') || session.user.id

        // If fetching someone else's lists, ensure they are public
        const isSelf = userId === session.user.id

        const lists = await prisma.list.findMany({
            where: {
                userId,
                ...(isSelf ? {} : { isPublic: true })
            },
            include: {
                _count: { select: { items: true } },
                items: {
                    take: 3, // preview items
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(lists)
    } catch (error) {
        console.error('[LISTS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// Create a new list
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await req.json()
        const { title, description, isPublic } = body

        if (!title) return new NextResponse('Title is required', { status: 400 })

        const list = await prisma.list.create({
            data: {
                title,
                description,
                isPublic: isPublic ?? true,
                userId: session.user.id
            }
        })

        return NextResponse.json(list)
    } catch (error) {
        console.error('[LISTS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
