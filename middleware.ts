import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/agent', '/admin', '/properties/new']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (!isProtected) return NextResponse.next()

  // Check for Supabase auth cookie as a basic verification
  const hasAuth = req.cookies.has('sb-access-token') || req.cookies.has('sb-session')

  if (!hasAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/agent/:path*', '/admin/:path*', '/properties/new']
}
