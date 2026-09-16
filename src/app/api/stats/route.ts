import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { PlayerStats } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error
  await connectDB()
  const { searchParams } = new URL(req.url)
  const matchId  = searchParams.get('match')
  const playerId = searchParams.get('player')
  const query: any = {}
  if (matchId)  query.match  = matchId
  if (playerId) query.player = playerId

  const stats = await PlayerStats.find(query)
    .populate('player', 'fullName position jerseyNumber profileImage')
    .populate('match', 'opponent date score status')
    .sort({ createdAt: -1 })
    .lean()
  return NextResponse.json(stats)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error
  await connectDB()
  const body = await req.json()

  // Upsert — one stat record per player per match
  const existing = await PlayerStats.findOne({ player: body.player, match: body.match })
  if (existing) {
    const updated = await PlayerStats.findByIdAndUpdate(existing._id, body, { new: true })
    return NextResponse.json(updated)
  }
  const stat = await PlayerStats.create(body)
  return NextResponse.json(stat, { status: 201 })
}
