import { connectDB } from '@/lib/db'
import {
  ClassSchedule,
  AssessmentTimetable,
  Player,
  Team,
} from '@/lib/models'

export interface AcademicsOverviewOptions {
  semester?: number
  year?: number
  squad?: string
}

export async function getAcademicsOverview({
  semester = 1,
  year = new Date().getFullYear(),
  squad = '',
}: AcademicsOverviewOptions = {}) {
  await connectDB()

  const playerQuery: Record<string, unknown> = {}

  if (squad) {
    playerQuery.squad = squad
  }

  const players = await Player.find(playerQuery)
    .select(
      'fullName jerseyNumber position squad'
    )
    .populate('squad', 'name type')
    .sort({ jerseyNumber: 1 })
    .lean()

  const playerIds = players.map(
    (player: any) => player._id
  )

  const [schedules, assessmentDocs, teams] =
    await Promise.all([
      ClassSchedule.find({
        player: { $in: playerIds },
        semester,
        year,
      })
        .select(
          'player submittedAt slots'
        )
        .lean(),

      AssessmentTimetable.find({
        player: { $in: playerIds },
        semester,
        year,
      })
        .select(
          'player submittedAt assessments'
        )
        .lean(),

      Team.find()
        .select('name type')
        .sort({ type: 1 })
        .lean(),
    ])

  const scheduleMap = new Map(
    schedules.map((schedule: any) => [
      schedule.player.toString(),
      schedule,
    ])
  )

  const assessmentMap = new Map(
    assessmentDocs.map((assessment: any) => [
      assessment.player.toString(),
      assessment,
    ])
  )

  const now = new Date()

  const overview = players.map(
    (player: any) => {
      const id = player._id.toString()

      const schedule =
        scheduleMap.get(id)

      const assessment =
        assessmentMap.get(id)

      const populatedSquad =
        player.squad as
          | {
              _id?: unknown
              name?: string
              type?: string
            }
          | null

      const upcoming =
        assessment?.assessments
          ?.filter(
            (item: any) =>
              new Date(item.date) >= now
          )
          ?.sort(
            (a: any, b: any) =>
              new Date(
                a.date
              ).getTime() -
              new Date(
                b.date
              ).getTime()
          )?.[0] ?? null

      let status:
        | 'complete'
        | 'partial'
        | 'none'

      if (!schedule && !assessment) {
        status = 'none'
      } else if (
        !schedule ||
        !assessment
      ) {
        status = 'partial'
      } else {
        status = 'complete'
      }

      return {
        player: {
          _id: player._id,
          name: player.fullName,
          jerseyNumber:
            player.jerseyNumber,
          position: player.position,
          squad:
            populatedSquad?.name ?? '—',
          squadType:
            populatedSquad?.type ?? null,
        },

        classSchedule: {
          submitted: Boolean(schedule),
          submittedAt:
            schedule?.submittedAt ??
            null,
          slotCount:
            schedule?.slots?.length ?? 0,
        },

        assessmentTimetable: {
          submitted:
            Boolean(assessment),

          submittedAt:
            assessment?.submittedAt ??
            null,

          assessmentCount:
            assessment?.assessments
              ?.length ?? 0,

          nextAssessment:
            upcoming,
        },

        status,
      }
    }
  )

  const summary = {
    total: overview.length,

    complete: overview.filter(
      (item) =>
        item.status === 'complete'
    ).length,

    partial: overview.filter(
      (item) =>
        item.status === 'partial'
    ).length,

    none: overview.filter(
      (item) =>
        item.status === 'none'
    ).length,
  }

  return JSON.parse(
    JSON.stringify({
      overview,
      summary,
      teams,
      semester,
      year,
    })
  )
}

export async function getPlayerAcademicsData(
  playerId: string,
  semester: number,
  year: number
) {
  await connectDB()

  const [player, schedule, assessmentDoc] =
    await Promise.all([
      Player.findById(playerId)
        .select(
          'fullName jerseyNumber position squad'
        )
        .populate('squad', 'name type')
        .lean(),

      ClassSchedule.findOne({
        player: playerId,
        semester,
        year,
      })
        .select(
          'player semester year submittedAt slots'
        )
        .lean(),

      AssessmentTimetable.findOne({
        player: playerId,
        semester,
        year,
      })
        .select(
          'player semester year submittedAt assessments'
        )
        .lean(),
    ])

  if (!player) {
    return null
  }

  return JSON.parse(
    JSON.stringify({
      player,
      slots: schedule?.slots ?? [],
      assessments:
        assessmentDoc?.assessments ?? [],
    })
  )
}