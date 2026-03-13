/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // TMDB — movie & TV posters and backdrops
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      // Google user profile images (OAuth avatars)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // RAWG — game cover images
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
        pathname: '/media/**',
      },
      // Google Books — book cover thumbnails
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
    ],
  },
}

module.exports = nextConfig
