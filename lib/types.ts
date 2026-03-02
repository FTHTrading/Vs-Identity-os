/**
 * Shared TypeScript types and interfaces
 */
import { Role } from '@prisma/client';

// ─────────────────────────────────────────────
// API Response Envelope
// ─────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────
export interface PublicProfile {
  id: string;
  slug: string;
  fullName: string;
  title: string | null;
  organization: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  linkedIn: string | null;
  twitter: string | null;
  github: string | null;
  avatarUrl: string | null;
  bio: string | null;
  department: string | null;
  location: string | null;
  roleTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile extends PublicProfile {
  tenantId: string;
  internalNotes: string | null;
  isPublic: boolean;
  isActive: boolean;
  createdById: string;
}

// ─────────────────────────────────────────────
// Activity Log
// ─────────────────────────────────────────────
export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────
export interface SessionUser {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
}

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────
export interface DashboardStats {
  totalProfiles: number;
  activeProfiles: number;
  totalUsers: number;
  recentActivity: number;
  signedProfiles: number;
}
