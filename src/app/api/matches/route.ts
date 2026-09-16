import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Match } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const { searchParams } = new URL(req.url)
  const squad  = searchParams.get('squad')
  const status = searchParams.get('status')

  const query: Record<string, unknown> = {}
  if (squad)  query.squad  = squad
  if (status) query.status = status

  const matches = await Match.find(query)
    .select('opponent date venue location competition squad status score notes')
    .populate('squad', 'name type')
    .sort({ date: -1 })
    .lean()

  return NextResponse.json(matches, {
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
    const body  = await req.json()
    const match = await Match.create(body)
    return NextResponse.json(match, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create match'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
