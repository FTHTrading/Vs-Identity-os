/**
 * Cryptographic Identity Signing Module
 * SHA-256 hash + ECDSA P-256 signature over canonical profile JSON
 */
import crypto from 'crypto';

// ─────────────────────────────────────────────
// Key Loading
// ─────────────────────────────────────────────
function getPrivateKey(): crypto.KeyObject {
  const b64 = process.env.SIGNING_PRIVATE_KEY_BASE64;
  if (!b64) throw new Error('SIGNING_PRIVATE_KEY_BASE64 is not configured');
  const pem = Buffer.from(b64, 'base64').toString('utf-8');
  return crypto.createPrivateKey(pem);
}

function getPublicKey(): crypto.KeyObject {
  const b64 = process.env.SIGNING_PUBLIC_KEY_BASE64;
  if (!b64) throw new Error('SIGNING_PUBLIC_KEY_BASE64 is not configured');
  const pem = Buffer.from(b64, 'base64').toString('utf-8');
  return crypto.createPublicKey(pem);
}

// ─────────────────────────────────────────────
// Canonical JSON (deterministic serialization)
// Sort keys to ensure same hash regardless of insertion order
// ─────────────────────────────────────────────
export function toCanonicalJson(obj: object): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

// ─────────────────────────────────────────────
// SHA-256 Hash
// ─────────────────────────────────────────────
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

// ─────────────────────────────────────────────
// Sign
// ─────────────────────────────────────────────
export interface SignatureResult {
  hash: string;
  signature: string;
  algorithm: string;
  timestamp: string;
}

export function signProfile(canonicalJson: string): SignatureResult {
  const hash = sha256(canonicalJson);
  const privateKey = getPrivateKey();

  const sign = crypto.createSign('SHA256');
  sign.update(hash);
  sign.end();

  const signature = sign.sign(privateKey, 'hex');

  return {
    hash,
    signature,
    algorithm: 'SHA256withECDSA',
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// Verify
// ─────────────────────────────────────────────
export function verifySignature(
  canonicalJson: string,
  signature: string
): boolean {
  try {
    const hash = sha256(canonicalJson);
    const publicKey = getPublicKey();

    const verify = crypto.createVerify('SHA256');
    verify.update(hash);
    verify.end();

    return verify.verify(publicKey, signature, 'hex');
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Profile Snapshot Builder
// Produces the canonical form of a profile for signing
// ─────────────────────────────────────────────
export function buildProfileSnapshot(profile: {
  id: string;
  tenantId: string;
  slug: string;
  fullName: string;
  title?: string | null;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  linkedIn?: string | null;
  twitter?: string | null;
  github?: string | null;
  updatedAt: Date;
}): object {
  // Strip internal-only and mutable fields; keep public identity fields
  return {
    id: profile.id,
    tenantId: profile.tenantId,
    slug: profile.slug,
    fullName: profile.fullName,
    title: profile.title ?? null,
    organization: profile.organization ?? null,
    phone: profile.phone ?? null,
    email: profile.email ?? null,
    website: profile.website ?? null,
    linkedIn: profile.linkedIn ?? null,
    twitter: profile.twitter ?? null,
    github: profile.github ?? null,
    signedAt: new Date().toISOString(),
  };
}
