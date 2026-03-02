#!/usr/bin/env node
/**
 * migrate-deploy.js
 *
 * Production-safe Prisma migration runner.
 * Uses `prisma migrate deploy` (NOT `migrate dev`) — never creates new
 * migration files, only applies pending migrations from the migrations folder.
 *
 * Usage:
 *   node scripts/migrate-deploy.js
 *   pnpm db:migrate:prod
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── Validation ─────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('\n❌  DATABASE_URL is not set.\n');
  console.error('    Set it before running migrations:');
  console.error('    DATABASE_URL=postgres://... node scripts/migrate-deploy.js\n');
  process.exit(1);
}

// ── Run migrations ──────────────────────────────────────────────────────────
console.log('⏳  Running Prisma migrations (migrate deploy)…');

const startMs = Date.now();

try {
  execSync('npx prisma migrate deploy', {
    cwd:   ROOT,
    stdio: 'inherit',
    env:   process.env,
  });
} catch (err) {
  console.error('\n❌  Prisma migrate deploy failed.\n');
  process.exit(1);
}

const elapsed = ((Date.now() - startMs) / 1000).toFixed(2);
console.log(`✅  Migrations complete (${elapsed}s)\n`);
