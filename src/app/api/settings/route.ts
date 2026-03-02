import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    isPublic: z.boolean().optional(),
    hideRatings: z.boolean().optional(),
    hideActivity: z.boolean().optional(),
    language: z.string().optional(),
    theme: z.enum(['LIGHT', 'DARK', 'CYBERPUNK', 'RETROWAVE']).optional(),
})

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // @ts-ignore
        let settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        if (!settings) {
            // @ts-ignore
            settings = await prisma.userSettings.create({
                data: {
                    userId: session.user.id
                }
            })
        }

        return NextResponse.json({ settings })
    } catch (e: any) {
        console.error('[SETTINGS GET]', e)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, ...settingsData } = settingsSchema.parse(body)

        // Run both updates in a transaction
        const [updatedSettings] = await prisma.$transaction([
            // @ts-ignore
            prisma.userSettings.upsert({
                where: { userId: session.user.id },
                update: settingsData,
                create: { ...settingsData, userId: session.user.id }
            }),
            ...(name ? [prisma.user.update({
                where: { id: session.user.id },
                data: { name }
            })] : [])
        ])

        return NextResponse.json({ settings: updatedSettings })
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
        }
        console.error('[SETTINGS PATCH]', e)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
