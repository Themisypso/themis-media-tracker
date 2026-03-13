/**
 * Shared media utility functions used by multiple API routes.
 * Extracted from api/media/route.ts and api/media/[id]/route.ts to avoid duplication.
 */

export interface CalcTimeInput {
    type: string
    runtime?: number | null
    episodeCount?: number | null
    episodeDuration?: number | null
    playtimeHours?: number | null
    steamPlaytimeMinutes?: number | null
}

export interface ProgressItem {
    type: string
    progress?: number | null
    runtime?: number | null
    episodeCount?: number | null
    pageCount?: number | null
    // playtimeHours is stored as progress percent (0-100) for GAME
}

/**
 * Computes the total time in minutes for a media item based on its type and metadata.
 * - GAME: playtimeHours × 60
 * - ANIME / TVSHOW: episodeCount × (episodeDuration ?? runtime ?? 24)
 * - MOVIE: runtime
 * - BOOK: null (no time concept)
 */
export function calcTotalTime(item: CalcTimeInput): number | null {
    if (item.type === 'GAME') {
        const manualMin = item.playtimeHours ? item.playtimeHours * 60 : 0
        const steamMin = item.steamPlaytimeMinutes ?? 0
        const effectiveMin = Math.max(manualMin, steamMin)
        return effectiveMin > 0 ? Math.round(effectiveMin) : null
    }
    if (item.type === 'ANIME' || item.type === 'TVSHOW') {
        const eps = item.episodeCount ?? 0
        const dur = item.episodeDuration ?? item.runtime ?? 24
        return eps > 0 ? eps * dur : null
    }
    if (item.type === 'MOVIE') {
        return item.runtime ?? null
    }
    return null
}

/** Role helper — all roles that are allowed to access the admin panel */
export const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN'] as const
export type AdminRole = typeof ADMIN_ROLES[number]

export function isAdminRole(role: string | null | undefined): boolean {
    return ADMIN_ROLES.includes(role as AdminRole)
}

/**
 * Returns a 0.0–1.0 progress fraction for display (e.g. for a progress bar).
 * Returns null if there is no total to compare against.
 */
export function calcProgressFraction(item: ProgressItem): number | null {
    const p = item.progress
    if (p == null || p < 0) return null

    if (item.type === 'MOVIE') {
        if (!item.runtime || item.runtime <= 0) return null
        return Math.min(p / item.runtime, 1)
    }
    if (item.type === 'TVSHOW' || item.type === 'ANIME') {
        if (!item.episodeCount || item.episodeCount <= 0) return null
        return Math.min(p / item.episodeCount, 1)
    }
    if (item.type === 'BOOK') {
        if (!item.pageCount || item.pageCount <= 0) return null
        return Math.min(p / item.pageCount, 1)
    }
    if (item.type === 'GAME') {
        return null // Progress fraction via hours doesn't make sense without a total
    }
    return null
}

/**
 * Returns a human-readable progress label.
 * e.g. "42 / 120 min", "Ep 12 / 48", "Page 180 / 400", "65%"
 */
export function formatProgressLabel(item: ProgressItem): string | null {
    const p = item.progress
    if (p == null) return null

    if (item.type === 'MOVIE') {
        if (!item.runtime) return `${p} min`
        return `${p} / ${item.runtime} min`
    }
    if (item.type === 'TVSHOW' || item.type === 'ANIME') {
        if (!item.episodeCount) return `Ep ${p}`
        return `Ep ${p} / ${item.episodeCount}`
    }
    if (item.type === 'BOOK') {
        if (!item.pageCount) return `Page ${p}`
        return `Page ${p} / ${item.pageCount}`
    }
    if (item.type === 'GAME') {
        return `${item.progress ?? 0}h`
    }
    return null
}
