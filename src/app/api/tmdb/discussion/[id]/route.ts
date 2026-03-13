import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const tmdbId = params.id

        // Find the discussion thread for this TMDB ID
        const thread = await prisma.discussionThread.findFirst({
            where: { tmdbId },
            include: {
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true
                            }
                        }
                    }
                }
            }
        })

        if (!thread) {
            return NextResponse.json({ comments: [] })
        }

        return NextResponse.json(thread)
    } catch (error) {
        console.error('[DISCUSSION_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
