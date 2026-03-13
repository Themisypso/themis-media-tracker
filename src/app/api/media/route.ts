export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { calcTotalTime } from '@/lib/utils/media'

const mediaSchema = z.object({
    title: z.string().min(1),
    type: z.enum(['ANIME', 'MOVIE', 'TVSHOW', 'GAME', 'BOOK']),
    status: z.enum(['WATCHING', 'COMPLETED', 'PLANNED', 'DROPPED']).default('PLANNED'),
    tmdbId: z.string().optional().nullable(),
    imdbId: z.string().optional().nullable(),
    rawgId: z.string().optional().nullable(),
    bookId: z.string().optional().nullable(),
    posterUrl: z.string().optional().nullable(),
    backdropUrl: z.string().optional().nullable(),
    genres: z.array(z.string()).optional().default([]),
    releaseYear: z.number().int().optional().nullable(),
    overview: z.string().optional().nullable(),
    tmdbRating: z.number().optional().nullable(),
    runtime: z.number().int().optional().nullable(),
    episodeCount: z.number().int().optional().nullable(),
    episodeDuration: z.number().int().optional().nullable(),
    playtimeHours: z.number().optional().nullable(),
    userRating: z.number().int().min(1).max(10).optional().nullable(),
    notes: z.string().optional().nullable(),
})

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const cursor = searchParams.get('cursor') ?? undefined
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '48', 10), 100)

    const items = await prisma.mediaItem.findMany({
        where: {
            userId: session.user.id,
            ...(type ? { type: type as any } : {}),
            ...(status ? { status: status as any } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = items.length > limit
    const page = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? page[page.length - 1].id : null

    return NextResponse.json({ items: page, hasMore, nextCursor })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const data = mediaSchema.parse(body)

        // Upsert: if item already exists (same user + distinct provider ID), update its status
        let existingId: string | null = null;

        if (data.tmdbId) {
            const existing = await prisma.mediaItem.findFirst({
                where: { userId: session.user.id, tmdbId: data.tmdbId },
            })
            if (existing) existingId = existing.id;
        } else if (data.rawgId) {
            const existing = await prisma.mediaItem.findFirst({
                where: { userId: session.user.id, rawgId: data.rawgId },
            })
            if (existing) existingId = existing.id;
        } else if (data.bookId) {
            const existing = await prisma.mediaItem.findFirst({
                where: { userId: session.user.id, bookId: data.bookId },
            })
            if (existing) existingId = existing.id;
        }

        if (existingId) {
            const updated = await prisma.mediaItem.update({
                where: { id: existingId },
                data: { status: data.status },
            })

            // Log Activity
            prisma.activity.create({
                data: {
                    userId: session.user.id,
                    type: 'STATUS_CHANGE',
                    mediaId: updated.id,
                    content: data.status,
                }
            }).catch(e => console.error('[ACTIVITY ERROR]', e))

            return NextResponse.json({ item: updated }, { status: 200 })
        }

        let finalData = { ...data }

        // Auto-fetch TMDB details if missing (e.g. when added directly from Explore feed)
        if (finalData.tmdbId && (!finalData.runtime || (finalData.type !== 'MOVIE' && !finalData.episodeCount))) {
            try {
                const tmdbType = finalData.type === 'MOVIE' ? 'movie' : 'tv'
                const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${finalData.tmdbId}?api_key=${process.env.TMDB_API_KEY}`)
                if (res.ok) {
                    const details = await res.json()
                    finalData.runtime = finalData.runtime || details.runtime || details.episode_run_time?.[0] || null
                    if (finalData.type !== 'MOVIE') {
                        finalData.episodeCount = finalData.episodeCount || details.number_of_episodes || null
                    }
                }
            } catch (err) {
                console.error('[TMDB Auto-Fetch Error]', err)
            }
        }

        const totalTimeMinutes = calcTotalTime(finalData)

        const item = await prisma.mediaItem.create({
            data: {
                ...finalData,
                userId: session.user.id,
                totalTimeMinutes,
                genres: finalData.genres ?? [],
                rawgId: finalData.rawgId ?? null,
                bookId: finalData.bookId ?? null,
            },
        })

        // Log Activity
        prisma.activity.create({
            data: {
                userId: session.user.id,
                type: 'ADDED_MEDIA',
                mediaId: item.id,
                content: item.status,
            }
        }).catch(e => console.error('[ACTIVITY ERROR]', e))

        // Invalidate homepage cache so new items appear immediately
        revalidateTag('landing-data')

        return NextResponse.json({ item }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('[MEDIA CREATE ERROR]', error)
        return NextResponse.json({ error: 'Failed to create media item' }, { status: 500 })
    }
}
