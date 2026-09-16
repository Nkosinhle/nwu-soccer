import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

async function handler(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip ALL checks for static files, images, and API routes
  // API routes handle their own auth via requireAuth(req)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Only check token for page routes
  const token      = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoggedIn = !!token

  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/dashboard' : '/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (!isLoggedIn && pathname !== '/login') {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export default handler
export const middleware = handler
export const proxy      = handler

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|manifest.json).*)'],
}