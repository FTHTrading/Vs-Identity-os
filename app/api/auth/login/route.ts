/**
 * POST /api/auth/login
 * Validates credentials, issues JWT access + refresh tokens
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { apiSuccess, apiError } from '@/lib/utils';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Rate limit: 10 attempts per minute per IP
  const rateLimit = checkRateLimit(ip, 'login');
  const rlHeaders = rateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return apiError('Too many login attempts. Try again shortly.', 429, 'RATE_LIMITED');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid credentials', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { email, password } = parsed.data;
  const { ipAddress, userAgent } = getRequestMeta(request);

  // Find user across all tenants by email
  const user = await prisma.user.findFirst({
    where: { email, isActive: true },
    include: { tenant: { select: { id: true, name: true } } },
  });

  if (!user) {
    return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
    });
    return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokenPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  setAuthCookies(accessToken, refreshToken);

  await logActivity({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'LOGIN',
    ipAddress,
    userAgent,
  });

  const response = apiSuccess({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
    },
  });

  Object.entries(rlHeaders).forEach(([k, v]) => response.headers.set(k, v as string));
  return response;
}
