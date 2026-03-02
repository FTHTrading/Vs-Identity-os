interface StatCard {
  label: string;
  value: number;
  description: string;
  colorClass: string;
  icon: React.ReactNode;
}

interface Props {
  stats: {
    totalProfiles: number;
    activeProfiles: number;
    totalUsers: number;
    signedProfiles: number;
    recentActivity: number;
  };
}

export default function DashboardStats({ stats }: Props) {
  const cards: StatCard[] = [
    {
      label: 'Total Profiles',
      value: stats.totalProfiles,
      description: `${stats.activeProfiles} active`,
      colorClass: 'text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'System Users',
      value: stats.totalUsers,
      description: 'Active accounts',
      colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Signed Profiles',
      value: stats.signedProfiles,
      description: 'Cryptographically verified',
      colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: '24h Activity',
      value: stats.recentActivity,
      description: 'Events in last 24 hours',
      colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{card.description}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.colorClass}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
