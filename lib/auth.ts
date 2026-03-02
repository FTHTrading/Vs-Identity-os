/**
 * Auth Utilities
 * JWT creation/verification, password hashing, session management
 */
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export interface SessionUser {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
}

// ─────────────────────────────────────────────
// Password Hashing
// ─────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─────────────────────────────────────────────
// JWT Tokens
// ─────────────────────────────────────────────
export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' } as JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' } as JwtPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Cookie Management
// ─────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = cookies();
  store.set('icos_access', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes
  });
  store.set('icos_refresh', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookies() {
  const store = cookies();
  store.delete('icos_access');
  store.delete('icos_refresh');
}

export function getSessionFromCookies(): SessionUser | null {
  const store = cookies();
  const accessToken = store.get('icos_access')?.value;
  if (!accessToken) return null;

  const payload = verifyAccessToken(accessToken);
  if (!payload || payload.type !== 'access') return null;

  return {
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
  };
}

// ─────────────────────────────────────────────
// RBAC Helpers
// ─────────────────────────────────────────────
// Re-export pure RBAC helpers from the client-safe module
export {
  hasMinRole,
  canEditProfiles,
  canDeleteProfiles,
  canManageUsers,
  canAccessAdmin,
} from '@/lib/rbac';
