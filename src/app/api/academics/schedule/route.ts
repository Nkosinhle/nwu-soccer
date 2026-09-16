import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import { ClassSchedule, Player, User } from '@/lib/models'
import { notify } from '@/lib/notifications'

const STAFF_ROLES = ['admin', 'coach', 'physio', 'support_staff']

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')
  const semester  = searchParams.get('semester')
  const year      = searchParams.get('year') || new Date().getFullYear()

  try {
    const query: Record<string, unknown> = { year: Number(year) }
    if (playerId) query.player = playerId
    if (semester) query.semester = Number(semester)

    const isStaff = STAFF_ROLES.includes(token.role as string)
    if (!isStaff) {
      if (!token.playerId) return NextResponse.json({ schedules: [] })
      query.player = token.playerId
    }

    const schedules = await ClassSchedule.find(query)
      .populate('player', 'fullName jerseyNumber position squad')
      .sort({ semester: 1 })
      .lean()

    return NextResponse.json({ schedules })
  } catch (err) {
    console.error('GET /api/academics/schedule', err)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  try {
    const body = await req.json()
    const { playerId, semester, year, slots } = body

    const isStaff = STAFF_ROLES.includes(token.role as string)
    const targetPlayer = isStaff ? playerId : token.playerId

    if (!targetPlayer || !semester || !slots?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await ClassSchedule.findOne({
      player: targetPlayer,
      semester: Number(semester),
      year: Number(year) || new Date().getFullYear(),
    })

    if (existing) {
      existing.slots = slots
      existing.submittedAt = new Date()
      await existing.save()
      fireConfirmation(targetPlayer, Number(semester), Number(year) || new Date().getFullYear())
      return NextResponse.json({ schedule: existing, updated: true })
    }

    const schedule = await ClassSchedule.create({
      player: targetPlayer,
      semester: Number(semester),
      year: Number(year) || new Date().getFullYear(),
      slots,
      submittedAt: new Date(),
    })

    fireConfirmation(targetPlayer, Number(semester), Number(year) || new Date().getFullYear())

    return NextResponse.json({ schedule, updated: false }, { status: 201 })
  } catch (err) {
    console.error('POST /api/academics/schedule', err)
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 })
  }
}

// Fire-and-forget confirmation. Looks up both the Player's contact details
// AND the linked User._id (via User.playerId) so the in-app notification
// can be addressed correctly in the existing forUser-based Notification model.
function fireConfirmation(playerId: string, semester: number, year: number) {
  Promise.all([
    Player.findById(playerId).select('fullName contactEmail contactPhone').lean(),
    User.findOne({ playerId }).select('_id').lean(),
  ])
    .then(([p, u]) => {
      const player = p as unknown as { fullName: string; contactEmail?: string; contactPhone?: string } | null
      const user   = u as unknown as { _id: { toString(): string } } | null
      if (!player) return
      return notify.academicsSubmitted({
        player: {
          _id: playerId,
          fullName: player.fullName,
          contactEmail: player.contactEmail,
          contactPhone: player.contactPhone,
          userId: user?._id.toString(),
        },
        semester, year, type: 'schedule',
      })
    })
    .catch(err => console.error('[notify] schedule confirmation failed', err))
}
