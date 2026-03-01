export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const mediaSchema = z.object({
    title: z.string().min(1),
    type: z.enum(['ANIME', 'MOVIE', 'TVSHOW', 'GAME']),
    status: z.enum(['WATCHING', 'COMPLETED', 'PLANNED', 'DROPPED']).default('PLANNED'),
    tmdbId: z.string().optional().nullable(),
    imdbId: z.string().optional().nullable(),
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

function calcTotalTime(item: z.infer<typeof mediaSchema>): number | null {
    if (item.type === 'GAME') {
        return item.playtimeHours ? Math.round(item.playtimeHours * 60) : null
    }
    if (item.type === 'ANIME' || item.type === 'TVSHOW') {
        const eps = item.episodeCount ?? 0
        const dur = item.episodeDuration ?? item.runtime ?? 24
        return eps > 0 ? eps * dur : null
    }
    if (item.type === 'MOVIE') {
        return item.runtime ?? null
    }
    return null
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const items = await prisma.mediaItem.findMany({
        where: {
            userId: session.user.id,
            ...(type ? { type: type as any } : {}),
            ...(status ? { status: status as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const data = mediaSchema.parse(body)

        // Check duplicate
        if (data.tmdbId) {
            const existing = await prisma.mediaItem.findUnique({
                where: { userId_tmdbId: { userId: session.user.id, tmdbId: data.tmdbId } },
            })
            if (existing) {
                return NextResponse.json({ error: 'This title is already in your library' }, { status: 409 })
            }
        }

        const totalTimeMinutes = calcTotalTime(data)

        const item = await prisma.mediaItem.create({
            data: {
                ...data,
                userId: session.user.id,
                totalTimeMinutes,
                genres: data.genres ?? [],
            },
        })

        return NextResponse.json({ item }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('[MEDIA CREATE ERROR]', error)
        return NextResponse.json({ error: 'Failed to create media item' }, { status: 500 })
    }
}
