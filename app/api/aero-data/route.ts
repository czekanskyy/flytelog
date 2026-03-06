import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [airports, airspaces, navaids, obstacles, reportingPoints] = await Promise.all([
    prisma.airport.findMany({ where: { country: 'PL' } }),
    prisma.airspace.findMany({ where: { country: 'PL' } }),
    prisma.navaid.findMany({ where: { country: 'PL' } }),
    prisma.obstacle.findMany({ where: { country: 'PL' } }),
    prisma.reportingPoint.findMany({ where: { country: 'PL' } }),
  ]);

  return NextResponse.json(
    { airports, airspaces, navaids, obstacles, reportingPoints },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
