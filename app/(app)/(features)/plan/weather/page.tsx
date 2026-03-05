import { CloudSun } from 'lucide-react';

export default function WeatherPage() {
  return (
    <div className='mx-auto max-w-7xl px-4 lg:px-6 py-6'>
      <div className='flex flex-col items-center justify-center gap-4 py-20 text-center'>
        <CloudSun className='h-12 w-12 text-sky-500/30' />
        <h1 className='text-xl font-bold text-slate-800 dark:text-zinc-100'>Weather</h1>
        <p className='text-sm text-slate-500 dark:text-zinc-400'>METAR, TAF and NOTAM briefing — coming soon</p>
      </div>
    </div>
  );
}
