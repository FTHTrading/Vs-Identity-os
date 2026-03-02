import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type HealthStatus = 'ok' | 'degraded' | 'error';

interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: HealthStatus; latencyMs?: number; error?: string };
    environment: { status: HealthStatus; missing?: string[] };
  };
}

const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SIGNING_PRIVATE_KEY_BASE64',
  'SIGNING_PUBLIC_KEY_BASE64',
] as const;

export async function GET() {
  const start = Date.now();

  // ── Environment check ───────────────────────────────────────────────────
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
  const envCheck: HealthReport['checks']['environment'] =
    missingEnv.length === 0
      ? { status: 'ok' }
      : { status: 'error', missing: missingEnv };

  // ── Database check ──────────────────────────────────────────────────────
  let dbCheck: HealthReport['checks']['database'];
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbCheck = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err) {
    dbCheck = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown DB error',
    };
  }

  // ── Aggregate ────────────────────────────────────────────────────────────
  const allOk = envCheck.status === 'ok' && dbCheck.status === 'ok';
  const anyError = envCheck.status === 'error' || dbCheck.status === 'error';

  const report: HealthReport = {
    status: allOk ? 'ok' : anyError ? 'error' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: dbCheck,
      environment: envCheck,
    },
  };

  const httpStatus = allOk ? 200 : anyError ? 503 : 207;

  return NextResponse.json(report, { status: httpStatus });
}
