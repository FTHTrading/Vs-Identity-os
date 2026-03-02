#!/usr/bin/env node
/**
 * Identity Capsule OS — Automated setup script
 *
 * Usage:
 *   node scripts/setup.js
 *
 * What it does:
 *   1. Copies .env.example → .env (if .env doesn't exist)
 *   2. Generates a secure random JWT_SECRET (64 hex chars)
 *   3. Generates an ECDSA P-256 key pair using Node.js crypto (no openssl needed)
 *   4. Base64-encodes the PEM keys and writes them into .env
 *   5. Prints a summary of what was done and what still needs manual filling
 */

const fs   = require('fs');
const path = require('path');
const { generateKeyPairSync, randomBytes } = require('crypto');

const ROOT    = path.join(__dirname, '..');
const ENV_EX  = path.join(ROOT, '.env.example');
const ENV_OUT = path.join(ROOT, '.env');

// ── 1. Bootstrap .env ──────────────────────────────────────────────────────
if (!fs.existsSync(ENV_OUT)) {
  if (!fs.existsSync(ENV_EX)) {
    console.error('❌  .env.example not found — cannot bootstrap .env');
    process.exit(1);
  }
  fs.copyFileSync(ENV_EX, ENV_OUT);
  console.log('✅  Created .env from .env.example');
} else {
  console.log('ℹ️   .env already exists — updating ECDSA keys and JWT_SECRET only');
}

// ── 2. Generate JWT_SECRET ─────────────────────────────────────────────────
const jwtSecret        = randomBytes(32).toString('hex'); // 64 hex chars
const jwtRefreshSecret = randomBytes(32).toString('hex'); // separate refresh secret

// ── 3. Generate ECDSA P-256 key pair ──────────────────────────────────────
const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'sec1', format: 'pem' },
  publicKeyEncoding:  { type: 'spki', format: 'pem' },
});

const privateB64 = Buffer.from(privateKey).toString('base64');
const publicB64  = Buffer.from(publicKey).toString('base64');

// ── 4. Patch .env ──────────────────────────────────────────────────────────
let env = fs.readFileSync(ENV_OUT, 'utf8');

function setEnvVar(content, key, value) {
  const re = new RegExp(`^(${key}=).*$`, 'm');
  if (re.test(content)) {
    return content.replace(re, `$1${value}`);
  }
  // key not present — append it
  return content.trimEnd() + `\n${key}=${value}\n`;
}

env = setEnvVar(env, 'JWT_SECRET',                  jwtSecret);
env = setEnvVar(env, 'JWT_REFRESH_SECRET',           jwtRefreshSecret);
env = setEnvVar(env, 'SIGNING_PRIVATE_KEY_BASE64',   privateB64);
env = setEnvVar(env, 'SIGNING_PUBLIC_KEY_BASE64',    publicB64);

fs.writeFileSync(ENV_OUT, env, 'utf8');

// ── 5. Summary ─────────────────────────────────────────────────────────────
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Identity Capsule OS — Setup Complete');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✅  JWT_SECRET                 generated (64-char hex)');
console.log('✅  JWT_REFRESH_SECRET         generated (64-char hex)');
console.log('✅  SIGNING_PRIVATE_KEY_BASE64 generated (P-256 sec1 PEM → base64)');
console.log('✅  SIGNING_PUBLIC_KEY_BASE64  generated (P-256 spki PEM → base64)');
console.log('');
console.log('⚠️   Still required — fill in .env manually:');
console.log('');
console.log('    DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>');
console.log('');
console.log('    Or start the local DB with Docker:');
console.log('');
console.log('    docker compose up -d db');
console.log('    # Then set: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/identity_capsule_os');
console.log('');
console.log('Next steps:');
console.log('');
console.log('  1. Fill in DATABASE_URL in .env');
console.log('  2. pnpm db:migrate    ← run Prisma migrations');
console.log('  3. pnpm db:seed       ← create admin user + demo tenant');
console.log('  4. pnpm dev           ← start dev server at http://localhost:3000');
console.log('');
console.log('Default admin after seed:');
console.log('  Email:    admin@example.com');
console.log('  Password: admin123!');
console.log('');
