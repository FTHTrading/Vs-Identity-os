/**
 * GET  /api/profile        — list profiles (paginated, filtered)
 * POST /api/profile        — create profile (EDITOR+)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProfileSchema } from '@/lib/validation';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { apiSuccess, apiError } from '@/lib/utils';
import { hasMinRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    isActive: true,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { organization: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        fullName: true,
        title: true,
        organization: true,
        phone: true,
        email: true,
        website: true,
        avatarUrl: true,
        department: true,
        roleTags: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { signatures: true } },
      },
    }),
    prisma.profile.count({ where }),
  ]);

  return apiSuccess(profiles, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId || !userId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'EDITOR')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const data = parsed.data;

  // Check slug uniqueness within tenant
  const existing = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId, slug: data.slug } },
  });
  if (existing) {
    return apiError('A profile with this slug already exists', 409, 'SLUG_CONFLICT');
  }

  const { ipAddress, userAgent } = getRequestMeta(request);

  const profile = await prisma.profile.create({
    data: {
      ...data,
      tenantId,
      createdById: userId,
    },
  });

  await logActivity({
    tenantId,
    userId,
    action: 'CREATE_PROFILE',
    entityType: 'Profile',
    entityId: profile.id,
    afterData: profile,
    ipAddress,
    userAgent,
  });

  return apiSuccess(profile, undefined);
}
