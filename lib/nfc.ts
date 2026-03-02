/**
 * NFC Payload Builder
 * Generates NFC-ready payloads for different modes:
 *  URL       → opens profile page
 *  VCARD     → downloads contact
 *  SIGNED_JSON → opens signed identity JSON endpoint
 */

export type NfcMode = 'URL' | 'VCARD' | 'SIGNED_JSON';

export interface NfcPayloadOptions {
  slug: string;
  mode: NfcMode;
  baseUrl?: string;
}

export interface NfcPayloadResult {
  mode: NfcMode;
  payload: string;
  label: string;
  encodingType: 'URI' | 'TEXT';
  byteLength: number;
}

export function buildNfcPayload(opts: NfcPayloadOptions): NfcPayloadResult {
  const baseUrl =
    opts.baseUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';

  const { slug, mode } = opts;

  let payload: string;
  let label: string;
  let encodingType: 'URI' | 'TEXT' = 'URI';

  switch (mode) {
    case 'URL':
      payload = `${baseUrl}/profile/${slug}`;
      label = `Profile page — ${slug}`;
      break;
    case 'VCARD':
      payload = `${baseUrl}/api/vcard/${slug}`;
      label = `vCard download — ${slug}`;
      break;
    case 'SIGNED_JSON':
      payload = `${baseUrl}/api/profile/${slug}/identity-packet`;
      label = `Signed identity packet — ${slug}`;
      break;
    default:
      throw new Error(`Unknown NFC mode: ${mode}`);
  }

  const byteLength = Buffer.byteLength(payload, 'utf-8');

  return { mode, payload, label, encodingType, byteLength };
}

/**
 * Returns a human-readable summary of the NFC payload for the UI
 */
export function nfcModeDescription(mode: NfcMode): string {
  switch (mode) {
    case 'URL':
      return 'Opens the branded profile page when tapped';
    case 'VCARD':
      return 'Downloads contact card directly when tapped';
    case 'SIGNED_JSON':
      return 'Opens cryptographically signed identity packet';
  }
}
