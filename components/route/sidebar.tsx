'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  AlertTriangle,
  Minus,
  Search,
  GripVertical,
  Plus,
  Layers,
  Mountain,
  Navigation,
  MapPin,
  TrafficCone,
  SquareDot,
  Triangle,
  Settings,
  Spline,
  PlaneTakeoff,
  PlaneLanding,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRoute } from '@/components/route/route-context';
import { useAeroData, type WaypointSearchResult } from '@/hooks/use-aero-data';
import { TerrainProfileChart } from '@/components/route/terrain-profile';
import { getTerrainProfile, type TerrainSample } from '@/lib/terrain';
import { computeNavlog, type NavlogEntry } from '@/lib/navlog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface LayerState {
  airspaceTypes: Record<number, boolean>;
  altitudeRange: [number, number];
  showTerrain: boolean;
  terrainOpacity: number;
  showAirports: boolean;
  showNavaids: boolean;
  showObstacles: boolean;
  showReportingPoints: boolean;
}

// ---------------------------------------------------------------------------
// OpenAIP type number reference (actual values from /api/aero-data):
//  1=R, 2=D, 3=P, 4=CTR, 5=TMZ, 6=RMZ, 7=TMA, 8=TRA, 9=TSA,
//  10=FIR, 13=ATZ, 18=BVLOS, 21=LFA, 28=SPORT, 30=MRT, 33=NPZ
// ---------------------------------------------------------------------------

const DEFAULT_LAYERS: LayerState = {
  airspaceTypes: {
    9: false,
    8: false,
    2: false,
    13: false,
    30: false,
    33: false,
    1: false,
    4: false,
    7: false,
    3: false,
    6: false,
    5: false,
    18: false,
    21: false,
    28: false,
  },
  altitudeRange: [0, 9500],
  showTerrain: false,
  terrainOpacity: 0.5,
  showAirports: false,
  showNavaids: false,
  showObstacles: false,
  showReportingPoints: false,
};

interface AirspaceTypeConfig {
  type: number;
  label: string;
  color: string;
}

/**
 * AUP-activated / dynamic airspaces.
 * Zarządzane elastycznie przez AUP — aktywowane na bieżąco.
 */
const DYNAMIC_TYPES: AirspaceTypeConfig[] = [
  { type: 9, label: 'TSA', color: '#ef4444' }, // 43 records
  { type: 8, label: 'TRA', color: '#f97316' }, // 246 records
  { type: 2, label: 'D', color: '#a855f7' }, // 28 records
  { type: 13, label: 'ATZ', color: '#22c55e' }, // 50 records
  { type: 30, label: 'MRT', color: '#6366f1' }, // 151 records
  { type: 33, label: 'NPZ', color: '#64748b' }, // 9 records
];

/**
 * Static / always-active airspaces.
 * Zawsze aktywne — stałe struktury przestrzeni powietrznej.
 */
const STATIC_TYPES: AirspaceTypeConfig[] = [
  { type: 1, label: 'R', color: '#dc2626' }, // 28 records
  { type: 4, label: 'CTR', color: '#3b82f6' }, // 31 records
  { type: 7, label: 'TMA', color: '#0ea5e9' }, // 75 records
  { type: 3, label: 'P', color: '#7f1d1d' }, // 32 records
];

/**
 * Informational / recreational airspaces — off by default.
 * Strefy informacyjne i rekreacyjne.
 */
const OTHER_TYPES: AirspaceTypeConfig[] = [
  { type: 6, label: 'RMZ', color: '#94a3b8' }, // 69 records
  { type: 5, label: 'TMZ', color: '#818cf8' }, // 1 record
  { type: 18, label: 'BVLOS', color: '#f59e0b' }, // 35 records
  { type: 21, label: 'LFA', color: '#84cc16' }, // 47 records
  { type: 28, label: 'SPORT', color: '#ec4899' }, // 106 records
];

