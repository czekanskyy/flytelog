import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminUserNav } from './admin-user-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const t = await getTranslations('admin');

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className='min-h-svh bg-zinc-950 text-zinc-50'>
      <header className='border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6'>
          <div className='flex items-center gap-3'>
            <Link href='/' className='text-lg font-bold tracking-tight text-sky-400 hover:text-sky-300 transition-colors'>
              flyteLog
            </Link>
            <span className='rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400'>Admin</span>
          </div>
          <AdminUserNav
            user={{
              firstName: session.user.firstName,
              lastName: session.user.lastName,
              username: session.user.username,
              email: session.user.email,
              avatarSeed: session.user.avatarSeed,
              role: session.user.role,
            }}
          />
        </div>
      </header>
      <main className='mx-auto max-w-7xl px-6 py-8'>{children}</main>
    </div>
  );
}
