import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getNotifications } from '@/lib/data/notifications'

import NotificationsClient from './NotificationsClient'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userId =
    (session.user as any)?.id ?? ''

  const role =
    (session.user as any)?.role ?? ''

  if (!userId) {
    redirect('/login')
  }

  const data = await getNotifications(
    userId,
    role
  )

  return (
    <NotificationsClient
      initialNotifications={data.notifications}
      initialUnreadCount={data.unreadCount}
      role={role}
    />
  )
}