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
            genres: true,
        },
    })

    const topGames = await prisma.mediaItem.findMany({
        where: { userId: session.user.id, type: 'GAME' },
        orderBy: { totalTimeMinutes: 'desc' },
        take: 5,
        select: { id: true, title: true, totalTimeMinutes: true, posterUrl: true },
    })

    const favoritePeople = await prisma.favoritePerson.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, profileUrl: true, knownForDepartment: true }
    })

    // Totals by type
    const typeStats: Record<string, { count: number; totalMinutes: number }> = {
        ANIME: { count: 0, totalMinutes: 0 },
        MOVIE: { count: 0, totalMinutes: 0 },
        TVSHOW: { count: 0, totalMinutes: 0 },
        GAME: { count: 0, totalMinutes: 0 },
        BOOK: { count: 0, totalMinutes: 0 },
    }

    const statusStats: Record<string, number> = {
        WATCHING: 0, COMPLETED: 0, PLANNED: 0, DROPPED: 0
    }

    const yearlyStats: Record<string, number> = {}
    const genreCounts: Record<string, number> = {}

    for (const item of items) {
        typeStats[item.type].count++
        typeStats[item.type].totalMinutes += item.totalTimeMinutes ?? 0
        statusStats[item.status]++
        const year = String(new Date(item.createdAt).getFullYear())
        yearlyStats[year] = (yearlyStats[year] ?? 0) + (item.totalTimeMinutes ?? 0)

        // Aggregating genres
        if (item.genres && Array.isArray(item.genres)) {
            for (const genre of item.genres) {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1
            }
        }
    }

    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))

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
        topGenres,
        favoritePeople,
        topGames: topGames.filter(g => (g.totalTimeMinutes ?? 0) > 0),
    })
}
