'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings, HelpCircle, Megaphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/user-avatar';
import { ThemeDropdown, LocaleDropdown } from '@/components/nav-dropdowns';
import { Button } from '@/components/ui/button';

const GREETING_COUNT = 9;

type NavbarProps = {
  firstName: string;
  lastName: string;
  avatarColor: string;
  isAdmin: boolean;
};

export function Navbar({ firstName, lastName, avatarColor, isAdmin }: NavbarProps) {
  const t = useTranslations();
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    setGreetingIndex(Math.floor(Math.random() * GREETING_COUNT));
  }, []);

  const greeting = t(`greetings.${greetingIndex}`, { name: firstName });

  const navLinks = [
    { icon: Megaphone, label: t('nav.changelog'), href: '/changelog' },
    { icon: HelpCircle, label: t('nav.help'), href: '/manual' },
    { icon: Settings, label: t('nav.settings'), href: '/settings' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: t('nav.admin'), href: '/admin' }] : []),
  ];

  return (
    <header className='sticky top-0 z-50 px-3 pt-3 md:px-4 md:pt-4'>
      <div className='mx-auto max-w-7xl rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50'>
        <div className='relative flex h-14 items-center justify-between px-4 lg:px-5'>
          {/* Left — logo */}
          <Link href='/' className='text-lg font-bold tracking-tight text-sky-600 dark:text-sky-400 select-none shrink-0'>
            flyteLog
          </Link>

          {/* Center — greeting (absolutely centered, pointer-events-none so it doesn't block clicks) */}
          <p className='absolute inset-x-0 text-center text-sm text-slate-500 dark:text-zinc-400 truncate pointer-events-none hidden md:block px-48'>
            {greeting}
          </p>

          {/* Right — actions */}

          <div className='flex items-center gap-0.5'>
            <ThemeDropdown />
            <LocaleDropdown />

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

            <Button variant='ghost' size='sm' className='h-9 w-9 px-0 ml-0.5' title={t('nav.account')}>
              <UserAvatar firstName={firstName} lastName={lastName} color={avatarColor} size='sm' />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
