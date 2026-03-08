'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Map, Globe, Triangle, SquareDot, TrafficCone, Locate, PlaneTakeoff, MapPin, X, Info, Crosshair, PlaneLanding } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTranslations } from 'next-intl';
import { useRoute, type Waypoint } from '@/components/route/route-context';
import type { LayerState } from '@/components/map-sidebar';
import type { WarningLevel } from '@/lib/navlog';
import { computeNavlog, type NavlogEntry } from '@/lib/navlog';
import { getTerrainProfile } from '@/lib/terrain';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createWaypointIcon(index: number, role: string) {
  const bg = role === 'departure' ? '#22c55e' : role === 'destination' ? '#ef4444' : '#3b82f6';
  const label = role === 'departure' ? 'D' : role === 'destination' ? 'A' : String(index + 1);
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Lucide icon SVGs pre-rendered for Leaflet divIcons
const LUCIDE_ICONS = {
  airport: renderToStaticMarkup(<Locate width={22} height={22} stroke='#6b7280' strokeWidth={1.75} fill='none' />),
  navaid: renderToStaticMarkup(<SquareDot width={20} height={20} stroke='#8b5cf6' strokeWidth={1.75} fill='none' />),
  obstacle: renderToStaticMarkup(<TrafficCone width={18} height={18} stroke='#ef4444' strokeWidth={1.75} fill='none' />),
  'reporting-point': renderToStaticMarkup(<Triangle width={20} height={20} stroke='#3b82f6' strokeWidth={1.75} fill='none' />),
} as const;

const ICON_SIZES: Record<string, number> = {
  airport: 22,
  navaid: 20,
  obstacle: 18,
  'reporting-point': 20,
};

function createObjectIcon(type: 'airport' | 'navaid' | 'obstacle' | 'reporting-point') {
  const svg = LUCIDE_ICONS[type];
  const size = ICON_SIZES[type] ?? 20;
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4));display:flex;align-items:center;justify-content:center;">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const LEG_COLORS: Record<WarningLevel, string> = {
  safe: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

function createLegInfoIcon(magneticTrack: number, distanceNM: number, warningLevel: WarningLevel) {
  const bg = warningLevel === 'danger' ? 'rgba(239,68,68,0.9)' : warningLevel === 'warning' ? 'rgba(245,158,11,0.9)' : 'rgba(255,255,255,0.92)';
  const color = warningLevel === 'safe' ? '#374151' : '#ffffff';
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};backdrop-filter:blur(8px);padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;color:${color};white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.3);pointer-events:none;">${magneticTrack}° · ${distanceNM} NM</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 10],
  });
}

const DEFAULT_CENTER: [number, number] = [50.11, 22.019];
const DEFAULT_ZOOM = 7;

// OpenAIP type → colour — must mirror DYNAMIC_TYPES / STATIC_TYPES / OTHER_TYPES in map-sidebar.tsx
const AIRSPACE_COLORS: Record<number, string> = {
  1: '#dc2626', // R     — dark red
  2: '#a855f7', // D     — purple
  3: '#7f1d1d', // P     — maroon
  4: '#3b82f6', // CTR   — blue
  5: '#818cf8', // TMZ   — indigo-light
  6: '#94a3b8', // RMZ   — slate
  7: '#0ea5e9', // TMA   — sky
  8: '#f97316', // TRA   — orange
  9: '#ef4444', // TSA   — red
  13: '#22c55e', // ATZ   — green
  18: '#f59e0b', // BVLOS — amber
  21: '#84cc16', // LFA   — lime
  28: '#ec4899', // SPORT — pink
  30: '#6366f1', // MRT   — indigo
  33: '#64748b', // NPZ   — slate
};

function getAirspaceColor(type: number) {
  return AIRSPACE_COLORS[type] || '#6b7280';
}

// Poland terrain tile bounds (N49-N54, E014-E023)
const TERRAIN_TILES: { key: string; bounds: [[number, number], [number, number]] }[] = [];
for (let lat = 49; lat <= 54; lat++) {
  for (let lon = 14; lon <= 23; lon++) {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lon >= 0 ? 'E' : 'W';
    const key = `${ns}${String(Math.abs(lat)).padStart(2, '0')}${ew}${String(Math.abs(lon)).padStart(3, '0')}`;
    TERRAIN_TILES.push({
      key,
      bounds: [
        [lat, lon],
        [lat + 1, lon + 1],
      ],
    });
  }
}

