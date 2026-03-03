import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { SettingsForm } from '@/components/SettingsForm'
import { prisma } from '@/lib/prisma'

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Force fetch or create UserSettings on initial load
    // @ts-ignore
    let settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id }
    })

    if (!settings) {
        // @ts-ignore
        settings = await prisma.userSettings.create({
            data: { userId: session.user.id }
        })
    }

    // Pass the raw user object as well for avatar and name mapping
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, image: true, email: true, username: true }
    })

    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in mt-16">
                <div className="flex items-center gap-3 mb-8">
                    <h1 className="text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-purple">
                        Profile Settings
                    </h1>
                </div>

                <p className="text-text-secondary text-sm mb-10 border-b border-border pb-6">
                    Manage your public profile presence, connections, and privacy preferences accurately across the network.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10">
                    <aside className="hidden md:block">
                        <nav className="flex flex-col gap-2">
                            <button className="text-left px-4 py-3 rounded-xl bg-bg-card border border-accent-cyan/30 text-accent-cyan font-bold text-sm flex justify-between items-center transition-all">
                                General <span>→</span>
                            </button>
                            <button className="text-left px-4 py-3 rounded-xl hover:bg-bg-hover text-text-secondary font-medium text-sm transition-all" disabled>
                                Security (Coming soon)
                            </button>
                            <button className="text-left px-4 py-3 rounded-xl hover:bg-bg-hover text-text-secondary font-medium text-sm transition-all" disabled>
                                Integrations (Coming soon)
                            </button>
                        </nav>
                    </aside>

                    <div className="space-y-8">
                        <SettingsForm initialSettings={settings} user={user} />
                    </div>
                </div>
            </div>
        </main>
    )
}
