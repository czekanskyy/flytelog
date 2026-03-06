import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/aup?date=YYYY-MM-DD
 *
 * Returns all AUP entries for the requested date (defaults to today UTC).
 * Requires an authenticated session.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get('date');

  let planDate: Date;
  if (dateParam) {
    const [year, month, day] = dateParam.split('-').map(Number);
    planDate = new Date(Date.UTC(year, month - 1, day));
  } else {
    const now = new Date();
    planDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  const plans = await prisma.airspacePlan.findMany({
    where: { planDate },
    orderBy: { designator: 'asc' },
  });

  return NextResponse.json({ plans, planDate: planDate.toISOString() });
}
