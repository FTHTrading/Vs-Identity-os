import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/auth';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getSessionFromCookies();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar email={session.email} role={session.role} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
