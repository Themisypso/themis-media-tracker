export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

const BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY

const cache = new LRUCache<string, any>({ max: 300, ttl: 1000 * 60 * 15 })

function normalizeBook(vol: any) {
    const info = vol.volumeInfo || {}
    const isbn = (info.industryIdentifiers || []).find(
        (i: any) => i.type === 'ISBN_13' || i.type === 'ISBN_10'
    )?.identifier ?? null

    return {
        volumeId: vol.id,
        title: info.title || 'Unknown Title',
        authors: info.authors || [],
        description: info.description || null,
        publishedDate: info.publishedDate || null,
        publishedYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
        pageCount: info.pageCount || null,
        categories: info.categories || [],
        thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://').replace('&zoom=1', '&zoom=0').replace('&edge=curl', '') || null,
        averageRating: info.averageRating || null,
        ratingsCount: info.ratingsCount || 0,
        isbn,
        publisher: info.publisher || null,
        language: info.language || null,
        previewLink: info.previewLink || null,
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || 'bestseller'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const maxResults = 20
    const startIndex = (page - 1) * maxResults

    const orderBy = searchParams.get('orderBy')
    const langRestrict = searchParams.get('langRestrict')

    const cacheKey = `books:search:${q}:${page}:${orderBy || 'relevance'}:${langRestrict || 'any'}`
    if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

    try {
        const params = new URLSearchParams({
            q,
            startIndex: String(startIndex),
            maxResults: String(maxResults),
            printType: 'books',
        })

        if (orderBy && orderBy !== 'relevance') {
            params.set('orderBy', orderBy)
        }
        if (langRestrict) {
            params.set('langRestrict', langRestrict)
        }
        if (API_KEY) params.set('key', API_KEY)

        const res = await fetch(`${BOOKS_BASE}/volumes?${params}`, { next: { revalidate: 900 } })
        if (!res.ok) throw new Error(`Books API error: ${res.status}`)
        const data = await res.json()

        const results = (data.items || []).map(normalizeBook)
        const totalItems = data.totalItems || 0
        const hasMore = startIndex + maxResults < Math.min(totalItems, 400) // cap at 400

        const response = { results, totalItems, hasMore }
        cache.set(cacheKey, response)
        return NextResponse.json(response)
    } catch (err) {
        console.error('[BOOKS SEARCH ERROR]', err)
        return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
    }
}
