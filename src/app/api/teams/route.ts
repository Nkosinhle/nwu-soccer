import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Team } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  // Include players array so squad pages can show player counts.
  // We only select _id from players — enough to count, not full docs.
  const teams = await Team.find()
    .select('name type season description players coaches physios supportStaff')
    .sort({ type: 1 })
    .lean()

  return NextResponse.json({ teams }, {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
    },
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req, ['admin'])
  if (error) return error

  await connectDB()

  try {
    const body = await req.json()
    const team = await Team.create(body)
    return NextResponse.json(team, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create team'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
