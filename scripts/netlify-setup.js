#!/usr/bin/env node
/**
 * Identity Capsule OS — Netlify automated setup
 *
 * Usage:
 *   node scripts/netlify-setup.js
 *
 * Prerequisites:
 *   1. Run `node scripts/setup.js` first (generates .env with keys)
 *   2. Fill in DATABASE_URL in .env
 *   3. Have netlify-cli available: npx netlify-cli ...
 *   4. Be authenticated: npx netlify-cli login
 *
 * What it does:
 *   1. Verifies netlify-cli auth status
 *   2. Creates (or links) a Netlify site named "vs-identity-os"
 *   3. Pushes all .env variables to Netlify as environment variables
 *   4. Triggers an initial production build+deploy
 *   5. Prints the live site URL
 */

const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const ENV_FILE    = path.join(ROOT, '.env');
const NETLIFY_CFG = path.join(ROOT, '.netlify', 'state.json');
const SITE_NAME   = 'vs-identity-os';

// ── Helpers ────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', ...opts });
  } catch (e) {
    return null;
  }
}

function netlify(args, opts = {}) {
  const result = spawnSync(
    'npx', ['--yes', 'netlify-cli', ...args.split(' ')],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env }, ...opts }
  );
  return { stdout: result.stdout || '', stderr: result.stderr || '', status: result.status };
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .reduce((acc, line) => {
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      if (key && val && !val.includes('<') && !val.includes('your-')) {
        acc[key] = val;
      }
      return acc;
    }, {});
}

function step(n, msg) {
  console.log(`\n[${n}] ${msg}`);
  console.log('─'.repeat(50));
}

// ── Skip vars that are placeholders or empty ───────────────────────────────
const SKIP_VARS = new Set([
  'NODE_ENV',
]);

// ── Main ───────────────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║    Identity Capsule OS — Netlify Automated Setup     ║');
console.log('╚══════════════════════════════════════════════════════╝');

// Step 1 — Check .env exists
step(1, 'Checking .env');
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌  .env not found. Run `node scripts/setup.js` first.');
  process.exit(1);
}
const envVars = parseEnvFile(ENV_FILE);
console.log(`✅  .env found — ${Object.keys(envVars).length} variables loaded`);

const missing = ['DATABASE_URL', 'JWT_SECRET', 'ECDSA_PRIVATE_KEY_B64', 'ECDSA_PUBLIC_KEY_B64']
  .filter(k => !envVars[k]);
if (missing.length) {
  console.error(`❌  Missing required .env vars: ${missing.join(', ')}`);
  console.error('    Run `node scripts/setup.js` then fill in DATABASE_URL.');
  process.exit(1);
}
console.log('✅  All required env vars present');

// Step 2 — Check netlify-cli auth
step(2, 'Checking Netlify authentication');
const authCheck = netlify('status --json');
if (authCheck.status !== 0 || authCheck.stdout.includes('"error"')) {
  console.error('❌  Not logged in to Netlify.');
  console.error('    Run: npx netlify-cli login');
  process.exit(1);
}
console.log('✅  Authenticated with Netlify');

// Step 3 — Create or link site
step(3, 'Setting up Netlify site');

let siteId = null;

// Check if already linked
if (fs.existsSync(NETLIFY_CFG)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(NETLIFY_CFG, 'utf8'));
    if (cfg.siteId) {
      siteId = cfg.siteId;
      console.log(`✅  Already linked to site: ${siteId}`);
    }
  } catch (_) {}
}

if (!siteId) {
  console.log(`    Creating Netlify site: ${SITE_NAME}`);
  const createResult = netlify(`sites:create --name ${SITE_NAME} --account-slug FTHTrading`);
  if (createResult.status !== 0) {
    // Site may already exist — try to link by name
    console.log('    Site may already exist, attempting to find it...');
    const listResult = netlify('sites:list --json');
    if (listResult.status === 0) {
      try {
        const sites = JSON.parse(listResult.stdout);
        const match = sites.find(s => s.name === SITE_NAME || s.custom_domain === `${SITE_NAME}.netlify.app`);
        if (match) {
          siteId = match.id;
          console.log(`✅  Found existing site: ${match.name} (${siteId})`);
        }
      } catch (_) {}
    }
    if (!siteId) {
      console.error('❌  Could not create or find Netlify site.');
      console.error('    Create it manually at https://app.netlify.com then run:');
      console.error('    npx netlify-cli link');
      process.exit(1);
    }
  } else {
    // Parse site ID from output
    const idMatch = createResult.stdout.match(/Site ID:\s+(\S+)/);
    if (idMatch) siteId = idMatch[1];
    console.log(`✅  Created site: ${SITE_NAME} (${siteId})`);
  }

  // Write .netlify/state.json
  fs.mkdirSync(path.join(ROOT, '.netlify'), { recursive: true });
  fs.writeFileSync(NETLIFY_CFG, JSON.stringify({ siteId }, null, 2), 'utf8');
  console.log('✅  Linked site in .netlify/state.json');
}

// Step 4 — Push environment variables
step(4, 'Syncing environment variables to Netlify');

const varsToPush = Object.entries(envVars)
  .filter(([k]) => !SKIP_VARS.has(k));

let pushed = 0;
let failed = 0;

for (const [key, value] of varsToPush) {
  // Escape the value for shell — wrap in single quotes, escape single quotes inside
  const escaped = value.replace(/'/g, "'\\''");
  const r = netlify(`env:set ${key} '${escaped}'`);
  if (r.status === 0) {
    process.stdout.write(`  ✅  ${key}\n`);
    pushed++;
  } else {
    process.stdout.write(`  ⚠️   ${key} — ${r.stderr.trim().split('\n')[0]}\n`);
    failed++;
  }
}

console.log(`\n    ${pushed} vars pushed${failed ? `, ${failed} warnings` : ''}`);

// Step 5 — Trigger deploy
step(5, 'Triggering production deploy');
console.log('    Running: pnpm build → netlify deploy --prod');
const buildResult = netlify('deploy --build --prod', { stdio: 'inherit' });

if (buildResult.status === 0) {
  console.log('\n✅  Deploy complete!');
} else {
  console.log('\n⚠️   Deploy command returned non-zero. Check output above.');
  console.log('    You can manually deploy with: npx netlify-cli deploy --build --prod');
}

// Step 6 — Summary
const siteUrl = envVars['NEXT_PUBLIC_APP_URL'] || `https://${SITE_NAME}.netlify.app`;
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Netlify Setup Complete!');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`  Live URL:    ${siteUrl}`);
console.log(`  Netlify ID:  ${siteId}`);
console.log('');
console.log('  GitHub Secrets needed for CI/CD (Settings → Secrets → Actions):');
console.log('');
console.log('    NETLIFY_AUTH_TOKEN   npx netlify-cli token:list (or user settings)');
console.log(`    NETLIFY_SITE_ID      ${siteId}`);
console.log('    DATABASE_URL         (your production DB connection string)');
console.log('    JWT_SECRET           (already in .env)');
console.log('    ECDSA_PRIVATE_KEY_B64 (already in .env)');
console.log('    ECDSA_PUBLIC_KEY_B64  (already in .env)');
console.log('');
