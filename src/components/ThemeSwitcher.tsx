'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'

const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'retrowave', label: 'Retrowave' },
]

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)
    const { theme, setTheme } = useTheme()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Ensure component only renders after hydration to prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    if (!mounted) {
        return <div className="w-9 h-9 bg-bg-card border border-border rounded-lg animate-pulse" />
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-bg-card border border-border hover:border-border-bright transition-all text-text-secondary hover:text-text-primary"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <Sun size={18} /> : theme === 'cyberpunk' ? <Moon className="text-accent-cyan" size={18} /> : theme === 'retrowave' ? <Moon className="text-accent-pink" size={18} /> : <Moon size={18} />}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-36 glass-card py-1 animate-slide-down flex flex-col shadow-card z-50 overflow-hidden">
                    {themes.map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); setOpen(false) }}
                            className={`px-4 py-2 text-sm text-left transition-colors ${theme === t.id ? 'text-accent-cyan bg-bg-hover font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
