import {
  notFound,
  redirect,
} from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getTrainingDetailData } from '@/lib/data/training'
import TrainingSessionClient from './TrainingSessionClient'

interface TrainingDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TrainingDetailPage({
  params,
}: TrainingDetailPageProps) {
  const session =
    await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  const data =
    await getTrainingDetailData(id)

  if (!data) {
    notFound()
  }

  return (
    <TrainingSessionClient
      initialTraining={data.training}
      initialSquadPlayers={
        data.squadPlayers
      }
      role={
        (session.user as any)?.role ??
        ''
      }
    />
  )
}