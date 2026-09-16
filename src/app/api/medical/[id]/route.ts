import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { MedicalRecord } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach', 'physio'])
  if (error) return error

  await connectDB()

  const record = await MedicalRecord.findById(id)
    .populate('player',     'fullName jerseyNumber position squad')
    .populate('recordedBy', 'name role')
    .lean()

  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  return NextResponse.json(
    record,
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'coach', 'physio'])
  if (error) return error

  await connectDB()
  const body   = await req.json()
  const record = await MedicalRecord.findByIdAndUpdate(id, body, { new: true })
    .populate('player',     'fullName jerseyNumber position')
    .populate('recordedBy', 'name role')
    .lean()

  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth(req, ['admin', 'physio'])
  if (error) return error

  await connectDB()
  await MedicalRecord.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Record deleted' })
}
