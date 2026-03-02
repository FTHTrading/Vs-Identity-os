<div align="center">

# 🪪 Identity Capsule OS

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Netlify](https://img.shields.io/badge/Netlify-deployed-00C7B7?style=for-the-badge&logo=netlify)](https://netlify.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A cryptographically-signed, NFC-enabled digital identity platform built for the modern web.**

*Multi-tenant · ECDSA-signed · Role-based · One-tap NFC sharing*

[🚀 Live Demo](https://vs-identity-os.netlify.app) · [📖 Docs](#-quick-start) · [🐛 Issues](https://github.com/FTHTrading/Vs-Identity-os/issues) · [🤝 Contribute](#️-roadmap)

</div>

---

## 🗂️ Table of Contents

| # | Section | Description |
|---|---------|-------------|
| 1 | [🟦 Overview](#-overview) | Architecture & Design Principles |
| 2 | [🟩 System Architecture](#-system-architecture) | Component Map & Request Lifecycle |
| 3 | [🟨 Feature Matrix](#-feature-matrix) | All Routes & Capabilities |
| 4 | [🟫 Data Model](#-data-model) | ERD & Schema Reference |
| 5 | [🟥 Auth & RBAC Flow](#-auth--rbac-flow) | JWT Lifecycle & Permissions |
| 6 | [🟪 Cryptographic Signing](#-cryptographic-signing) | ECDSA Sign & Verify |
| 7 | [🩵 NFC Payload System](#-nfc-payload-system) | Three NFC Modes |
| 8 | [🟢 Quick Start](#-quick-start) | Setup in 3 Commands |
| 9 | [🤖 Automation](#-automation) | Scripts, CI/CD & Netlify Auto-Deploy |
| 10 | [⚙️ Environment Variables](#️-environment-variables) | Config Reference |
| 11 | [📡 API Reference](#-api-reference) | All Endpoints |
| 12 | [🚀 Deployment](#-deployment) | Docker & Netlify |
| 13 | [🔒 Security Posture](#-security-posture) | Defense-in-Depth |
| 14 | [📁 Project Structure](#-project-structure) | Annotated File Tree |
| 15 | [🗺️ Roadmap](#️-roadmap) | Planned Features |

---

## 🟦 Overview

### The Problem → Solution

| Traditional ID Cards | Identity Capsule OS |
|---------------------|---------------------|
| Static, printed, easily lost | Dynamic, digital, always updated |
| No cryptographic trust | ECDSA P-256 signature on every payload |
| No access control | Multi-tenant RBAC with 4 roles |
| Requires manual sharing | One-tap NFC + QR code |
| No audit trail | Full activity log with immutable records |
| Single format | vCard 3.0, JSON identity packet, NFC NDEF |

### Core Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Zero-trust signing** | Every identity packet is signed with ECDSA P-256 before leaving the server |
| **Multi-tenancy** | All data partitioned by `tenantId` — cross-tenant reads are impossible |
| **Least privilege** | JWT claims scoped to role; middleware enforces on every request |
| **Rate limiting** | Sliding-window token bucket per IP at the edge |
| **Audit-first** | Every write generates an immutable `ActivityLog` record |
| **Portable identities** | NFC, QR, vCard, and JSON export formats supported |

---

## 🟩 System Architecture

### Component Map

```mermaid
graph TB
    subgraph Client["🌐 Browser / NFC Reader"]
        UI[Next.js App Router UI]
        NFC[NFC Tap / QR Scan]
    end

    subgraph Edge["⚡ Next.js Edge Middleware"]
        MW[middleware.ts\nJWT verify + Rate Limit]
    end

    subgraph API["🔌 API Layer — /api/*"]
        AUTH["/api/auth\nlogin · logout · me"]
        PROFILE["/api/profile\nCRUD + sign + nfc + qr"]
        VCARD["/api/vcard/slug\nvCard 3.0 generator"]
        ADMIN["/api/admin\nusers · stats · activity"]
    end

    subgraph Lib["📦 Core Libraries"]
        CRYPTO[lib/crypto.ts\nECDSA P-256]
        NFC_LIB[lib/nfc.ts\nNDEF encoder]
        QR[lib/qrcode.ts\nPNG generator]
        VCARD_LIB[lib/vcard.ts\nvCard builder]
        RBAC[lib/rbac.ts\nRole matrix]
        RATELIMIT[lib/rate-limit.ts\nToken bucket]
        ACTIVITY[lib/activity-logger.ts\nAudit trail]
    end

    subgraph DB["🗄️ PostgreSQL via Prisma"]
        SCHEMA[(Schema:\nUser · Profile\nTenant · ApiKey\nNfcTag · ActivityLog)]
    end

    UI --> MW
    NFC --> MW
    MW --> AUTH
    MW --> PROFILE
    MW --> VCARD
    MW --> ADMIN
    AUTH --> Lib
    PROFILE --> CRYPTO
    PROFILE --> NFC_LIB
    PROFILE --> QR
    PROFILE --> VCARD_LIB
    ADMIN --> ACTIVITY
    Lib --> DB
```

### Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Edge Middleware
    participant A as API Route
    participant L as Core Lib
    participant DB as PostgreSQL

    C->>MW: HTTP Request + JWT cookie
    MW->>MW: jwtVerify(token, JWT_SECRET)
    MW->>MW: Rate limit check (token bucket)
    alt Invalid JWT or rate exceeded
        MW-->>C: 401 / 429
    end
    MW->>A: Forward with decoded claims
    A->>A: Validate body (Zod schema)
    A->>DB: Prisma query (tenant-scoped)
    DB-->>A: Result rows
    A->>L: Sign / encode / transform
    L-->>A: Signed payload
    A->>DB: Write ActivityLog
    A-->>C: JSON envelope { data, meta, signature? }
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js App Router | 14.1 | SSR, API routes, middleware |
| Language | TypeScript | 5.4 | Type safety end-to-end |
| Database | PostgreSQL | 16 | Relational identity store |
| ORM | Prisma | 5.x | Type-safe DB client |
| Auth | jose (JOSE) | 6.x | JWT sign/verify |
| Crypto | Node.js `crypto` | built-in | ECDSA P-256 signing |
| Styling | Tailwind CSS | 3.x | Utility-first UI |
| Validation | Zod | 3.x | Runtime schema validation |
| QR Codes | qrcode | 1.5 | PNG QR generation |
| Container | Docker + Compose | 24 | Portable deployment |

---

## 🟨 Feature Matrix

| Route | Method | Auth Required | Role | Description |
|-------|--------|:-------------:|------|-------------|
| `/api/auth/login` | POST | ❌ | — | Issue JWT cookie |
| `/api/auth/logout` | POST | ✅ | Any | Clear JWT cookie |
| `/api/auth/me` | GET | ✅ | Any | Current user info |
| `/api/profile` | GET | ✅ | Any | List own profiles |
| `/api/profile` | POST | ✅ | Member+ | Create profile |
| `/api/profile/[slug]` | GET | ⚡ | Optional | Public or tenant view |
| `/api/profile/[slug]` | PATCH | ✅ | Owner/Admin | Update profile |
| `/api/profile/[slug]` | DELETE | ✅ | Owner/Admin | Delete profile |
| `/api/profile/[slug]/sign` | POST | ✅ | Any | ECDSA-sign identity packet |
| `/api/profile/[slug]/nfc` | GET | ✅ | Any | Generate NFC NDEF payload |
| `/api/profile/[slug]/qr` | GET | ✅ | Any | Generate QR PNG |
| `/api/profile/[slug]/identity-packet` | GET | ✅ | Any | Full signed identity JSON |
| `/api/vcard/[slug]` | GET | ❌ | — | Download vCard 3.0 |
| `/api/admin/users` | GET/PATCH | ✅ | Admin | User management |
| `/api/admin/stats` | GET | ✅ | Admin | Platform statistics |
| `/api/admin/activity-log` | GET | ✅ | Admin | Audit log |

---

## 🟫 Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    Tenant {
        string id PK
        string name
        string slug UK
        boolean isActive
        datetime createdAt
    }

    User {
        string id PK
        string email UK
        string passwordHash
        Role role
        string tenantId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime lastLoginAt
    }

    Profile {
        string id PK
        string slug UK
        string userId FK
        string tenantId FK
        string displayName
        string title
        string company
        string email
        string phone
        string bio
        string avatarUrl
        json socialLinks
        json customFields
        boolean isPublic
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    NfcTag {
        string id PK
        string tagId UK
        string profileId FK
        NfcMode mode
        datetime lastScanned
        int scanCount
        datetime createdAt
    }

    ApiKey {
        string id PK
        string keyHash UK
        string userId FK
        string name
        datetime expiresAt
        datetime lastUsedAt
        datetime createdAt
    }

    ActivityLog {
        string id PK
        string userId FK
        string action
        string resource
        string resourceId
        json metadata
        string ipAddress
        datetime createdAt
    }

    Tenant ||--o{ User : "has"
    Tenant ||--o{ Profile : "owns"
    User ||--o{ Profile : "creates"
    User ||--o{ ApiKey : "holds"
    User ||--o{ ActivityLog : "generates"
    Profile ||--o{ NfcTag : "tagged by"
```

### Enum Reference

| Enum | Values | Description |
|------|--------|-------------|
| `Role` | `SUPER_ADMIN`, `ADMIN`, `MEMBER`, `VIEWER` | Hierarchical RBAC |
| `NfcMode` | `URL`, `VCARD`, `IDENTITY_PACKET` | NFC payload encoding |

---

## 🟥 Auth & RBAC Flow

### JWT Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> TokenIssued : POST /api/auth/login\n(valid email + password)
    TokenIssued --> Authenticated : Cookie set\n(httpOnly, secure, sameSite=strict)
    Authenticated --> Verified : Edge middleware\njwtVerify() on every request
    Verified --> Authorized : RBAC check\npermission matrix
    Authorized --> [*] : Response returned
    Verified --> Rejected : Role insufficient 403
    Authenticated --> Expired : Token TTL exceeded
    Expired --> Unauthenticated : Cookie cleared
    Authenticated --> Unauthenticated : POST /api/auth/logout
```

### Role Hierarchy

```
╔══════════════════════════════════════╗
║           SUPER_ADMIN                ║  ← Full platform access
║   ┌──────────────────────────┐       ║
║   │        ADMIN             │       ║  ← Tenant management
║   │  ┌────────────────┐      │       ║
║   │  │    MEMBER      │      │       ║  ← Create/edit profiles
║   │  │  ┌──────────┐  │      │       ║
║   │  │  │  VIEWER  │  │      │       ║  ← Read-only access
║   │  │  └──────────┘  │      │       ║
║   │  └────────────────┘      │       ║
║   └──────────────────────────┘       ║
╚══════════════════════════════════════╝
```

### Route Permission Matrix

| Resource | VIEWER | MEMBER | ADMIN | SUPER_ADMIN |
|----------|:------:|:------:|:-----:|:-----------:|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Create profile | ❌ | ✅ | ✅ | ✅ |
| Edit own profile | ❌ | ✅ | ✅ | ✅ |
| Edit any profile | ❌ | ❌ | ✅ | ✅ |
| Delete profile | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| View activity log | ❌ | ❌ | ✅ | ✅ |
| Platform stats | ❌ | ❌ | ❌ | ✅ |
| Cross-tenant access | ❌ | ❌ | ❌ | ✅ |

---

## 🟪 Cryptographic Signing

### Signing Flow

```mermaid
flowchart LR
    A[Identity Packet\nJSON object] --> B[JSON.stringify]
    B --> C[SHA-256 hash\nof string bytes]
    C --> D[ECDSA P-256 sign\nwith private key\nfrom env]
    D --> E[DER-encoded\nsignature bytes]
    E --> F[Base64url encode]
    F --> G[Attach to packet:\nsignature + keyId + alg]
    G --> H[Return signed\nidentity packet]
```

### Verification Flow

```mermaid
flowchart TD
    A[Receive signed packet] --> B{signature present?}
    B -->|No| FAIL[Reject: unsigned]
    B -->|Yes| C[Extract payload\nwithout signature fields]
    C --> D[JSON.stringify\ndeterministically]
    D --> E[SHA-256 hash]
    E --> F[Load public key\nfrom env]
    F --> G[ECDSA verify\nsignature against hash]
    G --> H{Valid?}
    H -->|Yes| OK[Trust payload]
    H -->|No| FAIL2[Reject: tampered]
```

### Key Generation

```bash
# Generate ECDSA P-256 key pair
openssl ecparam -name prime256v1 -genkey -noout -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem

# Base64-encode for environment variables
# Linux/macOS:
base64 -w 0 ec_private.pem   # → ECDSA_PRIVATE_KEY_B64
base64 -w 0 ec_public.pem    # → ECDSA_PUBLIC_KEY_B64

# Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ec_private.pem"))
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ec_public.pem"))
```

---

## 🩵 NFC Payload System

### Three NFC Modes

```mermaid
flowchart TD
    TAP[NFC Tap] --> DECODE[Decode NDEF message]
    DECODE --> MODE{NfcMode?}

    MODE -->|URL| URL_FLOW[NDEF URI record\nhttps://domain/profile/slug]
    MODE -->|VCARD| VCARD_FLOW[NDEF MIME record\ntext/vcard\nvCard 3.0 payload]
    MODE -->|IDENTITY_PACKET| PACKET_FLOW[NDEF MIME record\napplication/json\nFull signed identity packet]

    URL_FLOW --> BROWSER[Opens in browser]
    VCARD_FLOW --> CONTACTS[Saved to contacts app]
    PACKET_FLOW --> APP[Parsed by identity app\nSignature verified]
```

### Mode Comparison

| Mode | NFC Record Type | Size | Use Case | Auto-opens |
|------|----------------|------|----------|-----------|
| `URL` | URI | ~50 bytes | Quick link to public profile | Browser |
| `VCARD` | MIME text/vcard | ~500 bytes | Save contact to phone | Contacts app |
| `IDENTITY_PACKET` | MIME application/json | ~2 KB | App-to-app signed transfer | Requires app |

---

## 🟢 Quick Start

### Prerequisites

| Requirement | Version | Check |
|------------|---------|-------|
| Node.js | ≥ 20.x | `node --version` |
| pnpm | ≥ 9.x | `pnpm --version` |
| PostgreSQL | ≥ 15 | `psql --version` |

> **No OpenSSL required** — `pnpm setup` generates ECDSA keys using Node.js built-in `crypto`.

### Setup in 3 commands

```bash
# 1. Clone & install
git clone https://github.com/FTHTrading/Vs-Identity-os.git
cd Vs-Identity-os
pnpm install

# 2. Auto-generate .env with ECDSA keys + JWT secret
pnpm setup
# → Edit .env and fill in DATABASE_URL, then:

# 3. Migrate DB, seed, and start
pnpm db:migrate && pnpm db:seed && pnpm dev
```

> **Default admin credentials (after seed):**
> - Email: `admin@example.com`
> - Password: `admin123!`

---

## 🤖 Automation

### Local Setup Script

`pnpm setup` runs `scripts/setup.js` which:

| Step | What happens |
|------|--------------|
| 1 | Copies `.env.example` → `.env` (if `.env` doesn't exist) |
| 2 | Generates a secure 64-char hex `JWT_SECRET` |
| 3 | Generates an ECDSA P-256 key pair using Node.js `crypto` (no openssl) |
| 4 | Base64-encodes both PEM keys and writes them into `.env` |
| 5 | Prints a summary of what still needs manual input (`DATABASE_URL`) |

```bash
pnpm setup
# Output:
# ✅  Created .env from .env.example
# ✅  JWT_SECRET           generated (64-char hex)
# ✅  ECDSA_PRIVATE_KEY_B64 generated (P-256 sec1 PEM → base64)
# ✅  ECDSA_PUBLIC_KEY_B64  generated (P-256 spki PEM → base64)
# ⚠️   Still required: DATABASE_URL
```

### Netlify One-Command Deploy

`pnpm setup:netlify` runs `scripts/netlify-setup.js` which:

| Step | What happens |
|------|--------------|
| 1 | Verifies Netlify CLI auth (`npx netlify-cli login` if needed) |
| 2 | Creates or links the Netlify site `vs-identity-os` |
| 3 | Pushes **all `.env` variables** to Netlify's environment |
| 4 | Runs `netlify deploy --build --prod` (full production deploy) |
| 5 | Prints live URL + GitHub Secrets checklist |

```bash
# One-time: authenticate with Netlify
npx netlify-cli login

# Deploy everything
pnpm setup:netlify
```

### GitHub Actions CI/CD

Two workflows in `.github/workflows/`:

```mermaid
flowchart LR
    PR[Pull Request] --> CI[ci.yml\nLint + Typecheck + Build]
    PUSH[Push to main] --> DEPLOY[deploy.yml\nBuild + Netlify Deploy]

    CI --> LINT[pnpm lint]
    LINT --> TC[pnpm type-check]
    TC --> BUILD1[pnpm build]
    BUILD1 --> ARTIFACT[Upload artifact]

    DEPLOY --> BUILD2[pnpm build]
    BUILD2 --> NETLIFY_PROD[netlify deploy --prod]
    NETLIFY_PROD --> LIVE[Live site]

    PR --> DEPLOY
    DEPLOY --> NETLIFY_PREVIEW[netlify deploy --preview]
    NETLIFY_PREVIEW --> COMMENT[PR comment\nwith preview URL]
```

#### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|--------|----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Printed by `pnpm setup:netlify`, or Netlify → Site → Site configuration |
| `DATABASE_URL` | Your production PostgreSQL connection string |
| `JWT_SECRET` | Already in your `.env` after `pnpm setup` |
| `ECDSA_PRIVATE_KEY_B64` | Already in your `.env` after `pnpm setup` |
| `ECDSA_PUBLIC_KEY_B64` | Already in your `.env` after `pnpm setup` |

---

## ⚙️ Environment Variables

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/identity_capsule_os` | PostgreSQL connection string |
| `JWT_SECRET` | `super-secret-32-char-minimum` | HMAC secret for JWT signing (min 32 chars) |
| `ECDSA_PRIVATE_KEY_B64` | `LS0tLS1CRUdJTi...` | Base64-encoded PEM private key |
| `ECDSA_PUBLIC_KEY_B64` | `LS0tLS1CRUdJTi...` | Base64-encoded PEM public key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL (used in NFC URL payloads) |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in ms |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

### Docker / Seed Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | PostgreSQL superuser (Docker only) |
| `POSTGRES_PASSWORD` | PostgreSQL password (Docker only) |
| `POSTGRES_DB` | Database name (Docker only) |
| `SEED_ADMIN_EMAIL` | Override seed admin email |
| `SEED_ADMIN_PASSWORD` | Override seed admin password |

---

## 📡 API Reference

All responses follow the envelope format:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601",
    "version": "1.0"
  },
  "error": null
}
```

### Auth Endpoints

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/auth/login` | `POST` | `{ email, password }` | `{ user, token }` |
| `/api/auth/logout` | `POST` | — | `204 No Content` |
| `/api/auth/me` | `GET` | — | `{ user }` |

### Profile Endpoints

| Endpoint | Method | Auth | Notes |
|----------|--------|------|-------|
| `/api/profile` | `GET` | Required | List own profiles |
| `/api/profile` | `POST` | Required | `ProfileCreateSchema` body |
| `/api/profile/[slug]` | `GET` | Optional | Public or tenant view |
| `/api/profile/[slug]` | `PATCH` | Required | `ProfileUpdateSchema` body |
| `/api/profile/[slug]` | `DELETE` | Admin | Soft delete |
| `/api/profile/[slug]/sign` | `POST` | Required | Returns signed packet |
| `/api/profile/[slug]/nfc` | `GET` | Required | `?mode=URL\|VCARD\|IDENTITY_PACKET` |
| `/api/profile/[slug]/qr` | `GET` | Required | `?size=256` returns PNG |
| `/api/profile/[slug]/identity-packet` | `GET` | Required | Full signed JSON |

### vCard Endpoint

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/api/vcard/[slug]` | `GET` | None | `text/vcard` file download |

### Admin Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | `GET` | Admin | List all users |
| `/api/admin/users` | `PATCH` | Admin | Update user role/status |
| `/api/admin/stats` | `GET` | Admin | Platform statistics |
| `/api/admin/activity-log` | `GET` | Admin | Paginated activity log |

---

## 🚀 Deployment

### Docker Compose (Recommended)

```bash
# Build and start all services
docker compose up --build -d

# Run database migrations inside container
docker compose exec app pnpm db:migrate

# Seed initial data
docker compose exec app pnpm db:seed

# View logs
docker compose logs -f app
```

Services started: `app` (Next.js on :3000), `db` (PostgreSQL on :5432).

### Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Link to your site
netlify link

# Deploy preview
netlify deploy

# Deploy production
netlify deploy --prod
```

**Required Netlify environment variables** (set in Netlify UI → Site → Environment variables):

- `DATABASE_URL` — your production PostgreSQL connection string
- `JWT_SECRET`
- `ECDSA_PRIVATE_KEY_B64`
- `ECDSA_PUBLIC_KEY_B64`

### CI/CD Pipeline

```mermaid
flowchart LR
    PUSH[git push main] --> CI[GitHub Actions CI]
    CI --> LINT[pnpm lint]
    LINT --> TYPECHECK[tsc noEmit]
    TYPECHECK --> BUILD[pnpm build]
    BUILD --> PASS{Build OK?}
    PASS -->|Yes| NETLIFY[Netlify Auto Deploy]
    PASS -->|No| FAIL[Block merge]
    NETLIFY --> PREVIEW[Preview URL]
    PREVIEW --> PROMOTE[Production]
```

---

## 🔒 Security Posture

### Defense-in-Depth Layers

```
Layer 7 — Application Logic
  ├── Zod input validation on all API bodies
  ├── Parameterized queries via Prisma (SQL injection immune)
  └── Output sanitization, no PII in logs

Layer 6 — Authorization
  ├── RBAC permission matrix enforced per route
  ├── Tenant isolation: all queries scoped to tenantId
  └── Resource ownership verified before mutations

Layer 5 — Authentication
  ├── JWT (HS256) with configurable TTL
  ├── httpOnly + Secure + SameSite=Strict cookie
  └── Password hashed with bcrypt (cost factor 12)

Layer 4 — Transport
  ├── HTTPS enforced (Netlify / reverse proxy)
  └── HSTS header recommended

Layer 3 — Edge / Middleware
  ├── JWT verified on every request before routing
  └── Sliding-window rate limiter per IP (100 req/min default)

Layer 2 — Cryptographic Integrity
  ├── ECDSA P-256 signature on all identity packets
  └── Signatures are detachable and independently verifiable

Layer 1 — Infrastructure
  ├── Docker network isolation (app ↔ db only)
  └── Environment secrets via .env / Netlify env vars
```

### Security Controls Audit

| Control | Status | Implementation |
|---------|:------:|----------------|
| SQL Injection | ✅ Immune | Prisma parameterized queries |
| XSS | ✅ Mitigated | React DOM escaping + no dangerouslySetInnerHTML |
| CSRF | ✅ Mitigated | SameSite=Strict cookie + custom headers |
| Brute Force | ✅ Rate limited | 100 req/min per IP sliding window |
| Token theft | ✅ Mitigated | httpOnly cookie, not localStorage |
| Data tampering | ✅ Detectable | ECDSA signature on identity packets |
| Privilege escalation | ✅ Blocked | RBAC checked server-side on every request |
| Tenant leakage | ✅ Blocked | All queries include tenantId filter |
| Password exposure | ✅ Hashed | bcrypt cost 12 |
| Key exposure | ✅ Env-only | Keys never logged or returned in API |

---

## 📁 Project Structure

```
identity-capsule-os/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # login · logout · me
│   │   ├── profile/              # CRUD + sign + nfc + qr
│   │   ├── vcard/                # vCard export
│   │   └── admin/                # Admin-only endpoints
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── profiles/             # Profile management UI
│   │   ├── users/                # User management UI
│   │   └── activity/             # Activity log UI
│   ├── login/                    # Login page
│   ├── profile/[slug]/           # Public profile page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Tailwind imports
│
├── components/                   # React components
│   ├── auth/                     # LoginForm
│   ├── dashboard/                # Sidebar · TopBar · Stats · Activity
│   └── profiles/                 # ProfileForm · ProfilesTable · Detail
│
├── lib/                          # Core business logic
│   ├── auth.ts                   # JWT issue/verify helpers
│   ├── crypto.ts                 # ECDSA sign/verify
│   ├── nfc.ts                    # NDEF payload encoder
│   ├── qrcode.ts                 # QR PNG generator
│   ├── vcard.ts                  # vCard 3.0 builder
│   ├── rbac.ts                   # Permission matrix
│   ├── rate-limit.ts             # Token bucket limiter
│   ├── activity-logger.ts        # Audit trail writer
│   ├── prisma.ts                 # Prisma client singleton
│   ├── types.ts                  # Shared TypeScript types
│   ├── utils.ts                  # Utilities
│   └── validation.ts             # Zod schemas
│
├── prisma/
│   ├── schema.prisma             # Database schema (6 models)
│   └── seed.ts                   # Admin user + demo tenant seed
│
├── middleware.ts                 # Edge JWT verification + rate limiting
├── netlify.toml                  # Netlify build configuration
├── Dockerfile                    # Multi-stage production image
├── docker-compose.yml            # App + PostgreSQL services
├── docker-entrypoint.sh          # Container startup script
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.example                  # Environment variable template
```

---

## 🗺️ Roadmap

| Feature | Priority | Status | Notes |
|---------|:--------:|--------|-------|
| OAuth 2.0 / OIDC login | 🔴 High | Planned | Google, GitHub, Microsoft |
| WebAuthn / Passkeys | 🔴 High | Planned | Hardware key support |
| Mobile app (React Native) | 🟠 Medium | Planned | iOS + Android NFC writer |
| GraphQL API | 🟠 Medium | Planned | Alongside REST |
| Webhook events | 🟠 Medium | Planned | Profile view, NFC tap events |
| Analytics dashboard | 🟡 Low | Planned | Scan counts, geo heatmap |
| Team workspaces | 🟡 Low | Planned | Shared profile collections |
| API key portal | 🟡 Low | Planned | Self-service key management |
| SCIM provisioning | ⚪ Stretch | Backlog | Enterprise SSO sync |
| Digital wallet export | ⚪ Stretch | Backlog | Apple Wallet / Google Wallet pass |

---

## 🛠️ Dev Scripts

```bash
# ── First-time setup ──────────────────────────────────────────────
pnpm setup            # Generate .env with ECDSA keys + JWT secret (no openssl needed)
pnpm setup:netlify    # Create Netlify site, push env vars, deploy to production

# ── Development ───────────────────────────────────────────────────
pnpm dev              # Start development server (hot reload)
pnpm build            # Production build (Next.js)
pnpm start            # Start production server
pnpm lint             # ESLint check
pnpm type-check       # TypeScript strict check (tsc --noEmit)

# ── Database ──────────────────────────────────────────────────────
pnpm db:migrate       # Run Prisma migrations (dev)
pnpm db:seed          # Seed database with demo data
pnpm db:studio        # Open Prisma Studio (GUI DB viewer)
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:reset         # Drop + recreate DB + re-seed (destructive!)
```

---

<div align="center">

Built with ❤️ by [FTHTrading](https://github.com/FTHTrading)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/FTHTrading/Vs-Identity-os)

*Identity Capsule OS — Cryptographically signed digital identities for the modern web*

</div>
