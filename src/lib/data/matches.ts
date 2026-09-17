import { connectDB } from '@/lib/db'
import {
  Match,
  Player,
  PlayerStats,
  Team,
} from '@/lib/models'

export async function getMatchesPageData() {
  await connectDB()

  const [matches, teams, players] = await Promise.all([
    Match.find()
      .select(
        'opponent date venue location competition squad status score notes'
      )
      .populate('squad', 'name type')
      .sort({ date: -1 })
      .lean(),

    Team.find()
      .select('name type season')
      .sort({ type: 1 })
      .lean(),

    Player.find()
      .select(
        'fullName jerseyNumber position fitnessStatus profileImage squad'
      )
      .lean(),
  ])

  return JSON.parse(
    JSON.stringify({
      matches,
      teams,
      players,
    })
  )
}

export async function getMatchDetailData(id: string) {
  await connectDB()

  const match = await Match.findById(id)
    .populate('squad', 'name type')
    .populate(
      'lineup',
      'fullName position jerseyNumber profileImage fitnessStatus'
    )
    .lean()

  if (!match) {
    return null
  }

  const squadId =
    match.squad &&
    typeof match.squad === 'object' &&
    '_id' in match.squad
      ? String(match.squad._id)
      : match.squad
        ? String(match.squad)
        : null

  const [stats, team] = await Promise.all([
    PlayerStats.find({ match: id })
      .populate(
        'player',
        'fullName position jerseyNumber profileImage'
      )
      .populate('match', 'opponent date score status')
      .sort({ createdAt: -1 })
      .lean(),

    squadId
      ? Team.findById(squadId)
          .populate(
            'players',
            'fullName jerseyNumber position fitnessStatus profileImage'
          )
          .lean()
      : Promise.resolve(null),
  ])

  return JSON.parse(
    JSON.stringify({
      match,
      stats,
      squadPlayers: team?.players ?? [],
    })
  )
}