'use client';

import { useTranslations } from 'next-intl';
import { useOfp } from '@/components/ofp/ofp-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function WeightBalance() {
  const t = useTranslations('ofp');
  const { state, dispatch, wb } = useOfp();

  const setWB = (category: 'bem' | 'frontSeats' | 'rearSeats' | 'baggage', field: 'mass' | 'arm', value: number) => {
    dispatch({ type: 'SET_WB', category, field, value });
  };

  type WBDisplayRow = {
    label: string;
    mass: number;
    arm: number;
    momentDiv10: number;
    editable?: 'bem' | 'frontSeats' | 'rearSeats' | 'baggage';
    highlight?: boolean;
    extraInfo?: string;
  };

  const rows: WBDisplayRow[] = [
    { label: t('wbBem'), ...wb.bem, editable: 'bem' },
    { label: t('wbFrontSeats'), ...wb.frontSeats, editable: 'frontSeats' },
    { label: t('wbRearSeats'), ...wb.rearSeats, editable: 'rearSeats' },
    { label: t('wbBaggage'), ...wb.baggage, editable: 'baggage' },
    { label: t('wbZfm'), ...wb.zfm, highlight: true },
    {
      label: t('wbTripFuel'),
      mass: wb.tripFuel.mass,
      arm: wb.tripFuel.arm,
      momentDiv10: wb.tripFuel.momentDiv10,
      extraInfo: `${wb.tripFuel.litres.toFixed(1)} L × 0.72`,
    },
    { label: t('wbTakeoff'), ...wb.takeoffMass, highlight: true },
    {
      label: t('wbLandingFuel'),
      mass: wb.landingFuel.mass,
      arm: wb.landingFuel.arm,
      momentDiv10: wb.landingFuel.momentDiv10,
      extraInfo: `${wb.landingFuel.litres.toFixed(1)} L`,
    },
    { label: t('wbLanding'), ...wb.landingMass, highlight: true },
    {
      label: t('wbAltFuel'),
      mass: wb.altFuel.mass,
      arm: wb.altFuel.arm,
      momentDiv10: wb.altFuel.momentDiv10,
      extraInfo: `${wb.altFuel.litres.toFixed(1)} L`,
    },
    { label: t('wbAltMass'), ...wb.altMass, highlight: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('weightBalance')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium" />
              <th className="pb-2 pr-4 font-medium text-right">{t('massKg')}</th>
              <th className="pb-2 pr-4 font-medium text-right">{t('armM')}</th>
              <th className="pb-2 font-medium text-right">{t('momentDiv10')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 ${row.highlight ? 'bg-sky-500/5 font-medium' : ''}`}
              >
                <td className="py-2 pr-4 text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                  {row.label}
                  {row.extraInfo && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({row.extraInfo})
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.editable ? (
                    <Input
                      className="h-8 w-24 text-right text-sm tabular-nums ml-auto"
                      type="number"
                      min={0}
                      step={0.1}
                      value={state[row.editable].mass || ''}
                      onChange={e => setWB(row.editable!, 'mass', parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {row.mass > 0 ? row.mass.toFixed(1) : '—'}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.editable ? (
                    <Input
                      className="h-8 w-24 text-right text-sm tabular-nums ml-auto"
                      type="number"
                      step={0.01}
                      value={state[row.editable].arm || ''}
                      onChange={e => setWB(row.editable!, 'arm', parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {row.arm > 0 ? row.arm.toFixed(2) : '—'}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {row.momentDiv10 !== 0 ? row.momentDiv10.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
