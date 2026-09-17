import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'

export async function getProfile(userId: string) {
  await connectDB()

  const user = await User.findById(userId)
    .select('-password')
    .lean()

  if (!user) {
    return null
  }

  return JSON.parse(JSON.stringify(user))
}