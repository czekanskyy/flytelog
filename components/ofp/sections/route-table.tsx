'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { useOfp, type RouteLeg } from '@/components/ofp/ofp-context';
import { formatMinutesAsTime } from '@/lib/ofp-calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RouteTableProps {
  variant: 'route' | 'alternate';
}

export function RouteTable({ variant }: RouteTableProps) {
  const t = useTranslations('ofp');
  const { state, dispatch, routeTotals, altTotals } = useOfp();

  const isRoute = variant === 'route';
  const legs = isRoute ? state.routeLegs : state.alternateLegs;
  const totals = isRoute ? routeTotals : altTotals;
  const maxLegs = isRoute ? 19 : 5;

  const title = isRoute ? t('routeInfo') : t('alternateInfo');
  const msaLabel = state.flightRules === 'VFR' ? 'MSA' : 'MORA';
  const safeLabel = state.flightRules === 'VFR' ? t('safeAlt') : 'MEA';

  const setLeg = (index: number, field: keyof RouteLeg, value: number | string) => {
    dispatch({
      type: isRoute ? 'SET_ROUTE_LEG' : 'SET_ALT_LEG',
      index,
      field,
      value,
    });
  };

  const addLeg = () => dispatch({ type: isRoute ? 'ADD_ROUTE_LEG' : 'ADD_ALT_LEG' });
  const removeLeg = (index: number) =>
    dispatch({ type: isRoute ? 'REMOVE_ROUTE_LEG' : 'REMOVE_ALT_LEG', index });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {legs.length < maxLegs && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLeg}
            className="h-8 gap-1 text-sky-500 hover:text-sky-400 select-none"
          >
            <Plus className="h-4 w-4" />
            {t('addLeg')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">#</th>
              <th className="pb-2 pr-2 font-medium">{t('waypoint')}</th>
              <th className="pb-2 pr-2 font-medium text-right">{t('distNm')}</th>
              <th className="pb-2 pr-2 font-medium text-right">MT (°)</th>
              <th className="pb-2 pr-2 font-medium text-right">WCA (°)</th>
              <th className="pb-2 pr-2 font-medium text-right">MH (°)</th>
              <th className="pb-2 pr-2 font-medium text-right">GS (kt)</th>
              <th className="pb-2 pr-2 font-medium text-right">{t('time')}</th>
              <th className="pb-2 pr-2 font-medium text-right">{msaLabel}</th>
              <th className="pb-2 pr-2 font-medium text-right">{safeLabel}</th>
              <th className="pb-2 pr-2 font-medium text-right">{t('planAlt')}</th>
              <th className="pb-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-1.5 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="py-1.5 pr-2">
                  <Input
                    className="h-8 text-sm"
                    value={leg.waypoint}
                    placeholder={i === 0 && isRoute ? state.departureIcao || t('waypoint') : t('waypoint')}
                    onChange={e => setLeg(i, 'waypoint', e.target.value)}
                  />
                </td>
                <NumCell value={leg.distance} onChange={v => setLeg(i, 'distance', v)} step={0.1} />
                <NumCell value={leg.magneticTrack} onChange={v => setLeg(i, 'magneticTrack', v)} max={360} />
                <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                  {leg.wca !== 0 ? (leg.wca > 0 ? `+${leg.wca}` : leg.wca) : '—'}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                  {leg.magneticHeading > 0 ? leg.magneticHeading : '—'}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                  {leg.groundSpeed > 0 ? leg.groundSpeed : '—'}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                  {leg.legTimeMin > 0 ? formatMinutesAsTime(leg.legTimeMin) : '—'}
                </td>
                <NumCell value={leg.msa} onChange={v => setLeg(i, 'msa', v)} step={100} />
                <NumCell value={leg.safeAlt} onChange={v => setLeg(i, 'safeAlt', v)} step={100} />
                <NumCell value={leg.planAltitude} onChange={v => setLeg(i, 'planAltitude', v)} step={500} />
                <td className="py-1.5">
                  {legs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLeg(i)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-xs font-medium text-muted-foreground">
              <td colSpan={2} className="pt-2 pr-2 text-right">
                {t('totals')}
              </td>
              <td className="pt-2 pr-2 text-right tabular-nums">
                {totals.distance > 0 ? Math.round(totals.distance * 10) / 10 : '—'}
              </td>
              <td colSpan={4} />
              <td className="pt-2 pr-2 text-right tabular-nums">
                {totals.time > 0 ? formatMinutesAsTime(totals.time) : '—'}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}

// ── Inline numeric input cell ──────────────────────────────────────

function NumCell({
  value,
  onChange,
  step = 1,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  max?: number;
}) {
  return (
    <td className="py-1.5 pr-2">
      <Input
        className="h-8 w-20 text-right text-sm tabular-nums"
        type="number"
        min={0}
        max={max}
        step={step}
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </td>
  );
}