/**
 * Format altitude for the sidebar slider label.
 * 0 ft      → "GND"
 * 1–6500 ft → A-prefix in hundreds, e.g. A15, A65
 * ≥7000 ft  → FL-prefix, e.g. FL070, FL245
 * ≥66000 ft → "UNL"
 */
function formatAltFt(ft: number): string {
  if (ft === 0) return 'GND';
  if (ft >= 66000) return 'UNL';
  if (ft <= 6500) return `A${Math.round(ft / 100)}`;
  const fl = Math.round(ft / 100);
  return `FL${String(fl).padStart(3, '0')}`;
}

interface SidebarProps {
  onLayerChange: (layers: LayerState) => void;
}

export function Sidebar({ onLayerChange }: SidebarProps) {
  const t = useTranslations('map');
  const [isExpanded, setIsExpanded] = useState(false);
  // Which accordion sections are open (multiple can be open simultaneously)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['route']));
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [terrainProfile, setTerrainProfile] = useState<TerrainSample[]>([]);
  const [navlogEntries, setNavlogEntries] = useState<NavlogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WaypointSearchResult[]>([]);
  const [showEnrouteSearch, setShowEnrouteSearch] = useState(false);
  const [isSyncingAup, setIsSyncingAup] = useState(false);
  const [aupLastSync, setAupLastSync] = useState<Date | null>(null);

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const { waypoints, legs, departure, destination, removeWaypoint, setDeparture, setDestination, addEnroute, reorderWaypoints, setLegAltitude, clearRoute } =
    useRoute();
  const { isOffline, isDownloading, downloadForOffline, lastDownloadDate, searchWaypoints } = useAeroData();

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (waypoints.length < 2) {
      setTerrainProfile([]);
      setNavlogEntries([]);
      return;
    }
    const compute = async () => {
      const profile = await getTerrainProfile(waypoints);
      setTerrainProfile(profile);
      const entries = computeNavlog(legs, profile, legs[0]?.altitudeFt ?? 3500);
      setNavlogEntries(entries);
    };
    compute();
  }, [waypoints, legs]);

  useEffect(() => {
    onLayerChange(layers);
  }, [layers, onLayerChange]);

  const updateLayer = useCallback(<K extends keyof LayerState>(key: K, value: LayerState[K]) => {
    setLayers(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleAirspaceType = useCallback((type: number) => {
    setLayers(prev => ({
      ...prev,
      airspaceTypes: { ...prev.airspaceTypes, [type]: !prev.airspaceTypes[type] },
    }));
  }, []);

  const handleAupSync = useCallback(async () => {
    setIsSyncingAup(true);
    try {
      await fetch('/api/aup/sync', { method: 'POST' });
      setAupLastSync(new Date());
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error('[AUP sync]', err);
    } finally {
      setIsSyncingAup(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchWaypoints(searchQuery).then(setSearchResults);
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchWaypoints]);

  const handleSearchSelect = useCallback(
    (result: WaypointSearchResult, role: 'departure' | 'waypoint' | 'destination') => {
      const wp = {
        name: result.icao ? `${result.name} (${result.icao})` : result.name,
        lat: result.lat,
        lon: result.lon,
        elev: result.elev,
        type: result.type,
      };
      if (role === 'departure') setDeparture(wp);
      else if (role === 'destination') setDestination(wp);
      else addEnroute(wp);
      setSearchQuery('');
      setSearchResults([]);
      setShowEnrouteSearch(false);
    },
    [setDeparture, setDestination, addEnroute],
  );

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    reorderWaypoints(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const totalDistance = legs.reduce((sum, l) => sum + l.distanceNM, 0);

  return (
    <motion.div
      initial={{ width: 56 }}
      animate={{ width: isExpanded ? 'auto' : 56 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className='hidden md:flex absolute top-36 left-4 bottom-4 z-40 flex-col rounded-xl shadow-md select-none bg-white dark:bg-zinc-900 overflow-hidden'
    >
      {/* 
        Tryb zwinięty (Pasek Samych Ikon) 
      */}
      <AnimatePresence mode='wait'>
        {!isExpanded && (
          <motion.div
            key='icon-strip'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className='flex flex-col w-14 shrink-0 p-2 items-center gap-2'
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsExpanded(true)}
                  className='flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-zinc-700 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
                >
                  <ChevronRight className='h-5 w-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p>{t('routeAndMapSettings', { defaultMessage: 'Map and route settings' })}</p>
              </TooltipContent>
            </Tooltip>

            <div className='w-8 h-px bg-zinc-200/50 dark:bg-zinc-700/50 shrink-0' />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setIsExpanded(true);
                    setOpenSections(new Set(['route']));
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${openSections.has('route') ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  <Spline className='h-5 w-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p>{t('route')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setIsExpanded(true);
                    setOpenSections(new Set(['layers']));
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${openSections.has('layers') ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  <Layers className='h-5 w-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p>{t('layers')}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}

        {/* 
          Tryb rozwinięty (Panel Boczny) 
        */}
        {isExpanded && (
          <motion.div
            key='expanded-panel'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='flex flex-col flex-1 min-w-0 w-72 lg:w-96'
          >
            {/* Nagłówek (Header) wpisujący do map-click-panel */}
            <div className='flex items-center justify-between py-2 px-3 lg:py-3 lg:px-4 sticky left-0 top-0 shrink-0 bg-white dark:bg-zinc-900 z-50'>
              <div className='flex items-center gap-2'>
                <Settings className='h-4 w-4 lg:h-5 lg:w-5 text-sky-500' />
                <span className='font-semibold text-xs lg:text-sm text-zinc-700 dark:text-zinc-200 tracking-wider'>
                  {t('routeAndMapSettings', { defaultMessage: 'Map and route settings' })}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setOpenSections(new Set());
                }}
                className='flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors'
              >
                <ChevronLeft className='h-4 w-4 text-slate-500' />
              </button>
            </div>

            <div className='h-px bg-zinc-200/50 dark:bg-zinc-700/50' />

            <div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3'>
              <AccordionSection id='route' icon={Spline} title={t('route')} isOpen={openSections.has('route')} onToggle={toggleSection}>
                <RouteTab
                  departure={departure}
                  destination={destination}
                  waypoints={waypoints}
                  legs={legs}
                  navlogEntries={navlogEntries}
                  terrainProfile={terrainProfile}
                  totalDistance={totalDistance}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  showEnrouteSearch={showEnrouteSearch}
                  dragIndex={dragIndex}
                  onSearchChange={setSearchQuery}
                  onSearchSelect={handleSearchSelect}
                  onToggleEnrouteSearch={() => setShowEnrouteSearch(!showEnrouteSearch)}
                  onRemoveWaypoint={removeWaypoint}
                  onSetLegAltitude={setLegAltitude}
                  onClearRoute={clearRoute}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  t={t}
                />
              </AccordionSection>

              <AccordionSection id='layers' icon={Layers} title={t('layers')} isOpen={openSections.has('layers')} onToggle={toggleSection}>
                <LayersTab
                  layers={layers}
                  onToggleAirspaceType={toggleAirspaceType}
                  onUpdateLayer={updateLayer}
                  isOffline={isOffline}
                  isDownloading={isDownloading}
                  onDownload={downloadForOffline}
                  lastDownloadDate={lastDownloadDate}
                  isSyncingAup={isSyncingAup}
                  aupLastSync={aupLastSync}
                  onAupSync={handleAupSync}
                  t={t}
                />
              </AccordionSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AccordionSection({
  id,
  icon: Icon,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className='border-b border-slate-200/60 dark:border-zinc-700/60 last:border-0'>
      <button onClick={() => onToggle(id)} className='flex items-center justify-between w-full py-2.5 text-left group'>
        <div className='flex items-center gap-2'>
          <Icon className='h-3.5 w-3.5 text-slate-500 dark:text-zinc-400 shrink-0' />
          <span className='text-xs lg:text-sm font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider'>{title}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='pb-3 flex flex-col gap-3'>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  results,
  onSelect,
  roleFilter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  results: WaypointSearchResult[];
  onSelect: (r: WaypointSearchResult, role: 'departure' | 'waypoint' | 'destination') => void;
  roleFilter: 'departure' | 'waypoint' | 'destination';
}) {
  return (
    <div className='relative'>
      <div className='flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-zinc-800 px-2.5 py-2 border border-slate-200 dark:border-zinc-700'>
        <Search className='h-3.5 w-3.5 text-slate-400 shrink-0' />
        <input
          type='text'
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className='flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 focus:outline-none'
        />
        {value && (
          <button onClick={() => onChange('')} className='text-slate-400 hover:text-slate-600'>
            <X className='h-3 w-3' />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <div className='absolute left-0 right-0 top-full mt-1 rounded-lg bg-white dark:bg-zinc-800 shadow-lg border border-slate-200 dark:border-zinc-700 z-50 max-h-48 overflow-y-auto'>
          {results.map((r, i) => (
            <button
              key={`${r.type}-${i}`}
              onClick={() => onSelect(r, roleFilter)}
              className='w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors text-left'
            >
              <span className='text-slate-800 dark:text-zinc-200 font-medium truncate'>{r.name}</span>
              {r.icao && <span className='text-slate-400 shrink-0'>({r.icao})</span>}
              <span className='ml-auto text-[10px] text-slate-400 capitalize shrink-0'>{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RouteTab({
  departure,
  destination,
  waypoints,
  legs,
  navlogEntries,
  terrainProfile,
  totalDistance,
  searchQuery,
  searchResults,
  showEnrouteSearch,
  dragIndex,
  onSearchChange,
  onSearchSelect,
  onToggleEnrouteSearch,
  onRemoveWaypoint,
  onSetLegAltitude,
  onClearRoute,
  onDragStart,
  onDragOver,
  onDragEnd,
  t,
}: any) {
  const [depSearch, setDepSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [depResults, setDepResults] = useState<WaypointSearchResult[]>([]);
  const [destResults, setDestResults] = useState<WaypointSearchResult[]>([]);
  const { searchWaypoints } = useAeroData();

  useEffect(() => {
    if (depSearch.length < 2) {
      setTimeout(() => setDepResults([]), 0);
      return;
    }
    const t = setTimeout(() => searchWaypoints(depSearch).then(setDepResults), 200);
    return () => clearTimeout(t);
  }, [depSearch, searchWaypoints]);

  useEffect(() => {
    if (destSearch.length < 2) {
      setTimeout(() => setDestResults([]), 0);
      return;
    }
    const t = setTimeout(() => searchWaypoints(destSearch).then(setDestResults), 200);
    return () => clearTimeout(t);
  }, [destSearch, searchWaypoints]);

  return (
    <>
      {/* Departure */}
      <div>
        <label className='flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1'>
          <PlaneTakeoff className='h-3 w-3 text-green-500' />
          {t('departureAirport')}
        </label>
        {departure ? (
          <div className='flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-500/10 px-2.5 py-2 text-xs'>
            <span className='flex-1 font-medium text-green-700 dark:text-green-400 truncate'>{departure.name}</span>
            <button onClick={() => onRemoveWaypoint(0)} className='text-green-400 hover:text-red-500 transition-colors'>
              <X className='h-3 w-3' />
            </button>
          </div>
        ) : (
          <SearchInput
            value={depSearch}
            onChange={setDepSearch}
            placeholder={t('searchDeparture')}
            results={depResults}
            onSelect={(r, _) => {
              onSearchSelect(r, 'departure');
              setDepSearch('');
            }}
            roleFilter='departure'
          />
        )}
      </div>

      {/* Waypoints */}
      <div>
        <div className='flex items-center justify-between mb-1'>
          <label className='flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400'>
            <MapPin className='h-3 w-3 text-sky-500' />
            {t('waypoints')} ({waypoints.filter((w: any) => w.role === 'waypoint').length})
          </label>
          <div className='flex gap-1'>
            <button onClick={onToggleEnrouteSearch} className='text-sky-500 hover:text-sky-600 transition-colors'>
              <Plus className='h-3.5 w-3.5' />
            </button>
            {waypoints.length > 0 && (
              <button onClick={onClearRoute} className='text-xs text-red-500 hover:text-red-600 transition-colors'>
                {t('clearAll')}
              </button>
            )}
          </div>
        </div>

        {showEnrouteSearch && (
          <div className='mb-2'>
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={t('searchWaypoint')}
              results={searchResults}
              onSelect={(r, _) => onSearchSelect(r, 'waypoint')}
              roleFilter='waypoint'
            />
          </div>
        )}

        <div className='flex flex-col gap-1'>
          {waypoints
            .filter((w: any) => w.role === 'waypoint')
            .map((wp: any, i: number) => {
              const realIndex = waypoints.indexOf(wp);
              return (
                <div
                  key={wp.id}
                  draggable
                  onDragStart={() => onDragStart(realIndex)}
                  onDragOver={(e: React.DragEvent) => onDragOver(e, realIndex)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/80 px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing ${
                    dragIndex === realIndex ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className='h-3 w-3 text-slate-300 dark:text-zinc-600 shrink-0' />
                  <span className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white'>{i + 1}</span>
                  <span className='flex-1 truncate text-slate-700 dark:text-zinc-300'>{wp.name}</span>
                  <button onClick={() => onRemoveWaypoint(realIndex)} className='shrink-0 text-slate-400 hover:text-red-500 transition-colors'>
                    <Minus className='h-3 w-3' />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className='flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1'>
          <PlaneLanding className='h-3 w-3 text-red-500' />
          {t('destinationAirport')}
        </label>
        {destination ? (
          <div className='flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-2.5 py-2 text-xs'>
            <span className='flex-1 font-medium text-red-700 dark:text-red-400 truncate'>{destination.name}</span>
            <button onClick={() => onRemoveWaypoint(waypoints.length - 1)} className='text-red-400 hover:text-red-500 transition-colors'>
              <X className='h-3 w-3' />
            </button>
          </div>
        ) : (
          <SearchInput
            value={destSearch}
            onChange={setDestSearch}
            placeholder={t('searchDestination')}
            results={destResults}
            onSelect={(r, _) => {
              onSearchSelect(r, 'destination');
              setDestSearch('');
            }}
            roleFilter='destination'
          />
        )}
      </div>

      {/* Per-Leg Altitude */}
      {legs.length > 0 && (
        <div>
          <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5'>{t('legAltitudes')}</h4>
          <div className='flex flex-col gap-1'>
            {legs.map((leg: any, i: number) => (
              <div key={i} className='flex items-center gap-2 text-xs'>
                <span className='w-16 truncate text-slate-500 dark:text-zinc-400'>{i + 1}.</span>
                <input
                  type='number'
                  value={leg.altitudeFt}
                  onChange={e => onSetLegAltitude(i, Number(e.target.value))}
                  step={500}
                  min={500}
                  className='w-20 rounded bg-slate-100 dark:bg-zinc-800 px-2 py-1 text-xs border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-zinc-200'
                />
                <span className='text-slate-400'>ft</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navlog */}
      {navlogEntries.length > 0 && (
        <div>
          <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5'>Navlog</h4>
          <div className='rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700'>
            <table className='w-full text-[11px]'>
              <thead>
                <tr className='bg-slate-100 dark:bg-zinc-800'>
                  <th className='px-2 py-1 text-left font-medium text-slate-500 dark:text-zinc-400'>#</th>
                  <th className='px-2 py-1 text-right font-medium text-slate-500 dark:text-zinc-400'>NM</th>
                  <th className='px-2 py-1 text-right font-medium text-slate-500 dark:text-zinc-400'>MT°</th>
                  <th className='px-2 py-1 text-right font-medium text-slate-500 dark:text-zinc-400'>Alt</th>
                  <th className='px-2 py-1 text-center font-medium text-slate-500 dark:text-zinc-400'>⚠</th>
                </tr>
              </thead>
              <tbody>
                {navlogEntries.map((entry: NavlogEntry) => (
                  <tr
                    key={entry.legIndex}
                    className={`border-t border-slate-100 dark:border-zinc-800 ${entry.isBelowSafe ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                  >
                    <td className='px-2 py-1 text-slate-700 dark:text-zinc-300'>{entry.legIndex + 1}</td>
                    <td className='px-2 py-1 text-right text-slate-600 dark:text-zinc-400'>{entry.distanceNM}</td>
                    <td className='px-2 py-1 text-right text-slate-600 dark:text-zinc-400'>{entry.magneticTrack}°</td>
                    <td className='px-2 py-1 text-right text-slate-600 dark:text-zinc-400'>{legs[entry.legIndex]?.altitudeFt}</td>
                    <td className='px-2 py-1 text-center'>{entry.isBelowSafe && <AlertTriangle className='h-3 w-3 text-red-500 inline' />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className='mt-1 text-[11px] text-slate-400 dark:text-zinc-500'>
            {t('totalDistance')}: {totalDistance.toFixed(1)} NM
          </p>
        </div>
      )}

      {/* Terrain */}
      {terrainProfile.length > 0 && (
        <div>
          <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5'>{t('terrainProfile')}</h4>
          <TerrainProfileChart profile={terrainProfile} plannedAltitudeFt={legs[0]?.altitudeFt ?? 3500} width={340} height={140} />
        </div>
      )}
    </>
  );
}

function AirspaceTypeGrid({ types, layers, onToggle }: { types: AirspaceTypeConfig[]; layers: LayerState; onToggle: (t: number) => void }) {
  return (
    <div className='grid grid-cols-3 gap-1.5'>
      {types.map(({ type, label, color }) => {
        const active = layers.airspaceTypes[type] ?? false;
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors select-none border ${
              active
                ? 'bg-white dark:bg-zinc-800 shadow-sm border-slate-200 dark:border-zinc-600'
                : 'bg-slate-100/70 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/60'
            }`}
          >
            <span className='w-2 h-2 rounded-sm shrink-0 transition-colors' style={{ backgroundColor: active ? color : '#9ca3af' }} />
            <span className='transition-colors' style={{ color: active ? color : '#9ca3af' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LayersTab({
  layers,
  onToggleAirspaceType,
  onUpdateLayer,
  isOffline,
  isDownloading,
  onDownload,
  lastDownloadDate,
  isSyncingAup,
  aupLastSync,
  onAupSync,
  t,
}: any) {
  return (
    <>
      {/* Dynamic Airspaces (AUP) */}
      <div>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-1.5'>
            <span className='w-2 h-2 rounded-full bg-red-500 shrink-0' />
            <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider'>{t('dynamicAirspaces')}</h4>
          </div>
          <button
            onClick={onAupSync}
            disabled={isSyncingAup}
            className='flex items-center gap-1 text-[10px] text-sky-500 hover:text-sky-600 disabled:opacity-50 transition-colors select-none'
          >
            <Navigation className={`h-3 w-3 ${isSyncingAup ? 'animate-spin' : ''}`} />
            {isSyncingAup ? t('aupSyncing') : t('aupSync')}
          </button>
        </div>
        <AirspaceTypeGrid types={DYNAMIC_TYPES} layers={layers} onToggle={onToggleAirspaceType} />
        {aupLastSync && (
          <p className='mt-1.5 text-[10px] text-slate-400 dark:text-zinc-500'>
            {t('aupLastSync')}: {aupLastSync.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Static Airspaces */}
      <div>
        <div className='flex items-center gap-1.5 mb-2'>
          <span className='w-2 h-2 rounded-full bg-blue-500 shrink-0' />
          <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider'>{t('staticAirspaces')}</h4>
        </div>
        <AirspaceTypeGrid types={STATIC_TYPES} layers={layers} onToggle={onToggleAirspaceType} />
      </div>

      {/* Other / Informational */}
      <div>
        <div className='flex items-center gap-1.5 mb-2'>
          <span className='w-2 h-2 rounded-full bg-slate-400 shrink-0' />
          <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider'>{t('otherAirspaces')}</h4>
        </div>
        <AirspaceTypeGrid types={OTHER_TYPES} layers={layers} onToggle={onToggleAirspaceType} />
      </div>

      {/* Altitude Range */}
      <div>
        <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2'>{t('altitudeRange')}</h4>
        <div className='flex items-center gap-2'>
          <span className='text-[10px] text-slate-400 font-mono w-8'>GND</span>
          <input
            type='range'
            min={0}
            max={66000}
            step={500}
            value={layers.altitudeRange[1]}
            onChange={e => onUpdateLayer('altitudeRange', [0, Number(e.target.value)])}
            className='flex-1 accent-sky-500'
          />
          <span className='text-[10px] text-slate-400 font-mono w-14 text-right'>{formatAltFt(layers.altitudeRange[1])}</span>
        </div>
      </div>

      {/* Terrain Overlay */}
      <div>
        <div className='flex items-center justify-between mb-1'>
          <h4 className='flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400'>
            <Mountain className='h-3 w-3' />
            {t('terrainOverlay')}
          </h4>
          <ToggleSwitch checked={layers.showTerrain} onChange={v => onUpdateLayer('showTerrain', v)} />
        </div>
        {layers.showTerrain && (
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-[10px] text-slate-400'>0%</span>
            <input
              type='range'
              min={0}
              max={80}
              step={5}
              value={layers.terrainOpacity * 100}
              onChange={e => onUpdateLayer('terrainOpacity', Number(e.target.value) / 100)}
              className='flex-1 accent-sky-500'
            />
            <span className='text-[10px] text-slate-400'>{Math.round(layers.terrainOpacity * 100)}%</span>
          </div>
        )}
      </div>

      {/* Object Toggles */}
      <div>
        <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2'>{t('mapObjects')}</h4>
        <div className='flex flex-col gap-1.5'>
          <ToggleRow icon={PlaneLanding} label={t('airports')} checked={layers.showAirports} onChange={v => onUpdateLayer('showAirports', v)} />
          <ToggleRow icon={SquareDot} label={t('navaids')} checked={layers.showNavaids} onChange={v => onUpdateLayer('showNavaids', v)} />
          <ToggleRow icon={TrafficCone} label={t('obstacles')} checked={layers.showObstacles} onChange={v => onUpdateLayer('showObstacles', v)} />
          <ToggleRow
            icon={Triangle}
            label={t('reportingPoints')}
            checked={layers.showReportingPoints}
            onChange={v => onUpdateLayer('showReportingPoints', v)}
          />
        </div>
      </div>

      {/* Download */}
      <div className='mt-2 pt-2 border-t border-slate-200/80 dark:border-zinc-700/80'>
        <Button variant='outline' size='sm' className='w-full rounded-xl' onClick={onDownload} disabled={isDownloading || isOffline}>
          <Download className='h-4 w-4 mr-2' />
          {isDownloading ? t('downloading') : t('downloadOffline')}
        </Button>
        {lastDownloadDate && (
          <p className='mt-1 text-[10px] text-center text-slate-400 dark:text-zinc-500'>
            {t('lastDownload')}: {new Date(lastDownloadDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-slate-200 dark:bg-zinc-700'}`}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className='flex items-center justify-between py-1.5'>
      <div className='flex items-center gap-2'>
        <Icon className='h-3.5 w-3.5 text-slate-400 dark:text-zinc-500' />
        <span className='text-xs text-slate-600 dark:text-zinc-300'>{label}</span>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}
