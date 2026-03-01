# Themis Media Tracker

A modern, production-ready full-stack application to track your anime, movies, TV shows, and games. Built with Next.js 14, Tailwind CSS, Prisma, and PostgreSQL.

## Features
- **All-in-one Tracking**: Anime, Movies, TV Shows, and Games.
- **TMDB Integration**: Auto-fetches metadata (posters, genres, runtimes) for you.
- **Analytics Dashboard**: Automatic consumption calculations (e.g., total watch time).
- **Cyberpunk Dark Theme**: Modern UI with glassmorphism and animated components.
- **Authentication**: Email/Password and Google OAuth.

## Prerequisites
- Node.js (v20+)
- PostgreSQL Database (local or hosted like Supabase / Neon)
- TMDB API Key (Free at [themoviedb.org](https://www.themoviedb.org/settings/api))

## Local Development Setup

1. **Clone the project & install dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your specific `DATABASE_URL`, `NEXTAUTH_SECRET`, and `TMDB_API_KEY`.

3. **Initialize Database**
   This pushes the schema and generates the Prisma client.
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment (Vercel)
The app is optimized for Vercel. 
1. Push to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from your `.env.local` to Vercel.
4. Set the Build Command to `npx prisma generate && next build`.
5. Deploy.
