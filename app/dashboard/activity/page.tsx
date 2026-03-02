import type { Metadata } from 'next';
import { getSessionFromCookies, hasMinRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Activity Log' };

interface Props {
  searchParams: { page?: string; action?: string };
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'badge-blue',
  LOGOUT: 'badge-slate',
  CREATE_PROFILE: 'badge-green',
  UPDATE_PROFILE: 'badge-amber',
  DELETE_PROFILE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 badge',
  DOWNLOAD_VCARD: 'badge-slate',
  SIGN_PROFILE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 badge',
  CREATE_NFC_PAYLOAD: 'badge-blue',
  ACCESS_DENIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 badge',
};

export default async function ActivityLogPage({ searchParams }: Props) {
  const session = getSessionFromCookies()!;
  if (!hasMinRole(session.role, 'TENANT_ADMIN')) redirect('/dashboard');

  const page = Math.max(1, parseInt(searchParams.page ?? '1'));
  const action = searchParams.action;
  const limit = 50;
  const skip = (page - 1) * limit;

  const where = {
    tenantId: session.tenantId,
    ...(action ? { action } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Activity Log</h1>
        <p className="text-slate-500 text-sm mt-1">
          Immutable audit trail — {total.toLocaleString()} total events
        </p>
      </div>

      {/* Filter */}
      <form className="flex gap-3">
        <select name="action" defaultValue={action ?? ''} className="input max-w-xs">
          <option value="">All actions</option>
          {['LOGIN', 'LOGOUT', 'CREATE_PROFILE', 'UPDATE_PROFILE', 'DELETE_PROFILE',
            'SIGN_PROFILE', 'DOWNLOAD_VCARD', 'CREATE_NFC_PAYLOAD', 'ACCESS_DENIED'].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <button type="submit" className="btn-md btn-secondary">Filter</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {['Time', 'User', 'Action', 'Entity', 'IP'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {log.user?.name ?? 'System'}
                  </div>
                  <div className="text-xs text-slate-400">{log.user?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={ACTION_COLORS[log.action] ?? 'badge-slate'}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {log.entityType && (
                    <span>
                      {log.entityType}
                      {log.entityId && (
                        <code className="ml-1 font-mono text-slate-400">
                          {log.entityId.slice(0, 8)}
                        </code>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                  {log.ipAddress ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}${action ? `&action=${action}` : ''}`} className="btn-sm btn-secondary no-underline">
                  Previous
                </Link>
              )}
              {page < pages && (
                <Link href={`?page=${page + 1}${action ? `&action=${action}` : ''}`} className="btn-sm btn-secondary no-underline">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
