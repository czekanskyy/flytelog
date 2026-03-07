'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useOfp } from '@/components/ofp/ofp-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WeatherCalc() {
  const t = useTranslations('ofp');
  const { state, dispatch } = useOfp();

  const setField = useCallback(
    (field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field: field as never, value }),
    [dispatch],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('weatherCalc')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ofp-tas">TAS (kt)</Label>
            <Input
              id="ofp-tas"
              type="number"
              min={0}
              value={state.tas || ''}
              onChange={e => setField('tas', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-wind-dir">{t('windDirection')} (°)</Label>
            <Input
              id="ofp-wind-dir"
              type="number"
              min={0}
              max={360}
              value={state.windDirection || ''}
              onChange={e => setField('windDirection', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-wind-speed">{t('windSpeedCalc')} (kt)</Label>
            <Input
              id="ofp-wind-speed"
              type="number"
              min={0}
              value={state.windSpeed || ''}
              onChange={e => setField('windSpeed', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
