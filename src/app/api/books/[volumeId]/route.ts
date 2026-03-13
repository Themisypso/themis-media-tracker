export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY
const cache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 60 })

function normalizeBook(vol: any) {
    const info = vol.volumeInfo || {}
    const isbn = (info.industryIdentifiers || []).find(
        (i: any) => i.type === 'ISBN_13' || i.type === 'ISBN_10'
    )?.identifier ?? null

    return {
        volumeId: vol.id,
        title: info.title || 'Unknown Title',
        subtitle: info.subtitle || null,
        authors: info.authors || [],
        description: info.description || null,
        publishedDate: info.publishedDate || null,
        publishedYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
        pageCount: info.pageCount || null,
        categories: info.categories || [],
        thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
        largeThumbnail: info.imageLinks?.large?.replace('http://', 'https://')
            || info.imageLinks?.medium?.replace('http://', 'https://')
            || info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
        averageRating: info.averageRating || null,
        ratingsCount: info.ratingsCount || 0,
        isbn,
        publisher: info.publisher || null,
        language: info.language || null,
        previewLink: info.previewLink || null,
        maturityRating: info.maturityRating || null,
    }
}

export async function GET(_req: Request, { params }: { params: { volumeId: string } }) {
    const { volumeId } = params
    const cacheKey = `books:detail:${volumeId}`
    if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

    try {
        const url = API_KEY
            ? `${BOOKS_BASE}/volumes/${volumeId}?key=${API_KEY}`
            : `${BOOKS_BASE}/volumes/${volumeId}`

        const res = await fetch(url, { next: { revalidate: 3600 } })
        if (!res.ok) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

        const vol = await res.json()
        const result = normalizeBook(vol)
        cache.set(cacheKey, result)
        return NextResponse.json(result)
    } catch (err) {
        console.error('[BOOKS DETAIL ERROR]', err)
        return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
    }
}
