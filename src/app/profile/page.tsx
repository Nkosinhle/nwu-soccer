import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getProfile } from '@/lib/data/profile'

import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userId = (session.user as any)?.id

  if (!userId) {
    redirect('/login')
  }

  const profile = await getProfile(userId)

  if (!profile) {
    redirect('/login')
  }

  const role = (session.user as any)?.role ?? profile.role ?? ''

  return (
    <ProfileClient
      initialProfile={profile}
      role={role}
    />
  )
}