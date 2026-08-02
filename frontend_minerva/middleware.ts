import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface JWTPayload {
  exp: number
  user_id: number
}

function isTokenValidSync(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp > now
  } catch {
    return false
  }
}

function redirectToLogin(request: NextRequest, returnUrl?: string): NextResponse {
  const loginUrl = new URL('/login', request.url)
  if (returnUrl) {
    loginUrl.searchParams.set('returnUrl', returnUrl)
  }

  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete('access')
  response.cookies.delete('refresh')
  response.cookies.set('access', '', { expires: new Date(0), path: '/' })
  response.cookies.set('refresh', '', { expires: new Date(0), path: '/' })

  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
  ]

  const staticRoutes = [
    '/favicon.ico',
    '/_next',
    '/images',
    '/icons',
    '/manifest.json',
  ]

  if (staticRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  const accessToken = request.cookies.get('access')?.value
  const refreshToken = request.cookies.get('refresh')?.value

  if (pathname === '/') {
    if (accessToken && isTokenValidSync(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (!accessToken && !refreshToken) {
      return redirectToLogin(request)
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isPublicRoute) {
    if (!accessToken && !refreshToken) {
      return redirectToLogin(request, pathname)
    }
    if (accessToken && isTokenValidSync(accessToken)) {
      return NextResponse.next()
    }
    if (refreshToken) {
      return NextResponse.next()
    }
    return redirectToLogin(request, pathname)
  }

  if (pathname === '/login') {
    if (accessToken && isTokenValidSync(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    const response = NextResponse.next()
    if (accessToken && !isTokenValidSync(accessToken)) {
      response.cookies.delete('access')
      response.cookies.delete('refresh')
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
