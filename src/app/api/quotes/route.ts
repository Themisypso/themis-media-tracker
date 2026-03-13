import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { tmdbId, type, title, posterUrl, backdropUrl, releaseYear, content, reference, mediaUrl, attachmentType } = body

        if (!content || !tmdbId || !type || !title) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const upperType = type.toUpperCase()
        const mappedType = upperType === 'TV' ? 'TVSHOW' : upperType
        const mappedStatus = 'PLANNED'

        // Ensure MediaItem exists for this user
        let mediaItem = await prisma.mediaItem.findUnique({
            where: { userId_tmdbId: { userId: session.user.id, tmdbId: String(tmdbId) } }
        })

        if (!mediaItem) {
            mediaItem = await prisma.mediaItem.create({
                data: {
                    userId: session.user.id,
                    tmdbId: String(tmdbId),
                    type: mappedType,
                    status: mappedStatus,
                    title,
                    posterUrl,
                    backdropUrl,
                    releaseYear: releaseYear ? parseInt(releaseYear) : null
                }
            })
        }

        // Create the Quote
        const quote = await prisma.quote.create({
            data: {
                userId: session.user.id,
                mediaId: mediaItem.id,
                content,
                reference: reference || null,
                mediaUrl: mediaUrl || null,
                attachmentType: attachmentType || 'NONE'
            }
        })

        // Create Activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type: 'QUOTE',
                mediaId: mediaItem.id,
                referenceId: quote.id,
                content: content.substring(0, 100)
            }
        })

        return NextResponse.json(quote)
    } catch (error) {
        console.error('[POST_QUOTES]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
