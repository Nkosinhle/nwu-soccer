import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Header from '@/components/layout/Header'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Player } from '@/lib/models'
import PlayerList from './PlayerList'

export default async function PlayersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  await connectDB()

  const players = await Player.find({})
    .select(
      'fullName nickname studentNumber jerseyNumber position fitnessStatus profileImage squad'
    )
    .populate('squad', 'name type')
    .lean()

  const serializedPlayers = JSON.parse(
    JSON.stringify(players)
  )

  return (
    <div className="animate-fade-in">
      <Header
        title="Players"
        subtitle={`${serializedPlayers.length} players across all squads`}
      />

      <PlayerList
        initialPlayers={serializedPlayers}
        role={session.user.role}
      />
    </div>
  )
}