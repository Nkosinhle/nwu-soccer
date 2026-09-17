import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getAcademicsOverview } from '@/lib/data/academics'
import AcademicsClient from './AcademicsClient'

const STAFF_ROLES = [
  'admin',
  'coach',
  'physio',
  'support_staff',
]

export default async function AcademicsPage() {
  const session =
    await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const role =
    (session.user as any)?.role ?? ''

  // Match /api/academics/overview authorization.
  if (!STAFF_ROLES.includes(role)) {
    redirect('/dashboard')
  }

  const currentYear =
    new Date().getFullYear()

  const data =
    await getAcademicsOverview({
      semester: 1,
      year: currentYear,
    })

  return (
    <AcademicsClient
      initialOverview={data.overview}
      initialSummary={data.summary}
      teams={data.teams}
      initialSemester={1}
      initialYear={currentYear}
      role={role}
    />
  )
}