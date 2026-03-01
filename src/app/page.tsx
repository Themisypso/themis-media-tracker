import Link from 'next/link'
import { Clapperboard, BarChart3, Clock, Star, ArrowRight, Tv, Film, Gamepad2, Check } from 'lucide-react'

export default function LandingPage() {
    return (
        <main className="min-h-screen cyber-bg">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)' }}>
                        <Clapperboard size={20} className="text-white" />
                    </div>
                    <span className="font-display font-bold text-xl" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Themis
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/auth/login" className="text-sm text-[#8899aa] hover:text-[#e8edf5] transition-colors px-4 py-2">
                        Sign In
                    </Link>
                    <Link href="/auth/register" className="btn-primary text-sm">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="text-center px-6 py-20 max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 border" style={{ background: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                    ✦ Track every hour of your media life
                </div>
                <h1 className="text-5xl sm:text-7xl font-display font-extrabold leading-tight mb-6">
                    <span style={{ background: 'linear-gradient(135deg, #e8edf5 0%, #8899aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your Media.
                    </span>
                    <br />
                    <span style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your Stats.
                    </span>
                </h1>
                <p className="text-lg text-[#8899aa] max-w-2xl mx-auto mb-10 leading-relaxed">
                    Track anime, movies, TV shows, and games in one place. Auto-filled from TMDB. Visualize your lifetime media consumption with beautiful analytics.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Link href="/auth/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
                        Start Tracking Free <ArrowRight size={18} />
                    </Link>
                    <Link href="/auth/login" className="btn-cyber flex items-center gap-2 text-base px-8 py-3.5">
                        Sign In
                    </Link>
                </div>

                {/* Stats preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
                    {[
                        { label: 'Anime', icon: <Tv size={20} />, color: '#ff9500', val: '127 tracked' },
                        { label: 'Movies', icon: <Film size={20} />, color: '#00d4ff', val: '2,400+ titles' },
                        { label: 'Shows', icon: <Tv size={20} />, color: '#a78bfa', val: 'All seasons' },
                        { label: 'Games', icon: <Gamepad2 size={20} />, color: '#00ff9d', val: 'Manual playtime' },
                    ].map(({ label, icon, color, val }) => (
                        <div key={label} className="glass-card p-5 text-center">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                                {icon}
                            </div>
                            <p className="font-display font-semibold text-[#e8edf5] text-sm">{label}</p>
                            <p className="text-xs text-[#8899aa] mt-1">{val}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="px-6 py-16 max-w-6xl mx-auto">
                <h2 className="text-3xl font-display font-bold text-center mb-12">
                    <span style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Everything you need
                    </span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: <Clock size={22} />, color: '#00d4ff', title: 'Time Analytics', desc: 'See exactly how many hours you\'ve spent on anime, movies, TV shows and games.' },
                        { icon: <BarChart3 size={22} />, color: '#7b2fff', title: 'Beautiful Charts', desc: 'Bar and pie charts show your yearly consumption and media breakdown at a glance.' },
                        { icon: <Star size={22} />, color: '#ffd700', title: 'Personal Ratings', desc: 'Rate and review every title. 1-10 star system with personal notes.' },
                        { icon: <Film size={22} />, color: '#ff9500', title: 'TMDB Auto-Fill', desc: 'Search and auto-populate poster, genres, runtime, and IMDB rating from TMDB.' },
                        { icon: <Clapperboard size={22} />, color: '#00ff9d', title: 'Status Tracking', desc: 'Mark as Watching, Completed, Planned or Dropped. Filter your library instantly.' },
                        { icon: <Gamepad2 size={22} />, color: '#ff2d7a', title: 'Games Too', desc: 'Track your game playtime manually. Combined with watch stats for total media time.' },
                    ].map(({ icon, color, title, desc }) => (
                        <div key={title} className="glass-card p-6 hover:border-[#2a3f5a] transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
                                {icon}
                            </div>
                            <h3 className="font-display font-semibold text-[#e8edf5] mb-2">{title}</h3>
                            <p className="text-sm text-[#8899aa] leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="text-center px-6 py-20">
                <div className="max-w-2xl mx-auto glass-card p-12" style={{ boxShadow: '0 0 60px rgba(0,212,255,0.1)' }}>
                    <h2 className="text-3xl font-display font-bold mb-4 text-[#e8edf5]">Ready to start tracking?</h2>
                    <p className="text-[#8899aa] mb-8">Create your free account and see how much of your life you&apos;ve given to great stories.</p>
                    <Link href="/auth/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
                        Create Free Account <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#1e2a3a] px-6 py-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Clapperboard size={16} className="text-[#00d4ff]" />
                    <span className="font-display font-semibold text-[#e8edf5]">Themis Media Tracker</span>
                </div>
                <p className="text-xs text-[#4a5568]">Powered by TMDB API. Built for obsessive media consumers.</p>
            </footer>
        </main>
    )
}
