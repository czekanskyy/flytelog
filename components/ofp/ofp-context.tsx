'use client';

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import {
  calculateWCA,
  calculateGroundSpeed,
  calculateMagneticHeading,
  calculateLegTime,
  calculateSunsetUtc,
  calculateFuel,
  calculateMoment,
  sumWBItems,
  fuelLitresToKg,
  type FuelCalculationResult,
  type WBResult,
} from '@/lib/ofp-calculations';
import { db } from '@/lib/dexie/db';

// ── Types ──────────────────────────────────────────────────────────

export type FlightRules = 'VFR' | 'IFR';

export interface RouteLeg {
  waypoint: string;
  distance: number;       // NM (user input)
  magneticTrack: number;  // degrees (user input)
  msa: number;            // ft (user input) — MSA (VFR) or Grid MORA (IFR)
  safeAlt: number;        // ft (user input) — Safe Alt (VFR) or MEA (IFR)
  planAltitude: number;   // ft or FL (user input)
  // Auto-calculated:
  wca: number;
  magneticHeading: number;
  groundSpeed: number;
  legTimeMin: number;
}

export interface RadioFrequency {
  name: string;
  frequency: string;
  checked: boolean;
}

export interface WBRow {
  mass: number;
  arm: number;
}

export interface OfpState {
  // Section 1 — General
  flightDate: string;           // YYYY-MM-DD
  aircraftType: string;
  registration: string;
  departureIcao: string;
  destinationIcao: string;
  sunsetUtc: string;            // HH:MM
  sunsetManual: boolean;
  flightRules: FlightRules;
  task: string;
  edt: string;                  // HH:MM
  ato: string;
  eta: string;
  ata: string;

  // Section 2 — Passengers
  pic: string;
  crewFunction: string;
  personsOnBoard: number;

  // Section 3 — Weather minima
  visibility: number;           // m
  cloudCeiling: number;         // ft
  windCrosswind: number;        // kt
  windTotal: number;            // kt
  temperature: number;          // °C

  // Section 4 — Weather calc
  tas: number;                  // kt
  windDirection: number;        // degrees
  windSpeed: number;            // kt

  // Section 5 — Route
  routeLegs: RouteLeg[];

  // Section 6 — Alternate
  alternateLegs: RouteLeg[];

  // Section 7 — Radio
  radioFrequencies: RadioFrequency[];

  // Section 8 — Fuel
  fuelBurnLph: number;          // L/h
  taxiTimeMin: number;
  finalReserveMin: number;
  additionalFuelLtr: number;
  blockFuelLtr: number;

  // Section 9 — W&B
  bem: WBRow;
  frontSeats: WBRow;
  rearSeats: WBRow;
  baggage: WBRow;

  // Internal — destination coords for sunset calc
  _destLat: number | null;
  _destLon: number | null;
}

// ── Default State ──────────────────────────────────────────────────

const createEmptyLeg = (): RouteLeg => ({
  waypoint: '',
  distance: 0,
  magneticTrack: 0,
  msa: 0,
  safeAlt: 0,
  planAltitude: 0,
  wca: 0,
  magneticHeading: 0,
  groundSpeed: 0,
  legTimeMin: 0,
});

const createEmptyFrequency = (): RadioFrequency => ({
  name: '',
  frequency: '',
  checked: false,
});

export const initialOfpState: OfpState = {
  flightDate: new Date().toISOString().slice(0, 10),
  aircraftType: '',
  registration: '',
  departureIcao: '',
  destinationIcao: '',
  sunsetUtc: '',
  sunsetManual: false,
  flightRules: 'VFR',
  task: '',
  edt: '',
  ato: '',
  eta: '',
  ata: '',

  pic: '',
  crewFunction: '',
  personsOnBoard: 1,

  visibility: 0,
  cloudCeiling: 0,
  windCrosswind: 0,
  windTotal: 0,
  temperature: 0,

  tas: 0,
  windDirection: 0,
  windSpeed: 0,

  routeLegs: [createEmptyLeg(), createEmptyLeg()],
  alternateLegs: [createEmptyLeg()],

  radioFrequencies: Array.from({ length: 6 }, createEmptyFrequency),

  fuelBurnLph: 0,
  taxiTimeMin: 0,
  finalReserveMin: 45,
  additionalFuelLtr: 0,
  blockFuelLtr: 0,

  bem: { mass: 0, arm: 0 },
  frontSeats: { mass: 0, arm: 0 },
  rearSeats: { mass: 0, arm: 0 },
  baggage: { mass: 0, arm: 0 },

  _destLat: null,
  _destLon: null,
};

// ── Actions ────────────────────────────────────────────────────────

