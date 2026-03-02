import type { Metadata } from 'next';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentActivity from '@/components/dashboard/RecentActivity';

export const metadata: Metadata = { title: 'Dashboard' };

async function getStats(tenantId: string) {
  const [
    totalProfiles,
    activeProfiles,
    totalUsers,
    signedProfiles,
    recentActivity,
    recentProfiles,
  ] = await Promise.all([
    prisma.profile.count({ where: { tenantId } }),
    prisma.profile.count({ where: { tenantId, isActive: true } }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.profileSignature.count({ where: { profile: { tenantId } } }),
    prisma.activityLog.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.profile.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        fullName: true,
        title: true,
        organization: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalProfiles,
    activeProfiles,
    totalUsers,
    signedProfiles,
    recentActivity,
    recentProfiles,
  };
}

export default async function DashboardPage() {
  const session = getSessionFromCookies()!;
  const stats = await getStats(session.tenantId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Identity infrastructure status and recent activity
        </p>
      </div>

      {/* Stats grid */}
      <DashboardStats stats={stats} />

      {/* Recent profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Recently Added Profiles
          </h2>
          {stats.recentProfiles.length === 0 ? (
            <p className="text-slate-400 text-sm">No profiles yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentProfiles.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
                    {p.fullName[0]}
                  </div>
                  <div className="min-w-0">
                    <a
                      href={`/dashboard/profiles/${p.slug}`}
                      className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600 no-underline truncate block"
                    >
                      {p.fullName}
                    </a>
                    <p className="text-xs text-slate-400 truncate">
                      {p.title}{p.title && p.organization ? ' · ' : ''}{p.organization}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <RecentActivity tenantId={session.tenantId} />
      </div>
    </div>
  );
}
