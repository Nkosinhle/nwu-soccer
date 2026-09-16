import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Player } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const { searchParams } = new URL(req.url)
  const squad    = searchParams.get('squad')
  const position = searchParams.get('position')
  const status   = searchParams.get('status')
  const search   = searchParams.get('search')

  const query: Record<string, unknown> = {}
  if (squad)    query.squad         = squad
  if (position) query.position      = position
  if (status)   query.fitnessStatus = status
  if (search) {
    query.fullName = { $regex: search, $options: 'i' }
  }

  // Select only the fields the players list page renders.
  // This is the biggest single-query win — Mongoose by default fetches
  // every field including bio, socialMedia, favouriteSuperhero, etc.
  // that the list page never displays.
  const players = await Player.find(query)
    .select([
      'fullName', 'jerseyNumber', 'position', 'squad',
      'fitnessStatus', 'profileImage', 'nationality', 'age',
      'contactEmail', 'contactPhone', 'studentNumber',
    ].join(' '))
    .populate('squad', 'name type')   // only name + type, not the full team doc
    .sort({ jerseyNumber: 1 })
    .lean()                            // plain JS objects — no Mongoose overhead

  return NextResponse.json({ players }, {
    headers: {
      'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
    },
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  await connectDB()

  try {
    const body   = await req.json()
    const player = await Player.create(body)
    return NextResponse.json(player, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create player'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
