/**
 * GET  /api/admin/users  — list users in tenant (TENANT_ADMIN+)
 * POST /api/admin/users  — create user (TENANT_ADMIN+)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUserSchema } from '@/lib/validation';
import { hashPassword, hasMinRole } from '@/lib/auth';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'TENANT_ADMIN')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(users);
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId || !userId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'TENANT_ADMIN')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { email, name, password, role: newRole } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });
  if (existing) {
    return apiError('User with this email already exists', 409, 'EMAIL_CONFLICT');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { tenantId, email, name, passwordHash, role: newRole },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const { ipAddress, userAgent } = getRequestMeta(request);
  await logActivity({
    tenantId,
    userId,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user.id,
    afterData: { email: user.email, role: user.role },
    ipAddress,
    userAgent,
  });

  return apiSuccess(user);
}
