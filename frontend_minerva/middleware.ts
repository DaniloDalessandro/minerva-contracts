import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface JWTPayload {
  exp: number
  user_id: number
}

// Validação síncrona do token JWT
function isTokenValidSync(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp > now
  } catch {
    return false
  }
}

// Função para redirecionar para login limpando cookies
function redirectToLogin(request: NextRequest, returnUrl?: string): NextResponse {
  const loginUrl = new URL('/login', request.url)
  if (returnUrl) {
    loginUrl.searchParams.set('returnUrl', returnUrl)
  }
  
  const response = NextResponse.redirect(loginUrl)
  
  // Limpar TODOS os cookies de autenticação
  response.cookies.delete('access')
  response.cookies.delete('refresh')
  response.cookies.set('access', '', { expires: new Date(0), path: '/' })
  response.cookies.set('refresh', '', { expires: new Date(0), path: '/' })
  
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/password-reset',
    '/forgot-password',
    '/reset-password',
    '/demo-validation',
    '/demo-sector-validation'
  ]
  
  // Define static routes that should be allowed
  const staticRoutes = [
    '/favicon.ico',
    '/_next',
    '/images',
    '/icons',
    '/manifest.json'
  ]
  
  // Allow static files sempre
  const isStaticRoute = staticRoutes.some(route => pathname.startsWith(route))
  if (isStaticRoute) {
    return NextResponse.next()
  }
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('access')?.value
  const refreshToken = request.cookies.get('refresh')?.value
  
  console.log(`[MIDDLEWARE] Path: ${pathname}, AccessToken: ${!!accessToken}, RefreshToken: ${!!refreshToken}`)
  
  // ESTRATÉGIA MAIS PERMISSIVA: Dar mais chances antes de forçar logout
  
  // Root path - redirecionar apenas se claramente não autenticado
  if (pathname === '/') {
    if (accessToken && isTokenValidSync(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else if (!accessToken && !refreshToken) {
      // Só redirecionar se não tem nenhum token
      return redirectToLogin(request)
    } else {
      // Se tem refresh token, dar chance para o frontend tentar renovar
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Para rotas protegidas - VALIDAÇÃO MAIS PERMISSIVA
  if (!isPublicRoute) {
    console.log(`[MIDDLEWARE] Validando rota protegida: ${pathname}`)
    
    // Se não tem NENHUM token, bloquear
    if (!accessToken && !refreshToken) {
      console.log(`[MIDDLEWARE] SEM NENHUM TOKEN - Bloqueando`)
      return redirectToLogin(request, pathname)
    }
    
    // Se tem access token válido, permitir
    if (accessToken && isTokenValidSync(accessToken)) {
      console.log(`[MIDDLEWARE] Token válido - Permitindo acesso`)
      return NextResponse.next()
    }
    
    // Se tem refresh token mas access token inválido/ausente, permitir e deixar o frontend tentar renovar
    if (refreshToken) {
      console.log(`[MIDDLEWARE] Tem refresh token - Permitindo para tentar renovação`)
      return NextResponse.next()
    }
    
    // Só bloquear se todos os tokens estão inválidos ou ausentes
    console.log(`[MIDDLEWARE] Todos os tokens inválidos - Bloqueando`)
    return redirectToLogin(request, pathname)
  }
  
  // Para rota de login
  if (pathname === '/login') {
    // Se tem token válido, redirecionar para dashboard
    if (accessToken && isTokenValidSync(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Token inválido ou sem token - limpar e permitir login
    const response = NextResponse.next()
    if (accessToken && !isTokenValidSync(accessToken)) {
      response.cookies.delete('access')
      response.cookies.delete('refresh')
    }
    return response
  }
  
  // Outras rotas públicas - permitir
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}