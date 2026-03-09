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

export function FeatureTabs() {
  const pathname = usePathname();
  const t = useTranslations('tabs');

  return (
    <div className='sticky top-14 w-full h-14 bg-card border-b border-border shadow-sm flex items-center justify-center z-40'>
      <div className='flex items-center gap-1 overflow-x-auto'>
        {tabs.map(({ key, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors select-none whitespace-nowrap ${
                isActive
                  ? 'bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className='h-4 w-4 shrink-0' />
              <span className='hidden sm:inline'>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
