'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode
    className?: string
    interactive?: boolean
    gradient?: boolean
    glowOnHover?: boolean
    delay?: number
}

export function GlassCard({
    children,
    className,
    interactive = false,
    gradient = false,
    glowOnHover = false,
    delay = 0,
    ...props
}: GlassCardProps) {
    const baseClasses = clsx(
        "relative overflow-hidden rounded-2xl border border-border backdrop-blur-md shadow-card",
        gradient ? "bg-card-gradient" : "bg-bg-card/80",
        interactive && "transition-all duration-300 cursor-pointer",
        glowOnHover && "hover:border-accent-cyan/50 hover:shadow-glow-cyan"
    )

    return (
        <motion.div
            className={twMerge(baseClasses, className)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={interactive ? { y: -4, scale: 1.01 } : {}}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            {...props}
        >
            {/* Subtle inner gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    )
}
