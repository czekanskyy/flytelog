'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Map, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRoute } from '@/components/route/route-context';
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

function createObjectIcon(type: 'airport' | 'navaid' | 'obstacle') {
  const configs = {
    airport: { emoji: '✈️', size: 20 },
    navaid: { emoji: '📡', size: 16 },
    obstacle: { emoji: '⚠', size: 14 },
  };
  const c = configs[type];
  return L.divIcon({
    className: '',
    html: `<div style="font-size:${c.size}px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${c.emoji}</div>`,
    iconSize: [c.size + 4, c.size + 4],
    iconAnchor: [(c.size + 4) / 2, (c.size + 4) / 2],
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

const AIRSPACE_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#3b82f6',
  4: '#22c55e',
  6: '#f59e0b',
  8: '#a855f7',
  10: '#dc2626',
  14: '#06b6d4',
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
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
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
  onMapClick?: (lat: number, lon: number) => void;
  clickedPoint?: { lat: number; lon: number } | null;
}

export default function WorldMap({ airspaces = [], layers, airports, navaids, obstacles, onMapClick, clickedPoint }: WorldMapProps) {
  const tMap = useTranslations('map');
  const { waypoints, moveWaypoint, legs } = useRoute();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [showLocationError, setShowLocationError] = useState(false);
  const [navlogEntries, setNavlogEntries] = useState<NavlogEntry[]>([]);
  const mapRef = useRef<L.Map>(null);

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
          return (
            <GeoJSON
              key={`as-${i}-${as.name}`}
              data={geoJsonData as any}
              style={{ color, weight: 1.5, opacity: 0.7, fillColor: color, fillOpacity: 0.12 }}
              onEachFeature={(_, layer) => {
                layer.bindPopup(`<strong>${as.name}</strong>`);
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
          <Marker key={`apt-${i}`} position={[a.lat, a.lon]} icon={airportIcon}>
            <Popup className='text-xs'>
              <strong>{a.name}</strong>
              {a.icaoCode && <span> ({a.icaoCode})</span>}
              {a.elevation != null && <br />}
              {a.elevation != null && <span>{a.elevation} ft</span>}
            </Popup>
          </Marker>
        ))}

        {/* Navaid markers */}
        {navaids?.map((n, i) => (
          <Marker key={`nav-${i}`} position={[n.lat, n.lon]} icon={navaidIcon}>
            <Popup className='text-xs'>
              <strong>{n.name}</strong>
            </Popup>
          </Marker>
        ))}

        {/* Obstacle markers */}
        {obstacles?.map((o, i) => (
          <Marker key={`obs-${i}`} position={[o.lat, o.lon]} icon={obstacleIcon}>
            <Popup className='text-xs'>
              <span>⚠ {o.elevation} ft AMSL</span>
              <br />
              <span>{o.heightAgl} ft AGL</span>
            </Popup>
          </Marker>
        ))}

        {/* Clicked point marker */}
        {clickedPoint && (
          <Marker
            position={[clickedPoint.lat, clickedPoint.lon]}
            icon={L.divIcon({
              className: '',
              html: `<div style="color:#0ea5e9;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
            interactive={false}
          />
        )}

        <UserLocationUpdater center={center} />
        <MapClickHandler onMapClick={handleMapClick} />
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
