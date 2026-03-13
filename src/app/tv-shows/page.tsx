import { Navbar } from '@/components/Navbar'
import { BrowseMedia } from '@/components/BrowseMedia'

export const metadata = {
    title: 'TV Shows - Themis',
    description: 'Browse and discover top-rated TV shows.',
}

export default function TvShowsPage() {
    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />
            <BrowseMedia
                type="tv"
                title="Discover TV Shows"
                description="Find your next binge-watch. Sort by popularity, rating, or release date."
                baseFilters={{
                    withoutKeywords: '210024|287501' // Exclude Anime and Japanese Anime keywords
                }}
            />
        </div>
    )
}
