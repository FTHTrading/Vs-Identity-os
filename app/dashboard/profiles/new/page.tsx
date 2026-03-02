import type { Metadata } from 'next';
import ProfileForm from '@/components/profiles/ProfileForm';

export const metadata: Metadata = { title: 'New Profile' };

export default function NewProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">New Identity Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Create a new identity capsule record
        </p>
      </div>
      <ProfileForm mode="create" />
    </div>
  );
}
