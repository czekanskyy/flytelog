import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className='min-h-svh bg-background flex flex-col'>
        <Navbar user={session.user} />
        <main className='flex-1 relative border-t border-border'>{children}</main>
      </div>
    </TooltipProvider>
  );
}
