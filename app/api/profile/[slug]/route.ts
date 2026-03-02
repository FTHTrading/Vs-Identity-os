/**
 * GET    /api/profile/[slug]  — public or internal profile fetch
 * PATCH  /api/profile/[slug]  — update profile (EDITOR+)
 * DELETE /api/profile/[slug]  — soft-delete (TENANT_ADMIN+)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validation';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { apiSuccess, apiError } from '@/lib/utils';
import { hasMinRole } from '@/lib/auth';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const tenantId = request.headers.get('x-tenant-id');
  const role = request.headers.get('x-user-role') as string | null;
  const { slug } = params;

  if (!slug?.match(/^[a-z0-9-]+$/)) {
    return apiError('Invalid slug format', 400);
  }

  // Public access — no auth required — only return public fields
  const isAuthenticated = Boolean(tenantId);

  const profile = await prisma.profile.findFirst({
    where: {
      slug,
      isActive: true,
      // Authenticated users of the same tenant can see non-public profiles
      ...(isAuthenticated && tenantId
        ? { tenantId: tenantId as string }
        : { isPublic: true }),
    },
    include: {
      _count: { select: { signatures: true } },
      signatures: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { hash: true, signature: true, algorithm: true, createdAt: true },
      },
    },
  });

  if (!profile) {
    return apiError('Profile not found', 404, 'NOT_FOUND');
  }

  // Strip sensitive admin fields for non-editors
  const canSeeInternal =
    isAuthenticated && role && hasMinRole(role as never, 'EDITOR');

  const responseData = canSeeInternal
    ? profile
    : {
        id: profile.id,
        slug: profile.slug,
        fullName: profile.fullName,
        title: profile.title,
        organization: profile.organization,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        linkedIn: profile.linkedIn,
        twitter: profile.twitter,
        github: profile.github,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        department: profile.department,
        location: profile.location,
        roleTags: profile.roleTags,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        signatures: profile.signatures,
        _count: profile._count,
      };

  return apiSuccess(responseData);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId || !userId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'EDITOR')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  const { slug } = params;

  const existing = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (!existing) return apiError('Profile not found', 404, 'NOT_FOUND');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { ipAddress, userAgent } = getRequestMeta(request);

  const updated = await prisma.profile.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  await logActivity({
    tenantId,
    userId,
    action: 'UPDATE_PROFILE',
    entityType: 'Profile',
    entityId: existing.id,
    beforeData: existing,
    afterData: updated,
    ipAddress,
    userAgent,
  });

  return apiSuccess(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId || !userId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'TENANT_ADMIN')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  const { slug } = params;

  const existing = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (!existing) return apiError('Profile not found', 404, 'NOT_FOUND');

  const { ipAddress, userAgent } = getRequestMeta(request);

  // Soft delete
  await prisma.profile.update({
    where: { id: existing.id },
    data: { isActive: false },
  });

  await logActivity({
    tenantId,
    userId,
    action: 'DELETE_PROFILE',
    entityType: 'Profile',
    entityId: existing.id,
    beforeData: existing,
    ipAddress,
    userAgent,
  });

  return apiSuccess({ message: 'Profile deleted' });
}
