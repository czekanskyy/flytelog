'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useOfp } from '@/components/ofp/ofp-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WeatherMinima() {
  const t = useTranslations('ofp');
  const { state, dispatch } = useOfp();

  const setField = useCallback(
    (field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field: field as never, value }),
    [dispatch],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('weatherMinima')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ofp-visibility">{t('visibility')} (m)</Label>
            <Input
              id="ofp-visibility"
              type="number"
              min={0}
              step={100}
              value={state.visibility || ''}
              onChange={e => setField('visibility', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-ceiling">{t('cloudCeiling')} (ft)</Label>
            <Input
              id="ofp-ceiling"
              type="number"
              min={0}
              step={100}
              value={state.cloudCeiling || ''}
              onChange={e => setField('cloudCeiling', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-xwind">{t('crosswind')} (kt)</Label>
            <Input
              id="ofp-xwind"
              type="number"
              min={0}
              value={state.windCrosswind || ''}
              onChange={e => setField('windCrosswind', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-total-wind">{t('totalWind')} (kt)</Label>
            <Input
              id="ofp-total-wind"
              type="number"
              min={0}
              value={state.windTotal || ''}
              onChange={e => setField('windTotal', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ofp-temp">{t('temperature')} (°C)</Label>
            <Input
              id="ofp-temp"
              type="number"
              value={state.temperature || ''}
              onChange={e => setField('temperature', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
