import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#080c14',
                    secondary: '#0d1117',
                    card: '#111827',
                    hover: '#1a2235',
                },
                accent: {
                    cyan: '#00d4ff',
                    purple: '#7b2fff',
                    pink: '#ff2d7a',
                    green: '#00ff9d',
                },
                border: {
                    DEFAULT: '#1e2a3a',
                    bright: '#2a3f5a',
                },
                text: {
                    primary: '#e8edf5',
                    secondary: '#8899aa',
                    muted: '#4a5568',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'cyber-grid': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
                'glow-cyan': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
                'glow-purple': 'radial-gradient(ellipse at center, rgba(123,47,255,0.15) 0%, transparent 70%)',
                'card-gradient': 'linear-gradient(135deg, #111827 0%, #0d1117 100%)',
                'hero-gradient': 'linear-gradient(135deg, #080c14 0%, #0d1a2d 50%, #080c14 100%)',
            },
            boxShadow: {
                'glow-cyan': '0 0 20px rgba(0,212,255,0.3)',
                'glow-purple': '0 0 20px rgba(123,47,255,0.3)',
                'glow-pink': '0 0 20px rgba(255,45,122,0.3)',
                'card': '0 4px 20px rgba(0,0,0,0.5)',
                'card-hover': '0 8px 40px rgba(0,0,0,0.7)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(0,212,255,0.2)' },
                    '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.5)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
export default config
