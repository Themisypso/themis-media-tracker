import { Navbar } from '@/components/Navbar'
import { BrowseBooks } from '@/components/BrowseBooks'
import { BookCollections } from '@/components/BookCollections'
import { LocalizedBookColumns } from '@/components/LocalizedBookColumns'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const metadata = {
    title: 'Books - Themis',
    description: 'Browse and discover books powered by Google Books.',
}

export default function BooksPage() {
    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />
            <div className="pt-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <BookCollections />
                <LocalizedBookColumns />
                <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="animate-spin text-accent-cyan" size={32} /></div>}>
                    <BrowseBooks />
                </Suspense>
            </div>
        </div>
    )
}
