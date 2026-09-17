import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getPerformancePageData } from '@/lib/data/performance'
import PerformanceClient from './PerformanceClient'

export default async function PerformancePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const data = await getPerformancePageData()

  return (
    <PerformanceClient
      initialStats={data.stats}
      teams={data.teams}
    />
  )
}