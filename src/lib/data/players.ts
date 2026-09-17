import { connectDB } from '@/lib/db'
import { Player } from '@/lib/models'

export async function getPlayers() {
  await connectDB()

  const players = await Player.find({})
    .select(
      'fullName jerseyNumber position fitnessStatus profileImage squad'
    )
    .populate('squad', 'name type')
    .lean()

  return JSON.parse(JSON.stringify(players))
}