type OfpAction =
  | { type: 'SET_FIELD'; field: keyof OfpState; value: unknown }
  | { type: 'SET_ROUTE_LEG'; index: number; field: keyof RouteLeg; value: number | string }
  | { type: 'ADD_ROUTE_LEG' }
  | { type: 'REMOVE_ROUTE_LEG'; index: number }
  | { type: 'SET_ALT_LEG'; index: number; field: keyof RouteLeg; value: number | string }
  | { type: 'ADD_ALT_LEG' }
  | { type: 'REMOVE_ALT_LEG'; index: number }
  | { type: 'SET_RADIO'; index: number; field: keyof RadioFrequency; value: string | boolean }
  | { type: 'SET_WB'; category: 'bem' | 'frontSeats' | 'rearSeats' | 'baggage'; field: 'mass' | 'arm'; value: number }
  | { type: 'SET_DEST_COORDS'; lat: number; lon: number }
  | { type: 'SET_SUNSET'; value: string };

function recalculateLegs(legs: RouteLeg[], tas: number, windSpeed: number, windDirection: number): RouteLeg[] {
  return legs.map(leg => {
    if (leg.distance <= 0 || leg.magneticTrack <= 0) return leg;

    const wca = calculateWCA(tas, windSpeed, windDirection, leg.magneticTrack);
    const groundSpeed = calculateGroundSpeed(tas, windSpeed, windDirection, leg.magneticTrack);
    const magneticHeading = calculateMagneticHeading(leg.magneticTrack, wca);
    const legTimeMin = calculateLegTime(leg.distance, groundSpeed);

    return { ...leg, wca, magneticHeading, groundSpeed, legTimeMin };
  });
}

function ofpReducer(state: OfpState, action: OfpAction): OfpState {
  switch (action.type) {
    case 'SET_FIELD': {
      const newState = { ...state, [action.field]: action.value };

      // Recalculate legs when wind/TAS change
      if (action.field === 'tas' || action.field === 'windSpeed' || action.field === 'windDirection') {
        newState.routeLegs = recalculateLegs(newState.routeLegs, newState.tas, newState.windSpeed, newState.windDirection);
        newState.alternateLegs = recalculateLegs(newState.alternateLegs, newState.tas, newState.windSpeed, newState.windDirection);
      }

      return newState;
    }

    case 'SET_ROUTE_LEG': {
      const legs = [...state.routeLegs];
      legs[action.index] = { ...legs[action.index], [action.field]: action.value };

      // Recalculate this leg
      const leg = legs[action.index];
      if (leg.distance > 0 && leg.magneticTrack > 0 && state.tas > 0) {
        leg.wca = calculateWCA(state.tas, state.windSpeed, state.windDirection, leg.magneticTrack);
        leg.groundSpeed = calculateGroundSpeed(state.tas, state.windSpeed, state.windDirection, leg.magneticTrack);
        leg.magneticHeading = calculateMagneticHeading(leg.magneticTrack, leg.wca);
        leg.legTimeMin = calculateLegTime(leg.distance, leg.groundSpeed);
      }

      return { ...state, routeLegs: legs };
    }

    case 'ADD_ROUTE_LEG': {
      if (state.routeLegs.length >= 19) return state;
      return { ...state, routeLegs: [...state.routeLegs, createEmptyLeg()] };
    }

    case 'REMOVE_ROUTE_LEG': {
      if (state.routeLegs.length <= 1) return state;
      return { ...state, routeLegs: state.routeLegs.filter((_, i) => i !== action.index) };
    }

    case 'SET_ALT_LEG': {
      const legs = [...state.alternateLegs];
      legs[action.index] = { ...legs[action.index], [action.field]: action.value };

      const leg = legs[action.index];
      if (leg.distance > 0 && leg.magneticTrack > 0 && state.tas > 0) {
        leg.wca = calculateWCA(state.tas, state.windSpeed, state.windDirection, leg.magneticTrack);
        leg.groundSpeed = calculateGroundSpeed(state.tas, state.windSpeed, state.windDirection, leg.magneticTrack);
        leg.magneticHeading = calculateMagneticHeading(leg.magneticTrack, leg.wca);
        leg.legTimeMin = calculateLegTime(leg.distance, leg.groundSpeed);
      }

      return { ...state, alternateLegs: legs };
    }

    case 'ADD_ALT_LEG': {
      if (state.alternateLegs.length >= 5) return state;
      return { ...state, alternateLegs: [...state.alternateLegs, createEmptyLeg()] };
    }

    case 'REMOVE_ALT_LEG': {
      if (state.alternateLegs.length <= 1) return state;
      return { ...state, alternateLegs: state.alternateLegs.filter((_, i) => i !== action.index) };
    }

    case 'SET_RADIO': {
      const freqs = [...state.radioFrequencies];
      freqs[action.index] = { ...freqs[action.index], [action.field]: action.value };
      return { ...state, radioFrequencies: freqs };
    }

    case 'SET_WB': {
      return {
        ...state,
        [action.category]: {
          ...state[action.category],
          [action.field]: action.value,
        },
      };
    }

    case 'SET_DEST_COORDS':
      return { ...state, _destLat: action.lat, _destLon: action.lon };

    case 'SET_SUNSET':
      return { ...state, sunsetUtc: action.value };

    default:
      return state;
  }
}

// ── Derived Values ─────────────────────────────────────────────────

