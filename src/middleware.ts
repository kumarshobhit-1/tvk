import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const blockedPaths = ['/api/secret']
  
  if (blockedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/not-found', request.url))
  }

  const protectedPaths = ['/hpcl-is-pyq', '/hpcl_is_pyq']
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Note: /admintvk01 routes are protected by (admin)/layout.tsx
  // which checks for admin authentication before rendering
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}