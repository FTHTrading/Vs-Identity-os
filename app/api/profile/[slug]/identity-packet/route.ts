/**
 * GET /api/profile/[slug]/identity-packet
 * Returns a portable, signed JSON identity packet for export / NFC SIGNED_JSON mode
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCanonicalJson, verifySignature } from '@/lib/crypto';
import { apiSuccess, apiError } from '@/lib/utils';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = params;

  const profile = await prisma.profile.findFirst({
    where: { slug, isPublic: true, isActive: true },
    include: {
      tenant: { select: { name: true, domain: true, logoUrl: true } },
      signatures: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!profile) return apiError('Profile not found', 404, 'NOT_FOUND');

  const latestSig = profile.signatures[0];
  let signatureValid = false;

  if (latestSig) {
    const canonicalJson = toCanonicalJson(latestSig.profileSnapshot as object);
    signatureValid = verifySignature(canonicalJson, latestSig.signature);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const packet = {
    version: '1.0',
    type: 'IdentityCapsulePacket',
    issuer: {
      name: profile.tenant.name,
      domain: profile.tenant.domain,
      logoUrl: profile.tenant.logoUrl,
    },
    subject: {
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
    },
    verification: latestSig
      ? {
          algorithm: latestSig.algorithm,
          hash: latestSig.hash,
          signature: latestSig.signature,
          signedAt: latestSig.createdAt.toISOString(),
          isValid: signatureValid,
          verifyUrl: `${appUrl}/api/profile/${slug}/sign`,
        }
      : null,
    profileUrl: `${appUrl}/profile/${slug}`,
    vcardUrl: `${appUrl}/api/vcard/${slug}`,
    generatedAt: new Date().toISOString(),
  };

  return apiSuccess(packet);
}
