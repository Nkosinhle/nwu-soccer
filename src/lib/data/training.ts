import { connectDB } from '@/lib/db'
import { Team, TrainingSession } from '@/lib/models'

export async function getTrainingPageData() {
  await connectDB()

  const [sessions, teams] = await Promise.all([
    TrainingSession.find()
      .populate('squad', 'name')
      .populate('attendance.player', 'fullName jerseyNumber position')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .lean(),

    Team.find()
      .select('name type season')
      .sort({ type: 1 })
      .lean(),
  ])

  return JSON.parse(
    JSON.stringify({
      sessions,
      teams,
    })
  )
}

export async function getTrainingDetailData(id: string) {
  await connectDB()

  const training = await TrainingSession.findById(id)
    .populate('squad', 'name type')
    .populate('createdBy', 'name role')
    .populate(
      'attendance.player',
      'fullName jerseyNumber position profileImage'
    )
    .lean()

  if (!training) return null

  const populatedSquad = (training as any).squad

  const squadId = populatedSquad?._id
    ? String(populatedSquad._id)
    : populatedSquad
      ? String(populatedSquad)
      : null

  const team = squadId
    ? await Team.findById(squadId)
        .populate(
          'players',
          'fullName jerseyNumber position fitnessStatus profileImage'
        )
        .lean()
    : null

  return JSON.parse(
    JSON.stringify({
      training,
      squadPlayers: (team as any)?.players ?? [],
    })
  )
}