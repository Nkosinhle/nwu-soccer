import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getDashboardData } from '@/lib/dashboard-data'

import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const dashboardData = await getDashboardData()

  return (
    <DashboardClient
      initialData={dashboardData}
      user={{
        name: session.user?.name ?? '',
        role: session.user?.role ?? '',
      }}
    />
  )
}