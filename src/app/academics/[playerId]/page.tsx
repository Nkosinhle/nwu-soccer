import {
  notFound,
  redirect,
} from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getPlayerAcademicsData } from '@/lib/data/academics'

import PlayerAcademicsClient from './PlayerAcademicsClient'

const STAFF_ROLES = [
  'admin',
  'coach',
  'physio',
  'support_staff',
]

interface PlayerAcademicsPageProps {
  params: Promise<{
    playerId: string
  }>

  searchParams: Promise<{
    semester?: string
    year?: string
  }>
}

export default async function PlayerAcademicsPage({
  params,
  searchParams,
}: PlayerAcademicsPageProps) {
  const session =
    await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const role =
    (session.user as any)?.role ?? ''

  /*
   * This page comes from the staff
   * Academics overview, so preserve the
   * same staff-only access rule.
   */
  if (!STAFF_ROLES.includes(role)) {
    redirect('/dashboard')
  }

  const { playerId } = await params

  const query = await searchParams

  const semester =
    Number(query.semester) || 1

  const year =
    Number(query.year) ||
    new Date().getFullYear()

  const data =
    await getPlayerAcademicsData(
      playerId,
      semester,
      year
    )

  if (!data) {
    notFound()
  }

  return (
    <PlayerAcademicsClient
      playerId={playerId}
      semester={semester}
      year={year}
      player={data.player}
      slots={data.slots}
      assessments={
        data.assessments
      }
    />
  )
}