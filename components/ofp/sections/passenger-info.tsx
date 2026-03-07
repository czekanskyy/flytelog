'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useOfp } from '@/components/ofp/ofp-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PassengerInfo() {
  const t = useTranslations('ofp');
  const { state, dispatch } = useOfp();

  const setField = useCallback((field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field: field as never, value }), [dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{t('passengerInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='ofp-pic'>{t('pic')}</Label>
            <Input id='ofp-pic' placeholder={t('picPlaceholder')} value={state.pic} onChange={e => setField('pic', e.target.value.toUpperCase())} />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='ofp-crew'>{t('crewFunction')}</Label>
            <Input
              id='ofp-crew'
              placeholder={t('crewPlaceholder')}
              value={state.crewFunction}
              onChange={e => setField('crewFunction', e.target.value.toUpperCase())}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='ofp-pob'>{t('personsOnBoard')}</Label>
            <Input
              id='ofp-pob'
              type='number'
              min={1}
              max={99}
              value={state.personsOnBoard || ''}
              onChange={e => setField('personsOnBoard', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
