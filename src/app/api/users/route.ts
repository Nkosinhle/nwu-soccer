import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req, ['admin'])
  if (error) return error
  await connectDB()
  const users = await User.find().select('-password').lean()
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req, ['admin'])
  if (error) return error
  await connectDB()
  const body = await req.json()
  const existing = await User.findOne({ email: body.email })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  const user = await User.create(body)
  const { password: _, ...safeUser } = user.toObject()
  return NextResponse.json(safeUser, { status: 201 })
}
