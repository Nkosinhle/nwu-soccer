import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getTeams } from '@/lib/data/teams'

import TeamsClient from './TeamsClient'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const teams = await getTeams()

  return (
    <TeamsClient
      initialTeams={teams}
      role={session.user?.role ?? ''}
    />
  )
}