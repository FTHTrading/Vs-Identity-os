/**
 * Pure RBAC helper functions — no server-only imports.
 * Safe to use in both Client and Server Components.
 */
import type { Role } from '@prisma/client';

const ROLE_LEVELS: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  TENANT_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

export function canEditProfiles(role: Role): boolean {
  return hasMinRole(role, 'EDITOR');
}

export function canDeleteProfiles(role: Role): boolean {
  return hasMinRole(role, 'TENANT_ADMIN');
}

export function canManageUsers(role: Role): boolean {
  return hasMinRole(role, 'TENANT_ADMIN');
}

export function canViewActivityLog(role: Role): boolean {
  return hasMinRole(role, 'EDITOR');
}

export function canAccessAdmin(role: Role): boolean {
  return hasMinRole(role, 'EDITOR');
}
