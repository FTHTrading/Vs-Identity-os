/**
 * GET /api/vcard/[slug]
 * Returns a .vcf file for download / NFC tap
 * Rate limited — no auth required (public endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVCard } from '@/lib/vcard';
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { apiError } from '@/lib/utils';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = params;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Strict rate limiting on vcard endpoint
  const rateLimit = checkRateLimit(ip, 'vcard');
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded', 429, 'RATE_LIMITED');
  }

  if (!slug?.match(/^[a-z0-9-]+$/)) {
    return apiError('Invalid slug format', 400);
  }

  const profile = await prisma.profile.findFirst({
    where: { slug, isPublic: true, isActive: true },
  });

  if (!profile) {
    return apiError('Profile not found', 404, 'NOT_FOUND');
  }

  const vcf = generateVCard({
    fullName: profile.fullName,
    title: profile.title,
    organization: profile.organization,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    linkedIn: profile.linkedIn,
    twitter: profile.twitter,
    avatarUrl: profile.avatarUrl,
  });

  const { ipAddress, userAgent } = getRequestMeta(request);

  await logActivity({
    tenantId: profile.tenantId,
    action: 'DOWNLOAD_VCARD',
    entityType: 'Profile',
    entityId: profile.id,
    ipAddress,
    userAgent,
  });

  const headers = new Headers({
    'Content-Type': 'text/vcard; charset=utf-8',
    'Content-Disposition': `attachment; filename="${slug}.vcf"`,
    'Cache-Control': 'no-store',
    ...rateLimitHeaders(rateLimit),
  });

  return new NextResponse(vcf, { status: 200, headers });
}
