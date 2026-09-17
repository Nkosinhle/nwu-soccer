import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getMatchesPageData } from '@/lib/data/matches'

import MatchesClient from './MatchesClient'

export default async function MatchesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const data = await getMatchesPageData()

  return (
    <MatchesClient
      initialMatches={data.matches}
      teams={data.teams}
      players={data.players}
      role={session.user?.role ?? ''}
    />
  )
}