import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Team } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const team = await Team.findById(id)
    // Players in the team detail page need these fields for the player cards
    .populate('players',      'fullName jerseyNumber position fitnessStatus profileImage')
    // Coaches/physios/staff need name + role for the team management panel
    .populate('coaches',      'name role avatar')
    .populate('physios',      'name role avatar')
    .populate('supportStaff', 'name role avatar')
    .lean()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  return NextResponse.json(
    team,
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  const body = await req.json()
  const team = await Team.findByIdAndUpdate(id, body, { new: true })
    .lean()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  return NextResponse.json(team)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin'])
  if (error) return error

  await connectDB()
  await Team.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Team deleted' })
}
