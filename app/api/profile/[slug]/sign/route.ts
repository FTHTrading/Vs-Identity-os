/**
 * POST /api/profile/[slug]/sign
 * Signs a profile snapshot with ECDSA P-256 private key (EDITOR+)
 *
 * GET /api/profile/[slug]/sign
 * Returns the latest signature for verification
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildProfileSnapshot,
  toCanonicalJson,
  signProfile,
  verifySignature,
} from '@/lib/crypto';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { apiSuccess, apiError } from '@/lib/utils';
import { hasMinRole } from '@/lib/auth';

interface RouteParams {
  params: { slug: string };
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

  const snapshot = buildProfileSnapshot(profile);
  const canonicalJson = toCanonicalJson(snapshot);
  const { hash, signature, algorithm, timestamp } = signProfile(canonicalJson);

  const record = await prisma.profileSignature.create({
    data: {
      profileId: profile.id,
      hash,
      signature,
      algorithm,
      profileSnapshot: snapshot,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(request);

  await logActivity({
    tenantId,
    userId,
    action: 'SIGN_PROFILE',
    entityType: 'Profile',
    entityId: profile.id,
    afterData: { signatureId: record.id, hash, timestamp },
    ipAddress,
    userAgent,
  });

  return apiSuccess({
    signatureId: record.id,
    hash,
    signature,
    algorithm,
    timestamp,
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = params;

  const profile = await prisma.profile.findFirst({
    where: { slug, isActive: true },
    include: {
      signatures: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          hash: true,
          signature: true,
          algorithm: true,
          profileSnapshot: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) return apiError('Profile not found', 404, 'NOT_FOUND');

  // Verify the latest signature
  const latest = profile.signatures[0];
  let isValid = false;

  if (latest) {
    const canonicalJson = toCanonicalJson(latest.profileSnapshot as object);
    isValid = verifySignature(canonicalJson, latest.signature);
  }

  return apiSuccess({
    profileId: profile.id,
    slug,
    latestSignature: latest ?? null,
    isVerified: isValid,
    totalSignatures: profile.signatures.length,
    history: profile.signatures,
  });
}
