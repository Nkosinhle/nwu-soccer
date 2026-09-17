import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { getDashboardData } from '@/lib/dashboard-data'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)

  if (error) {
    return error
  }

  try {
    const data = await getDashboardData()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control':
          'private, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[Dashboard API]', error)

    return NextResponse.json(
      {
        error: 'Failed to load dashboard',
      },
      {
        status: 500,
      }
    )
  }
}