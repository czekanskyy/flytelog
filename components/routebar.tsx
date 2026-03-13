'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Send, Monitor, Route, FileText, CloudSun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

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

  const [isHovered, setIsHovered] = useState(true);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    setIsHovered(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 1500);
  };

  const isVisible = isDesktop === false || isHovered;

  return (
    <div
      className='sticky top-20 z-40 mx-auto w-full md:w-max flex justify-center'
      onMouseEnter={isDesktop ? handleMouseEnter : undefined}
      onMouseLeave={isDesktop ? handleMouseLeave : undefined}
    >
      <div className='hidden md:block absolute -inset-x-8 -inset-y-4 cursor-default z-0' />
      <motion.div
        initial={false}
        animate={{
          y: isVisible ? 0 : -40,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`relative z-10 w-full md:w-max mx-auto pb-2 px-4 md:p-2 md:shadow-lg items-center justify-center md:rounded-xl md:bg-white md:dark:bg-zinc-900 overflow-x-auto ${
          isVisible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className='flex items-center gap-1 md:p-0 w-max'>
          {tabs.map(({ key, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href);

            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors select-none whitespace-nowrap lg:shadow-md ${
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
      </motion.div>
    </div>
  );
}
