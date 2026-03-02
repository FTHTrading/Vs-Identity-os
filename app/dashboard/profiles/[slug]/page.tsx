import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSessionFromCookies, hasMinRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileDetailView from '@/components/profiles/ProfileDetailView';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Profile: ${params.slug}` };
}

export default async function ProfileDetailPage({ params }: Props) {
  const session = getSessionFromCookies()!;

  const profile = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId: session.tenantId, slug: params.slug } },
    include: {
      signatures: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      nfcPayloads: {
        orderBy: { createdAt: 'desc' },
      },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!profile) notFound();

  const canEdit = hasMinRole(session.role, 'EDITOR');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <ProfileDetailView
      profile={profile}
      canEdit={canEdit}
      appUrl={appUrl}
    />
  );
}
