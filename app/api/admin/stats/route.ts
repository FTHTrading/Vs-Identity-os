/**
 * GET /api/admin/stats
 * Returns dashboard summary stats for the current tenant (EDITOR+)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { hasMinRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'EDITOR')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  const [
    totalProfiles,
    activeProfiles,
    publicProfiles,
    totalUsers,
    signedProfiles,
    recentActivity,
  ] = await Promise.all([
    prisma.profile.count({ where: { tenantId } }),
    prisma.profile.count({ where: { tenantId, isActive: true } }),
    prisma.profile.count({ where: { tenantId, isActive: true, isPublic: true } }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.profileSignature.count({
      where: { profile: { tenantId } },
    }),
    prisma.activityLog.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return apiSuccess({
    totalProfiles,
    activeProfiles,
    publicProfiles,
    totalUsers,
    signedProfiles,
    recentActivity,
  });
}
