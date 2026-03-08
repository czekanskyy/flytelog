'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  db,
  type AirportRecord,
  type AirspaceRecord,
  type NavaidRecord,
  type ObstacleRecord,
  type ReportingPointRecord,
  type LocationRecord,
  type PeakRecord,
} from '@/lib/dexie/db';

interface AeroData {
  airports: AirportRecord[];
  airspaces: AirspaceRecord[];
  navaids: NavaidRecord[];
  obstacles: ObstacleRecord[];
  reportingPoints: ReportingPointRecord[];
}

interface AeroDataState {
  isOffline: boolean;
  hasOfflineData: boolean;
  lastDownloadDate: Date | null;
  isDownloading: boolean;
  isLoading: boolean;
  data: AeroData | null;
}

const DEFAULT_AGL_FT = 1000;

let cachedOnlineData: AeroData | null = null;

async function fetchOnlineData(): Promise<AeroData> {
  if (cachedOnlineData) return cachedOnlineData;

  const res = await fetch('/api/aero-data');
  if (!res.ok) throw new Error('Failed to fetch aero data');

  const data = await res.json();
  cachedOnlineData = data;
  return data;
}

async function getOfflineAeroData(): Promise<AeroData | null> {
  const meta = await db.syncMeta.get('main');
  if (!meta) return null;

  const [airports, airspaces, navaids, obstacles, reportingPoints] = await Promise.all([
    db.airports.toArray(),
    db.airspaces.toArray(),
    db.navaids.toArray(),
    db.obstacles.toArray(),
    db.reportingPoints.toArray(),
  ]);

  return { airports, airspaces, navaids, obstacles, reportingPoints };
}

