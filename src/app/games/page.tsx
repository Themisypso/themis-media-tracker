import { Navbar } from '@/components/Navbar'
import { BrowseGames } from '@/components/BrowseGames'

export const metadata = {
    title: 'Games - Themis',
    description: 'Browse and discover top-rated games powered by RAWG.',
}

export default function GamesPage() {
    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <Navbar />
            <div className="pt-20">
                <BrowseGames />
            </div>
        </div>
    )
}
