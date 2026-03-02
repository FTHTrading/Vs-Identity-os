/**
 * GET /api/admin/activity-log
 * Returns paginated activity log (TENANT_ADMIN+)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { hasMinRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'TENANT_ADMIN')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
  const skip = (page - 1) * limit;
  const action = searchParams.get('action');
  const entityType = searchParams.get('entityType');

  const where = {
    tenantId,
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return apiSuccess(logs, { total, page, limit, pages: Math.ceil(total / limit) });
}
