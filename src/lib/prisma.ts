import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

function createPrismaClient() {
    const url = process.env.DATABASE_URL ?? ''
    // Append connect_timeout if not already present (helps with Supabase cold starts)
    const urlWithTimeout = url.includes('connect_timeout')
        ? url
        : url + (url.includes('?') ? '&' : '?') + 'connect_timeout=30'

    return new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
            db: { url: urlWithTimeout },
        },
    })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Always keep a single instance in development to prevent HMR from creating new clients
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
