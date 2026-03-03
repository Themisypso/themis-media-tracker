import { Navbar } from '@/components/Navbar'
import { BrowseMedia } from '@/components/BrowseMedia'

export const metadata = {
    title: 'Anime - Themis',
    description: 'Browse and discover top-rated Anime.',
}

export default function AnimePage() {
    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />
            <BrowseMedia
                type="tv"
                title="Discover Anime"
                description="Find your next favorite anime series. Sort by popularity, rating, or release date."
                baseFilters={{
                    genres: '16', // Animation
                    withOriginCountry: 'JP', // Japan Origin
                    withKeywords: '210024|287501', // Anime keywords
                }}
            />
        </div>
    )
}