interface AirspaceFeature {
  type: number;
  icaoClass?: number;
  name: string;
  geometry: any;
  upperLimit?: number;
  lowerLimit?: number;
}

interface ObjectRecord {
  name?: string;
  lat: number;
  lon: number;
  icaoCode?: string;
  elevation?: number;
  heightAgl?: number;
  type?: number;
  frequency?: string;
  objectKind?: 'airport' | 'navaid' | 'obstacle' | 'reporting-point';
}

interface SelectedPoint {
  lat: number;
  lon: number;
  data: ObjectRecord;
  kind: 'airport' | 'navaid' | 'obstacle' | 'reporting-point';
}

const NAVAID_TYPE_LABELS: Record<number, string> = {
  2: 'VOR',
  3: 'DME',
  4: 'NDB',
  5: 'TACAN',
  6: 'VOR/DME',
  7: 'NDB/DME',
  9: 'ILS',
  10: 'ILS/DME',
  12: 'LOC',
  13: 'LOC/DME',
  14: 'DVOR',
  15: 'DVOR/DME',
};

const AIRPORT_TYPE_LABELS: Record<number, string> = {
  0: 'Civil & Military Airport',
  1: 'Glider Site',
  2: 'Civil Airport',
  3: 'Intl. Airport',
  4: 'Military Heliport',
  5: 'Military Airport',
  6: 'Ultralight Airfield',
  7: 'Civil Heliport',
  8: 'Closed Airfield',
  9: 'Intl. Airport',
  10: 'Water Airfield',
  11: 'Landing Strip',
  12: 'Agricultural Airfield',
  13: 'Mountain Airfield',
};

const POPUP_W = 240;
const POPUP_H_EST = 220;

