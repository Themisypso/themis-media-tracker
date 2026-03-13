import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { FriendsDashboard } from './FriendsDashboard'

export default async function FriendsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/login')

    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-12 mt-16 animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <h1 className="text-3xl font-display font-bold text-text-primary">Friends</h1>
                </div>

                <FriendsDashboard />
            </div>
        </main>
    )
}
