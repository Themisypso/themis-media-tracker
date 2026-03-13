import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export async function Footer() {
    // Fetch footer links from DB and sort them
    let footerLinks: any[] = []

    try {
        footerLinks = await prisma.footerConfig.findMany({
            orderBy: [
                { section: 'asc' },
                { order: 'asc' }
            ]
        })
    } catch (error) {
        console.error("Failed to fetch footer links", error)
    }

    // Default static links if DB is empty
    const defaultSections = {
        Product: [
            { label: 'Explore', url: '/explore' },
            { label: 'Libraries', url: '/library' },
            { label: 'Trending', url: '/explore' }
        ],
        Community: [
            { label: 'Guidelines', url: '#' },
            { label: 'Discussions', url: '#' },
            { label: 'Leaderboard', url: '#' }
        ],
        Company: [
            { label: 'About', url: '#' },
            { label: 'Privacy Policy', url: '#' },
            { label: 'Terms of Service', url: '#' }
        ],
        Social: [
            { label: 'Twitter', url: '#' },
            { label: 'Discord', url: '#' },
            { label: 'GitHub', url: '#' }
        ]
    }

    // Group fetched links by section
    const groupedLinks: Record<string, { label: string, url: string }[]> = {}

    if (footerLinks.length > 0) {
        footerLinks.forEach((link: any) => {
            if (!groupedLinks[link.section]) {
                groupedLinks[link.section] = []
            }
            groupedLinks[link.section].push({ label: link.label, url: link.url })
        })
    } else {
        // Fallback to default
        Object.assign(groupedLinks, defaultSections)
    }

    const sections = Object.keys(groupedLinks)

    return (
        <footer className="w-full border-t border-border mt-20 bg-bg-primary pb-10 pt-16 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-accent-cyan/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent-cyan/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">

                    {/* Brand Section */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center font-display font-bold text-white shadow-glow-cyan transform group-hover:scale-110 transition-all duration-300">
                                T
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-text-primary group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-cyan group-hover:to-accent-purple transition-all duration-300">
                                Themis
                            </span>
                        </Link>
                        <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                            Discover, track, and share your favorite movies, shows, games, and books. Join the community and explore boundless entertainment.
                        </p>
                    </div>

                    {/* Dynamic Links */}
                    {sections.map(section => (
                        <div key={section}>
                            <h3 className="font-display font-bold text-white mb-4">{section}</h3>
                            <ul className="space-y-3">
                                {groupedLinks[section].map((link, idx) => (
                                    <li key={idx}>
                                        <Link href={link.url} className="text-sm text-text-secondary hover:text-accent-cyan transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-text-muted text-xs">
                        &copy; {new Date().getFullYear()} Themis Media Tracker. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
