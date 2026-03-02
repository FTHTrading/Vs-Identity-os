import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PublicProfileCard from '@/components/profile/PublicProfileCard';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await prisma.profile.findFirst({
    where: { slug: params.slug, isPublic: true, isActive: true },
    include: { tenant: { select: { name: true } } },
  });

  if (!profile) {
    return { title: 'Profile Not Found' };
  }

  return {
    title: `${profile.fullName} — ${profile.tenant.name}`,
    description: profile.bio ?? `${profile.title} at ${profile.organization}`,
    openGraph: {
      title: profile.fullName,
      description: profile.bio ?? `${profile.title} at ${profile.organization}`,
      ...(profile.avatarUrl ? { images: [profile.avatarUrl] } : {}),
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = params;

  if (!slug.match(/^[a-z0-9-]+$/)) notFound();

  const profile = await prisma.profile.findFirst({
    where: { slug, isPublic: true, isActive: true },
    include: {
      tenant: {
        select: {
          name: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
        },
      },
      signatures: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          hash: true,
          algorithm: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <PublicProfileCard
        profile={profile}
        appUrl={appUrl}
        tenantName={profile.tenant.name}
        tenantLogo={profile.tenant.logoUrl}
        signature={profile.signatures[0] ?? null}
      />
    </main>
  );
}
