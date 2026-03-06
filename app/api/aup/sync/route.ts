import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncAupFromPansa } from '@/lib/aup-parser';

/**
 * POST /api/aup/sync
 *
 * Triggers a fresh AUP/UUP scrape from airspace.pansa.pl and
 * upserts today's and tomorrow's plans into the database.
 * Requires an authenticated session.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAupFromPansa();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('[AUP sync]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
