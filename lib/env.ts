/**
 * lib/env.ts
 *
 * Runtime environment validation.
 * Import this module in any API route or server component that needs env vars.
 * It throws with a clear message at startup if required vars are missing,
 * rather than failing silently at the point of use.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const secret = env.JWT_SECRET;
 */

type EnvSchema = {
  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // ECDSA signing keys
  SIGNING_PRIVATE_KEY_BASE64: string;
  SIGNING_PUBLIC_KEY_BASE64: string;

  // App
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'test' | 'production';
};

type OptionalEnvSchema = {
  NEXT_PUBLIC_APP_NAME: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  SEED_SUPER_ADMIN_EMAIL: string;
  SEED_SUPER_ADMIN_PASSWORD: string;
  LOG_LEVEL: string;
};

const REQUIRED: (keyof EnvSchema)[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SIGNING_PRIVATE_KEY_BASE64',
  'SIGNING_PUBLIC_KEY_BASE64',
];

function validateEnv(): EnvSchema & Partial<OptionalEnvSchema> {
  const missing: string[] = [];

  for (const key of REQUIRED) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const lines = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║  MISSING REQUIRED ENVIRONMENT VARIABLES                  ║',
      '╚══════════════════════════════════════════════════════════╝',
      '',
      ...missing.map((k) => `  ✗  ${k}`),
      '',
      '  Run `pnpm setup` to generate keys and .env automatically.',
      '  Then fill in DATABASE_URL.',
      '',
    ];
    throw new Error(lines.join('\n'));
  }

  return {
    DATABASE_URL:               process.env.DATABASE_URL!,
    JWT_SECRET:                 process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET:         process.env.JWT_REFRESH_SECRET!,
    JWT_EXPIRES_IN:             process.env.JWT_EXPIRES_IN             ?? '15m',
    JWT_REFRESH_EXPIRES_IN:     process.env.JWT_REFRESH_EXPIRES_IN     ?? '7d',
    SIGNING_PRIVATE_KEY_BASE64: process.env.SIGNING_PRIVATE_KEY_BASE64!,
    SIGNING_PUBLIC_KEY_BASE64:  process.env.SIGNING_PUBLIC_KEY_BASE64!,
    NEXT_PUBLIC_APP_URL:        process.env.NEXT_PUBLIC_APP_URL        ?? 'http://localhost:3000',
    NODE_ENV:                   (process.env.NODE_ENV as EnvSchema['NODE_ENV']) ?? 'development',

    // Optional
    NEXT_PUBLIC_APP_NAME:       process.env.NEXT_PUBLIC_APP_NAME,
    RATE_LIMIT_WINDOW_MS:       process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS:    process.env.RATE_LIMIT_MAX_REQUESTS,
    SEED_SUPER_ADMIN_EMAIL:     process.env.SEED_SUPER_ADMIN_EMAIL,
    SEED_SUPER_ADMIN_PASSWORD:  process.env.SEED_SUPER_ADMIN_PASSWORD,
    LOG_LEVEL:                  process.env.LOG_LEVEL,
  };
}

// Validate once on module load (server side only)
export const env = validateEnv();
