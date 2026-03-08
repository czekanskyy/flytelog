'use client';

import { useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useOfp, calculateSunsetUtc } from '@/components/ofp/ofp-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function GeneralInfo() {
  const t = useTranslations('ofp');
  const { state, dispatch, lookupAirport } = useOfp();

  const setField = useCallback(
    (field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field: field as never, value }),
    [dispatch],
  );

  // Auto-calculate sunset when date or destination changes
  useEffect(() => {
    if (state.sunsetManual || !state.flightDate || !state._destLat || !state._destLon) return;

    const sunset = calculateSunsetUtc(
      new Date(state.flightDate),
      state._destLat,
      state._destLon,
    );
    if (sunset) dispatch({ type: 'SET_SUNSET', value: sunset });
  }, [state.flightDate, state._destLat, state._destLon, state.sunsetManual, dispatch]);

  // Lookup destination airport coords when ICAO changes
  useEffect(() => {
    if (state.destinationIcao.length < 3) return;

    const timer = setTimeout(async () => {
      const airport = await lookupAirport(state.destinationIcao);
      if (airport) {
        dispatch({ type: 'SET_DEST_COORDS', lat: airport.lat, lon: airport.lon });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state.destinationIcao, lookupAirport, dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('generalInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Date, Aircraft Type, Registration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ofp-date">{t('flightDate')}</Label>
            <Input
              id="ofp-date"
              type="date"
              value={state.flightDate}
              onChange={e => setField('flightDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-aircraft-type">{t('aircraftType')}</Label>
            <Input
              id="ofp-aircraft-type"
              placeholder="TB-9 Tampico"
              value={state.aircraftType}
              onChange={e => setField('aircraftType', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-registration">{t('registration')}</Label>
            <Input
              id="ofp-registration"
              placeholder="SP-ABC"
              value={state.registration}
              onChange={e => setField('registration', e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Row 2: Departure, Destination, Flight rules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ofp-dep">{t('departureIcao')}</Label>
            <Input
              id="ofp-dep"
              placeholder="EPWA"
              maxLength={4}
              value={state.departureIcao}
              onChange={e => setField('departureIcao', e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-dest">{t('destinationIcao')}</Label>
            <Input
              id="ofp-dest"
              placeholder="EPKK"
              maxLength={4}
              value={state.destinationIcao}
              onChange={e => setField('destinationIcao', e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('flightRules')}</Label>
            <Select
              value={state.flightRules}
              onValueChange={v => setField('flightRules', v)}
            >
              <SelectTrigger id="ofp-rules" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VFR">VFR</SelectItem>
                <SelectItem value="IFR">IFR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Sunset, Task */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ofp-sunset">{t('sunsetUtc')}</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="ofp-sunset"
                type="time"
                value={state.sunsetUtc}
                onChange={e => {
                  setField('sunsetManual', true);
                  dispatch({ type: 'SET_SUNSET', value: e.target.value });
                }}
                className="flex-1"
              />
              {state.sunsetManual && (
                <button
                  type="button"
                  className="text-xs text-sky-500 hover:text-sky-400 whitespace-nowrap select-none"
                  onClick={() => setField('sunsetManual', false)}
                >
                  {t('autoCalc')}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ofp-task">{t('task')}</Label>
            <Input
              id="ofp-task"
              placeholder={t('taskPlaceholder')}
              value={state.task}
              onChange={e => setField('task', e.target.value)}
            />
          </div>
        </div>

        {/* Row 4: Times — EDT, ATO, ETA, ATA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ofp-edt">EDT</Label>
            <Input
              id="ofp-edt"
              type="time"
              value={state.edt}
              onChange={e => setField('edt', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-ato">ATO</Label>
            <Input
              id="ofp-ato"
              type="time"
              value={state.ato}
              onChange={e => setField('ato', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-eta">ETA</Label>
            <Input
              id="ofp-eta"
              type="time"
              value={state.eta}
              onChange={e => setField('eta', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-ata">ATA</Label>
            <Input
              id="ofp-ata"
              type="time"
              value={state.ata}
              onChange={e => setField('ata', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
