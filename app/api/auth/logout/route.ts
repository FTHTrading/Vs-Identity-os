/**
 * POST /api/auth/logout
 */
import { logActivity, getRequestMeta } from '@/lib/activity-logger';
import { clearAuthCookies, getSessionFromCookies } from '@/lib/auth';
import { apiSuccess } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = getSessionFromCookies();
  const { ipAddress, userAgent } = getRequestMeta(request);

  if (session) {
    await logActivity({
      tenantId: session.tenantId,
      userId: session.userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent,
    });
  }

  clearAuthCookies();
  return apiSuccess({ message: 'Logged out successfully' });
}
