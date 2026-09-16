import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import { AssessmentTimetable, Player, User } from '@/lib/models'
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
  const upcoming  = searchParams.get('upcoming') === 'true'

  try {
    const query: Record<string, unknown> = { year: Number(year) }
    if (playerId) query.player = playerId
    if (semester) query.semester = Number(semester)

    const isStaff = STAFF_ROLES.includes(token.role as string)
    if (!isStaff) {
      if (!token.playerId) return NextResponse.json({ assessments: [] })
      query.player = token.playerId
    }

    let assessments = await AssessmentTimetable.find(query)
      .populate('player', 'fullName jerseyNumber position squad')
      .sort({ 'assessments.date': 1 })
      .lean()

    if (upcoming) {
      const now = new Date()
      assessments = assessments.map(doc => ({
        ...doc,
        assessments: doc.assessments.filter((a: { date: Date }) => new Date(a.date) >= now),
      })).filter(doc => doc.assessments.length > 0)
    }

    return NextResponse.json({ assessments })
  } catch (err) {
    console.error('GET /api/academics/assessments', err)
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  try {
    const body = await req.json()
    const { playerId, semester, year, assessments } = body

    const isStaff = STAFF_ROLES.includes(token.role as string)
    const targetPlayer = isStaff ? playerId : token.playerId

    if (!targetPlayer || !semester || !assessments?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await AssessmentTimetable.findOne({
      player: targetPlayer,
      semester: Number(semester),
      year: Number(year) || new Date().getFullYear(),
    })

    if (existing) {
      existing.assessments = assessments
      existing.submittedAt = new Date()
      await existing.save()
      fireConfirmation(targetPlayer, Number(semester), Number(year) || new Date().getFullYear())
      return NextResponse.json({ timetable: existing, updated: true })
    }

    const timetable = await AssessmentTimetable.create({
      player: targetPlayer,
      semester: Number(semester),
      year: Number(year) || new Date().getFullYear(),
      assessments,
      submittedAt: new Date(),
    })

    fireConfirmation(targetPlayer, Number(semester), Number(year) || new Date().getFullYear())

    return NextResponse.json({ timetable, updated: false }, { status: 201 })
  } catch (err) {
    console.error('POST /api/academics/assessments', err)
    return NextResponse.json({ error: 'Failed to save assessments' }, { status: 500 })
  }
}

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
        semester, year, type: 'assessments',
      })
    })
    .catch(err => console.error('[notify] assessment confirmation failed', err))
}
