'use client';

import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';

type AdminUserNavProps = {
  user: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatarColor: string;
    role: string;
  };
};

export function AdminUserNav({ user }: AdminUserNavProps) {
  const t = useTranslations();

  return (
    <div className='flex items-center gap-3 text-sm text-zinc-400'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='h-9 w-auto px-2 gap-2 rounded-full hover:bg-zinc-800 hover:text-zinc-100' title={t('nav.account')}>
            <span className="hidden sm:inline-block">{user.firstName} {user.lastName}</span>
            <UserAvatar firstName={user.firstName} lastName={user.lastName} color={user.avatarColor} size='sm' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-64 p-2 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50 mt-2'
        >
          <DropdownMenuLabel className='font-normal flex flex-col gap-1 p-2'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm font-medium leading-none text-slate-900 dark:text-zinc-100'>
                {user.firstName} {user.lastName}
              </p>
              <p className='text-xs leading-none text-slate-500 dark:text-zinc-400 italic'>@{user.username}</p>
              <p className='text-xs leading-none text-slate-500 dark:text-zinc-400'>{user.email}</p>
              <div className="mt-1">
                <span className="inline-block rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-500">
                  {user.role}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className='cursor-pointer gap-2'>
            <Link href='/settings'>
              <Settings className='h-4 w-4 text-slate-500' />
              {t('nav.accSettings')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut({ redirectTo: '/login' })}
            className='cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400'
          >
            <LogOut className='h-4 w-4' />
            {t('nav.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
