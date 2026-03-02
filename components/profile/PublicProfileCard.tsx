'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Signature {
  hash: string;
  algorithm: string;
  createdAt: Date;
}

interface Props {
  profile: {
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
    roleTags: string[];
  };
  appUrl: string;
  tenantName: string;
  tenantLogo: string | null;
  signature: Signature | null;
}

export default function PublicProfileCard({
  profile,
  appUrl,
  tenantName,
  tenantLogo,
  signature,
}: Props) {
  const [showQr, setShowQr] = useState(false);

  const qrUrl = `/api/profile/${profile.slug}/qr`;
  const vcardUrl = `/api/vcard/${profile.slug}`;
  const profileUrl = `${appUrl}/profile/${profile.slug}`;

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Org branding */}
      <div className="text-center mb-6">
        {tenantLogo ? (
          <Image
            src={tenantLogo}
            alt={tenantName}
            width={40}
            height={40}
            className="mx-auto rounded-lg mb-2"
          />
        ) : (
          <div className="w-10 h-10 bg-brand-600 rounded-xl mx-auto mb-2 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0z" />
            </svg>
          </div>
        )}
        <p className="text-slate-400 text-xs">{tenantName}</p>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header gradient */}
        <div className="h-24 bg-gradient-to-r from-brand-700 to-brand-500" />

        {/* Avatar */}
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={88}
                height={88}
                className="w-22 h-22 rounded-2xl border-4 border-white dark:border-slate-900 object-cover shadow-lg"
              />
            ) : (
              <div className="w-22 h-22 rounded-2xl border-4 border-white dark:border-slate-900 bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-4xl font-bold shadow-lg"
                style={{ width: 88, height: 88 }}>
                {profile.fullName[0]}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h1>
          <p className="text-brand-600 dark:text-brand-400 font-medium mt-0.5">{profile.title}</p>
          <p className="text-slate-500 text-sm">{profile.organization}</p>

          {/* Tags */}
          {profile.roleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.roleTags.map((tag) => (
                <span key={tag} className="badge-blue text-xs">{tag}</span>
              ))}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Contact links */}
          <div className="mt-5 space-y-2.5">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 no-underline hover:text-brand-600 transition-colors group">
                <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-950 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                {profile.email}
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 no-underline hover:text-brand-600 transition-colors group">
                <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-950 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                {profile.phone}
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 no-underline hover:text-brand-600 transition-colors group">
                <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-950 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </span>
                {profile.website.replace(/https?:\/\//, '')}
              </a>
            )}
            {profile.location && (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                {profile.location}
              </div>
            )}
          </div>

          {/* Social */}
          {(profile.linkedIn || profile.twitter || profile.github) && (
            <div className="flex gap-3 mt-5">
              {profile.linkedIn && (
                <a href={profile.linkedIn.startsWith('http') ? profile.linkedIn : `https://linkedin.com/in/${profile.linkedIn}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors no-underline group"
                  title="LinkedIn">
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors no-underline group"
                  title="Twitter/X">
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {profile.github && (
                <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors no-underline group"
                  title="GitHub">
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3 mt-6">
            <a
              href={vcardUrl}
              className="flex-1 btn-md btn-primary no-underline text-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Contact
            </a>
            <button
              onClick={() => setShowQr(!showQr)}
              className="flex-1 btn-md btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12v.01M12 4h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
              </svg>
              {showQr ? 'Hide QR' : 'Show QR'}
            </button>
          </div>

          {/* QR Code (collapsible) */}
          {showQr && (
            <div className="mt-4 text-center animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Profile QR"
                className="w-48 h-48 mx-auto rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-400 mt-2">Scan to share this profile</p>
            </div>
          )}
        </div>

        {/* Crypto verification footer */}
        {signature && (
          <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium text-purple-600 dark:text-purple-400">Cryptographically signed</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <code className="font-mono truncate">{signature.hash.slice(0, 20)}...</code>
            </div>
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="text-center mt-4">
        <p className="text-slate-500 text-xs">
          Identity verified by <span className="text-slate-300">{tenantName}</span>
        </p>
      </div>
    </div>
  );
}
