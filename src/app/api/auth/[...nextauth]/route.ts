export const dynamic = 'force-dynamic'
import NextAuth, { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import SteamProvider from 'next-auth-steam'
import { prisma } from '@/lib/prisma'

async function handler(
    req: NextRequest,
    ctx: { params: { nextauth: string[] } }
) {
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Get current session to see if we are linking an account
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id

    const customOptions = {
        ...authOptions,
        providers: [
            ...authOptions.providers.filter((p: any) => p.id !== 'steam'),
            SteamProvider(req, {
                clientSecret: process.env.STEAM_API_KEY ?? '',
                callbackUrl: `${baseUrl}/api/auth/callback/steam`,
            })
        ],
        callbacks: {
            ...authOptions.callbacks,
            async signIn({ user, account, profile }: any) {
                // If we have a current session and this is a steam login, LINK it
                if (account?.provider === 'steam' && currentUserId) {
                    const steamId = profile?.steamid || user.id
                    if (steamId) {
                        try {
                            await prisma.user.update({
                                where: { id: currentUserId },
                                data: { steamId } as any,
                            })
                            console.log(`[AUTH] Successfully linked Steam ID ${steamId} to User ${currentUserId}`)
                            return true
                        } catch (error) {
                            console.error('[AUTH] Error linking Steam account:', error)
                            return false
                        }
                    }
                }

                // Fallback to standard check for login (requires email etc)
                // If Steam doesn't provide email and we are NOT linking, this might still fail 
                // but linking should work now.
                return true
            }
        }
    }

    console.log('[AUTH] Custom Options configured with Session Linking:', !!currentUserId)

    // @ts-ignore
    return NextAuth(req, ctx, customOptions)
}

export { handler as GET, handler as POST }
