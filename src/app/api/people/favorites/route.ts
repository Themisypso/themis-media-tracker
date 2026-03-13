import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - list user's favorite people
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const favorites = await prisma.favoritePerson.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(favorites)
}

// POST - add a favorite person
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const body = await req.json()
    const { tmdbPersonId, name, profileUrl, knownForDepartment } = body

    if (!tmdbPersonId || !name) {
        return new NextResponse('Missing required fields', { status: 400 })
    }

    try {
        const favorite = await prisma.favoritePerson.upsert({
            where: { userId_tmdbPersonId: { userId: session.user.id, tmdbPersonId: Number(tmdbPersonId) } },
            create: { userId: session.user.id, tmdbPersonId: Number(tmdbPersonId), name, profileUrl: profileUrl || null, knownForDepartment: knownForDepartment || null },
            update: {},
        })

        // Log activity
        prisma.activity.create({
            data: {
                userId: session.user.id,
                type: 'FAVORITED_PERSON',
                referenceId: String(tmdbPersonId),
                content: `Added ${name} to favorites`,
            }
        }).catch(e => console.error('[ACTIVITY ERROR]', e))

        return NextResponse.json(favorite)
    } catch (error) {
        console.error('[FAVORITE_PERSON_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// DELETE - remove a favorite person
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const tmdbPersonId = searchParams.get('tmdbPersonId')
    if (!tmdbPersonId) return new NextResponse('Missing tmdbPersonId', { status: 400 })

    try {
        await prisma.favoritePerson.deleteMany({
            where: { userId: session.user.id, tmdbPersonId: Number(tmdbPersonId) },
        })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[FAVORITE_PERSON_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
