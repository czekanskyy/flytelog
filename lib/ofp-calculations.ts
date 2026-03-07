import SunCalc from 'suncalc';
import { getMagneticDeclination } from '@/lib/navlog';

// ── Wind Triangle Calculations ─────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculate Wind Correction Angle using the wind triangle.
 * All angles in degrees, speeds in knots.
 * Returns WCA in degrees (positive = right correction).
 */
export function calculateWCA(
  tas: number,
  windSpeed: number,
  windDirection: number,
  magneticTrack: number,
): number {
  if (tas <= 0 || windSpeed <= 0) return 0;

  const swca = (windSpeed / tas) * Math.sin((windDirection - magneticTrack) * DEG_TO_RAD);
  const clampedSwca = Math.max(-1, Math.min(1, swca));

  return Math.round(Math.asin(clampedSwca) * RAD_TO_DEG);
}

/**
 * Calculate Ground Speed from the wind triangle.
 * Returns GS in knots.
 */
export function calculateGroundSpeed(
  tas: number,
  windSpeed: number,
  windDirection: number,
  magneticTrack: number,
): number {
  if (tas <= 0) return 0;

  const wca = calculateWCA(tas, windSpeed, windDirection, magneticTrack);
  const gs =
    tas * Math.cos(wca * DEG_TO_RAD) -
    windSpeed * Math.cos((windDirection - magneticTrack) * DEG_TO_RAD);

  return Math.max(0, Math.round(gs));
}

/**
 * Calculate Magnetic Heading from Magnetic Track + WCA.
 * Returns MH in degrees [0, 360).
 */
export function calculateMagneticHeading(magneticTrack: number, wca: number): number {
  let mh = magneticTrack + wca;
  if (mh < 0) mh += 360;
  if (mh >= 360) mh -= 360;
  return Math.round(mh);
}

/**
 * Calculate the Magnetic Track from True Bearing and coordinates.
 * Returns MT in degrees [0, 360).
 */
export function calculateMagneticTrack(
  trueBearing: number,
  lat: number,
  lon: number,
): number {
  const declination = getMagneticDeclination(lat, lon);
  let mt = trueBearing - declination;
  if (mt < 0) mt += 360;
  if (mt >= 360) mt -= 360;
  return Math.round(mt);
}

// ── Time Calculations ──────────────────────────────────────────────

/**
 * Calculate leg time in minutes from distance and ground speed.
 */
export function calculateLegTime(distanceNM: number, groundSpeed: number): number {
  if (groundSpeed <= 0 || distanceNM <= 0) return 0;
  return Math.round((distanceNM / groundSpeed) * 60);
}

/**
 * Format minutes as HH:MM string.
 */
export function formatMinutesAsTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Sunset ─────────────────────────────────────────────────────────

/**
 * Calculate sunset time in UTC for a given date and position.
 * Returns "HH:MM" UTC string, or null if polar day/night.
 */
