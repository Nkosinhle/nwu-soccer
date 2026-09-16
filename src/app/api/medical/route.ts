import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { MedicalRecord, Player } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req, ['admin', 'coach', 'physio'])
  if (error) return error
  await connectDB()
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('player')
  const query: any = {}
  if (playerId) query.player = playerId

  const records = await MedicalRecord.find(query)
    .populate('player', 'fullName position jerseyNumber profileImage')
    .populate('recordedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean()
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req, ['admin', 'physio'])
  if (error) return error
  await connectDB()
  const body   = await req.json()
  const record = await MedicalRecord.create({ ...body, recordedBy: (session!.user as any).id })

  // Update player fitness status
  const statusMap: Record<string, string> = { Active: 'Injured', Recovering: 'Recovering', Cleared: 'Fit' }
  await Player.findByIdAndUpdate(body.player, { fitnessStatus: statusMap[body.recoveryStatus] || 'Injured' })

  return NextResponse.json(record, { status: 201 })
}
