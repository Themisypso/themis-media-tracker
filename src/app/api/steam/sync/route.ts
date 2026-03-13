export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { steamId: true } })
        if (!user?.steamId) return NextResponse.json({ error: 'Steam account not connected' }, { status: 400 })

        const key = process.env.STEAM_API_KEY
        if (!key) return NextResponse.json({ error: 'Server missing STEAM_API_KEY' }, { status: 500 })

        const res = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${user.steamId}&format=json&include_appinfo=1`)
        if (!res.ok) {
            return NextResponse.json({ error: `Steam API Error: ${res.statusText}` }, { status: 502 })
        }

        const data = await res.json()

        if (!data.response || !data.response.games) {
            return NextResponse.json({ error: 'Could not fetch games. Your Game Details privacy setting might be Private on Steam.' }, { status: 400 })
        }

        const ownedGames = data.response.games // array of { appid, name, playtime_forever, img_icon_url, ... }

        // Fetch user's existing games from DB
        const existingGames = await prisma.mediaItem.findMany({
            where: { userId: session.user.id, type: 'GAME' }
        })

        let updatedCount = 0

        for (const sg of ownedGames) {
            if (sg.playtime_forever <= 0) continue // skip games never played

            const steamPlaytimeMinutes = sg.playtime_forever
            const appidStr = String(sg.appid)

            // Try to match by steamAppId OR exact title
            let match = existingGames.find(g => g.steamAppId === appidStr || g.title.toLowerCase() === sg.name.toLowerCase())

            if (match) {
                // Update existing record
                const newEffective = Math.max((match.playtimeHours ?? 0) * 60, steamPlaytimeMinutes)

                await prisma.mediaItem.update({
                    where: { id: match.id },
                    data: {
                        steamAppId: appidStr,
                        steamPlaytimeMinutes,
                        totalTimeMinutes: Math.round(newEffective),
                    }
                })
                updatedCount++
            } else {
                // Create a new entry if they played it for more than 1 hour (avoids cluttering library with 5min tries)
                if (steamPlaytimeMinutes >= 60) {
                    const status = steamPlaytimeMinutes > 600 ? 'COMPLETED' : 'WATCHING' // >10 hours = default COMPLETED for simplicity

                    // Note: Instead of storing progressPercent for Steam, we just let it track total time.
                    await prisma.mediaItem.create({
                        data: {
                            userId: session.user.id,
                            title: sg.name,
                            type: 'GAME',
                            status,
                            steamAppId: appidStr,
                            steamPlaytimeMinutes,
                            totalTimeMinutes: steamPlaytimeMinutes, // since there's no manual time yet
                            posterUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${sg.appid}/header.jpg`
                        }
                    })
                    updatedCount++
                }
            }
        }

        return NextResponse.json({ success: true, updatedCount }, { status: 200 })
    } catch (e: any) {
        console.error('[STEAM SYNC]', e)
        return NextResponse.json({ error: e.message || 'Internal sync error' }, { status: 500 })
    }
}
