/**
 * Activity Logger — immutable audit trail
 * Stores who did what, when, with before/after diff
 */
import { prisma } from './prisma';

export type ActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'CREATE_PROFILE'
  | 'UPDATE_PROFILE'
  | 'DELETE_PROFILE'
  | 'VIEW_PROFILE'
  | 'DOWNLOAD_VCARD'
  | 'SIGN_PROFILE'
  | 'CREATE_NFC_PAYLOAD'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'ACCESS_DENIED';

interface LogActivityParams {
  tenantId: string;
  userId?: string;
  action: ActionType;
  entityType?: string;
  entityId?: string;
  beforeData?: object | null;
  afterData?: object | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeData: params.beforeData ?? undefined,
        afterData: params.afterData ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    // Log failures must NEVER crash main operations
    console.error('[ActivityLog] Failed to write log entry:', err);
  }
}

/**
 * Extract IP and User-Agent from a Next.js Request
 */
export function getRequestMeta(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  return { ipAddress, userAgent };
}
