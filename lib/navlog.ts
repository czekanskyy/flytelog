import geomagnetism from 'geomagnetism';
import type { Leg } from '@/components/route/route-context';
import type { TerrainSample } from '@/lib/terrain';

const DEFAULT_AGL_FT = 1000;
const OBSTACLE_BUFFER_FT = 300;

export type WarningLevel = 'safe' | 'warning' | 'danger';

export interface NavlogEntry {
  legIndex: number;
  from: string;
  to: string;
  distanceNM: number;
  trueBearing: number;
  magneticTrack: number;
  maxTerrainFt: number;
  safeAltitudeFt: number;
  altitudeFt: number;
  isBelowSafe: boolean;
  warningLevel: WarningLevel;
  warnings: string[];
}

export function getMagneticDeclination(lat: number, lon: number): number {
  const model = geomagnetism.model();
  const info = model.point([lat, lon]);
  return info.decl;
}

interface AirspaceZone {
  name: string;
  type: number;
  geometry: any;
  upperLimit?: number;
  lowerLimit?: number;
}

function isPointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1],
      yi = polygon[i][0];
    const xj = polygon[j][1],
      yj = polygon[j][0];
    const intersect = yi > lon !== yj > lon && lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function legIntersectsAirspace(from: { lat: number; lon: number }, to: { lat: number; lon: number }, airspace: AirspaceZone): boolean {
  if (!airspace.geometry) return false;

  const geom = airspace.geometry;
  const polygons: number[][][] = [];

  if (geom.type === 'Polygon') {
    polygons.push(geom.coordinates[0]);
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach((poly: number[][][]) => polygons.push(poly[0]));
  }

  // Sample 10 points along the leg
  for (let t = 0; t <= 1; t += 0.1) {
    const lat = from.lat + t * (to.lat - from.lat);
    const lon = from.lon + t * (to.lon - from.lon);
    for (const ring of polygons) {
      if (isPointInPolygon(lat, lon, ring)) return true;
    }
  }

  return false;
}

// Types 6=Restricted, 8=Danger, 10=Prohibited
const DANGER_TYPES = new Set([6, 8, 10]);
// Types 1=CTR, 2=TMA
const CONTROLLED_TYPES = new Set([1, 2]);

export function computeNavlog(
  legs: Leg[],
  terrainProfile: TerrainSample[],
  defaultAltitudeFt: number,
  airspaces: AirspaceZone[] = [],
  maxObstacleHeightFt = 0,
  samplesPerLeg = 100,
): NavlogEntry[] {
  return legs.map((leg, i) => {
    const midLat = (leg.from.lat + leg.to.lat) / 2;
    const midLon = (leg.from.lon + leg.to.lon) / 2;
    const declination = getMagneticDeclination(midLat, midLon);

    let magneticTrack = leg.trueBearing - declination;
    if (magneticTrack < 0) magneticTrack += 360;
    if (magneticTrack >= 360) magneticTrack -= 360;

    const start = i * (samplesPerLeg + 1);
    const end = start + samplesPerLeg + 1;
    const legSamples = terrainProfile.slice(start, end);
    const maxTerrainFt = legSamples.length > 0 ? Math.max(...legSamples.map(s => s.elevationFt)) : 0;

    const safeAltitudeFt = maxTerrainFt + DEFAULT_AGL_FT + Math.max(maxObstacleHeightFt, OBSTACLE_BUFFER_FT);
    const altitudeFt = leg.altitudeFt ?? defaultAltitudeFt;
    const isBelowSafe = altitudeFt < safeAltitudeFt;

    const warnings: string[] = [];
    let warningLevel: WarningLevel = 'safe';

    if (isBelowSafe) {
      warnings.push(`Below safe altitude (${safeAltitudeFt} ft)`);
      warningLevel = 'warning';
    }

    for (const as of airspaces) {
      if (legIntersectsAirspace(leg.from, leg.to, as)) {
        if (DANGER_TYPES.has(as.type)) {
          warnings.push(`Through ${as.name}`);
          warningLevel = 'danger';
        } else if (CONTROLLED_TYPES.has(as.type)) {
          warnings.push(`Through ${as.name}`);
          if (warningLevel !== 'danger') warningLevel = 'warning';
        }
      }
    }

    return {
      legIndex: i,
      from: leg.from.name,
      to: leg.to.name,
      distanceNM: Math.round(leg.distanceNM * 10) / 10,
      trueBearing: Math.round(leg.trueBearing),
      magneticTrack: Math.round(magneticTrack),
      maxTerrainFt: Math.round(maxTerrainFt),
      safeAltitudeFt: Math.round(safeAltitudeFt),
      altitudeFt,
      isBelowSafe,
      warningLevel,
      warnings,
    };
  });
}
