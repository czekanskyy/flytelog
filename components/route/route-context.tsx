'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { getDistance, getRhumbLineBearing } from 'geolib';

const METERS_PER_NM = 1852;

export type WaypointRole = 'departure' | 'waypoint' | 'destination';

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elev?: number | null;
  type: 'airport' | 'navaid' | 'location' | 'peak' | 'custom';
  role: WaypointRole;
}

export interface Leg {
  from: Waypoint;
  to: Waypoint;
  distanceNM: number;
  trueBearing: number;
  magneticTrack?: number;
  altitudeFt: number;
}

interface RouteState {
  waypoints: Waypoint[];
  legs: Leg[];
  addWaypoint: (wp: Omit<Waypoint, 'id'>) => void;
  setDeparture: (wp: Omit<Waypoint, 'id' | 'role'>) => void;
  setDestination: (wp: Omit<Waypoint, 'id' | 'role'>) => void;
  addEnroute: (wp: Omit<Waypoint, 'id' | 'role'>, index?: number) => void;
  removeWaypoint: (index: number) => void;
  moveWaypoint: (index: number, lat: number, lon: number) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  setLegAltitude: (legIndex: number, altFt: number) => void;
  clearRoute: () => void;
  departure: Waypoint | null;
  destination: Waypoint | null;
  enrouteWaypoints: Waypoint[];
}

const RouteContext = createContext<RouteState | null>(null);

function generateId() {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function computeLegs(waypoints: Waypoint[], legAltitudes: Map<string, number>): Leg[] {
  const legs: Leg[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const distanceM = getDistance({ latitude: from.lat, longitude: from.lon }, { latitude: to.lat, longitude: to.lon });
    const bearing = getRhumbLineBearing({ latitude: from.lat, longitude: from.lon }, { latitude: to.lat, longitude: to.lon });

    const legKey = `${from.id}-${to.id}`;
    const altitudeFt = legAltitudes.get(legKey) ?? 3500;

    legs.push({
      from,
      to,
      distanceNM: distanceM / METERS_PER_NM,
      trueBearing: bearing < 0 ? bearing + 360 : bearing,
      altitudeFt,
    });
  }
  return legs;
}

export function RouteProvider({ children }: { children: ReactNode }) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [legAltitudes, setLegAltitudes] = useState<Map<string, number>>(new Map());

  const legs = useMemo(() => computeLegs(waypoints, legAltitudes), [waypoints, legAltitudes]);

  const departure = useMemo(() => waypoints.find(wp => wp.role === 'departure') ?? null, [waypoints]);
  const destination = useMemo(() => waypoints.find(wp => wp.role === 'destination') ?? null, [waypoints]);
  const enrouteWaypoints = useMemo(() => waypoints.filter(wp => wp.role === 'waypoint'), [waypoints]);

  const addWaypoint = useCallback((wp: Omit<Waypoint, 'id'>) => {
    setWaypoints(prev => [...prev, { ...wp, id: generateId() }]);
  }, []);

  const setDeparture = useCallback((wp: Omit<Waypoint, 'id' | 'role'>) => {
    setWaypoints(prev => {
      const withoutDep = prev.filter(w => w.role !== 'departure');
      return [{ ...wp, id: generateId(), role: 'departure' as const }, ...withoutDep];
    });
  }, []);

  const setDestination = useCallback((wp: Omit<Waypoint, 'id' | 'role'>) => {
    setWaypoints(prev => {
      const withoutDest = prev.filter(w => w.role !== 'destination');
      return [...withoutDest, { ...wp, id: generateId(), role: 'destination' as const }];
    });
  }, []);

  const addEnroute = useCallback((wp: Omit<Waypoint, 'id' | 'role'>, index?: number) => {
    setWaypoints(prev => {
      const newWp: Waypoint = { ...wp, id: generateId(), role: 'waypoint' };

      if (index !== undefined) {
        const next = [...prev];
        next.splice(index, 0, newWp);
        return next;
      }

      // Insert before destination if exists
      const destIndex = prev.findIndex(w => w.role === 'destination');
      if (destIndex >= 0) {
        const next = [...prev];
        next.splice(destIndex, 0, newWp);
        return next;
      }
      return [...prev, newWp];
    });
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveWaypoint = useCallback((index: number, lat: number, lon: number) => {
    setWaypoints(prev => prev.map((wp, i) => (i === index ? { ...wp, lat, lon } : wp)));
  }, []);

  const reorderWaypoints = useCallback((fromIndex: number, toIndex: number) => {
    setWaypoints(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const setLegAltitude = useCallback(
    (legIndex: number, altFt: number) => {
      setLegAltitudes(prev => {
        const next = new Map(prev);
        const leg = legs[legIndex];
        if (leg) {
          next.set(`${leg.from.id}-${leg.to.id}`, altFt);
        }
        return next;
      });
    },
    [legs],
  );

  const clearRoute = useCallback(() => {
    setWaypoints([]);
    setLegAltitudes(new Map());
  }, []);

  return (
    <RouteContext.Provider
      value={{
        waypoints,
        legs,
        addWaypoint,
        setDeparture,
        setDestination,
        addEnroute,
        removeWaypoint,
        moveWaypoint,
        reorderWaypoints,
        setLegAltitude,
        clearRoute,
        departure,
        destination,
        enrouteWaypoints,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRoute must be used within RouteProvider');
  return ctx;
}

export function toFplCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLon = Math.abs(lon);
  const latDeg = Math.floor(absLat);
  const latMin = (absLat - latDeg) * 60;
  const lonDeg = Math.floor(absLon);
  const lonMin = (absLon - lonDeg) * 60;
  return `${String(latDeg).padStart(2, '0')}${latMin.toFixed(2).padStart(5, '0')}${latDir}/${String(lonDeg).padStart(3, '0')}${lonMin.toFixed(2).padStart(5, '0')}${lonDir}`;
}
