'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Send, Monitor, Route, FileText, CloudSun, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';

const tabs = [
  { key: 'aircraft', href: '/logbook/aircraft', icon: Plane },
  { key: 'glider', href: '/logbook/glider', icon: Send },
  { key: 'fstd', href: '/logbook/fstd', icon: Monitor },
  { key: 'route', href: '/plan/route', icon: Route },
  { key: 'ofp', href: '/plan/ofp', icon: FileText },
  { key: 'weather', href: '/plan/weather', icon: CloudSun },
] as const;

const HIDE_DELAY_MS = 1000;

export function FeatureTabs() {
  const pathname = usePathname();
  const t = useTranslations('tabs');
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearHideTimer();
    setIsVisible(true);
  }, [clearHideTimer]);

  const handleMouseLeave = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => setIsVisible(false), HIDE_DELAY_MS);
  }, [clearHideTimer]);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className='absolute left-1/2 -translate-x-1/2 z-40 flex flex-col items-center px-8'>
      {/* Invisible hover trigger zone — always present */}
      <div className='h-3 -mx-1 w-max' />

      <motion.nav
        initial={false}
        animate={isVisible ? { y: 0, opacity: 1, scaleY: 1 } : { y: -20, opacity: 0, scaleY: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`origin-top mx-auto w-fit rounded-xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50 ${
          isVisible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className='flex items-center gap-1 p-2'>
          {tabs.map(({ key, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href);

            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors select-none whitespace-nowrap ${
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
      </motion.nav>

      {/* Bottom padding zone for easier mouse interaction */}
      <div className='h-6 w-full' />
    </div>
  );
}
