/**
 * GET /api/profile/[slug]/qr
 * Returns a PNG QR code pointing to the profile URL
 * Public — no auth required
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQrBuffer } from '@/lib/qrcode';
import { apiError } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const rateLimit = checkRateLimit(ip, 'qr');
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded', 429, 'RATE_LIMITED');
  }

  if (!slug?.match(/^[a-z0-9-]+$/)) {
    return apiError('Invalid slug', 400);
  }

  const profile = await prisma.profile.findFirst({
    where: { slug, isPublic: true, isActive: true },
    select: { id: true },
  });

  if (!profile) {
    return apiError('Profile not found', 404, 'NOT_FOUND');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const profileUrl = `${appUrl}/profile/${slug}`;

  // Parse optional color overrides from query params
  const { searchParams } = new URL(request.url);
  const dark = searchParams.get('dark') ?? '#1e293b';
  const light = searchParams.get('light') ?? '#ffffff';
  const size = Math.min(1000, Math.max(100, parseInt(searchParams.get('size') ?? '300')));

  const pngBuffer = await generateQrBuffer({
    data: profileUrl,
    size,
    darkColor: dark,
    lightColor: light,
    errorCorrectionLevel: 'Q',
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(pngBuffer.byteLength),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
