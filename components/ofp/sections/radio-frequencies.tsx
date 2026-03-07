'use client';

import { useTranslations } from 'next-intl';
import { useOfp } from '@/components/ofp/ofp-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export function RadioFrequencies() {
  const t = useTranslations('ofp');
  const { state, dispatch } = useOfp();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('radioFrequencies')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.radioFrequencies.map((rf, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
              <Checkbox
                id={`ofp-radio-${i}`}
                checked={rf.checked}
                onCheckedChange={(checked: boolean) =>
                  dispatch({ type: 'SET_RADIO', index: i, field: 'checked', value: !!checked })
                }
              />
              <div className="flex flex-1 gap-2">
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder={t('freqName')}
                  value={rf.name}
                  onChange={e =>
                    dispatch({ type: 'SET_RADIO', index: i, field: 'name', value: e.target.value })
                  }
                />
                <Input
                  className="h-8 text-sm w-28"
                  placeholder="123.456"
                  value={rf.frequency}
                  onChange={e =>
                    dispatch({ type: 'SET_RADIO', index: i, field: 'frequency', value: e.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
