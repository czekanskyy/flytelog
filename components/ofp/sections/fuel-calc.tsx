'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useOfp, type OfpState } from '@/components/ofp/ofp-context';
import { formatMinutesAsTime } from '@/lib/ofp-calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FuelCalc() {
  const t = useTranslations('ofp');
  const { state, dispatch, fuel } = useOfp();

  const setField = useCallback(
    (field: string, value: unknown) => dispatch({ type: 'SET_FIELD', field: field as never, value }),
    [dispatch],
  );

  const getEditableValue = (field: string): number => {
    const editableFields: Record<string, number> = {
      fuelBurnLph: state.fuelBurnLph,
      taxiTimeMin: state.taxiTimeMin,
      finalReserveMin: state.finalReserveMin,
      additionalFuelLtr: state.additionalFuelLtr,
      blockFuelLtr: state.blockFuelLtr,
    };
    return editableFields[field] ?? 0;
  };

  const rows: {
    label: string;
    time: number;
    fuelLtr: number;
    editable?: { timeField?: string; fuelField?: string };
    highlight?: boolean;
  }[] = [
    {
      label: t('fuelBurnRate'),
      time: 0,
      fuelLtr: state.fuelBurnLph,
      editable: { fuelField: 'fuelBurnLph' },
    },
    {
      label: t('taxi'),
      time: fuel.taxiTimeMin,
      fuelLtr: fuel.taxiFuelLtr,
      editable: { timeField: 'taxiTimeMin' },
    },
    {
      label: t('cruise'),
      time: fuel.cruiseTimeMin,
      fuelLtr: fuel.cruiseFuelLtr,
    },
    {
      label: `${t('contingency')} (5%)`,
      time: fuel.contingencyTimeMin,
      fuelLtr: fuel.contingencyFuelLtr,
    },
    {
      label: t('alternate'),
      time: fuel.alternateTimeMin,
      fuelLtr: fuel.alternateFuelLtr,
    },
    {
      label: t('finalReserve'),
      time: fuel.finalReserveMin,
      fuelLtr: fuel.finalReserveFuelLtr,
      editable: { timeField: 'finalReserveMin' },
    },
    {
      label: t('additional'),
      time: fuel.additionalTimeMin,
      fuelLtr: fuel.additionalFuelLtr,
      editable: { fuelField: 'additionalFuelLtr' },
    },
    {
      label: t('required'),
      time: fuel.requiredTimeMin,
      fuelLtr: fuel.requiredFuelLtr,
      highlight: true,
    },
    {
      label: t('extra'),
      time: fuel.extraTimeMin,
      fuelLtr: fuel.extraFuelLtr,
    },
    {
      label: t('block'),
      time: fuel.blockTimeMin,
      fuelLtr: fuel.blockFuelLtr,
      editable: { fuelField: 'blockFuelLtr' },
      highlight: true,
    },
    {
      label: t('safeEndurance'),
      time: fuel.safeEnduranceMin,
      fuelLtr: fuel.safeEnduranceLtr,
      highlight: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('fuelCalc')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium" />
              <th className="pb-2 pr-4 font-medium text-right">{t('time')}</th>
              <th className="pb-2 font-medium text-right">{t('fuelLtr')}</th>
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
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.editable?.timeField ? (
                    <Input
                      className="h-8 w-20 text-right text-sm tabular-nums ml-auto"
                      type="number"
                      min={0}
                      value={getEditableValue(row.editable.timeField) || ''}
                      onChange={e => setField(row.editable!.timeField!, parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {row.time > 0 ? formatMinutesAsTime(row.time) : '—'}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {row.editable?.fuelField ? (
                    <Input
                      className="h-8 w-24 text-right text-sm tabular-nums ml-auto"
                      type="number"
                      min={0}
                      step={0.1}
                      value={getEditableValue(row.editable.fuelField) || ''}
                      onChange={e => setField(row.editable!.fuelField!, parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {row.fuelLtr > 0 ? row.fuelLtr.toFixed(1) : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