export function calculateSunsetUtc(
  date: Date,
  lat: number,
  lon: number,
): string | null {
  const times = SunCalc.getTimes(date, lat, lon);
  const sunset = times.sunset;

  if (!sunset || isNaN(sunset.getTime())) return null;

  const h = sunset.getUTCHours();
  const m = sunset.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Fuel Calculations ──────────────────────────────────────────────

export interface FuelCalculationInput {
  fuelBurnLph: number;      // fuel burn rate [L/h]
  taxiTimeMin: number;      // taxi time [min]
  cruiseTimeMin: number;    // sum of route leg times [min]
  alternateTimeMin: number; // sum of alternate route leg times [min]
  finalReserveMin: number;  // default 45 min
  additionalLtr: number;    // additional fuel [L]
  blockFuelLtr: number;     // total block fuel [L]
}

export interface FuelCalculationResult {
  taxiFuelLtr: number;
  cruiseFuelLtr: number;
  contingencyFuelLtr: number;  // 5% of cruise
  alternateFuelLtr: number;
  finalReserveFuelLtr: number;
  additionalFuelLtr: number;
  requiredFuelLtr: number;     // sum of above
  extraFuelLtr: number;        // block - required
  blockFuelLtr: number;
  safeEnduranceLtr: number;    // block - final reserve
  taxiTimeMin: number;
  cruiseTimeMin: number;
  contingencyTimeMin: number;
  alternateTimeMin: number;
  finalReserveMin: number;
  additionalTimeMin: number;
  requiredTimeMin: number;
  extraTimeMin: number;
  blockTimeMin: number;
  safeEnduranceMin: number;
}

/**
 * Calculate all fuel rows.
 * All times in minutes, fuel in litres.
 */
export function calculateFuel(input: FuelCalculationInput): FuelCalculationResult {
  const { fuelBurnLph, taxiTimeMin, cruiseTimeMin, alternateTimeMin, finalReserveMin, additionalLtr, blockFuelLtr } = input;
  const burnPerMin = fuelBurnLph / 60;

  const taxiFuelLtr = round1(taxiTimeMin * burnPerMin);
  const cruiseFuelLtr = round1(cruiseTimeMin * burnPerMin);
  const contingencyFuelLtr = round1(cruiseFuelLtr * 0.05);
  const contingencyTimeMin = Math.round(cruiseTimeMin * 0.05);
  const alternateFuelLtr = round1(alternateTimeMin * burnPerMin);
  const finalReserveFuelLtr = round1(finalReserveMin * burnPerMin);
  const additionalFuelLtr = round1(additionalLtr);
  const additionalTimeMin = burnPerMin > 0 ? Math.round(additionalLtr / burnPerMin) : 0;

  const requiredFuelLtr = round1(
    taxiFuelLtr + cruiseFuelLtr + contingencyFuelLtr + alternateFuelLtr + finalReserveFuelLtr + additionalFuelLtr,
  );
  const requiredTimeMin = taxiTimeMin + cruiseTimeMin + contingencyTimeMin + alternateTimeMin + finalReserveMin + additionalTimeMin;

  const extraFuelLtr = round1(blockFuelLtr - requiredFuelLtr);
  const extraTimeMin = burnPerMin > 0 ? Math.round(extraFuelLtr / burnPerMin) : 0;

  const blockTimeMin = burnPerMin > 0 ? Math.round(blockFuelLtr / burnPerMin) : 0;

  const safeEnduranceLtr = round1(blockFuelLtr - finalReserveFuelLtr);
  const safeEnduranceMin = burnPerMin > 0 ? Math.round(safeEnduranceLtr / burnPerMin) : 0;

  return {
    taxiFuelLtr, cruiseFuelLtr, contingencyFuelLtr, alternateFuelLtr,
    finalReserveFuelLtr, additionalFuelLtr, requiredFuelLtr, extraFuelLtr,
    blockFuelLtr, safeEnduranceLtr,
    taxiTimeMin, cruiseTimeMin, contingencyTimeMin, alternateTimeMin,
    finalReserveMin, additionalTimeMin, requiredTimeMin, extraTimeMin,
    blockTimeMin, safeEnduranceMin,
  };
}

// ── Weight & Balance ───────────────────────────────────────────────

export interface WBItem {
  mass: number;   // kg
  arm: number;    // m
}

export interface WBResult {
  mass: number;
  arm: number;
  momentDiv10: number;
}

/**
 * Calculate moment/10 for a single W&B item.
 */
export function calculateMoment(item: WBItem): WBResult {
  const momentDiv10 = round1((item.mass * item.arm) / 10);
  return { mass: item.mass, arm: item.arm, momentDiv10 };
}

/**
 * Sum multiple W&B items into a total.
 */
export function sumWBItems(items: WBResult[]): WBResult {
  const totalMass = items.reduce((sum, i) => sum + i.mass, 0);
  const totalMoment10 = items.reduce((sum, i) => sum + i.momentDiv10, 0);
  const arm = totalMass > 0 ? round2((totalMoment10 * 10) / totalMass) : 0;
  return { mass: round1(totalMass), arm, momentDiv10: round1(totalMoment10) };
}

/**
 * Convert litres of AVGAS to kg (density ≈ 0.72 kg/L).
 */
export function fuelLitresToKg(litres: number): number {
  return round1(litres * 0.72);
}

// ── Helpers ────────────────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
