import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getTrainingPageData } from '@/lib/data/training'
import TrainingClient from './TrainingClient'

export default async function TrainingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const data = await getTrainingPageData()

  return (
    <TrainingClient
      initialSessions={data.sessions}
      teams={data.teams}
      role={(session.user as any)?.role ?? ''}
    />
  )
}