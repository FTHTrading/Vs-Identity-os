import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

interface Props {
  tenantId: string;
}

const ACTION_STYLES: Record<string, string> = {
  LOGIN: 'badge-blue',
  LOGOUT: 'badge-slate',
  CREATE_PROFILE: 'badge-green',
  UPDATE_PROFILE: 'badge-amber',
  DELETE_PROFILE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 badge',
  DOWNLOAD_VCARD: 'badge-slate',
  SIGN_PROFILE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 badge',
  ACCESS_DENIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 badge',
};

export default async function RecentActivity({ tenantId }: Props) {
  const logs = await prisma.activityLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Recent Activity
      </h2>
      {logs.length === 0 ? (
        <p className="text-slate-400 text-sm">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="flex items-start gap-3 text-sm">
              <span
                className={`${ACTION_STYLES[log.action] ?? 'badge-slate'} mt-0.5 shrink-0`}
              >
                {log.action.replace(/_/g, ' ')}
              </span>
              <div className="min-w-0">
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  {log.user?.name ?? 'System'}
                </span>
                <span className="text-slate-400 text-xs block">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
