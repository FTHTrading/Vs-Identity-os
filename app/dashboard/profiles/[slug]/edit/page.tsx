import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSessionFromCookies, hasMinRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/profiles/ProfileForm';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Edit: ${params.slug}` };
}

export default async function EditProfilePage({ params }: Props) {
  const session = getSessionFromCookies()!;

  if (!hasMinRole(session.role, 'EDITOR')) notFound();

  const profile = await prisma.profile.findUnique({
    where: { tenantId_slug: { tenantId: session.tenantId, slug: params.slug } },
  });

  if (!profile) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Edit Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Updating identity capsule for <strong>{profile.fullName}</strong>
        </p>
      </div>
      <ProfileForm
        mode="edit"
        slug={profile.slug}
        initialData={{
          slug: profile.slug,
          fullName: profile.fullName,
          title: profile.title ?? '',
          organization: profile.organization ?? '',
          phone: profile.phone ?? '',
          email: profile.email ?? '',
          website: profile.website ?? '',
          linkedIn: profile.linkedIn ?? '',
          twitter: profile.twitter ?? '',
          github: profile.github ?? '',
          avatarUrl: profile.avatarUrl ?? '',
          bio: profile.bio ?? '',
          department: profile.department ?? '',
          location: profile.location ?? '',
          internalNotes: profile.internalNotes ?? '',
          roleTags: profile.roleTags.join(', '),
          isPublic: profile.isPublic,
        }}
      />
    </div>
  );
}
