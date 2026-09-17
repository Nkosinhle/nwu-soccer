import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getMedicalPageData } from '@/lib/data/medical'
import MedicalClient from './MedicalClient'

export default async function MedicalPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const role = (session.user as any)?.role ?? ''

  // GET /api/medical currently allows only these roles.
  if (!['admin', 'coach', 'physio'].includes(role)) {
    redirect('/dashboard')
  }

  const data = await getMedicalPageData()

  return (
    <MedicalClient
      initialRecords={data.records}
      players={data.players}
      role={role}
    />
  )
}