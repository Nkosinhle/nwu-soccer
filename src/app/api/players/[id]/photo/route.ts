import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Player } from '@/lib/models'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG or WebP' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5 MB' }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public/images/players/<id>.<ext>
    const ext     = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${id}.${ext}`
    const dir      = path.join(process.cwd(), 'public', 'images', 'players')
    const filepath = path.join(dir, filename)

    await mkdir(dir, { recursive: true })
    await writeFile(filepath, buffer)

    // Update player record with new image URL
    const url = `/images/players/${filename}`
    await connectDB()
    await Player.findByIdAndUpdate(id, { profileImage: url })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[photo upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
