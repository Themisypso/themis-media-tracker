/**
 * Activity content builder — generates human-readable strings for the Activity feed.
 * Used by the progress PATCH route after each progress update.
 */

interface ProgressActivityInput {
    userName: string
    title: string
    type: string
    progress: number
    /** Total for the type — runtime for movies, episodeCount for TV, pageCount for books */
    total?: number | null
}

/**
 * Builds a past-tense activity string describing a progress update.
 *
 * Examples:
 *   "watched 42 minutes of Interstellar"
 *   "reached Episode 12 of Breaking Bad"
 *   "read to page 180 of Dune"
 *   "progressed 65% through Cyberpunk 2077"
 */
export function buildProgressActivityContent({
    userName,
    title,
    type,
    progress,
    total,
}: ProgressActivityInput): string {
    const name = userName || 'Someone'

    switch (type) {
        case 'MOVIE':
            return `${name} watched ${progress} minute${progress !== 1 ? 's' : ''} of ${title}`

        case 'TVSHOW':
        case 'ANIME': {
            const ep = progress
            const totalStr = total ? ` / ${total}` : ''
            return `${name} reached Episode ${ep}${totalStr} of ${title}`
        }

        case 'BOOK':
            return `${name} read to page ${progress} of ${title}`

        case 'GAME':
            return `${name} progressed ${progress}% through ${title}`

        default:
            return `${name} updated progress on ${title}`
    }
}

/**
 * Builds a completion activity string when the item is marked completed via progress.
 */
export function buildCompletionActivityContent(userName: string, title: string, type: string): string {
    const name = userName || 'Someone'
    switch (type) {
        case 'MOVIE': return `${name} finished watching ${title}`
        case 'TVSHOW':
        case 'ANIME': return `${name} completed ${title}`
        case 'BOOK': return `${name} finished reading ${title}`
        case 'GAME': return `${name} completed ${title}`
        default: return `${name} completed ${title}`
    }
}
