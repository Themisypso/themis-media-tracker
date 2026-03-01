'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Search, LayoutDashboard, Library, LogOut, User, Menu, X, Clapperboard, ChevronDown } from 'lucide-react'
import { SearchBar } from './SearchBar'

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

    if (!session) return null

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border" style={{ background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(12px)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)' }}>
                                <Clapperboard size={18} className="text-white" />
                            </div>
                            <span className="font-display font-bold text-lg hidden sm:block" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Themis
                            </span>
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ href, label, icon: Icon }) => (
                                <Link key={href} href={href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === href
                                            ? 'text-[#00d4ff] bg-[#00d4ff15]'
                                            : 'text-[#8899aa] hover:text-[#e8edf5] hover:bg-[#1a2235]'
                                        }`}
                                >
                                    <Icon size={15} />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Right: search + avatar */}
                        <div className="flex items-center gap-3">
                            {/* User dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setUserDropdown(p => !p)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-[#1e2a3a] hover:border-[#2a3f5a] transition-all"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2fff)' }}>
                                            {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <span className="text-sm text-[#e8edf5] hidden sm:block max-w-[120px] truncate">{session.user?.name || session.user?.email}</span>
                                    <ChevronDown size={14} className="text-[#8899aa]" />
                                </button>

                                {userDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-48 glass-card py-2 animate-slide-down" style={{ zIndex: 100 }}>
                                        <div className="px-4 py-2 border-b border-[#1e2a3a]">
                                            <p className="text-xs text-[#8899aa] truncate">{session.user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#ff2d7a] hover:bg-[#ff2d7a15] transition-colors"
                                        >
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile menu toggle */}
                            <button onClick={() => setMobileOpen(p => !p)} className="md:hidden p-2 rounded-lg hover:bg-[#1a2235] text-[#8899aa]">
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-[#1e2a3a] px-4 py-3 space-y-1" style={{ background: 'rgba(8,12,20,0.98)' }}>
                        {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href} href={href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${pathname === href ? 'text-[#00d4ff] bg-[#00d4ff15]' : 'text-[#8899aa] hover:text-[#e8edf5] hover:bg-[#1a2235]'
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
