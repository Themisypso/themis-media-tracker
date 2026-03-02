import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!supabase) {
        return NextResponse.json({ error: 'Supabase storage is not configured.' }, { status: 501 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate basic image types optionally
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Invalid file format. Please upload an image.' }, { status: 400 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Upload to Supabase Storage Bucket named 'avatars'
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) {
            console.error('[STORAGE UPLOAD ERROR]', uploadError)
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
        }

        // Retrieve public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Update the database User model with the new image URL
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: publicUrl }
        })

        return NextResponse.json({ url: publicUrl })
    } catch (e: any) {
        console.error('[UPLOAD ERROR]', e)
        return NextResponse.json({ error: e.message || 'Server error during upload' }, { status: 500 })
    }
}
