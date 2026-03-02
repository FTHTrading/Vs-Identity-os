'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Role } from '@prisma/client';

interface ProfileRow {
  id: string;
  slug: string;
  fullName: string;
  title: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  roleTags: string[];
  createdAt: Date;
  _count: { signatures: number };
}

interface Props {
  profiles: ProfileRow[];
  total: number;
  page: number;
  limit: number;
  role: Role;
}

export default function ProfilesTable({ profiles, total, page, limit, role }: Props) {
  const pages = Math.ceil(total / limit);
  const canEdit = ['SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR'].includes(role);

  if (profiles.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">No profiles found</p>
        <p className="text-slate-400 text-sm mt-1">Create your first identity capsule to get started.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Organization</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Signed</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Added</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
                      {p.fullName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{p.fullName}</div>
                      {p.title && <div className="text-xs text-slate-400">{p.title}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {p.organization ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {p.slug}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className={p.isPublic ? 'badge-green' : 'badge-slate'}>
                    {p.isPublic ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p._count.signatures > 0 ? (
                    <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      ✓ Signed
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {formatDate(p.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/profile/${p.slug}`}
                      target="_blank"
                      className="btn-sm btn-ghost text-slate-500 no-underline"
                      title="View public profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/dashboard/profiles/${p.slug}/edit`}
                        className="btn-sm btn-secondary no-underline"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {page} of {pages} ({total} total)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="btn-sm btn-secondary no-underline">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={`?page=${page + 1}`} className="btn-sm btn-secondary no-underline">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
