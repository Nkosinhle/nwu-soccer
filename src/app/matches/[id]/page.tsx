import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getMatchDetailData } from '@/lib/data/matches'

import MatchClient from './MatchClient'

interface MatchDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MatchDetailPage({
  params,
}: MatchDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  const data = await getMatchDetailData(id)

  if (!data) {
    notFound()
  }

  return (
    <MatchClient
      initialMatch={data.match}
      initialStats={data.stats}
      initialSquadPlayers={data.squadPlayers}
      role={session.user?.role ?? ''}
    />
  )
}