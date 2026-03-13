'use client'

interface ProgressBarProps {
    /** 0.0 – 1.0 */
    fraction: number
    /** Display label below or alongside the bar */
    label?: string
    /** sm = 2px (poster overlay), md = 4px (card), lg = 6px (modal) */
    size?: 'sm' | 'md' | 'lg'
    /** Override the fill color; defaults to accent-cyan */
    color?: string
    showLabel?: boolean
    className?: string
}

const HEIGHT: Record<string, string> = {
    sm: 'h-[3px]',
    md: 'h-[5px]',
    lg: 'h-[6px]',
}

export function ProgressBar({
    fraction,
    label,
    size = 'md',
    color = 'var(--accent-cyan)',
    showLabel = false,
    className = '',
}: ProgressBarProps) {
    const pct = Math.min(Math.max(fraction, 0), 1) * 100

    return (
        <div className={`w-full ${className}`}>
            {/* Track */}
            <div className={`w-full rounded-full bg-bg-secondary overflow-hidden ${HEIGHT[size]}`}>
                <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%`, background: color }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
            {showLabel && label && (
                <p className="text-[10px] text-text-muted mt-1">{label}</p>
            )}
        </div>
    )
}
