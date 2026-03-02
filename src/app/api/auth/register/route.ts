export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
    name: z.string().min(2, 'Name too short').max(50),
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, username, email, password } = registerSchema.parse(body)

        const existingEmail = await prisma.user.findUnique({ where: { email } })
        if (existingEmail) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
        }

        const existingUsername = await prisma.user.findUnique({ where: { username } })
        if (existingUsername) {
            return NextResponse.json({ error: 'This username is already taken' }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const user = await prisma.user.create({
            data: { name, username, email, password: hashedPassword },
            select: { id: true, username: true, name: true, email: true, createdAt: true },
        })

        return NextResponse.json({ user, message: 'Account created successfully' }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('[REGISTER ERROR]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
