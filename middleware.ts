import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/agent', '/admin', '/properties/new']
const authCookieNames = ['sb-access-token', 'sb-refresh-token', 'sb-auth-token']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (!isProtected) return NextResponse.next()

  const hasAuthCookie = authCookieNames.some((name) => req.cookies.has(name))
  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/agent/:path*', '/admin/:path*', '/properties/new']
}
