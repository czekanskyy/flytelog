import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className='min-h-svh bg-slate-50 dark:bg-zinc-950'>
      <Navbar user={session.user} />
      {children}
    </div>
  );
}