function useDerivedFuel(state: OfpState): FuelCalculationResult {
  return useMemo(() => {
    const cruiseTimeMin = state.routeLegs.reduce((sum, l) => sum + l.legTimeMin, 0);
    const alternateTimeMin = state.alternateLegs.reduce((sum, l) => sum + l.legTimeMin, 0);

    return calculateFuel({
      fuelBurnLph: state.fuelBurnLph,
      taxiTimeMin: state.taxiTimeMin,
      cruiseTimeMin,
      alternateTimeMin,
      finalReserveMin: state.finalReserveMin,
      additionalLtr: state.additionalFuelLtr,
      blockFuelLtr: state.blockFuelLtr,
    });
  }, [
    state.fuelBurnLph, state.taxiTimeMin, state.routeLegs,
    state.alternateLegs, state.finalReserveMin,
    state.additionalFuelLtr, state.blockFuelLtr,
  ]);
}

function useDerivedWB(state: OfpState, fuel: FuelCalculationResult) {
  return useMemo(() => {
    const bemResult = calculateMoment(state.bem);
    const frontResult = calculateMoment(state.frontSeats);
    const rearResult = calculateMoment(state.rearSeats);
    const baggageResult = calculateMoment(state.baggage);
    const zfm = sumWBItems([bemResult, frontResult, rearResult, baggageResult]);

    // Trip fuel = (block - taxi) in litres → to kg
    const tripFuelLtr = Math.max(0, state.blockFuelLtr - fuel.taxiFuelLtr);
    const tripFuelKg = fuelLitresToKg(tripFuelLtr);
    const tripFuelResult = calculateMoment({ mass: tripFuelKg, arm: state.bem.arm });

    const takeoffMass = sumWBItems([zfm, tripFuelResult]);

    // Landing fuel
    const landingFuelLtr = Math.max(0, state.blockFuelLtr - fuel.taxiFuelLtr - fuel.cruiseFuelLtr);
    const landingFuelKg = fuelLitresToKg(landingFuelLtr);
    const landingFuelResult = calculateMoment({ mass: landingFuelKg, arm: state.bem.arm });
    const landingMass = sumWBItems([zfm, landingFuelResult]);

    // Alternate landing fuel
    const altFuelLtr = Math.max(0, state.blockFuelLtr - fuel.taxiFuelLtr - fuel.cruiseFuelLtr - fuel.alternateFuelLtr);
    const altFuelKg = fuelLitresToKg(altFuelLtr);
    const altFuelResult = calculateMoment({ mass: altFuelKg, arm: state.bem.arm });
    const altMass = sumWBItems([zfm, altFuelResult]);

    return {
      bem: bemResult,
      frontSeats: frontResult,
      rearSeats: rearResult,
      baggage: baggageResult,
      zfm,
      tripFuel: { ...tripFuelResult, litres: tripFuelLtr },
      takeoffMass,
      landingFuel: { ...landingFuelResult, litres: landingFuelLtr },
      landingMass,
      altFuel: { ...altFuelResult, litres: altFuelLtr },
      altMass,
    };
  }, [state.bem, state.frontSeats, state.rearSeats, state.baggage, state.blockFuelLtr, fuel]);
}

// ── Context ────────────────────────────────────────────────────────

interface OfpContextValue {
  state: OfpState;
  dispatch: React.Dispatch<OfpAction>;
  fuel: FuelCalculationResult;
  wb: ReturnType<typeof useDerivedWB>;
  routeTotals: { distance: number; time: number };
  altTotals: { distance: number; time: number };
  lookupAirport: (icao: string) => Promise<{ lat: number; lon: number; name: string } | null>;
}

const OfpContext = createContext<OfpContextValue | null>(null);

export function OfpProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ofpReducer, initialOfpState);

  const fuel = useDerivedFuel(state);
  const wb = useDerivedWB(state, fuel);

  const routeTotals = useMemo(() => ({
    distance: state.routeLegs.reduce((s, l) => s + l.distance, 0),
    time: state.routeLegs.reduce((s, l) => s + l.legTimeMin, 0),
  }), [state.routeLegs]);

  const altTotals = useMemo(() => ({
    distance: state.alternateLegs.reduce((s, l) => s + l.distance, 0),
    time: state.alternateLegs.reduce((s, l) => s + l.legTimeMin, 0),
  }), [state.alternateLegs]);

  const lookupAirport = useCallback(async (icao: string) => {
    if (!icao || icao.length < 2) return null;
    const airport = await db.airports
      .where('icaoCode')
      .equalsIgnoreCase(icao)
      .first();
    if (!airport) return null;
    return { lat: airport.lat, lon: airport.lon, name: airport.name };
  }, []);

  const value = useMemo<OfpContextValue>(
    () => ({ state, dispatch, fuel, wb, routeTotals, altTotals, lookupAirport }),
    [state, dispatch, fuel, wb, routeTotals, altTotals, lookupAirport],
  );

  return (
    <OfpContext.Provider value={value}>
      {children}
    </OfpContext.Provider>
  );
}

export function useOfp() {
  const ctx = useContext(OfpContext);
  if (!ctx) throw new Error('useOfp must be used within OfpProvider');
  return ctx;
}

export { calculateSunsetUtc };
