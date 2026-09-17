import { connectDB } from '@/lib/db'
import { PlayerStats, Team } from '@/lib/models'

export async function getPerformancePageData() {
  await connectDB()

  const [stats, teams] = await Promise.all([
    PlayerStats.find()
      .populate(
        'player',
        'fullName position jerseyNumber profileImage squad'
      )
      .populate(
        'match',
        'opponent date score status'
      )
      .sort({ createdAt: -1 })
      .lean(),

    Team.find()
      .select('name type season')
      .sort({ type: 1 })
      .lean(),
  ])

  return JSON.parse(
    JSON.stringify({
      stats,
      teams,
    })
  )
}