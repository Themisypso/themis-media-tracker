export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

const updateSchema = z.object({
    status: z.enum(['WATCHING', 'COMPLETED', 'PLANNED', 'DROPPED']).optional(),
    userRating: z.number().int().min(1).max(10).optional().nullable(),
    notes: z.string().optional().nullable(),
    episodeCount: z.number().int().optional().nullable(),
    episodeDuration: z.number().int().optional().nullable(),
    playtimeHours: z.number().optional().nullable(),
    runtime: z.number().int().optional().nullable(),
})

function calcTotalTime(item: any): number | null {
    if (item.type === 'GAME') return item.playtimeHours ? Math.round(item.playtimeHours * 60) : null
    if (item.type === 'ANIME' || item.type === 'TVSHOW') {
        const eps = item.episodeCount ?? 0
        const dur = item.episodeDuration ?? item.runtime ?? 24
        return eps > 0 ? eps * dur : null
    }
    if (item.type === 'MOVIE') return item.runtime ?? null
    return null
}

async function getOwnedItem(userId: string, id: string) {
    const item = await prisma.mediaItem.findUnique({ where: { id } })
    if (!item || item.userId !== userId) return null
    return item
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const item = await getOwnedItem(session.user.id, params.id)
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await getOwnedItem(session.user.id, params.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    try {
        const body = await req.json()
        const updates = updateSchema.parse(body)

        const merged = { ...existing, ...updates }
        const totalTimeMinutes = calcTotalTime(merged)

        const updated = await prisma.mediaItem.update({
            where: { id: params.id },
            data: { ...updates, totalTimeMinutes },
        })

        revalidateTag('landing-data')
        return NextResponse.json({ item: updated })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await getOwnedItem(session.user.id, params.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.mediaItem.delete({ where: { id: params.id } })
    revalidateTag('landing-data')
    return NextResponse.json({ success: true })
}
