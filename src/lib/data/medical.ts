import { connectDB } from '@/lib/db'
import { MedicalRecord, Player } from '@/lib/models'

export async function getMedicalPageData() {
  await connectDB()

  const [records, players] = await Promise.all([
    MedicalRecord.find()
      .populate(
        'player',
        'fullName position jerseyNumber profileImage'
      )
      .populate('recordedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean(),

    Player.find()
      .select(
        'fullName jerseyNumber position fitnessStatus profileImage squad'
      )
      .sort({ fullName: 1 })
      .lean(),
  ])

  return JSON.parse(
    JSON.stringify({
      records,
      players,
    })
  )
}