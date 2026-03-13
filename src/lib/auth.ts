import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import SteamProvider from 'next-auth-steam'
import { NextRequest } from 'next/server'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            role: string
            steamId?: string
            username?: string
            needsUsername?: boolean
        } & DefaultSession['user']
    }
    interface User {
        role?: string
        username?: string
        steamId?: string
    }
}

export const authOptions: NextAuthOptions = {
    debug: true,
    // @ts-ignore
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        }),
        SteamProvider({
            // Note: url is required here but will be overridden by the dynamic injection in route.ts
            url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        } as any, {
            clientSecret: process.env.STEAM_API_KEY ?? '',
            callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/steam`,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials')
                }
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    select: { id: true, email: true, password: true, name: true, username: true, image: true, role: true }
                })
                if (!user || !user.password) {
                    throw new Error('No user found with this email')
                }
                const isValid = await bcrypt.compare(credentials.password, user.password)
                if (!isValid) {
                    throw new Error('Invalid password')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    image: user.image,
                    role: user.role
                } as any
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/auth/login',
        error: '/auth/error',
        newUser: '/auth/setup-username',
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            console.log('[AUTH] redirect callback', { url, baseUrl })
            if (url.startsWith('/')) return `${baseUrl}${url}`
            if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
        async signIn({ user, account, profile }: any) {
            console.log('[AUTH] signIn callback', { provider: account?.provider, userId: user?.id })
            // Determine Steam ID if logging in with Steam
            if (account?.provider === 'steam') {
                // Extract Steam ID from OpenID identity
                const steamId = profile?.steamid || user.id
                if (steamId && user.id) {
                    // We must ensure the user model is updated with this steamId
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { steamId } as any,
                    }).catch(() => { })
                }
            }
            return true
        },
        async jwt({ token, user, trigger, session, account }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.image = user.image
                token.name = user.name
                token.username = (user as any).username
                // Mark if this is a new Google user with no username
                token.needsUsername = !(user as any).username
            }
            if (trigger === 'update' && session?.image) {
                token.image = session.image
            }
            if (trigger === 'update' && session?.name) {
                token.name = session.name
            }
            if (trigger === 'update' && session?.username !== undefined) {
                token.username = session.username
                token.needsUsername = false
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.image = token.image as string | undefined
                session.user.name = token.name as string | undefined
                    ; (session.user as any).username = token.username as string | undefined
                    ; (session.user as any).needsUsername = token.needsUsername as boolean | undefined
            }
            return session
        },
    },
    events: {
        async signIn({ user, account }) {
            if (account?.provider === 'google' && user.image) {
                const existingUser = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } })
                if (!existingUser?.image) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { image: user.image },
                    }).catch(() => { })
                }
            }
        },
    },
}
