/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const tenantId = request.headers.get('x-tenant-id');

  if (!userId || !tenantId) {
    return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      lastLoginAt: true,
      tenant: {
        select: { id: true, name: true, logoUrl: true, primaryColor: true, accentColor: true },
      },
    },
  });

  if (!user) {
    return apiError('User not found', 404, 'NOT_FOUND');
  }

  return apiSuccess({ user });
}
