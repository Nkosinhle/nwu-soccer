import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { requireAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error
  await connectDB()
  const user = await User.findById(session!.user.id).select('-password').lean()
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error
  await connectDB()
  const body = await req.json()

  if (body.newPassword) {
    const user = await User.findById(session!.user.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const valid = await bcrypt.compare(body.currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    const hashed = await bcrypt.hash(body.newPassword, 12)
    await User.findByIdAndUpdate(session!.user.id, { password: hashed })
    delete body.newPassword
    delete body.currentPassword
  }

  const updated = await User.findByIdAndUpdate(
    session!.user.id,
    { $set: { name: body.name, email: body.email } },
    { new: true }
  ).select('-password').lean()

  return NextResponse.json(updated)
}
