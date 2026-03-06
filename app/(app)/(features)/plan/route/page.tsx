'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapSidebar, type LayerState } from '@/components/map-sidebar';
import { MapClickPanel } from '@/components/route/map-click-panel';
import { RouteProvider } from '@/components/route/route-context';
import { useAeroData } from '@/hooks/use-aero-data';

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

function RoutePageInner() {
  const [layers, setLayers] = useState<LayerState | null>(null);
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lon: number } | null>(null);
  const { data } = useAeroData();

  const handleLayerChange = useCallback((l: LayerState) => setLayers(l), []);
  const handleMapClick = useCallback((lat: number, lon: number) => setClickedPoint({ lat, lon }), []);
  const handleClosePanel = useCallback(() => setClickedPoint(null), []);

  const visibleAirspaces =
    data?.airspaces
      ?.filter(a => layers?.airspaceTypes[a.type])
      ?.filter(a => {
        if (!layers) return true;
        const [minAlt, maxAlt] = layers.altitudeRange;
        const lower = a.lowerLimit ?? 0;
        const upper = a.upperLimit ?? 99999;
        return lower <= maxAlt && upper >= minAlt;
      })
      ?.map(a => ({
        type: a.type,
        icaoClass: a.icaoClass,
        name: a.name,
        geometry: a.geometry,
        upperLimit: a.upperLimit,
        lowerLimit: a.lowerLimit,
      })) ?? [];

  return (
    <div className='fixed inset-0 z-0'>
      <MapSidebar onLayerChange={handleLayerChange} />
      <DynamicWorldMap
        airspaces={visibleAirspaces}
        layers={layers}
        airports={layers?.showAirports ? data?.airports : undefined}
        navaids={layers?.showNavaids ? data?.navaids : undefined}
        obstacles={layers?.showObstacles ? data?.obstacles : undefined}
        reportingPoints={layers?.showReportingPoints ? data?.reportingPoints : undefined}
        onMapClick={handleMapClick}
        clickedPoint={clickedPoint}
      />
      <MapClickPanel clickedPoint={clickedPoint} onClose={handleClosePanel} />
    </div>
  );
}

export default function RoutePage() {
  return (
    <RouteProvider>
      <RoutePageInner />
    </RouteProvider>
  );
}
