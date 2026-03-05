'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Download,
  X,
  AlertTriangle,
  Minus,
  Search,
  GripVertical,
  PlaneTakeoff,
  PlaneLanding,
  Plus,
  Layers,
  Mountain,
  Plane,
  Navigation,
  MapPin,
  TriangleAlert,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRoute } from '@/components/route/route-context';
import { useAeroData, type WaypointSearchResult } from '@/hooks/use-aero-data';
import { TerrainProfileChart } from '@/components/route/terrain-profile';
import { getTerrainProfile, type TerrainSample } from '@/lib/terrain';
import { computeNavlog, type NavlogEntry } from '@/lib/navlog';

export interface LayerState {
  airspaceTypes: Record<number, boolean>;
  altitudeRange: [number, number];
  showTerrain: boolean;
  terrainOpacity: number;
  showAirports: boolean;
  showNavaids: boolean;
  showObstacles: boolean;
}

const DEFAULT_LAYERS: LayerState = {
  airspaceTypes: { 1: true, 2: true, 4: true, 6: true, 8: true, 10: true, 14: true },
  altitudeRange: [0, 9500],
  showTerrain: false,
  terrainOpacity: 0.5,
  showAirports: false,
  showNavaids: false,
  showObstacles: false,
};

const AIRSPACE_TYPE_LABELS: Record<number, string> = {
  1: 'CTR',
  2: 'TMA',
  4: 'ATZ',
  6: 'R',
  8: 'D',
  10: 'P',
  14: 'ADIZ',
  20: 'TSA',
  22: 'TRA',
};

interface MapSidebarProps {
  onLayerChange: (layers: LayerState) => void;
}

export function MapSidebar({ onLayerChange }: MapSidebarProps) {
  const t = useTranslations('map');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'route' | 'layers'>('route');
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [terrainProfile, setTerrainProfile] = useState<TerrainSample[]>([]);
  const [navlogEntries, setNavlogEntries] = useState<NavlogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WaypointSearchResult[]>([]);
  const [showEnrouteSearch, setShowEnrouteSearch] = useState(false);

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
      animate={{ width: isExpanded ? 380 : 56 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className='absolute top-18 left-2 z-40 bottom-2 flex flex-col rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl overflow-hidden select-none'
    >
      {/* Tab Bar */}
      <div className='flex shrink-0'>
        <TabButton
          active={isExpanded && activeTab === 'route'}
          onClick={() => {
            setIsExpanded(true);
            setActiveTab('route');
          }}
          collapsed={!isExpanded}
        >
          <PlaneTakeoff className='h-4 w-4' />
          {isExpanded && <span className='text-xs'>{t('route')}</span>}
        </TabButton>
        <TabButton
          active={isExpanded && activeTab === 'layers'}
          onClick={() => {
            setIsExpanded(true);
            setActiveTab('layers');
          }}
          collapsed={!isExpanded}
        >
          <Layers className='h-4 w-4' />
          {isExpanded && <span className='text-xs'>{t('layers')}</span>}
        </TabButton>
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className='flex h-12 w-10 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors ml-auto'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
        )}
      </div>

      <div className='mx-3 h-px bg-slate-200/80 dark:bg-zinc-700/80' />

      {/* Content */}
      <AnimatePresence mode='wait'>
        {isExpanded && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3'
          >
            {activeTab === 'route' ? (
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
            ) : (
              <LayersTab
                layers={layers}
                onToggleAirspaceType={toggleAirspaceType}
                onUpdateLayer={updateLayer}
                isOffline={isOffline}
                isDownloading={isDownloading}
                onDownload={downloadForOffline}
                lastDownloadDate={lastDownloadDate}
                t={t}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TabButton({ active, onClick, collapsed, children }: { active: boolean; onClick: () => void; collapsed: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-12 transition-colors ${
        active ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
      } ${collapsed ? 'flex-1 justify-center' : ''}`}
    >
      {children}
    </button>
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
      setDepResults([]);
      return;
    }
    const t = setTimeout(() => searchWaypoints(depSearch).then(setDepResults), 200);
    return () => clearTimeout(t);
  }, [depSearch, searchWaypoints]);

  useEffect(() => {
    if (destSearch.length < 2) {
      setDestResults([]);
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
                  className={`flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/80 px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing ${dragIndex === realIndex ? 'opacity-50' : ''}`}
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
          <p className='mt-1 text-[10px] text-slate-400 dark:text-zinc-500'>
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

function LayersTab({ layers, onToggleAirspaceType, onUpdateLayer, isOffline, isDownloading, onDownload, lastDownloadDate, t }: any) {
  return (
    <>
      {/* Airspace Types */}
      <div>
        <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2'>{t('airspaceTypes')}</h4>
        <div className='grid grid-cols-3 gap-1.5'>
          {Object.entries(AIRSPACE_TYPE_LABELS).map(([typeStr, label]) => {
            const type = Number(typeStr);
            const active = layers.airspaceTypes[type] ?? false;
            return (
              <button
                key={type}
                onClick={() => onToggleAirspaceType(type)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Altitude Range */}
      <div>
        <h4 className='text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2'>{t('altitudeRange')}</h4>
        <div className='flex items-center gap-2'>
          <span className='text-[10px] text-slate-400 w-10'>GND</span>
          <input
            type='range'
            min={0}
            max={24500}
            step={500}
            value={layers.altitudeRange[1]}
            onChange={e => onUpdateLayer('altitudeRange', [0, Number(e.target.value)])}
            className='flex-1 accent-sky-500'
          />
          <span className='text-[10px] text-slate-400 w-16 text-right'>
            {layers.altitudeRange[1] >= 10000 ? `FL${Math.round(layers.altitudeRange[1] / 100)}` : `${layers.altitudeRange[1]} ft`}
          </span>
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
          <ToggleRow icon={Plane} label={t('airports')} checked={layers.showAirports} onChange={v => onUpdateLayer('showAirports', v)} />
          <ToggleRow icon={Radio} label={t('navaids')} checked={layers.showNavaids} onChange={v => onUpdateLayer('showNavaids', v)} />
          <ToggleRow icon={TriangleAlert} label={t('obstacles')} checked={layers.showObstacles} onChange={v => onUpdateLayer('showObstacles', v)} />
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
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-600'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className='flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-800/70 px-2.5 py-2'>
      <div className='flex items-center gap-2'>
        <Icon className='h-3.5 w-3.5 text-slate-500 dark:text-zinc-400' />
        <span className='text-xs text-slate-700 dark:text-zinc-300'>{label}</span>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}
