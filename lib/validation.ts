/**
 * Zod validation schemas for all API inputs
 */
import { z } from 'zod';

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Valid email required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────
const slugRegex = /^[a-z0-9-]+$/;

export const createProfileSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(64, 'Slug must be under 64 characters')
    .regex(slugRegex, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  fullName: z.string().min(2, 'Full name required').max(128),
  title: z.string().max(128).optional().nullable(),
  organization: z.string().max(128).optional().nullable(),
  phone: z
    .string()
    .max(32)
    .regex(/^[+\d\s\-().]*$/, 'Invalid phone format')
    .optional()
    .nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  website: z.string().url('Must be a valid URL').optional().nullable(),
  linkedIn: z.string().url('Must be a valid URL').optional().nullable(),
  twitter: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  avatarUrl: z.string().url('Must be a valid URL').optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  department: z.string().max(128).optional().nullable(),
  location: z.string().max(128).optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
  roleTags: z.array(z.string().max(64)).max(10).optional().default([]),
  isPublic: z.boolean().optional().default(true),
});

export const updateProfileSchema = createProfileSchema.partial();

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────
export const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(128),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR', 'VIEWER']).default('VIEWER'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ─────────────────────────────────────────────
// NFC
// ─────────────────────────────────────────────
export const nfcPayloadSchema = z.object({
  mode: z.enum(['URL', 'VCARD', 'SIGNED_JSON']),
  label: z.string().max(128).optional(),
});

export type NfcPayloadInput = z.infer<typeof nfcPayloadSchema>;
