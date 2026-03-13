'use client'

import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react'

type Status = 'WATCHING' | 'COMPLETED' | 'PLANNED' | 'DROPPED'

interface StatusOption {
    value: Status
    label: string
    tooltip: string
    icon: React.ReactNode
    activeClass: string
}

const STATUS_OPTIONS: StatusOption[] = [
    {
        value: 'WATCHING',
        label: 'In Progress',
        tooltip: 'In Progress',
        icon: <Eye size={15} />,
        activeClass: 'bg-accent-cyan/15 border-accent-cyan/60 text-accent-cyan',
    },
    {
        value: 'COMPLETED',
        label: 'Completed',
        tooltip: 'Completed',
        icon: <CheckCircle size={15} />,
        activeClass: 'bg-green-500/15 border-green-500/60 text-green-400',
    },
    {
        value: 'PLANNED',
        label: 'Planned',
        tooltip: 'Planned',
        icon: <Clock size={15} />,
        activeClass: 'bg-text-muted/15 border-text-muted/60 text-text-secondary',
    },
    {
        value: 'DROPPED',
        label: 'Dropped',
        tooltip: 'Dropped',
        icon: <XCircle size={15} />,
        activeClass: 'bg-accent-pink/15 border-accent-pink/60 text-accent-pink',
    },
]

interface StatusIconBarProps {
    value: Status | string
    onChange: (status: Status) => void
    size?: 'sm' | 'md'
    disabled?: boolean
}

export function StatusIconBar({ value, onChange, size = 'md', disabled }: StatusIconBarProps) {
    const pad = size === 'sm' ? 'p-1.5' : 'p-2.5'
    return (
        <div className="flex gap-2" role="group" aria-label="Library status">
            {STATUS_OPTIONS.map(opt => {
                const isActive = value === opt.value
                return (
                    <div key={opt.value} className="relative group/tip flex-1">
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-[10px] font-medium bg-bg-card border border-border text-text-primary whitespace-nowrap
                            opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-300 z-50 shadow-lg">
                            {opt.tooltip}
                        </div>

                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(opt.value)}
                            aria-label={opt.tooltip}
                            aria-pressed={isActive}
                            className={`w-full flex items-center justify-center rounded-xl border transition-all duration-200 ${pad} ${isActive
                                ? opt.activeClass
                                : 'border-border text-text-muted hover:text-text-secondary hover:border-text-muted bg-bg-secondary'
                                } disabled:opacity-40`}
                        >
                            {opt.icon}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

export { STATUS_OPTIONS }
export type { Status }
