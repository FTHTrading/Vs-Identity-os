'use client';

import { Role } from '@prisma/client';
import { ROLE_LABELS } from '@/lib/utils';

interface TopBarProps {
  email: string;
  role: Role;
}

export default function TopBar({ email, role }: TopBarProps) {
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className="badge badge-blue text-xs">
          {ROLE_LABELS[role] ?? role}
        </span>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
            {email[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
            {email}
          </span>
        </div>
      </div>
    </header>
  );
}
