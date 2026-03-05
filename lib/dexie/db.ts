import Dexie, { type EntityTable } from 'dexie';

interface AirportRecord {
  openaipId: string;
  name: string;
  icaoCode?: string;
  type: number;
  lat: number;
  lon: number;
  elevation?: number;
  geometry?: unknown;
}

interface AirspaceRecord {
  openaipId: string;
  name: string;
  type: number;
  icaoClass?: number;
  upperLimit?: number;
  lowerLimit?: number;
  geometry: unknown;
}

interface NavaidRecord {
  openaipId: string;
  name: string;
  type: number;
  frequency?: string;
  lat: number;
  lon: number;
  elevation?: number;
}

interface ObstacleRecord {
  openaipId: string;
  type: number;
  lat: number;
  lon: number;
  elevation: number;
  heightAgl: number;
}

interface LocationRecord {
  n: string;
  lat: number;
  lon: number;
  elev: number;
  agl: number;
}

interface PeakRecord {
  id: string;
  name: string;
  lat: number;
  lon: number;
  ele: number;
}

interface SyncMeta {
  id: string;
  lastDownload: Date;
}

const db = new Dexie('flytelogAero') as Dexie & {
  airports: EntityTable<AirportRecord, 'openaipId'>;
  airspaces: EntityTable<AirspaceRecord, 'openaipId'>;
  navaids: EntityTable<NavaidRecord, 'openaipId'>;
  obstacles: EntityTable<ObstacleRecord, 'openaipId'>;
  locations: EntityTable<LocationRecord, 'n'>;
  peaks: EntityTable<PeakRecord, 'id'>;
  syncMeta: EntityTable<SyncMeta, 'id'>;
};

db.version(1).stores({
  airports: 'openaipId, icaoCode, name, [lat+lon]',
  airspaces: 'openaipId, type, name',
  navaids: 'openaipId, name, [lat+lon]',
  obstacles: 'openaipId, [lat+lon]',
  locations: 'n, [lat+lon]',
  peaks: 'id, name, [lat+lon]',
  syncMeta: 'id',
});

export { db };
export type { AirportRecord, AirspaceRecord, NavaidRecord, ObstacleRecord, LocationRecord, PeakRecord, SyncMeta };
