#!/bin/sh
# docker-entrypoint.sh
#
# Waits for PostgreSQL to be ready, validates environment variables, runs
# Prisma migrations, then starts the application.

set -e

# ── Config ──────────────────────────────────────────────────────────────────
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
MAX_RETRIES="${DB_MAX_RETRIES:-30}"
RETRY_DELAY="${DB_RETRY_DELAY:-2}"

# ── Helpers ─────────────────────────────────────────────────────────────────
log() { printf '[entrypoint] %s\n' "$*"; }
ok()  { printf '[entrypoint] ✅ %s\n' "$*"; }
err() { printf '[entrypoint] ❌ %s\n' "$*" >&2; }

# ── Wait for PostgreSQL ─────────────────────────────────────────────────────
log "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}…"

RETRY=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    err "PostgreSQL not ready after $MAX_RETRIES retries."
    err "Check DB_HOST=${DB_HOST} and DB_PORT=${DB_PORT}."
    exit 1
  fi
  log "  retry ${RETRY}/${MAX_RETRIES} — sleeping ${RETRY_DELAY}s"
  sleep "$RETRY_DELAY"
done

ok "PostgreSQL is ready."

# ── Environment validation ───────────────────────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${JWT_SECRET:?JWT_SECRET must be set}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET must be set}"
: "${SIGNING_PRIVATE_KEY_BASE64:?SIGNING_PRIVATE_KEY_BASE64 must be set}"
: "${SIGNING_PUBLIC_KEY_BASE64:?SIGNING_PUBLIC_KEY_BASE64 must be set}"

ok "Environment variables validated."

# ── Run migrations ───────────────────────────────────────────────────────────
log "Running Prisma migrations…"
node scripts/migrate-deploy.js
ok "Migrations complete."

# ── Start the application ────────────────────────────────────────────────────
log "Starting application: $*"
exec "$@"
