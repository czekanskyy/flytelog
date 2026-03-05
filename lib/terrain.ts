const TILE_SIZE = 3601;
const TILE_CACHE = new Map<string, ImageData>();

function getTileKey(lat: number, lon: number) {
  const latFloor = Math.floor(lat);
  const lonFloor = Math.floor(lon);
  const ns = latFloor >= 0 ? 'N' : 'S';
  const ew = lonFloor >= 0 ? 'E' : 'W';
  return `${ns}${String(Math.abs(latFloor)).padStart(2, '0')}${ew}${String(Math.abs(lonFloor)).padStart(3, '0')}`;
}

async function loadTile(key: string): Promise<ImageData | null> {
  if (TILE_CACHE.has(key)) return TILE_CACHE.get(key)!;

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `/terrain/${key}.png`;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Tile ${key} not found`));
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    TILE_CACHE.set(key, imageData);
    return imageData;
  } catch {
    return null;
  }
}

export async function sampleElevation(lat: number, lon: number): Promise<number | null> {
  const key = getTileKey(lat, lon);
  const imageData = await loadTile(key);
  if (!imageData) return null;

  const latFloor = Math.floor(lat);
  const lonFloor = Math.floor(lon);

  const x = Math.round((lon - lonFloor) * (TILE_SIZE - 1));
  const y = Math.round((1 - (lat - latFloor)) * (TILE_SIZE - 1));

  const clampX = Math.max(0, Math.min(imageData.width - 1, x));
  const clampY = Math.max(0, Math.min(imageData.height - 1, y));

  const idx = (clampY * imageData.width + clampX) * 4;
  const r = imageData.data[idx];

  return r * 50;
}

function interpolateGreatCircle(lat1: number, lon1: number, lat2: number, lon2: number, numSamples: number): { lat: number; lon: number }[] {
  const points: { lat: number; lon: number }[] = [];
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    points.push({
      lat: lat1 + t * (lat2 - lat1),
      lon: lon1 + t * (lon2 - lon1),
    });
  }
  return points;
}

export interface TerrainSample {
  lat: number;
  lon: number;
  distanceNM: number;
  elevationFt: number;
}

export async function getTerrainProfile(waypoints: { lat: number; lon: number }[], samplesPerLeg = 100): Promise<TerrainSample[]> {
  if (waypoints.length < 2) return [];

  const allSamples: TerrainSample[] = [];
  let cumulativeDistNM = 0;

  const neededTiles = new Set<string>();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const points = interpolateGreatCircle(waypoints[i].lat, waypoints[i].lon, waypoints[i + 1].lat, waypoints[i + 1].lon, samplesPerLeg);
    points.forEach(p => neededTiles.add(getTileKey(p.lat, p.lon)));
  }
  await Promise.all([...neededTiles].map(loadTile));

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const points = interpolateGreatCircle(from.lat, from.lon, to.lat, to.lon, samplesPerLeg);

    const legDistNM = Math.sqrt(
      Math.pow((to.lat - from.lat) * 60, 2) + Math.pow((to.lon - from.lon) * 60 * Math.cos((((from.lat + to.lat) / 2) * Math.PI) / 180), 2),
    );

    for (let j = 0; j < points.length; j++) {
      const p = points[j];
      const elev = await sampleElevation(p.lat, p.lon);

      allSamples.push({
        lat: p.lat,
        lon: p.lon,
        distanceNM: cumulativeDistNM + (j / samplesPerLeg) * legDistNM,
        elevationFt: elev ?? 0,
      });
    }

    cumulativeDistNM += legDistNM;
  }

  return allSamples;
}

export function getMaxElevationForLeg(profile: TerrainSample[], legIndex: number, samplesPerLeg = 100): number {
  const start = legIndex * (samplesPerLeg + 1);
  const end = start + samplesPerLeg + 1;
  const legSamples = profile.slice(start, end);
  if (legSamples.length === 0) return 0;
  return Math.max(...legSamples.map(s => s.elevationFt));
}
