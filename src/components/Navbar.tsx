'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Search, LayoutDashboard, Library, LogOut, User, Menu, X, Clapperboard, ChevronDown, Settings, Compass, Film, Tv, Users, Sparkles } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { ThemeSwitcher } from './ThemeSwitcher'

// Center browse links — visible to everyone
const browseLinks = [
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/tv-shows', label: 'TV Shows', icon: Tv },
    { href: '/anime', label: 'Anime', icon: Sparkles },
    { href: '/people', label: 'People', icon: Users },
]

export function Navbar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userDropdown, setUserDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setUserDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function isActive(href: string) {
        return pathname === href || pathname.startsWith(href + '?')
    }

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg-primary/95 backdrop-blur-md">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        {/* Logo — left side */}
                        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-6">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-accent-cyan to-accent-purple">
                                <Clapperboard size={18} className="text-white" />
                            </div>
                            <span className="font-display font-bold text-lg hidden sm:block bg-gradient-to-br from-accent-cyan to-accent-purple text-transparent bg-clip-text">
                                Themis
                            </span>
                        </Link>

                        {/* Center browse links */}
                        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
                            {browseLinks.map(({ href, label, icon: Icon }) => (
                                <Link key={href} href={href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(href)
                                        ? href === '/people'
                                            ? 'text-[#7b2fff] bg-[#7b2fff]/10'
                                            : 'text-accent-cyan bg-accent-cyan/10'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Right side: theme + auth */}
                        <div className="flex items-center gap-2 ml-auto">
                            {/* Global Search */}
                            <div className="hidden md:block relative mr-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search everything..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            router.push(`/global-search?q=${encodeURIComponent(e.currentTarget.value.trim())}`)
                                            e.currentTarget.value = ''
                                        }
                                    }}
                                    id="navbar-global-search"
                                    className="pl-9 pr-4 py-1.5 bg-bg-secondary/50 border border-border rounded-full text-sm text-text-primary focus:outline-none focus:border-accent-cyan focus:bg-bg-secondary transition-all w-48 lg:w-64"
                                />
                            </div>

                            <div className="hidden sm:block">
                                <ThemeSwitcher />
                            </div>

                            {/* User dropdown or Login */}
                            {session ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setUserDropdown(p => !p)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border hover:border-border-bright transition-all"
                                    >
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-accent-cyan to-accent-purple text-white">
                                                {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="text-sm text-text-primary hidden sm:block max-w-[100px] truncate">{session.user?.name || session.user?.email}</span>
                                        <ChevronDown size={14} className="text-text-secondary" />
                                    </button>

                                    {userDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-56 glass-card py-2 animate-slide-down flex flex-col gap-0.5 shadow-card" style={{ zIndex: 100 }}>
                                            <div className="px-4 py-2 border-b border-border mb-1">
                                                <p className="text-xs text-text-secondary truncate">{session.user?.email}</p>
                                            </div>

                                            <Link
                                                href="/dashboard"
                                                onClick={() => setUserDropdown(false)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                                            >
                                                <LayoutDashboard size={14} />
                                                Dashboard
                                            </Link>

                                            <Link
                                                href="/library"
                                                onClick={() => setUserDropdown(false)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                                            >
                                                <Library size={14} />
                                                My Library
                                            </Link>

                                            <Link
                                                href="/search"
                                                onClick={() => setUserDropdown(false)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-[#00ff9d] hover:bg-[#00ff9d]/10 transition-colors"
                                            >
                                                <Search size={14} />
                                                Add Media
                                            </Link>

                                            <div className="h-px bg-border my-1" />

                                            <Link
                                                // @ts-ignore
                                                href={`/user/${(session.user as any)?.username || session.user?.id}`}
                                                onClick={() => setUserDropdown(false)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-accent-purple hover:bg-accent-purple/10 transition-colors"
                                            >
                                                <User size={14} />
                                                My Profile
                                            </Link>

                                            <Link
                                                href="/settings"
                                                onClick={() => setUserDropdown(false)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-accent-purple hover:bg-accent-purple/10 transition-colors"
                                            >
                                                <Settings size={14} />
                                                Settings
                                            </Link>

                                            <div className="h-px bg-border my-1" />

                                            <button
                                                onClick={() => signOut({ callbackUrl: '/' })}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-accent-pink hover:bg-accent-pink/10 transition-colors"
                                            >
                                                <LogOut size={14} />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href="/auth/login" className="btn-primary text-sm px-4 py-2">
                                    Sign In
                                </Link>
                            )}

                            {/* Mobile menu toggle */}
                            <button onClick={() => setMobileOpen(p => !p)} className="lg:hidden p-2 rounded-lg hover:bg-bg-hover text-text-secondary">
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <div className="lg:hidden border-t border-border bg-bg-primary/95 px-4 py-3 space-y-1">
                        {browseLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href} href={href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${isActive(href)
                                    ? 'text-accent-cyan bg-accent-cyan/10'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </Link>
                        ))}
                        {session && (
                            <>
                                <div className="h-px bg-border my-2" />
                                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover">
                                    <LayoutDashboard size={16} /> Dashboard
                                </Link>
                                <Link href="/library" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover">
                                    <Library size={16} /> My Library
                                </Link>
                                <Link href="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover">
                                    <Search size={16} /> Add Media
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </nav>
            {/* Spacer for fixed navbar */}
            <div className="h-16" />
        </>
    )
}
