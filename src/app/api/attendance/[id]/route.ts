import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { TrainingSession } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const session = await TrainingSession.findById(id)
    .populate('squad',      'name type')
    .populate('createdBy',  'name role')
    // attendance.player only needs enough to render the attendance list row
    .populate('attendance.player', 'fullName jerseyNumber position profileImage')
    .lean()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  return NextResponse.json(
    session,
    { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  const body    = await req.json()
  const session = await TrainingSession.findByIdAndUpdate(id, body, { new: true })
    .populate('squad', 'name type')
    .lean()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json(session)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  await TrainingSession.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Session deleted' })
}
