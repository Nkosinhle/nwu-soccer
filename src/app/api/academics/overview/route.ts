import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import { ClassSchedule, AssessmentTimetable, Player, Team } from '@/lib/models'

const STAFF_ROLES = ['admin', 'coach', 'physio', 'support_staff']

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isStaff = STAFF_ROLES.includes(token.role as string)
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const semester = Number(searchParams.get('semester') || 1)
  const year     = Number(searchParams.get('year') || new Date().getFullYear())
  const squadId  = searchParams.get('squad') // Team ObjectId, optional filter

  try {
    const playerQuery: Record<string, unknown> = {}
    if (squadId) playerQuery.squad = squadId

    const players = await Player.find(playerQuery)
      .select('fullName jerseyNumber position squad')
      .populate('squad', 'name type')
      .sort({ jerseyNumber: 1 })
      .lean()

    const playerIds = players.map(p => p._id)

    const [schedules, assessmentDocs] = await Promise.all([
      ClassSchedule.find({ player: { $in: playerIds }, semester, year })
        .select('player submittedAt slots')
        .lean(),
      AssessmentTimetable.find({ player: { $in: playerIds }, semester, year })
        .select('player submittedAt assessments')
        .lean(),
    ])

    const scheduleMap   = new Map(schedules.map(s => [s.player.toString(), s]))
    const assessmentMap = new Map(assessmentDocs.map(a => [a.player.toString(), a]))

    const now = new Date()

    const overview = players.map(player => {
      const id         = player._id.toString()
      const schedule   = scheduleMap.get(id)
      const assessment = assessmentMap.get(id)
      const squad       = player.squad as unknown as { name?: string; type?: string } | null

      const upcoming = assessment?.assessments
        ?.filter((a: { date: string | Date }) => new Date(a.date) >= now)
        ?.sort((a: { date: string | Date }, b: { date: string | Date }) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )?.[0] ?? null

      return {
        player: {
          _id: player._id,
          name: player.fullName,
          jerseyNumber: player.jerseyNumber,
          position: player.position,
          squad: squad?.name ?? '—',
          squadType: squad?.type ?? null,
        },
        classSchedule: {
          submitted: !!schedule,
          submittedAt: schedule?.submittedAt ?? null,
          slotCount:   schedule?.slots?.length ?? 0,
        },
        assessmentTimetable: {
          submitted:       !!assessment,
          submittedAt:     assessment?.submittedAt ?? null,
          assessmentCount: assessment?.assessments?.length ?? 0,
          nextAssessment:  upcoming,
        },
        status: !schedule && !assessment
          ? 'none'
          : !schedule || !assessment
            ? 'partial'
            : 'complete',
      }
    })

    const summary = {
      total:    overview.length,
      complete: overview.filter(o => o.status === 'complete').length,
      partial:  overview.filter(o => o.status === 'partial').length,
      none:     overview.filter(o => o.status === 'none').length,
    }

    return NextResponse.json({ overview, summary, semester, year })
  } catch (err) {
    console.error('GET /api/academics/overview', err)
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
  }
}
