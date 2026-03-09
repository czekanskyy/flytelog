'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, MapPin, Mountain, Crosshair, PlaneTakeoff, PlaneLanding, Radio, Triangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRoute, toFplCoords } from '@/components/route/route-context';
import { useAeroData, type NearbySearchResult } from '@/hooks/use-aero-data';

interface MapClickPanelProps {
  clickedPoint: { lat: number; lon: number } | null;
  onClose: () => void;
}

const searchRadius = 5;

const TYPE_ICONS: Record<string, React.ElementType> = {
  airport: Plane,
  navaid: Radio,
  'reporting-point': Triangle,
  location: MapPin,
  peak: Mountain,
};

const TYPE_COLORS: Record<string, string> = {
  airport: 'text-sky-500',
  navaid: 'text-emerald-500',
  'reporting-point': 'text-violet-500',
  location: 'text-amber-500',
  peak: 'text-orange-600',
};

const TYPE_LABELS: Record<string, string> = {
  airport: 'Lotnisko',
  navaid: 'Navaid',
  'reporting-point': 'Pkt VFR',
  location: 'Miejscowość',
  peak: 'Szczyt',
};

function bearingToCardinal(bearing: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(bearing / 45) % 8];
}

export function MapClickPanel({ clickedPoint, onClose }: MapClickPanelProps) {
  const t = useTranslations('map');
  const { setDeparture, setDestination, addEnroute } = useRoute();
  const { searchNearby } = useAeroData();
  const [results, setResults] = useState<NearbySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (!clickedPoint) {
      setTimeout(() => setResults([]), 0);
      return;
    }

    setIsLoading(true);
    setCustomName('');
    searchNearby(clickedPoint.lat, clickedPoint.lon, searchRadius).then(r => {
      setResults(r);
      setIsLoading(false);
    });
  }, [clickedPoint, searchNearby]);

  const handleAddPoint = useCallback(
    (
      point: { name: string; lat: number; lon: number; elev?: number | null; type: NearbySearchResult['type'] | 'custom' },
      role: 'departure' | 'waypoint' | 'destination',
    ) => {
      const wp = { name: point.name, lat: point.lat, lon: point.lon, elev: point.elev, type: point.type };

      if (role === 'departure') setDeparture(wp);
      else if (role === 'destination') setDestination(wp);
      else addEnroute(wp);

      onClose();
    },
    [setDeparture, setDestination, addEnroute, onClose],
  );

  if (!clickedPoint) return null;

  const fplCoords = toFplCoords(clickedPoint.lat, clickedPoint.lon);
  const pointName = customName || fplCoords;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className='absolute lg:top-36 right-4 bottom-4 z-40 w-96 hidden lg:flex flex-col rounded-2xl bg-white dark:bg-zinc-900 shadow-md overflow-hidden select-none'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 shrink-0'>
          <div className='flex items-center gap-2'>
            <Crosshair className='h-4 w-4 text-sky-500' />
            <span className='font-semibold text-sm text-slate-800 dark:text-zinc-100'>{t('selectedPoint')}</span>
          </div>
          <button onClick={onClose} className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors'>
            <X className='h-4 w-4 text-slate-500' />
          </button>
        </div>

        <div className='mx-4 h-px bg-slate-200/80 dark:bg-zinc-700/80' />

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3'>
          {/* Clicked coords as custom point */}
          <div className='rounded-xl bg-sky-50 dark:bg-sky-500/10 p-3'>
            <p className='text-xs font-mono text-sky-700 dark:text-sky-300 mb-2'>{fplCoords}</p>
            <input
              type='text'
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder={t('customPointName')}
              className='w-full rounded-lg bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-2 text-slate-800 dark:text-zinc-200'
            />
            <div className='flex gap-1.5'>
              <RoleButton
                icon={PlaneTakeoff}
                label={t('asDeparture')}
                onClick={() => handleAddPoint({ name: pointName, lat: clickedPoint.lat, lon: clickedPoint.lon, type: 'custom' }, 'departure')}
              />
              <RoleButton
                icon={MapPin}
                label={t('asWaypoint')}
                onClick={() => handleAddPoint({ name: pointName, lat: clickedPoint.lat, lon: clickedPoint.lon, type: 'custom' }, 'waypoint')}
              />
              <RoleButton
                icon={PlaneLanding}
                label={t('asDestination')}
                onClick={() => handleAddPoint({ name: pointName, lat: clickedPoint.lat, lon: clickedPoint.lon, type: 'custom' }, 'destination')}
              />
            </div>
          </div>

          {/* Nearby results */}
          <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider'>
            {t('nearbyPoints')} ({searchRadius} NM)
          </h4>

          {isLoading && (
            <div className='flex justify-center py-4'>
              <div className='h-5 w-5 rounded-full border-2 border-slate-300 dark:border-zinc-600 border-t-sky-500 animate-spin' />
            </div>
          )}

          {!isLoading && results.length === 0 && <p className='text-xs text-slate-400 dark:text-zinc-500 text-center py-3'>{t('noNearbyPoints')}</p>}

          <div className='flex flex-col gap-1.5'>
            {results.slice(0, 30).map((result, i) => {
              const Icon = TYPE_ICONS[result.type] ?? MapPin;
              const colorClass = TYPE_COLORS[result.type] ?? 'text-slate-500';

              return (
                <div key={`${result.type}-${i}`} className='rounded-xl bg-slate-50 dark:bg-zinc-800/70 p-2.5'>
                  <div className='flex items-start gap-2 mb-2'>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-1.5 flex-wrap'>
                        <p className='text-sm font-medium text-slate-800 dark:text-zinc-200 truncate'>
                          {result.name}
                          {result.icao && <span className='ml-1 text-xs text-slate-400'>({result.icao})</span>}
                        </p>
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                            result.type === 'airport'
                              ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'
                              : result.type === 'navaid'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : result.type === 'reporting-point'
                                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                                  : result.type === 'peak'
                                    ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {TYPE_LABELS[result.type] ?? result.type}
                        </span>
                      </div>
                      <p className='text-[11px] text-slate-400 dark:text-zinc-500'>
                        {result.distanceNM.toFixed(1)} NM · {bearingToCardinal(result.bearing)} ({Math.round(result.bearing)}°)
                        {result.elev != null && ` · ${Math.round(result.elev)} ft`}
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-1.5'>
                    <RoleButton icon={PlaneTakeoff} label={t('asDeparture')} onClick={() => handleAddPoint(result, 'departure')} />
                    <RoleButton icon={MapPin} label={t('asWaypoint')} onClick={() => handleAddPoint(result, 'waypoint')} />
                    <RoleButton icon={PlaneLanding} label={t('asDestination')} onClick={() => handleAddPoint(result, 'destination')} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function RoleButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className='flex-1 flex items-center justify-center gap-1 rounded-lg bg-white dark:bg-zinc-700 px-2 py-1.5 text-[10px] font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-600 transition-colors border border-slate-200 dark:border-zinc-600 min-h-[44px]'
      title={label}
    >
      <Icon className='h-3 w-3' />
      <span className='hidden sm:inline'>{label}</span>
    </button>
  );
}
