import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/discussions — list trending/recent discussion threads
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const sort = searchParams.get('sort') || 'trending'
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
        const cursor = searchParams.get('cursor') || undefined

        let orderBy: any = { createdAt: 'desc' }
        if (sort === 'trending') {
            orderBy = { comments: { _count: 'desc' } }
        }

        const threads = await prisma.discussionThread.findMany({
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy,
            include: {
                author: {
                    select: { id: true, name: true, username: true, image: true }
                },
                _count: { select: { comments: true } },
                comments: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                }
            }
        })

        const hasMore = threads.length > limit
        const data = hasMore ? threads.slice(0, limit) : threads
        const nextCursor = hasMore ? data[data.length - 1]?.id : null

        return NextResponse.json({ threads: data, nextCursor })
    } catch (error) {
        console.error('[DISCUSSIONS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// POST /api/discussions — create a new standalone discussion thread
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { title, tmdbId, mediaTitle, mediaPosterUrl, mediaType } = body

        if (!title?.trim()) {
            return new NextResponse('Title is required', { status: 400 })
        }

        const thread = await prisma.discussionThread.create({
            data: {
                title: title.trim(),
                userId: session.user.id,
                tmdbId: tmdbId || null,
                mediaTitle: mediaTitle || null,
                mediaPosterUrl: mediaPosterUrl || null,
                mediaType: mediaType || null
            },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { comments: true } }
            }
        })

        return NextResponse.json(thread)
    } catch (error) {
        console.error('[DISCUSSIONS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
