'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Search, LayoutDashboard, Library, LogOut, User, Menu, X, Clapperboard, ChevronDown, Settings } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { ThemeSwitcher } from './ThemeSwitcher'

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/search', label: 'Add Media', icon: Search },
]

export function Navbar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userDropdown, setUserDropdown] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
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

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg-primary/95 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-accent-cyan to-accent-purple">
                                <Clapperboard size={18} className="text-white" />
                            </div>
                            <span className="font-display font-bold text-lg hidden sm:block bg-gradient-to-br from-accent-cyan to-accent-purple text-transparent bg-clip-text">
                                Themis
                            </span>
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-1">
                            {session && navLinks.map(({ href, label, icon: Icon }) => (
                                <Link key={href} href={href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === href
                                        ? 'text-accent-cyan bg-accent-cyan/10'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                                        }`}
                                >
                                    <Icon size={15} />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Right: search + avatar */}
                        <div className="flex items-center gap-3">
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
                                        <span className="text-sm text-text-primary hidden sm:block max-w-[120px] truncate">{session.user?.name || session.user?.email}</span>
                                        <ChevronDown size={14} className="text-text-secondary" />
                                    </button>

                                    {userDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-64 glass-card py-2 animate-slide-down flex flex-col gap-1 shadow-card" style={{ zIndex: 100 }}>
                                            <div className="px-4 py-2 border-b border-border mb-1">
                                                <p className="text-xs text-text-secondary truncate">{session.user?.email}</p>
                                            </div>

                                            <Link
                                                // @ts-ignore
                                                href={`/user/${session.user?.id}`}
                                                onClick={() => setUserDropdown(false)}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
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
                            <button onClick={() => setMobileOpen(p => !p)} className="md:hidden p-2 rounded-lg hover:bg-bg-hover text-text-secondary">
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-border bg-bg-primary/95 px-4 py-3 space-y-1">
                        {session && navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href} href={href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${pathname === href ? 'text-accent-cyan bg-accent-cyan/10' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>
            {/* Spacer for fixed navbar */}
            <div className="h-16" />
        </>
    )
}
