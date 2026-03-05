'use client';

import dynamic from 'next/dynamic';

import { MapSidebar } from '@/components/map-sidebar';

const DynamicWorldMap = dynamic(() => import('@/components/worldmap'), {
  ssr: false,
  loading: () => (
    <div className='fixed inset-0 z-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-900'>
      <div className='animate-pulse flex flex-col items-center gap-4'>
        <div className='h-8 w-8 rounded-full border-4 border-slate-300 dark:border-zinc-700 border-t-sky-500 animate-spin' />
        <p className='text-slate-500 dark:text-zinc-400 text-sm'>Loading map...</p>
      </div>
    </div>
  ),
});

export default function RoutePage() {
  return (
    <div className='fixed inset-0 z-0'>
      <MapSidebar />
      <DynamicWorldMap />
    </div>
  );
}
