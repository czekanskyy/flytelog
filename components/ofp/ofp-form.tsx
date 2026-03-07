'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { OfpProvider } from '@/components/ofp/ofp-context';
import { GeneralInfo } from '@/components/ofp/sections/general-info';
import { PassengerInfo } from '@/components/ofp/sections/passenger-info';
import { WeatherMinima } from '@/components/ofp/sections/weather-minima';
import { WeatherCalc } from '@/components/ofp/sections/weather-calc';
import { RouteTable } from '@/components/ofp/sections/route-table';
import { RadioFrequencies } from '@/components/ofp/sections/radio-frequencies';
import { FuelCalc } from '@/components/ofp/sections/fuel-calc';
import { WeightBalance } from '@/components/ofp/sections/weight-balance';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export function OfpForm() {
  const t = useTranslations('ofp');

  return (
    <OfpProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
            <FileText className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100 select-none">
              Operational Flight Plan
            </h1>
            <p className="text-xs text-muted-foreground select-none">{t('subtitle')}</p>
          </div>
        </div>

        <Separator />

        {/* Section 1 — General Info */}
        <GeneralInfo />

        {/* Section 2 — Passengers */}
        <PassengerInfo />

        {/* Section 3 — Weather Minima */}
        <WeatherMinima />

        {/* Section 4 — Weather Calc */}
        <WeatherCalc />

        <Separator />

        {/* Section 5 — Route */}
        <RouteTable variant="route" />

        {/* Section 6 — Alternate */}
        <RouteTable variant="alternate" />

        <Separator />

        {/* Section 7 — Radio Frequencies */}
        <RadioFrequencies />

        <Separator />

        {/* Section 8 — Fuel */}
        <FuelCalc />

        {/* Section 9 — Weight & Balance */}
        <WeightBalance />

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            disabled
            className="select-none"
          >
            {t('generatePdf')}
          </Button>
        </div>
      </div>
    </OfpProvider>
  );
}
