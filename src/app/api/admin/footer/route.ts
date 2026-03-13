import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminRole } from '@/lib/utils/media'

export async function GET() {
    try {
        const links = await prisma.footerConfig.findMany({
            orderBy: [{ section: 'asc' }, { order: 'asc' }]
        })
        return NextResponse.json(links)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const items = body.items || []

        await prisma.$transaction(async (tx) => {
            await tx.footerConfig.deleteMany({})

            if (items.length > 0) {
                const creates = items.map((item: any, idx: number) => ({
                    section: item.section,
                    label: item.label,
                    url: item.url,
                    order: idx
                }))
                await tx.footerConfig.createMany({ data: creates })
            }
        })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
