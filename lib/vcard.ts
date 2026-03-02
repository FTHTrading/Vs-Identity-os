/**
 * vCard Generator
 * Produces RFC 6350 / vCard 3.0 compliant .vcf content
 */

export interface VCardData {
  fullName: string;
  title?: string | null;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  linkedIn?: string | null;
  twitter?: string | null;
  avatarUrl?: string | null;
  note?: string | null;
}

/**
 * Escapes special vCard characters: comma, semicolon, backslash, newline
 */
function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .trim();
}

/**
 * Folds long lines to max 75 chars (vCard spec requirement)
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.substring(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.substring(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

export function generateVCard(data: VCardData): string {
  const lines: string[] = [];

  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  lines.push(`FN:${escapeVCard(data.fullName)}`);

  // N field: Last;First;Middle;Prefix;Suffix
  const nameParts = data.fullName.split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts[nameParts.length - 1] ?? '';
  lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);

  if (data.organization) {
    lines.push(`ORG:${escapeVCard(data.organization)}`);
  }

  if (data.title) {
    lines.push(`TITLE:${escapeVCard(data.title)}`);
  }

  if (data.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(data.phone)}`);
  }

  if (data.email) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCard(data.email)}`);
  }

  if (data.website) {
    lines.push(`URL;TYPE=WORK:${escapeVCard(data.website)}`);
  }

  if (data.linkedIn) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${escapeVCard(data.linkedIn)}`);
  }

  if (data.twitter) {
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${escapeVCard(data.twitter)}`);
  }

  if (data.avatarUrl) {
    lines.push(`PHOTO;VALUE=URI:${escapeVCard(data.avatarUrl)}`);
  }

  if (data.note) {
    lines.push(`NOTE:${escapeVCard(data.note)}`);
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push('END:VCARD');

  // Apply line folding and use CRLF as required by spec
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
