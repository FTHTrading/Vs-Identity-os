import type { Metadata } from 'next';
import { getSessionFromCookies, hasMinRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDateTime, ROLE_LABELS } from '@/lib/utils';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage() {
  const session = getSessionFromCookies()!;
  if (!hasMinRole(session.role, 'TENANT_ADMIN')) redirect('/dashboard');

  const users = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-md btn-primary" disabled>
          + Invite User
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Joined'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">
                      {u.name[0]}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={
                    u.role === 'SUPER_ADMIN' || u.role === 'TENANT_ADMIN'
                      ? 'badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : u.role === 'EDITOR'
                        ? 'badge-blue'
                        : 'badge-slate'
                  }>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? 'badge-green' : 'badge-slate'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {formatDateTime(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