export function useAeroData() {
  const [state, setState] = useState<AeroDataState>({
    isOffline: false,
    hasOfflineData: false,
    lastDownloadDate: null,
    isDownloading: false,
    isLoading: true,
    data: null,
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const meta = await db.syncMeta.get('main');
      const hasOffline = !!meta;
      const online = navigator.onLine;

      try {
        if (online) {
          const data = await fetchOnlineData();
          setState(prev => ({
            ...prev,
            isOffline: false,
            hasOfflineData: hasOffline,
            lastDownloadDate: meta?.lastDownload ?? null,
            isLoading: false,
            data,
          }));
        } else if (hasOffline) {
          const data = await getOfflineAeroData();
          setState(prev => ({
            ...prev,
            isOffline: true,
            hasOfflineData: true,
            lastDownloadDate: meta?.lastDownload ?? null,
            isLoading: false,
            data,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isOffline: true,
            hasOfflineData: false,
            isLoading: false,
          }));
        }
      } catch {
        if (hasOffline) {
          const data = await getOfflineAeroData();
          setState(prev => ({
            ...prev,
            isOffline: true,
            hasOfflineData: true,
            lastDownloadDate: meta?.lastDownload ?? null,
            isLoading: false,
            data,
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false, isOffline: true }));
        }
      }
    };

    init();
  }, []);

  useEffect(() => {
    const goOffline = () => setState(prev => ({ ...prev, isOffline: true }));
    const goOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      cachedOnlineData = null;
      fetchOnlineData()
        .then(data => setState(prev => ({ ...prev, data })))
        .catch(() => {});
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  const downloadForOffline = useCallback(async () => {
    setState(prev => ({ ...prev, isDownloading: true }));

    try {
      const [aeroData, locationsRes, peaksRes] = await Promise.all([fetchOnlineData(), fetch('/data/locations.json'), fetch('/data/peaks.geojson')]);

      const locations: { n: string; lat: number; lon: number; elev: number }[] = await locationsRes.json();
      const peaksGeoJson = await peaksRes.json();

      const locationRecords: LocationRecord[] = locations.map(l => ({
        ...l,
        agl: DEFAULT_AGL_FT,
      }));

      const peakRecords: PeakRecord[] = peaksGeoJson.features
        .filter((f: any) => f.properties?.name)
        .map((f: any) => ({
          id: f.id || `peak-${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}`,
          name: f.properties.name,
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          ele: parseFloat(f.properties.ele || '0'),
        }));

      await db.transaction('rw', [db.airports, db.airspaces, db.navaids, db.obstacles, db.reportingPoints, db.locations, db.peaks, db.syncMeta], async () => {
        await Promise.all([
          db.airports.clear(),
          db.airspaces.clear(),
          db.navaids.clear(),
          db.obstacles.clear(),
          db.reportingPoints.clear(),
          db.locations.clear(),
          db.peaks.clear(),
        ]);

        await Promise.all([
          db.airports.bulkAdd(
            aeroData.airports.map(({ openaipId, name, icaoCode, type, lat, lon, elevation, elevationUnit, geometry, trafficType, ppr, private: isPrivate, skydiveActivity, winchOnly, runways, frequencies }: any) => ({
              openaipId,
              name,
              icaoCode,
              type,
              lat,
              lon,
              elevation,
              elevationUnit,
              geometry,
              trafficType,
              ppr,
              private: isPrivate,
              skydiveActivity,
              winchOnly,
              runways,
              frequencies,
            }))
          ),
          db.airspaces.bulkAdd(
            aeroData.airspaces.map(({ openaipId, name, type, icaoClass, upperLimit, lowerLimit, geometry }: any) => ({
              openaipId,
              name,
              type,
              icaoClass,
              upperLimit,
              lowerLimit,
              geometry,
            }))
          ),
          db.navaids.bulkAdd(
            aeroData.navaids.map(({ openaipId, name, identifier, type, frequency, frequencyUnit, channel, range, rangeUnit, lat, lon, elevation, elevationUnit, sourceUpdatedAt }: any) => ({
              openaipId,
              name,
              identifier,
              type,
              frequency,
              frequencyUnit,
              channel,
              range,
              rangeUnit,
              lat,
              lon,
              elevation,
              elevationUnit,
              sourceUpdatedAt,
            }))
          ),
          db.obstacles.bulkAdd(
            aeroData.obstacles.map(({ openaipId, type, lat, lon, elevation, heightAgl }: any) => ({
              openaipId,
              type,
              lat,
              lon,
              elevation,
              heightAgl,
            }))
          ),
          db.reportingPoints.bulkAdd(
            aeroData.reportingPoints.map(({ openaipId, name, type, lat, lon, elevation }: any) => ({
              openaipId,
              name,
              type,
              lat,
              lon,
              elevation,
            }))
          ),
          db.locations.bulkAdd(locationRecords),
          db.peaks.bulkAdd(peakRecords),
        ]);

        await db.syncMeta.put({ id: 'main', lastDownload: new Date() });
      });

      setState(prev => ({
        ...prev,
        isDownloading: false,
        hasOfflineData: true,
        lastDownloadDate: new Date(),
      }));
    } catch (err) {
      console.error('Download for offline failed:', err);
      setState(prev => ({ ...prev, isDownloading: false }));
      throw err;
    }
  }, []);

  const searchWaypoints = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) return [];

      const upperQuery = query.toUpperCase();
      const lowerQuery = query.toLowerCase();

      const source = state.isOffline && state.hasOfflineData ? 'offline' : 'online';

      if (source === 'offline') {
        const [airports, navaids, reportingPoints, locations, peaks] = await Promise.all([
          db.airports
            .filter(a => a.name.toLowerCase().includes(lowerQuery) || (a.icaoCode?.toUpperCase().includes(upperQuery) ?? false))
            .limit(10)
            .toArray(),
          db.navaids
            .filter(n => n.name.toLowerCase().includes(lowerQuery))
            .limit(10)
            .toArray(),
          db.reportingPoints
            .filter(rp => rp.name.toLowerCase().includes(lowerQuery))
            .limit(10)
            .toArray(),
          db.locations
            .filter(l => l.n.toLowerCase().includes(lowerQuery))
            .limit(10)
            .toArray(),
          db.peaks
            .filter(p => p.name.toLowerCase().includes(lowerQuery))
            .limit(10)
            .toArray(),
        ]);

        return [
          ...airports.map(a => ({ type: 'airport' as const, name: a.name, icao: a.icaoCode, lat: a.lat, lon: a.lon, elev: a.elevation })),
          ...navaids.map(n => ({ type: 'navaid' as const, name: n.name, lat: n.lat, lon: n.lon, elev: n.elevation })),
          ...reportingPoints.map(rp => ({ type: 'reporting-point' as const, name: rp.name, lat: rp.lat, lon: rp.lon, elev: rp.elevation })),
          ...locations.map(l => ({ type: 'location' as const, name: l.n, lat: l.lat, lon: l.lon, elev: l.elev })),
          ...peaks.map(p => ({ type: 'peak' as const, name: p.name, lat: p.lat, lon: p.lon, elev: p.ele })),
        ];
      }

      if (!state.data) return [];

      const airports = state.data.airports
        .filter(a => a.name.toLowerCase().includes(lowerQuery) || (a.icaoCode?.toUpperCase().includes(upperQuery) ?? false))
        .slice(0, 10);
      const navaids = state.data.navaids.filter(n => n.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
      const reportingPoints = state.data.reportingPoints.filter(rp => rp.name.toLowerCase().includes(lowerQuery)).slice(0, 10);

      return [
        ...airports.map(a => ({ type: 'airport' as const, name: a.name, icao: a.icaoCode, lat: a.lat, lon: a.lon, elev: a.elevation })),
        ...navaids.map(n => ({ type: 'navaid' as const, name: n.name, lat: n.lat, lon: n.lon, elev: n.elevation })),
        ...reportingPoints.map(rp => ({ type: 'reporting-point' as const, name: rp.name, lat: rp.lat, lon: rp.lon, elev: rp.elevation })),
      ];
    },
    [state.isOffline, state.hasOfflineData, state.data]
  );

  const searchNearby = useCallback(
    async (lat: number, lon: number, radiusNM = 10) => {
      const radiusM = radiusNM * 1852;
      const origin = { latitude: lat, longitude: lon };

      const { getDistance: getDist, getRhumbLineBearing: getBearing } = await import('geolib');

      function withinRadius<T extends { lat: number; lon: number }>(items: T[]) {
        return items
          .map(item => {
            const dist = getDist(origin, { latitude: item.lat, longitude: item.lon });
            if (dist > radiusM) return null;
            const bearing = getBearing(origin, { latitude: item.lat, longitude: item.lon });
            return { ...item, distanceNM: dist / 1852, bearing: bearing < 0 ? bearing + 360 : bearing };
          })
          .filter(Boolean) as (T & { distanceNM: number; bearing: number })[];
      }

      const source = state.isOffline && state.hasOfflineData ? 'offline' : 'online';

      if (source === 'offline') {
        const [airports, navaids, locations, peaks] = await Promise.all([
          db.airports.toArray(),
          db.navaids.toArray(),
          db.locations.toArray(),
          db.peaks.toArray(),
        ]);

        const nearAirports = withinRadius(airports.map(a => ({ ...a, lat: a.lat, lon: a.lon })));
        const nearNavaids = withinRadius(navaids.map(n => ({ ...n, lat: n.lat, lon: n.lon })));
        const nearLocations = withinRadius(locations.map(l => ({ n: l.n, lat: l.lat, lon: l.lon, elev: l.elev })));
        const nearPeaks = withinRadius(peaks.map(p => ({ name: p.name, lat: p.lat, lon: p.lon, ele: p.ele })));

        const results: NearbySearchResult[] = [
          ...nearAirports.map(a => ({
            type: 'airport' as const,
            name: a.name,
            icao: (a as any).icaoCode,
            lat: a.lat,
            lon: a.lon,
            elev: (a as any).elevation,
            distanceNM: a.distanceNM,
            bearing: a.bearing,
          })),
          ...nearNavaids.map(n => ({
            type: 'navaid' as const,
            name: n.name,
            lat: n.lat,
            lon: n.lon,
            elev: (n as any).elevation,
            distanceNM: n.distanceNM,
            bearing: n.bearing,
          })),
          ...nearLocations.map(l => ({
            type: 'location' as const,
            name: (l as any).n,
            lat: l.lat,
            lon: l.lon,
            elev: (l as any).elev,
            distanceNM: l.distanceNM,
            bearing: l.bearing,
          })),
          ...nearPeaks.map(p => ({
            type: 'peak' as const,
            name: (p as any).name,
            lat: p.lat,
            lon: p.lon,
            elev: (p as any).ele,
            distanceNM: p.distanceNM,
            bearing: p.bearing,
          })),
        ];
        return results.sort((a, b) => a.distanceNM - b.distanceNM);
      }

      if (!state.data) return [];

      const allAirports = state.data.airports.map(a => ({
        type: 'airport' as const,
        name: a.name,
        icao: a.icaoCode,
        lat: a.lat,
        lon: a.lon,
        elev: a.elevation,
      }));
      const allNavaids = state.data.navaids.map(n => ({ type: 'navaid' as const, name: n.name, lat: n.lat, lon: n.lon, elev: n.elevation }));
      const allReportingPoints = state.data.reportingPoints.map(rp => ({
        type: 'reporting-point' as const,
        name: rp.name,
        lat: rp.lat,
        lon: rp.lon,
        elev: rp.elevation,
      }));

      // Locations from static JSON (always available in browser)
      let allLocations: { type: 'location'; name: string; lat: number; lon: number; elev: number }[] = [];
      try {
        const locData: { n: string; lat: number; lon: number; elev: number }[] = await fetch('/data/locations.json').then(r => r.json());
        allLocations = locData.map(l => ({ type: 'location' as const, name: l.n, lat: l.lat, lon: l.lon, elev: l.elev }));
      } catch {
        /* ignore */
      }

      const nearA = withinRadius(allAirports);
      const nearN = withinRadius(allNavaids);
      const nearRP = withinRadius(allReportingPoints);
      const nearL = withinRadius(allLocations);

      const results: NearbySearchResult[] = [
        ...nearA.map(a => ({ ...a, distanceNM: a.distanceNM, bearing: a.bearing })),
        ...nearN.map(n => ({ ...n, distanceNM: n.distanceNM, bearing: n.bearing })),
        ...nearRP.map(r => ({ ...r, distanceNM: r.distanceNM, bearing: r.bearing })),
        ...nearL.map(l => ({ ...l, distanceNM: l.distanceNM, bearing: l.bearing })),
      ];
      return results.sort((a, b) => a.distanceNM - b.distanceNM);
    },
    [state.isOffline, state.hasOfflineData, state.data]
  );

  return {
    ...state,
    downloadForOffline,
    searchWaypoints,
    searchNearby,
  };
}

export type WaypointSearchResult = {
  type: 'airport' | 'navaid' | 'reporting-point' | 'location' | 'peak';
  name: string;
  icao?: string | null;
  lat: number;
  lon: number;
  elev?: number | null;
};

export type NearbySearchResult = WaypointSearchResult & {
  distanceNM: number;
  bearing: number;
};
