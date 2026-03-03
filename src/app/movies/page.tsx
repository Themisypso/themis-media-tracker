import { Navbar } from '@/components/Navbar'
import { BrowseMedia } from '@/components/BrowseMedia'

export const metadata = {
    title: 'Movies - Themis',
    description: 'Browse and discover top-rated movies.',
}

export default function MoviesPage() {
    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />
            <BrowseMedia
                type="movie"
                title="Discover Movies"
                description="Find your next favorite film. Sort by popularity, rating, or release date."
            />
        </div>
    )
}
