'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { slugify } from '@/lib/utils';

interface ProfileFormData {
  slug: string;
  fullName: string;
  title: string;
  organization: string;
  phone: string;
  email: string;
  website: string;
  linkedIn: string;
  twitter: string;
  github: string;
  avatarUrl: string;
  bio: string;
  department: string;
  location: string;
  internalNotes: string;
  roleTags: string;
  isPublic: boolean;
}

interface Props {
  initialData?: Partial<ProfileFormData>;
  slug?: string; // if editing
  mode: 'create' | 'edit';
}

const emptyForm: ProfileFormData = {
  slug: '',
  fullName: '',
  title: '',
  organization: '',
  phone: '',
  email: '',
  website: '',
  linkedIn: '',
  twitter: '',
  github: '',
  avatarUrl: '',
  bio: '',
  department: '',
  location: '',
  internalNotes: '',
  roleTags: '',
  isPublic: true,
};

export default function ProfileForm({ initialData, slug: editSlug, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProfileFormData>({ ...emptyForm, ...initialData });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const update = (key: keyof ProfileFormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-generate slug from name in create mode
      if (key === 'fullName' && mode === 'create') {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const payload = {
      ...form,
      roleTags: form.roleTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const url =
        mode === 'create'
          ? '/api/profile'
          : `/api/profile/${editSlug}`;

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.details) {
          setErrors(data.details);
          toast.error('Please fix the errors below.');
        } else {
          toast.error(data.error ?? 'Request failed');
        }
        return;
      }

      toast.success(mode === 'create' ? 'Profile created!' : 'Profile updated!');
      router.push(`/dashboard/profiles/${data.data.slug}`);
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    required,
  }: {
    label: string;
    name: keyof ProfileFormData;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[name] as string}
        onChange={(e) => update(name, e.target.value)}
        placeholder={placeholder}
        className="input"
        required={required}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name][0]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core Identity */}
      <div className="card p-6 space-y-4">
        <h3 className="section-heading">Core Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" name="fullName" required placeholder="Jane Burns" />
          <div>
            <label className="label">
              Slug<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">/profile/</span>
              <input
                value={form.slug}
                onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="input"
                placeholder="jane-burns"
                required
              />
            </div>
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>}
          </div>
          <Field label="Title / Role" name="title" placeholder="VP of Engineering" />
          <Field label="Organization" name="organization" placeholder="Acme Corp" />
          <Field label="Department" name="department" placeholder="R&D" />
          <Field label="Location" name="location" placeholder="New York, NY" />
        </div>
      </div>

      {/* Contact */}
      <div className="card p-6 space-y-4">
        <h3 className="section-heading">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email" name="email" type="email" placeholder="jane@acme.com" />
          <Field label="Phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
          <Field label="Website" name="website" type="url" placeholder="https://acme.com" />
          <Field label="Avatar URL" name="avatarUrl" type="url" placeholder="https://.../avatar.jpg" />
        </div>
      </div>

      {/* Social */}
      <div className="card p-6 space-y-4">
        <h3 className="section-heading">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="LinkedIn" name="linkedIn" type="url" placeholder="https://linkedin.com/in/..." />
          <Field label="Twitter / X" name="twitter" placeholder="@handle" />
          <Field label="GitHub" name="github" placeholder="username" />
        </div>
      </div>

      {/* Bio & Tags */}
      <div className="card p-6 space-y-4">
        <h3 className="section-heading">Bio & Tags</h3>
        <div>
          <label className="label">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="Brief professional bio..."
            maxLength={1000}
          />
        </div>
        <Field
          label="Role Tags (comma separated)"
          name="roleTags"
          placeholder="Leadership, Engineering, Operations"
        />
        <div className="flex items-center gap-3">
          <input
            id="isPublic"
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => update('isPublic', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-700 dark:text-slate-300">
            Public profile (accessible without login via slug URL)
          </label>
        </div>
      </div>

      {/* Internal Notes (admin only) */}
      <div className="card p-6 space-y-4 border-amber-200 dark:border-amber-900">
        <h3 className="section-heading text-amber-600 dark:text-amber-500">
          🔒 Internal Notes (Admin Only)
        </h3>
        <textarea
          value={form.internalNotes}
          onChange={(e) => update('internalNotes', e.target.value)}
          className="input min-h-[80px] resize-y"
          placeholder="Notes not visible on public profile..."
          maxLength={5000}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-md btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-md btn-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : mode === 'create' ? (
            'Create Profile'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
