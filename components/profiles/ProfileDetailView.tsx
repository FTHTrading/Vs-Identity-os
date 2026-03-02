'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { formatDateTime } from '@/lib/utils';

interface Signature {
  id: string;
  hash: string;
  signature: string;
  algorithm: string;
  createdAt: Date;
}

interface NfcPayload {
  id: string;
  mode: string;
  payload: string;
  label: string | null;
  createdAt: Date;
}

interface Profile {
  id: string;
  slug: string;
  fullName: string;
  title: string | null;
  organization: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  linkedIn: string | null;
  twitter: string | null;
  github: string | null;
  avatarUrl: string | null;
  bio: string | null;
  department: string | null;
  location: string | null;
  internalNotes: string | null;
  roleTags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  signatures: Signature[];
  nfcPayloads: NfcPayload[];
  createdBy: { name: string; email: string };
}

interface Props {
  profile: Profile;
  canEdit: boolean;
  appUrl: string;
}

export default function ProfileDetailView({ profile, canEdit, appUrl }: Props) {
  const [signingLoading, setSigningLoading] = useState(false);
  const [nfcLoading, setNfcLoading] = useState(false);
  const [qrMode, setQrMode] = useState<'URL' | 'VCARD' | 'SIGNED_JSON'>('URL');

  const profileUrl = `${appUrl}/profile/${profile.slug}`;
  const qrUrl = `/api/profile/${profile.slug}/qr`;
  const vcardUrl = `/api/vcard/${profile.slug}`;

  const handleSign = async () => {
    setSigningLoading(true);
    try {
      const res = await fetch(`/api/profile/${profile.slug}/sign`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile signed successfully!');
        window.location.reload();
      } else {
        toast.error(data.error ?? 'Signing failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSigningLoading(false);
    }
  };

  const handleCreateNfc = async () => {
    setNfcLoading(true);
    try {
      const res = await fetch(`/api/profile/${profile.slug}/nfc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: qrMode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('NFC payload generated!');
        window.location.reload();
      } else {
        toast.error(data.error ?? 'Failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setNfcLoading(false);
    }
  };

  const latestSig = profile.signatures[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.fullName}
              width={64}
              height={64}
              className="rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold">
              {profile.fullName[0]}
            </div>
          )}
          <div>
            <h1 className="page-title">{profile.fullName}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {profile.title}
              {profile.title && profile.organization && ' · '}
              {profile.organization}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">
                /{profile.slug}
              </code>
              <span className={profile.isPublic ? 'badge-green' : 'badge-slate'}>
                {profile.isPublic ? 'Public' : 'Private'}
              </span>
              {latestSig && (
                <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  ✓ Cryptographically Signed
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={profileUrl}
            target="_blank"
            className="btn-sm btn-secondary no-underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Public View
          </Link>
          {canEdit && (
            <Link
              href={`/dashboard/profiles/${profile.slug}/edit`}
              className="btn-sm btn-primary no-underline"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h2 className="section-heading">Identity Details</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              { label: 'Email', value: profile.email },
              { label: 'Phone', value: profile.phone },
              { label: 'Department', value: profile.department },
              { label: 'Location', value: profile.location },
              { label: 'Website', value: profile.website },
              { label: 'LinkedIn', value: profile.linkedIn },
              { label: 'Twitter', value: profile.twitter },
              { label: 'GitHub', value: profile.github },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <dt className="text-slate-400 text-xs">{label}</dt>
                  <dd className="text-slate-800 dark:text-slate-200 font-medium truncate">{value}</dd>
                </div>
              ) : null
            )}
          </dl>

          {profile.bio && (
            <div>
              <p className="text-slate-400 text-xs mb-1">Bio</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{profile.bio}</p>
            </div>
          )}

          {profile.roleTags.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.roleTags.map((tag) => (
                  <span key={tag} className="badge-blue">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* QR Code + Actions */}
        <div className="space-y-4">
          <div className="card p-5 text-center">
            <h3 className="section-heading mb-3">QR Code</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Profile QR Code"
              className="w-48 h-48 mx-auto rounded-xl"
            />
            <a
              href={qrUrl}
              download={`${profile.slug}-qr.png`}
              className="btn-sm btn-secondary mt-3 no-underline inline-flex"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR
            </a>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="section-heading">Quick Actions</h3>
            <a href={vcardUrl} className="btn-md btn-secondary w-full no-underline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download vCard
            </a>

            {canEdit && (
              <button
                onClick={handleSign}
                disabled={signingLoading}
                className="btn-md btn-secondary w-full"
              >
                {signingLoading ? 'Signing...' : '🔐 Sign Profile'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      {profile.internalNotes && (
        <div className="card p-6 border-amber-200 dark:border-amber-900">
          <h2 className="section-heading text-amber-600 dark:text-amber-500 mb-3">
            🔒 Internal Notes
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {profile.internalNotes}
          </p>
        </div>
      )}

      {/* Signature History */}
      {profile.signatures.length > 0 && (
        <div className="card p-6">
          <h2 className="section-heading mb-4">Signature History</h2>
          <div className="space-y-3">
            {profile.signatures.map((sig, i) => (
              <div key={sig.id} className="flex items-start gap-3 text-sm">
                <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mt-0.5">
                  {i === 0 ? 'Latest' : `v${profile.signatures.length - i}`}
                </span>
                <div className="min-w-0">
                  <code className="text-xs text-slate-500 font-mono block truncate">
                    SHA-256: {sig.hash.slice(0, 32)}...
                  </code>
                  <span className="text-slate-400 text-xs">{formatDateTime(sig.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NFC Payloads */}
      {canEdit && (
        <div className="card p-6">
          <h2 className="section-heading mb-4">NFC Payloads</h2>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={qrMode}
              onChange={(e) => setQrMode(e.target.value as typeof qrMode)}
              className="input max-w-xs"
            >
              <option value="URL">URL Mode — opens profile</option>
              <option value="VCARD">vCard Mode — downloads contact</option>
              <option value="SIGNED_JSON">Signed JSON — identity packet</option>
            </select>
            <button
              onClick={handleCreateNfc}
              disabled={nfcLoading}
              className="btn-md btn-primary"
            >
              {nfcLoading ? 'Generating...' : 'Generate NFC Payload'}
            </button>
          </div>

          {profile.nfcPayloads.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                  <th className="pb-2 font-medium text-slate-500">Mode</th>
                  <th className="pb-2 font-medium text-slate-500">Payload</th>
                  <th className="pb-2 font-medium text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {profile.nfcPayloads.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">
                      <span className="badge-blue">{p.mode}</span>
                    </td>
                    <td className="py-2">
                      <code className="text-xs text-slate-500 font-mono truncate block max-w-sm">
                        {p.payload}
                      </code>
                    </td>
                    <td className="py-2 text-slate-400 text-xs">
                      {formatDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-400 text-sm">No NFC payloads generated yet.</p>
          )}
        </div>
      )}

      <div className="text-xs text-slate-400 text-right">
        Created by {profile.createdBy.name} · Last updated {formatDateTime(profile.updatedAt)}
      </div>
    </div>
  );
}
