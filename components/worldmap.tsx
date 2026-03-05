'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Map, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Fix Leaflet's default icon path issues with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// EPRJ - Rzeszów Jasionka coordinates
const DEFAULT_CENTER: [number, number] = [50.11, 22.019];
const DEFAULT_ZOOM = 12;

function UserLocationUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function WorldMap() {
  const tTabs = useTranslations('tabs');
  const tMap = useTranslations('map');
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [showLocationError, setShowLocationError] = useState(false);
  const mapRef = useRef<L.Map>(null); // To access map outside of MapContainer children

  // Initial location fetch
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        error => {
          console.warn('Geolocation error or denied:', error);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      );
    }
  }, []);

  const handleLocationClick = () => {
    if (!('geolocation' in navigator)) {
      setShowLocationError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(newCenter);
        // Explicitly flyTo since UserLocationUpdater might not trigger if center hasn't changed
        if (mapRef.current) {
          mapRef.current.flyTo(newCenter, 13, { duration: 1.5 });
        }
      },
      error => {
        console.warn('Geolocation explicitly denied or failed:', error);
        setShowLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const mapLayerUrl =
    mapMode === 'street'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const mapAttribution =
    mapMode === 'street'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

  return (
    // 'isolate' is crucial here! It creates a stacking context so Leaflet's internal z-400 pane
    // doesn't overlap the navbar (z-50) and feature tabs (z-40).
    <div className='h-full w-full isolate z-0 bg-slate-100 dark:bg-zinc-900 overflow-hidden relative'>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className='h-full w-full z-0'
        zoomControl={false} // We can add it manually if we want custom positioning
        ref={mapRef}
      >
        <TileLayer attribution={mapAttribution} url={mapLayerUrl} />
        {center && (
          <Marker position={center}>
            <Popup className='text-xs font-medium'>Your Location</Popup>
          </Marker>
        )}
        <UserLocationUpdater center={center} />

        {/* Map Controls (Floating over Leaflet) */}
        <div className='absolute bottom-6 right-4 z-400 flex flex-col gap-2'>
          <button
            onClick={() => setMapMode(mapMode === 'street' ? 'satellite' : 'street')}
            className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors'
            title='Toggle Map Layer'
            aria-label='Toggle Map Layer'
          >
            {mapMode === 'street' ? <Globe className='h-6 w-6' /> : <Map className='h-6 w-6' />}
          </button>

          <button
            onClick={handleLocationClick}
            className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg shadow-slate-200/50 dark:shadow-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors'
            title='Go to my location'
            aria-label='Go to my location'
          >
            <LocateFixed className='h-6 w-6' />
          </button>
        </div>
      </MapContainer>

      {/* Custom Location Error Modal */}
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
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
