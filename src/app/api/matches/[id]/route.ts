import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Match } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const match = await Match.findById(id)
    .populate('squad', 'name type')
    // lineup fields: keep all since the match detail page renders
    // player cards with image, position, jersey number and fitness badge
    .populate('lineup', 'fullName position jerseyNumber profileImage fitnessStatus')
    .lean()                             // ← was missing .lean()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  return NextResponse.json(
    match,
    { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  const body  = await req.json()
  const match = await Match.findByIdAndUpdate(id, body, { new: true })
    .populate('squad', 'name type')
    .lean()                             // ← was missing .lean()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  return NextResponse.json(match)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin'])
  if (error) return error

  await connectDB()
  await Match.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Match deleted' })
}
