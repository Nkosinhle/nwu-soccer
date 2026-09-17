import { connectDB } from '@/lib/db'
import { Team } from '@/lib/models'

export async function getTeams() {
  await connectDB()

  const teams = await Team.find({})
    .select('name type season description players coaches')
    .lean()

  return JSON.parse(JSON.stringify(teams))
}