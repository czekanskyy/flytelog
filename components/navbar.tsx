'use client';

import Link from 'next/link';
import { ShieldCheck, Settings, HelpCircle, Megaphone, LogOut } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';
import { UserAvatar } from '@/components/user-avatar';
import { ThemeDropdown, LocaleDropdown } from '@/components/nav-dropdowns';
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

const GREETING_COUNT = 9;

type NavbarProps = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatarColor: string;
    role: string;
  };
};

export function Navbar({ user }: NavbarProps) {
  const t = useTranslations();
  const format = useFormatter();

  // Deterministic "random" greeting based on user ID to prevent hydration mismatch
  const greetingIndex = user.id ? user.id.charCodeAt(user.id.length - 1) % GREETING_COUNT : 0;

  const isAdmin = user.role === 'ADMIN';

  const navLinks = [
    { icon: Megaphone, label: t('nav.changelog'), href: '/changelog' },
    { icon: HelpCircle, label: t('nav.help'), href: '/manual' },
    { icon: Settings, label: t('nav.settings'), href: '/settings' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: t('nav.admin'), href: '/admin' }] : []),
  ];

  return (
    <header className='sticky top-0 z-50 px-2 pt-2'>
      <div className='mx-auto max-w-7xl rounded-xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50'>
        <div className='relative flex h-14 items-center justify-between px-4 lg:px-5'>
          {/* Left — logo */}
          <Link href='/' className='text-lg font-bold tracking-tight text-sky-600 dark:text-sky-400 select-none shrink-0'>
            flyteLog
          </Link>

          {/* Center — greeting */}
          <div className='absolute inset-x-0 hidden md:flex justify-center pointer-events-none px-48'>
            <p className='text-sm text-slate-500 dark:text-zinc-400 truncate'>{t(`greetings.${greetingIndex}`, { name: user.firstName })}</p>
          </div>

          {/* Right — actions */}

          <div className='flex items-center gap-0.5'>
            <ThemeDropdown />
            <LocaleDropdown />

            <div className='w-px h-5 rounded-full border border-slate-500 dark:border-zinc-400 mx-2' />

            {navLinks.map(({ icon: Icon, label, href }) => (
              <Button
                key={href}
                variant='ghost'
                size='sm'
                asChild
                className='h-9 w-9 px-0 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hidden sm:inline-flex'
                title={label}
              >
                <Link href={href}>
                  <Icon className='h-4.5 w-4.5' />
                </Link>
              </Button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-9 w-9 px-0 ml-0.5 rounded-full' title={t('nav.account')}>
                  <UserAvatar firstName={user.firstName} lastName={user.lastName} color={user.avatarColor} size='sm' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-64 p-2 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50 mt-4'
              >
                <DropdownMenuLabel className='font-normal flex flex-col gap-1 p-2'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none text-slate-900 dark:text-zinc-100'>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className='text-xs leading-none text-slate-500 dark:text-zinc-400 italic'>{user.username}</p>
                    <p className='text-xs leading-none text-slate-500 dark:text-zinc-400'>{user.email}</p>
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
                  onClick={() => signOut()}
                  className='cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400'
                >
                  <LogOut className='h-4 w-4' />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
