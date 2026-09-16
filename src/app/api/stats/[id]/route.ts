import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { PlayerStats } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const stats = await PlayerStats.find({ player: id })
    .select('goals assists minutesPlayed yellowCards redCards saves tackles rating match')
    .populate('match', 'opponent date score competition location')
    .sort({ createdAt: -1 })
    .lean()

  const totals = stats.reduce((acc, s) => ({
    goals:         acc.goals         + (s.goals         ?? 0),
    assists:       acc.assists       + (s.assists        ?? 0),
    minutesPlayed: acc.minutesPlayed + (s.minutesPlayed  ?? 0),
    yellowCards:   acc.yellowCards   + (s.yellowCards    ?? 0),
    redCards:      acc.redCards      + (s.redCards       ?? 0),
    saves:         acc.saves         + (s.saves          ?? 0),
    tackles:       acc.tackles       + (s.tackles        ?? 0),
    matches:       acc.matches       + 1,
  }), { goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, saves: 0, tackles: 0, matches: 0 })

  return NextResponse.json(
    { stats, totals },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
  )
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  const body = await req.json()
  const stat = await PlayerStats.create({ ...body, player: id })
  return NextResponse.json(stat, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  const body = await req.json()
  const stat = await PlayerStats.findByIdAndUpdate(id, body, { new: true }).lean()
  if (!stat) return NextResponse.json({ error: 'Stat not found' }, { status: 404 })
  return NextResponse.json(stat)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()
  await PlayerStats.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Stat deleted' })
}
