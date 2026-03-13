export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('openid.mode')

    // Find the base URL dynamically based on environment configuration or request headers
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const absoluteUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`
    const callbackUrl = `${absoluteUrl}/api/settings/steam`
    const realm = absoluteUrl

    if (!mode) {
        // Initiate Steam OpenID flow for connecting an existing account
        const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login')
        steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0')
        steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup')
        steamOpenIdUrl.searchParams.set('openid.return_to', callbackUrl)
        steamOpenIdUrl.searchParams.set('openid.realm', realm)
        steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select')
        steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select')

        return NextResponse.redirect(steamOpenIdUrl.toString())
    }

    if (mode === 'id_res') {
        // Validation phase: verifying Steam response Signature
        const verifyParams = new URLSearchParams()
        verifyParams.set('openid.ns', 'http://specs.openid.net/auth/2.0')
        verifyParams.set('openid.mode', 'check_authentication')

        // Steam specific requirements: parameters must be forwarded exactly as they were returned
        for (const [key, value] of Array.from(searchParams.entries())) {
            verifyParams.set(key, value)
        }
        verifyParams.set('openid.mode', 'check_authentication')

        console.log('[STEAM VERIFY PARAMS]', verifyParams.toString())

        try {
            const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: verifyParams.toString()
            })

            const verifyText = await verifyRes.text()
            console.log('[STEAM VERIFY RESPONSE]', verifyText)

            // If steam signature matches
            if (verifyText.includes('is_valid:true')) {
                const claimedId = searchParams.get('openid.claimed_id') || ''
                const match = claimedId.match(/steamcommunity\.com\/openid\/id\/(\d+)/)
                if (match && match[1]) {
                    const steamId = match[1]

                    // Link the Steam ID to the CURRENT User
                    await prisma.user.update({
                        where: { id: session.user.id },
                        data: { steamId } as any
                    })

                    return NextResponse.redirect(new URL('/settings?steam_connected=true', req.url))
                }
            }
        } catch (e) {
            console.error('[STEAM OPENID VERIFICATION ERROR]', e)
        }
    }

    return NextResponse.redirect(new URL('/settings?error=steam_failed', req.url))
}
