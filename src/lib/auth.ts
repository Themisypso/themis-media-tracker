import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
    // @ts-ignore
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
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
        newUser: '/dashboard',
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.image = user.image
                token.name = user.name
                token.username = (user as any).username // Passed from db
            }
            if (trigger === 'update' && session?.image) {
                token.image = session.image
            }
            if (trigger === 'update' && session?.name) {
                token.name = session.name
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
            }
            return session
        },
    },
    events: {
        async signIn({ user, account }) {
            // Update user image from Google if not set, and generate a missing username
            if (account?.provider === 'google') {
                const existingUser = await prisma.user.findUnique({ where: { id: user.id } })

                const updates: any = {}
                if (user.image && !existingUser?.image) {
                    updates.image = user.image
                }
                if (!existingUser?.username) {
                    const baseName = (user.name || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 15)
                    const randomNum = Math.floor(1000 + Math.random() * 9000)
                    updates.username = `${baseName}_${randomNum}`
                }

                if (Object.keys(updates).length > 0) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: updates,
                    }).catch(() => { })
                }
            }
        },
    },
}
