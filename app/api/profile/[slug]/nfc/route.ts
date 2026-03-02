/**
 * POST /api/profile/[slug]/nfc
 * Generates and stores an NFC payload (EDITOR+)
 *
 * GET /api/profile/[slug]/nfc
 * Returns all NFC payloads for this profile
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildNfcPayload } from '@/lib/nfc';
import { nfcPayloadSchema } from '@/lib/validation';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { apiSuccess, apiError } from '@/lib/utils';
import { hasMinRole } from '@/lib/auth';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId, slug: params.slug } },
    include: { nfcPayloads: { orderBy: { createdAt: 'desc' } } },
  });

  if (!profile) return apiError('Profile not found', 404, 'NOT_FOUND');

  return apiSuccess(profile.nfcPayloads);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as string;

  if (!tenantId || !userId) return apiError('Not authenticated', 401, 'UNAUTHORIZED');
  if (!hasMinRole(role as never, 'EDITOR')) return apiError('Insufficient permissions', 403, 'FORBIDDEN');

  const { slug } = params;

  const profile = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });

  if (!profile) return apiError('Profile not found', 404, 'NOT_FOUND');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  const parsed = nfcPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { mode, label } = parsed.data;
  const result = buildNfcPayload({ slug, mode });

  const nfcRecord = await prisma.nfcPayload.create({
    data: {
      profileId: profile.id,
      mode,
      payload: result.payload,
      label: label ?? result.label,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(request);
  await logActivity({
    tenantId,
    userId,
    action: 'CREATE_NFC_PAYLOAD',
    entityType: 'Profile',
    entityId: profile.id,
    afterData: { nfcId: nfcRecord.id, mode, payload: result.payload },
    ipAddress,
    userAgent,
  });

  return apiSuccess({ ...nfcRecord, byteLength: result.byteLength });
}
