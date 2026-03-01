export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const items = await prisma.mediaItem.findMany({
        where: { userId: session.user.id },
        select: {
            type: true,
            status: true,
            totalTimeMinutes: true,
            userRating: true,
            createdAt: true,
        },
    })

    // Totals by type
    const typeStats: Record<string, { count: number; totalMinutes: number }> = {
        ANIME: { count: 0, totalMinutes: 0 },
        MOVIE: { count: 0, totalMinutes: 0 },
        TVSHOW: { count: 0, totalMinutes: 0 },
        GAME: { count: 0, totalMinutes: 0 },
    }

    const statusStats: Record<string, number> = {
        WATCHING: 0, COMPLETED: 0, PLANNED: 0, DROPPED: 0
    }

    const yearlyStats: Record<string, number> = {}

    for (const item of items) {
        typeStats[item.type].count++
        typeStats[item.type].totalMinutes += item.totalTimeMinutes ?? 0
        statusStats[item.status]++
        const year = String(new Date(item.createdAt).getFullYear())
        yearlyStats[year] = (yearlyStats[year] ?? 0) + (item.totalTimeMinutes ?? 0)
    }

    const totalMinutes = Object.values(typeStats).reduce((a, b) => a + b.totalMinutes, 0)
    const gameMinutes = typeStats.GAME.totalMinutes
    const watchMinutes = totalMinutes - gameMinutes

    return NextResponse.json({
        overview: {
            totalItems: items.length,
            totalWatchMinutes: watchMinutes,
            totalPlayMinutes: gameMinutes,
            totalMinutes,
            totalWatchHours: Math.round(watchMinutes / 60 * 10) / 10,
            totalPlayHours: Math.round(gameMinutes / 60 * 10) / 10,
            totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        },
        typeStats,
        statusStats,
        yearlyStats,
    })
}
