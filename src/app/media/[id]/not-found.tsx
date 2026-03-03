import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Film, ArrowLeft } from 'lucide-react'

export default function MediaNotFound() {
    return (
        <div className="min-h-screen cyber-bg">
            <Navbar />
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
                    <Film size={36} className="text-accent-cyan" />
                </div>
                <h1 className="text-4xl font-display font-bold text-text-primary mb-3">Media Not Found</h1>
                <p className="text-text-secondary max-w-sm mb-8">
                    This media item doesn&apos;t exist or may have been removed from the library.
                </p>
                <div className="flex gap-3">
                    <Link href="/explore" className="btn-primary flex items-center gap-2">
                        <ArrowLeft size={16} /> Browse Explore
                    </Link>
                    <Link href="/" className="btn-cyber">Home</Link>
                </div>
            </div>
        </div>
    )
}
