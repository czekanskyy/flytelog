'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, MapPin, Route as RouteIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function MapSidebar() {
  const t = useTranslations('map'); // Note: We might need to add translations for this
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <motion.div
      initial={{ width: 64 }}
      animate={{ width: isExpanded ? 320 : 64 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className='absolute top-18 left-2 z-40 bottom-2 flex flex-col rounded-2xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50 overflow-hidden'
    >
      {/* Sidebar Header / Toggle */}
      <div
        className='flex h-16 shrink-0 items-center justify-between px-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors rounded-2xl'
        onClick={toggleSidebar}
      >
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'>
          {isExpanded ? <ChevronLeft className='h-5 w-5' /> : <ChevronRight className='h-5 w-5' />}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className='ml-3 flex-1 font-semibold text-slate-800 dark:text-zinc-100 whitespace-nowrap'
            >
              {t('settings')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className='mx-4 my-2 h-px shrink-0 bg-slate-500 dark:bg-zinc-400' />

      {/* Scrollable Content */}
      <div className='flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700 px-3 pb-4 flex flex-col gap-2'>
        <SidebarItem icon={Layers} label={t('layers')} isExpanded={isExpanded} onClick={() => !isExpanded && setIsExpanded(true)} />
        <SidebarItem icon={RouteIcon} label={t('route')} isExpanded={isExpanded} onClick={() => !isExpanded && setIsExpanded(true)} />
        <SidebarItem icon={MapPin} label={t('waypoints')} isExpanded={isExpanded} onClick={() => !isExpanded && setIsExpanded(true)} />

        {/* Content visible only when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className='mt-4 px-1'>
              <p className='text-sm text-slate-500 dark:text-zinc-400 mb-4'>Miejsce na zaawansowane filtry i ustawienia trasy...</p>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className='h-10 w-full bg-slate-100 dark:bg-zinc-800 rounded-lg mb-2 animate-pulse' />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SidebarItem({ icon: Icon, label, isExpanded, onClick }: { icon: any; label: string; isExpanded: boolean; onClick: () => void }) {
  return (
    <Button variant='ghost' className={`h-12 w-full justify-start rounded-xl px-0 ${!isExpanded ? 'px-0 justify-center' : 'px-3'}`} onClick={onClick}>
      <div className='flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 dark:text-zinc-400'>
        <Icon className='h-5 w-5' />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className='ml-3 whitespace-nowrap text-slate-700 dark:text-zinc-300'
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
