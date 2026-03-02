'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    // Ensure component only renders after hydration to prevent hydration mismatch
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return <div className="h-10 w-[180px] bg-bg-card rounded-lg animate-pulse" />
    }

    return (
        <div className="flex bg-bg-card border border-border rounded-lg p-1 gap-1">
            <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'light'
                        ? 'bg-text-primary text-bg-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
            >
                Light
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'dark'
                        ? 'bg-text-primary text-bg-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
            >
                Dark
            </button>
            <button
                onClick={() => setTheme('cyberpunk')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'cyberpunk'
                        ? 'bg-accent-cyan text-black shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                        : 'text-text-secondary hover:text-accent-cyan'
                    }`}
            >
                Cyber
            </button>
            <button
                onClick={() => setTheme('retrowave')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'retrowave'
                        ? 'bg-accent-pink text-white shadow-[0_0_10px_rgba(255,45,122,0.4)]'
                        : 'text-text-secondary hover:text-accent-pink'
                    }`}
            >
                Retro
            </button>
        </div>
    )
}
