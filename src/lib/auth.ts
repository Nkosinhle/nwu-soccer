import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export type Role = 'admin' | 'coach' | 'physio' | 'support_staff' | 'player'

/**
 * Pass the NextRequest object directly — getToken reads the cookie from it.
 * This is the ONLY approach that works reliably in Next.js 16 API routes.
 */
export async function requireAuth(req: NextRequest, allowedRoles?: Role[]) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
    })

    if (!token) {
      return {
        error:   NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        session: null,
      }
    }

    const role = token.role as Role

    if (allowedRoles && !allowedRoles.includes(role)) {
      return {
        error:   NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        session: null,
      }
    }

    return {
      error: null,
      session: {
        user: {
          id:       token.sub      as string,
          email:    token.email    as string,
          name:     token.name     as string,
          role,
          avatar:   token.avatar   as string | undefined,
          playerId: token.playerId as string | undefined,
        },
      },
    }
  } catch (err) {
    console.error('[requireAuth]', err)
    return {
      error:   NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }
}

export function formatRole(role: string): string {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}
