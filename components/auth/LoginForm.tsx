'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.details) {
          setErrors(data.details);
        } else {
          toast.error(data.error ?? 'Login failed');
        }
        return;
      }

      toast.success(`Welcome back, ${data.data.user.name}`);
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="label text-slate-300">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input bg-white/10 border-white/20 text-white placeholder-slate-500 focus:ring-brand-500"
          placeholder="you@organization.com"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="label text-slate-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="input bg-white/10 border-white/20 text-white placeholder-slate-500 focus:ring-brand-500"
          placeholder="••••••••••••"
        />
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-md btn-primary w-full text-base py-3 rounded-xl mt-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Authenticating...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
