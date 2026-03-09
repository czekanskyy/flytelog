'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Send, Monitor, Route, FileText, CloudSun } from 'lucide-react';
import { useTranslations } from 'next-intl';

const tabs = [
  { key: 'aircraft', href: '/logbook/aircraft', icon: Plane },
  { key: 'glider', href: '/logbook/glider', icon: Send },
  { key: 'fstd', href: '/logbook/fstd', icon: Monitor },
  { key: 'route', href: '/plan/route', icon: Route },
  { key: 'ofp', href: '/plan/ofp', icon: FileText },
  { key: 'weather', href: '/plan/weather', icon: CloudSun },
] as const;

export function RouteBar() {
  const pathname = usePathname();
  const t = useTranslations('tabs');

  return (
    <div className='sticky top-20 w-full lg:w-max mx-auto pb-2 px-4 lg:p-2 lg:shadow-lg items-center justify-center z-40 lg:rounded-full lg:bg-white lg:dark:bg-zinc-900 overflow-x-auto'>
      <div className='flex items-center gap-1 lg:p-0 w-max'>
        {tabs.map(({ key, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors select-none whitespace-nowrap shadow-md lg:shadow-none ${
                isActive
                  ? 'bg-sky-200 dark:bg-sky-700 text-sky-700 dark:text-sky-200'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className='h-4 w-4 shrink-0' />
              <span className=''>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
