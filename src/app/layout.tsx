import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'
import NextTopLoader from 'nextjs-toploader'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Themis Media Tracker',
    description: 'Track your anime, movies, TV shows, and games. Visualize your lifetime media consumption.',
    keywords: ['media tracker', 'anime tracker', 'movie tracker', 'game tracker', 'watch time'],
    authors: [{ name: 'Themis' }],
    openGraph: {
        title: 'Themis Media Tracker',
        description: 'Track your lifetime media consumption. Analytics, stats, and more.',
        type: 'website',
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body>
                <NextTopLoader
                    color="#7b2fff"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #7b2fff,0 0 5px #7b2fff"
                />
                <Providers>
                    {children}
                    <Footer />
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: '#111827',
                                color: '#e8edf5',
                                border: '1px solid #1e2a3a',
                                borderRadius: '10px',
                            },
                            success: { iconTheme: { primary: '#00ff9d', secondary: '#111827' } },
                            error: { iconTheme: { primary: '#ff2d7a', secondary: '#111827' } },
                        }}
                    />
                </Providers>
            </body>
        </html>
    )
}
