import { Navbar } from '@/components/Navbar'
import { FeedView } from './FeedView'
import { ActivitySquare } from 'lucide-react'

export default function FeedPage() {
    return (
        <main className="min-h-screen cyber-bg">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <ActivitySquare className="text-accent-cyan" size={32} />
                    <h1 className="text-3xl font-display font-bold text-text-primary">Activity Stream</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        <FeedView />
                    </div>
                </div>
            </div>
        </main>
    )
}
