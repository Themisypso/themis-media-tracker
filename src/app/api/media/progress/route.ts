import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { buildProgressActivityContent, buildCompletionActivityContent } from '@/lib/utils/activity'

// ─── Per-type discriminated schemas ──────────────────────────────────────────

const MovieProgressSchema = z.object({
    mediaId: z.string().min(1),
    type: z.literal('MOVIE'),
    progressMinutes: z.number().int().min(0),
})

const TvProgressSchema = z.object({
    mediaId: z.string().min(1),
    type: z.enum(['TVSHOW', 'ANIME']),
    currentEpisode: z.number().int().min(0),
    progressMinutes: z.number().int().min(0).optional(), // within current episode (optional)
})

const BookProgressSchema = z.object({
    mediaId: z.string().min(1),
    type: z.literal('BOOK'),
    currentPage: z.number().int().min(0),
})

const GameProgressSchema = z.object({
    mediaId: z.string().min(1),
    type: z.literal('GAME'),
    playtimeHours: z.number().min(0),
})

const ProgressSchema = z.discriminatedUnion('type', [
    MovieProgressSchema,
    TvProgressSchema,
    BookProgressSchema,
    GameProgressSchema,
])

// ─── PATCH /api/media/progress ────────────────────────────────────────────────

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = ProgressSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
            { status: 400 }
        )
    }

    const data = parsed.data

    // Ownership check + current state
    const existing = await prisma.mediaItem.findUnique({
        where: { id: data.mediaId },
        select: {
            id: true, userId: true, title: true, type: true, status: true,
            runtime: true, episodeCount: true, pageCount: true, totalTimeMinutes: true, playtimeHours: true,
        },
    })

    if (!existing || existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ─── Map each type to a raw progress value + validate upper bound ─────────
    let progressValue: number
    let activityTotal: number | null = null

    switch (data.type) {
        case 'MOVIE': {
            if (existing.runtime && data.progressMinutes > existing.runtime) {
                return NextResponse.json(
                    { error: `Progress (${data.progressMinutes} min) exceeds runtime (${existing.runtime} min)` },
                    { status: 400 }
                )
            }
            progressValue = data.progressMinutes
            activityTotal = existing.runtime ?? null
            break
        }

        case 'TVSHOW':
        case 'ANIME': {
            if (existing.episodeCount && data.currentEpisode > existing.episodeCount) {
                return NextResponse.json(
                    { error: `Episode ${data.currentEpisode} exceeds total episodes (${existing.episodeCount})` },
                    { status: 400 }
                )
            }
            progressValue = data.currentEpisode
            activityTotal = existing.episodeCount ?? null
            break
        }

        case 'BOOK': {
            if (existing.pageCount && data.currentPage > existing.pageCount) {
                return NextResponse.json(
                    { error: `Page ${data.currentPage} exceeds total pages (${existing.pageCount})` },
                    { status: 400 }
                )
            }
            progressValue = data.currentPage
            activityTotal = existing.pageCount ?? null
            break
        }

        case 'GAME': {
            progressValue = data.playtimeHours
            break
        }
    }

    // ─── Determine new status ─────────────────────────────────────────────────
    const isComplete = (() => {
        switch (data.type) {
            case 'MOVIE': return existing.runtime != null && progressValue >= existing.runtime
            case 'TVSHOW':
            case 'ANIME': return existing.episodeCount != null && progressValue >= existing.episodeCount
            case 'BOOK': return existing.pageCount != null && progressValue >= existing.pageCount
            case 'GAME': return false
            default: return false
        }
    })()

    const newStatus =
        isComplete ? 'COMPLETED'
            : progressValue > 0 && existing.status === 'PLANNED' ? 'WATCHING'
                : existing.status

    // ─── DB update ────────────────────────────────────────────────────────────
    const updateData: any = {
        lastProgressAt: new Date(),
        ...(newStatus !== existing.status ? { status: newStatus as any } : {}),
    }

    if (data.type === 'GAME') {
        const effectiveMin = Math.max(progressValue * 60, existing.totalTimeMinutes ?? 0)
        updateData.playtimeHours = progressValue
        updateData.totalTimeMinutes = Math.round(effectiveMin)
    } else {
        updateData.progress = progressValue
    }

    let updated
    try {
        updated = await prisma.mediaItem.update({
            where: { id: data.mediaId },
            data: updateData,
        })
    } catch (e) {
        console.error('[Progress Update Error]', e)
        return NextResponse.json({ error: 'Failed to save progress in database.' }, { status: 500 })
    }

    // ─── Activity log ─────────────────────────────────────────────────────────
    const userName = session.user.name ?? 'Someone'
    const activityContent = isComplete
        ? buildCompletionActivityContent(userName, existing.title, existing.type)
        : buildProgressActivityContent({
            userName,
            title: existing.title,
            type: existing.type,
            progress: progressValue,
            total: activityTotal,
        })

    // Fire-and-forget — don't let activity failure break the response
    prisma.activity.create({
        data: {
            userId: session.user.id,
            mediaId: existing.id,
            type: 'PROGRESS_UPDATE',
            content: activityContent,
        },
    }).catch(console.error)

    return NextResponse.json({
        item: updated,
        statusChanged: newStatus !== existing.status,
        newStatus,
        activityContent,
    })
}
