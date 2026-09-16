import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Player, PlayerStats, MedicalRecord } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const player = await Player.findById(id)
    .populate('squad', 'name type')
    .lean()                              // ← was missing .lean()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const [stats, medical] = await Promise.all([
    PlayerStats.find({ player: id })
      // Only fetch the match fields the player detail page renders
      .populate('match', 'opponent date score competition')
      .select('goals assists minutesPlayed yellowCards redCards saves tackles rating match')
      .lean(),                           // ← was missing .lean()
    MedicalRecord.find({ player: id })
      .populate('recordedBy', 'name')
      .sort({ dateOfInjury: -1 })        // ← newest injuries first
      .lean(),                           // ← was missing .lean()
  ])

  const totals = stats.reduce((acc, s) => ({
    goals:         acc.goals         + (s.goals         ?? 0),
    assists:       acc.assists       + (s.assists        ?? 0),
    minutesPlayed: acc.minutesPlayed + (s.minutesPlayed  ?? 0),
    yellowCards:   acc.yellowCards   + (s.yellowCards    ?? 0),
    redCards:      acc.redCards      + (s.redCards       ?? 0),
    matches:       acc.matches       + 1,
  }), { goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, matches: 0 })

  return NextResponse.json(
    { player, stats, medical, totals },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach', 'physio'])
  if (error) return error

  await connectDB()
  const body   = await req.json()
  const player = await Player.findByIdAndUpdate(id, body, { new: true })
    .populate('squad', 'name type')
    .lean()                              // ← was missing .lean()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  return NextResponse.json(player)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin'])
  if (error) return error

  await connectDB()
  await Player.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Player deleted' })
}
