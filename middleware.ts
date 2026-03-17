/**
 * Next.js Edge Middleware
 * Protects /dashboard and /api routes with JWT verification
 * Rate limiting is applied on sensitive endpoints
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { checkRateLimit, rateLimitHeaders } from './lib/rate-limit';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Routes accessible without auth
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/health',
];

// Routes accessible for slugged public profiles
const PUBLIC_SLUG_PATTERNS = [
  /^\/profile\/[^/]+$/,
  /^\/api\/vcard\/[^/]+$/,
  /^\/api\/profile\/[^/]+\/qr$/,
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Allow explicitly public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow public profile and vcard routes
  if (PUBLIC_SLUG_PATTERNS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // Protected routes require valid JWT
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  
  // Apply rate limiting for API routes first
  if (pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(ip, 'api');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }
  }

  const token =
    request.cookies.get('icos_access')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Attach user info to request headers for downstream consumption
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-tenant-id', payload.tenantId as string);
    requestHeaders.set('x-user-email', payload.email as string);
    requestHeaders.set('x-user-role', payload.role as string);

    // Admin-only routes
    let allowedAdmin = true;
    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/api/admin')) {
      const role = payload.role as string;
      if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR'].includes(role)) {
        allowedAdmin = false;
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    
    // Add rate limit headers to successful API responses
    if (pathname.startsWith('/api/')) {
       const rateLimit = checkRateLimit(ip, 'api');
       const headers = rateLimitHeaders(rateLimit);
       Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v as string));
    }
    
    return response;
  } catch {
    // Token invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Token expired or invalid', code: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('icos_access');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
};
