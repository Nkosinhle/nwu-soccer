import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { TrainingSession } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error
  await connectDB()
  const { searchParams } = new URL(req.url)
  const squad = searchParams.get('squad')
  const query: any = {}
  if (squad) query.squad = squad

  const sessions = await TrainingSession.find(query)
    .populate('squad', 'name')
    .populate('attendance.player', 'fullName jerseyNumber position')
    .populate('createdBy', 'name')
    .sort({ date: -1 })
    .lean()
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req, ['admin', 'coach', 'support_staff'])
  if (error) return error
  await connectDB()
  const body    = await req.json()
  const training = await TrainingSession.create({ ...body, createdBy: (session!.user as any).id })
  return NextResponse.json(training, { status: 201 })
}