function PointPopup({
  point,
  popupRef,
  beakRef,
  onClose,
  onAdep,
  onAdes,
  onWpt,
}: {
  point: SelectedPoint;
  popupRef: React.RefObject<HTMLDivElement | null>;
  beakRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onAdep: (p: SelectedPoint) => void;
  onAdes: (p: SelectedPoint) => void;
  onWpt: (p: SelectedPoint) => void;
}) {
  const { data, kind } = point;

  const kindColors: Record<SelectedPoint['kind'], string> = {
    airport: '#6b7280',
    navaid: '#8b5cf6',
    obstacle: '#ef4444',
    'reporting-point': '#3b82f6',
  };

  const kindLabel: Record<SelectedPoint['kind'], string> = {
    airport: 'Lotnisko',
    navaid: 'Navaid',
    obstacle: 'Przeszkoda',
    'reporting-point': 'Punkt VFR',
  };

  const typeLabel =
    kind === 'navaid' && data.type != null
      ? (NAVAID_TYPE_LABELS[data.type] ?? `Type ${data.type}`)
      : kind === 'airport' && data.type != null
        ? (AIRPORT_TYPE_LABELS[data.type] ?? `Type ${data.type}`)
        : kindLabel[kind];

  const isAirport = kind === 'airport';

  // Start off-screen; DomPopupTracker repositions via DOM directly
  return (
    <div ref={popupRef} style={{ left: -9999, top: -9999, width: POPUP_W }} className='absolute z-1000 overflow-visible select-none pointer-events-none'>
      {/* Card */}
      <div
        className='rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden pointer-events-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-2 px-3 pt-3 pb-2'>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate'>{data.name ?? '—'}</p>
            {data.icaoCode && <p className='text-[11px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5'>{data.icaoCode}</p>}
          </div>
          <button
            onClick={onClose}
            className='shrink-0 h-6 w-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors'
          >
            <X className='h-3.5 w-3.5 text-slate-500' />
          </button>
        </div>

        {/* Type badge */}
        <div className='px-3 pb-2'>
          <span
            className='inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full text-white'
            style={{ background: kindColors[kind] }}
          >
            <Info className='h-2.5 w-2.5' />
            {typeLabel}
          </span>
        </div>

        {/* Data rows */}
        <div className='px-3 pb-2 flex flex-col gap-0.5'>
          {data.elevation != null && (
            <div className='flex justify-between text-xs'>
              <span className='text-slate-500 dark:text-zinc-400'>AMSL</span>
              <span className='font-medium text-slate-800 dark:text-zinc-200'>{Math.round(data.elevation)} ft</span>
            </div>
          )}
          {data.heightAgl != null && (
            <div className='flex justify-between text-xs'>
              <span className='text-slate-500 dark:text-zinc-400'>AGL</span>
              <span className='font-medium text-slate-800 dark:text-zinc-200'>{Math.round(data.heightAgl)} ft</span>
            </div>
          )}
          {data.frequency && (
            <div className='flex justify-between text-xs'>
              <span className='text-slate-500 dark:text-zinc-400'>FREQ</span>
              <span className='font-medium font-mono text-slate-800 dark:text-zinc-200'>{data.frequency}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className='flex gap-1 px-3 pb-3'>
          {isAirport && (
            <button
              onClick={() => onAdep(point)}
              className='flex-1 flex flex-col items-center gap-0.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 py-2 transition-colors'
            >
              <PlaneTakeoff className='h-4 w-4 text-sky-500' />
              <span className='text-[9px] font-bold uppercase text-sky-600 dark:text-sky-400'>ADEP</span>
            </button>
          )}
          <button
            onClick={() => onWpt(point)}
            className='flex-1 flex flex-col items-center gap-0.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 py-2 transition-colors'
          >
            <MapPin className='h-4 w-4 text-sky-500' />
            <span className='text-[9px] font-bold uppercase text-sky-600 dark:text-sky-400'>WPT</span>
          </button>
          {isAirport && (
            <button
              onClick={() => onAdes(point)}
              className='flex-1 flex flex-col items-center gap-0.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 py-2 transition-colors'
            >
              <PlaneLanding className='h-4 w-4 text-sky-500' />
              <span className='text-[9px] font-bold uppercase text-sky-600 dark:text-sky-400'>ADES</span>
            </button>
          )}
        </div>
      </div>

      {/* Beak arrow — repositioned by DomPopupTracker via ref */}
      <div
        ref={beakRef}
        style={{ left: POPUP_W / 2 }}
        className='absolute -translate-x-1/2 w-3 h-3 rotate-45 bg-white/95 dark:bg-zinc-900/95 shadow-sm pointer-events-none -bottom-1.5 -z-10'
      />
    </div>
  );
}

/**
 * Lives inside MapContainer — updates popup DOM node position directly
 * on every map move/zoom frame, with zero React re-renders.
 */
function DomPopupTracker({
  latLon,
  popupRef,
  beakRef,
}: {
  latLon: [number, number];
  popupRef: React.RefObject<HTMLDivElement | null>;
  beakRef: React.RefObject<HTMLDivElement | null>;
}) {
  const map = useMap();

  const reposition = useCallback(() => {
    const el = popupRef.current;
    const beak = beakRef.current;
    if (!el) return;

    const pt = map.latLngToContainerPoint(L.latLng(latLon[0], latLon[1]));
    const GAP = 10;
    const BEAK_H = 6;
    const vw = map.getContainer().clientWidth;

    const rawLeft = pt.x - POPUP_W / 2;
    const left = Math.max(8, Math.min(rawLeft, vw - POPUP_W - 8));
    const beakOffset = Math.max(16, Math.min(pt.x - left, POPUP_W - 16));

    const showAbove = pt.y - GAP - BEAK_H >= POPUP_H_EST + 8;
    const top = showAbove ? pt.y - POPUP_H_EST - BEAK_H - GAP : pt.y + GAP;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    if (beak) {
      beak.style.left = `${beakOffset}px`;
      beak.classList.remove('-bottom-1.5', 'border-r', 'border-b', '-top-1.5', 'border-l', 'border-t');
      if (showAbove) {
        beak.classList.add('-bottom-1.5', 'border-r', 'border-b');
      } else {
        beak.classList.add('-top-1.5', 'border-l', 'border-t');
      }
    }
  }, [map, latLon, popupRef, beakRef]);

  useEffect(() => {
    reposition();
  }, [reposition]);

  useMapEvents({ move: reposition, zoom: reposition, viewreset: reposition });

  return null;
}

function MapClickHandler({ onMapClick, onClosePopup }: { onMapClick: (lat: number, lon: number) => void; onClosePopup: () => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onClosePopup();
      // Only trigger within Poland bounds
      if (lat >= 49 && lat <= 55 && lng >= 14 && lng <= 24.5) {
        onMapClick(lat, lng);
      }
    },
  });
  return null;
}

function UserLocationUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface WorldMapProps {
  airspaces?: AirspaceFeature[];
  layers?: LayerState | null;
  airports?: ObjectRecord[];
  navaids?: ObjectRecord[];
  obstacles?: ObjectRecord[];
  reportingPoints?: ObjectRecord[];
  onMapClick?: (lat: number, lon: number) => void;
  clickedPoint?: { lat: number; lon: number } | null;
}

export default function WorldMap({ airspaces = [], layers, airports, navaids, obstacles, reportingPoints, onMapClick, clickedPoint }: WorldMapProps) {
  const tMap = useTranslations('map');
  const { waypoints, moveWaypoint, legs, setDeparture, setDestination, addEnroute } = useRoute();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [showLocationError, setShowLocationError] = useState(false);
  const [navlogEntries, setNavlogEntries] = useState<NavlogEntry[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const beakRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map>(null);

  const handleMarkerClick = useCallback((e: L.LeafletMouseEvent, data: ObjectRecord, kind: SelectedPoint['kind']) => {
    L.DomEvent.stopPropagation(e);
    setSelectedPoint({ lat: e.latlng.lat, lon: e.latlng.lng, data, kind });
  }, []);

  const closePopup = useCallback(() => setSelectedPoint(null), []);

  const kindToWpType = useCallback((kind: SelectedPoint['kind']): Waypoint['type'] => {
    if (kind === 'obstacle') return 'custom';
    return kind;
  }, []);

  const handleAdep = useCallback(
    (p: SelectedPoint) => {
      setDeparture({ name: p.data.name ?? p.data.icaoCode ?? 'ADEP', lat: p.lat, lon: p.lon, elev: p.data.elevation, type: kindToWpType(p.kind) });
      setSelectedPoint(null);
    },
    [setDeparture, kindToWpType],
  );

  const handleAdes = useCallback(
    (p: SelectedPoint) => {
      setDestination({ name: p.data.name ?? p.data.icaoCode ?? 'ADES', lat: p.lat, lon: p.lon, elev: p.data.elevation, type: kindToWpType(p.kind) });
      setSelectedPoint(null);
    },
    [setDestination, kindToWpType],
  );

  const handleWpt = useCallback(
    (p: SelectedPoint) => {
      addEnroute({ name: p.data.name ?? p.data.icaoCode ?? 'WPT', lat: p.lat, lon: p.lon, elev: p.data.elevation, type: kindToWpType(p.kind) });
      setSelectedPoint(null);
    },
    [addEnroute, kindToWpType],
  );

  // Compute navlog for leg coloring
  useEffect(() => {
    if (waypoints.length < 2) {
      setNavlogEntries([]);
      return;
    }
    const compute = async () => {
      const profile = await getTerrainProfile(waypoints);
      const entries = computeNavlog(legs, profile, 3500, airspaces as any);
      setNavlogEntries(entries);
    };
    compute();
  }, [waypoints, legs, airspaces]);

  const handleLocationClick = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setShowLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(c);
        mapRef.current?.flyTo(c, 13, { duration: 1.5 });
      },
      () => setShowLocationError(true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      onMapClick?.(lat, lon);
    },
    [onMapClick],
  );

  const mapLayerUrl =
    mapMode === 'street'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const mapAttribution = mapMode === 'street' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : 'Tiles &copy; Esri';

  const airportIcon = useMemo(() => createObjectIcon('airport'), []);
  const navaidIcon = useMemo(() => createObjectIcon('navaid'), []);
  const obstacleIcon = useMemo(() => createObjectIcon('obstacle'), []);
  const reportingPointIcon = useMemo(() => createObjectIcon('reporting-point'), []);

  return (
    <div className='h-full w-full isolate z-0 bg-slate-100 dark:bg-zinc-900 overflow-hidden relative'>
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className='h-full w-full z-0' zoomControl={false} ref={mapRef}>
        <TileLayer attribution={mapAttribution} url={mapLayerUrl} />

        {/* Terrain overlay */}
        {layers?.showTerrain &&
          TERRAIN_TILES.map(tile => <ImageOverlay key={tile.key} url={`/terrain/${tile.key}.png`} bounds={tile.bounds} opacity={layers.terrainOpacity} />)}

        {/* Airspace layers */}
        {airspaces.map((as, i) => {
          if (!as.geometry) return null;
          const geoJsonData = { type: 'Feature' as const, properties: { name: as.name, type: as.type }, geometry: as.geometry };
          const color = getAirspaceColor(as.type);

          const lowerStr =
            as.lowerLimit != null
              ? as.lowerLimit === 0
                ? 'GND'
                : as.lowerLimit <= 6500
                  ? `A${Math.round(as.lowerLimit / 100)}`
                  : `FL${String(Math.round(as.lowerLimit / 100)).padStart(3, '0')}`
              : '—';
          const upperStr =
            as.upperLimit != null
              ? as.upperLimit >= 66000
                ? 'UNL'
                : as.upperLimit <= 6500
                  ? `A${Math.round(as.upperLimit / 100)}`
                  : `FL${String(Math.round(as.upperLimit / 100)).padStart(3, '0')}`
              : '—';

          const typeLabels: Record<number, string> = {
            1: 'R',
            2: 'D',
            3: 'P',
            4: 'CTR',
            5: 'TMZ',
            6: 'RMZ',
            7: 'TMA',
            8: 'TRA',
            9: 'TSA',
            13: 'ATZ',
            18: 'BVLOS',
            21: 'LFA',
            28: 'SPORT',
            30: 'MRT',
            33: 'NPZ',
          };
          const typeLabel = typeLabels[as.type] ?? `Type ${as.type}`;

          return (
            <GeoJSON
              key={`as-${i}-${as.name}`}
              data={geoJsonData as any}
              style={{ color, weight: 1.5, opacity: 0.8, fillColor: color, fillOpacity: 0.1 }}
              onEachFeature={(_, layer) => {
                layer.bindPopup(
                  `<div style="font-family:sans-serif;font-size:12px;min-width:160px">
                    <div style="font-weight:700;margin-bottom:4px">${as.name}</div>
                    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
                      <span style="background:${color};color:#fff;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600">${typeLabel}</span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:11px">
                      <tr><td style="color:#6b7280;padding:1px 4px 1px 0">↓ Lower</td><td style="font-weight:600">${lowerStr}</td></tr>
                      <tr><td style="color:#6b7280;padding:1px 4px 1px 0">↑ Upper</td><td style="font-weight:600">${upperStr}</td></tr>
                    </table>
                  </div>`,
                  { className: 'leaflet-popup-airspace' },
                );
              }}
            />
          );
        })}

        {/* Per-leg colored polylines */}
        {legs.map((leg, i) => {
          const entry = navlogEntries[i];
          const color = entry ? LEG_COLORS[entry.warningLevel] : '#3b82f6';
          return (
            <Polyline
              key={`leg-${i}`}
              positions={[
                [leg.from.lat, leg.from.lon],
                [leg.to.lat, leg.to.lon],
              ]}
              pathOptions={{ color, weight: 3, opacity: 0.9 }}
            />
          );
        })}

        {/* Leg info boxes at midpoints */}
        {navlogEntries.map(entry => {
          const leg = legs[entry.legIndex];
          if (!leg) return null;
          const midLat = (leg.from.lat + leg.to.lat) / 2;
          const midLon = (leg.from.lon + leg.to.lon) / 2;
          return (
            <Marker
              key={`info-${entry.legIndex}`}
              position={[midLat, midLon]}
              icon={createLegInfoIcon(entry.magneticTrack, entry.distanceNM, entry.warningLevel)}
              interactive={false}
            />
          );
        })}

        {/* Waypoint markers */}
        {waypoints.map((wp, i) => (
          <Marker
            key={wp.id}
            position={[wp.lat, wp.lon]}
            icon={createWaypointIcon(i, wp.role)}
            draggable
            eventHandlers={{
              dragend: e => {
                const { lat, lng } = e.target.getLatLng();
                moveWaypoint(i, lat, lng);
              },
            }}
          >
            <Popup className='text-xs'>
              <div className='flex flex-col gap-0.5'>
                <span className='font-semibold'>{wp.name}</span>
                <span className='text-slate-500'>
                  {wp.lat.toFixed(4)}°, {wp.lon.toFixed(4)}°
                </span>
                {wp.elev != null && <span className='text-slate-500'>{wp.elev} ft</span>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Airport markers */}
        {airports?.map((a, i) => (
          <Marker key={`apt-${i}`} position={[a.lat, a.lon]} icon={airportIcon} eventHandlers={{ click: e => handleMarkerClick(e as any, a, 'airport') }} />
        ))}

        {/* Navaid markers */}
        {navaids?.map((n, i) => (
          <Marker key={`nav-${i}`} position={[n.lat, n.lon]} icon={navaidIcon} eventHandlers={{ click: e => handleMarkerClick(e as any, n, 'navaid') }} />
        ))}

        {/* Obstacle markers */}
        {obstacles?.map((o, i) => (
          <Marker key={`obs-${i}`} position={[o.lat, o.lon]} icon={obstacleIcon} eventHandlers={{ click: e => handleMarkerClick(e as any, o, 'obstacle') }} />
        ))}

        {/* Reporting point / VFR markers */}
        {reportingPoints?.map((rp, i) => (
          <Marker
            key={`rp-${i}`}
            position={[rp.lat, rp.lon]}
            icon={reportingPointIcon}
            eventHandlers={{ click: e => handleMarkerClick(e as any, rp, 'reporting-point') }}
          />
        ))}

        {/* Clicked point marker */}
        {clickedPoint && (
          <Marker
            position={[clickedPoint.lat, clickedPoint.lon]}
            icon={L.divIcon({
              className: '',
              html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${renderToStaticMarkup(
                <Crosshair width={24} height={24} stroke='#0ea5e9' strokeWidth={2} fill='none' />,
              )}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
            interactive={false}
          />
        )}

        <UserLocationUpdater center={center} />
        <MapClickHandler onMapClick={handleMapClick} onClosePopup={closePopup} />
        {selectedPoint && <DomPopupTracker latLon={[selectedPoint.lat, selectedPoint.lon]} popupRef={popupRef} beakRef={beakRef} />}
      </MapContainer>

      {/* Map Controls */}
      <div className='absolute bottom-6 right-4 z-400 flex flex-col gap-2'>
        <button
          onClick={() => setMapMode(mapMode === 'street' ? 'satellite' : 'street')}
          className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors'
          title={tMap('toggleLayer')}
          aria-label={tMap('toggleLayer')}
        >
          {mapMode === 'street' ? <Globe className='h-6 w-6' /> : <Map className='h-6 w-6' />}
        </button>
        <button
          onClick={handleLocationClick}
          className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors'
          title={tMap('myLocation')}
          aria-label={tMap('myLocation')}
        >
          <LocateFixed className='h-6 w-6' />
        </button>
      </div>

      {selectedPoint && (
        <PointPopup
          point={selectedPoint}
          popupRef={popupRef}
          beakRef={beakRef}
          onClose={closePopup}
          onAdep={handleAdep}
          onAdes={handleAdes}
          onWpt={handleWpt}
        />
      )}

      {/* Location Error Modal */}
      {showLocationError && (
        <div className='absolute inset-0 z-500 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 mb-4'>
              <LocateFixed className='h-6 w-6 text-red-600 dark:text-red-400' />
            </div>
            <h3 className='text-center text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-2'>{tMap('locationErrorTitle')}</h3>
            <p className='text-center text-sm text-slate-500 dark:text-zinc-400 mb-6'>{tMap('locationErrorMsg')}</p>
            <button
              onClick={() => setShowLocationError(false)}
              className='w-full rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors'
            >
              {tMap('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
