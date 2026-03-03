import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - list user's favorite media IDs string[]
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const favorites = await prisma.favoriteMedia.findMany({
        where: { userId: session.user.id },
        select: { tmdbId: true },
        orderBy: { createdAt: 'desc' },
    })

    // Return array of tmdbIds directly
    return NextResponse.json(favorites.map(f => f.tmdbId))
}

// POST - add a favorite media
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await req.json()
        const { tmdbId, title, type, posterUrl, releaseYear } = body

        if (!tmdbId || !title || !type) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const favorite = await prisma.favoriteMedia.upsert({
            where: { userId_tmdbId: { userId: session.user.id, tmdbId: String(tmdbId) } },
            create: {
                userId: session.user.id,
                tmdbId: String(tmdbId),
                title,
                type,
                posterUrl: posterUrl || null,
                releaseYear: releaseYear || null
            },
            update: {}, // do nothing if it already exists
        })
        return NextResponse.json(favorite)
    } catch (error) {
        console.error('[FAVORITE_MEDIA_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// DELETE - remove a favorite media
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const tmdbId = searchParams.get('tmdbId')

    if (!tmdbId) return new NextResponse('Missing tmdbId', { status: 400 })

    try {
        await prisma.favoriteMedia.deleteMany({
            where: { userId: session.user.id, tmdbId: String(tmdbId) },
        })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[FAVORITE_MEDIA_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
