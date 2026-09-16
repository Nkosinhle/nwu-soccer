import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose, { Schema } from 'mongoose'
import { requireAuth } from '@/lib/auth'
import { Notification as AcademicsNotification } from '@/lib/models'


const NotificationSchema = new Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['match', 'medical', 'training', 'general', 'info', 'warning', 'success', 'error'], default: 'general' },
  link:      { type: String },       // ← NEW: for academics notifications that deep-link somewhere
  forRoles:  [{ type: String }],
  forUser:   { type: Schema.Types.ObjectId, ref: 'User' },
  read:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)


export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  await connectDB()

  const userId = session!.user.id
  const role   = session!.user.role

  const notifications = await Notification.find({
    $or: [
      { forRoles: role },                                    // broadcast to this role
      { forRoles: { $size: 0 }, forUser: { $exists: false } }, // broadcast to all roles (and NOT a per-user notification)
      { forUser: userId },                                    // direct to this user (academics, etc.)
    ],
  })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const result = (notifications as unknown as Array<{
    _id: unknown
    title: string
    message: string
    type: string
    link?: string
    read?: Array<{ toString(): string }>
    [key: string]: unknown
  }>).map(n => ({
    ...n,
    isRead: n.read?.some(r => r.toString() === userId) ?? false,
  }))

  return NextResponse.json({
    notifications: result,
    unreadCount:   result.filter(n => !n.isRead).length,
  })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req, ['admin', 'coach'])
  if (error) return error

  const body = await req.json()
  await connectDB()

  const notif = await Notification.create({ ...body, createdBy: session!.user.id })
  return NextResponse.json(notif, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id, all } = await req.json()
  const userId = session!.user.id
  const role   = session!.user.role

  await connectDB()

  if (all) {
    await Notification.updateMany(
      { $or: [{ forRoles: role }, { forRoles: { $size: 0 }, forUser: { $exists: false } }, { forUser: userId }] },
      { $addToSet: { read: userId } }
    )
  } else if (id) {
    await Notification.findByIdAndUpdate(id, { $addToSet: { read: userId } })
  }

  return NextResponse.json({ success: true })
}
