'use client'

import toast from 'react-hot-toast'

export type LibraryStatus = 'WATCHING' | 'COMPLETED' | 'PLANNED' | 'DROPPED'

export interface LibraryItem {
    /** Local DB id — if set, we PATCH; otherwise we POST */
    id?: string | null
    title: string
    type: string
    status?: string | null
    tmdbId?: string | number | null
    rawgId?: string | number | null
    bookId?: string | null
    posterUrl?: string | null
    releaseYear?: number | null
    genres?: string[]
    overview?: string | null
    tmdbRating?: number | null
    runtime?: number | null
    episodeCount?: number | null
    backdropUrl?: string | null
    imdbId?: string | null
}

/**
 * Shared utility that correctly POSTs (new item) or PATCHes (existing item).
 * Returns the updated/created item on success, or null on error.
 * Shows toast messages automatically.
 */
export async function upsertLibraryStatus(
    item: LibraryItem,
    newStatus: LibraryStatus,
    statusLabel: string
): Promise<any | null> {
    try {
        // Prisma CUIDs are 25-30 chars. TMDB/RAWG IDs are purely numeric or short.
        // If it's a short numeric ID, it belongs to the external API, not our local DB yet.
        const isLocalId = item.id && item.id.length > 20 && isNaN(Number(item.id))

        if (isLocalId) {
            // ── PATCH existing item ───────────────────────────────────────────
            const res = await fetch(`/api/media/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Failed to update')
            }
            const data = await res.json()
            toast.success(`${statusLabel} — ${item.title}`)
            return data.item ?? data
        } else {
            // ── POST new item ─────────────────────────────────────────────────
            const body: Record<string, any> = {
                title: item.title,
                type: item.type,
                status: newStatus,
                posterUrl: item.posterUrl ?? null,
                backdropUrl: item.backdropUrl ?? null,
                releaseYear: item.releaseYear ?? null,
                genres: item.genres ?? [],
                overview: item.overview ?? null,
                tmdbRating: item.tmdbRating ?? null,
                runtime: item.runtime ?? null,
                episodeCount: item.episodeCount ?? null,
                imdbId: item.imdbId ?? null,
            }
            if (item.tmdbId != null) body.tmdbId = String(item.tmdbId)
            if (item.rawgId != null) body.rawgId = String(item.rawgId)
            if (item.bookId) body.bookId = item.bookId

            const res = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to add')
            toast.success(`${statusLabel} — ${item.title}`)
            // POST returns { item } on create (201) or the item directly on upsert (200)
            return data.item ?? data
        }
    } catch (e: any) {
        toast.error(e.message || 'Failed to update library')
        return null
    }
}
