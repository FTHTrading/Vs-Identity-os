import type { Metadata } from 'next';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfilesTable from '@/components/profiles/ProfilesTable';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Profiles' };

interface Props {
  searchParams: { search?: string; page?: string };
}

export default async function ProfilesPage({ searchParams }: Props) {
  const session = getSessionFromCookies()!;
  const search = searchParams.search ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1'));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    tenantId: session.tenantId,
    isActive: true,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { organization: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        fullName: true,
        title: true,
        organization: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isPublic: true,
        roleTags: true,
        createdAt: true,
        _count: { select: { signatures: true } },
      },
    }),
    prisma.profile.count({ where }),
  ]);

  const canCreate = ['SUPER_ADMIN', 'TENANT_ADMIN', 'EDITOR'].includes(session.role);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Identity Profiles</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {total} profile{total !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/profiles/new" className="btn-md btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Profile
          </Link>
        )}
      </div>

      {/* Search */}
      <form className="flex gap-3">
        <input
          name="search"
          defaultValue={search}
          type="search"
          placeholder="Search profiles..."
          className="input max-w-sm"
        />
        <button type="submit" className="btn-md btn-secondary">
          Search
        </button>
      </form>

      {/* Table */}
      <ProfilesTable
        profiles={profiles}
        total={total}
        page={page}
        limit={limit}
        role={session.role}
      />
    </div>
  );
}
