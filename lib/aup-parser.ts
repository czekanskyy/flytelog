/**
 * AUP/UUP Parser — PANSA airspace.pansa.pl
 *
 * Parses Bravo-table HTML rows from:
 *   https://airspace.pansa.pl/aup/current  (today's base AUP)
 *   https://airspace.pansa.pl/uup/current  (today's updated UUP — overrides AUP)
 *   https://airspace.pansa.pl/aup/next     (tomorrow's AUP)
 *
 * Golden rule: UUP overrides ALL entries for a given designator from today's AUP.
 */

import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AupEntry {
  designator: string; // normalised, whitespace removed, uppercase
  lowerLimit: string; // "GND" | "A020" | "F095" etc.
  upperLimit: string;
  validFrom: string; // "HH:mm" UTC
  validTo: string; // "HH:mm" UTC
  unit: string | null; // controlling ATSU, e.g. "EPDE"
  fuaStatus: string | null; // "Y" | "N"
  remarks: string | null;
}

export interface ParseResult {
  entries: AupEntry[];
  planDate: Date | null; // UTC midnight of the first validity day
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PANSA_BASE = 'https://airspace.pansa.pl';

/**
 * Remove all whitespace from a designator and uppercase it.
 * "TSA 04 A" → "TSA04A"
 */
export function normalizeDesignator(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/**
 * Extract the plan date (UTC midnight) from the <aside> validity text.
 * Example aside text: "2026-03-06 06:00 - 2026-03-07 06:00"
 */
function extractPlanDate(html: string): Date | null {
  const $ = cheerio.load(html);
  const text = $('aside').text();
  const match = text.match(/(\d{4})-(\d{2})-(\d{2})\s+\d{2}:\d{2}\s*-/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export function parsePansaHtml(html: string): ParseResult {
  const $ = cheerio.load(html);
  const planDate = extractPlanDate(html);
  const entries: AupEntry[] = [];

  // The bravo table contains area-type reservations (TSA, TRA, R, MRT, …).
  // Selector covers both the data-attribute variant and the explicit tbody ID.
  $('[data-table="bravo"] tbody tr').each((_, row) => {
    const cells = $(row).find('td').toArray();

    // NIL rows have only 1 cell; real rows have at least 6
    if (cells.length < 6) return;

    const designatorRaw = $(cells[1]).text().trim();

    // Skip empty cells, NIL placeholders, and i18n placeholder strings
    if (!designatorRaw || /^nil$/i.test(designatorRaw) || designatorRaw.startsWith('??')) return;

    entries.push({
      designator: normalizeDesignator(designatorRaw),
      lowerLimit: $(cells[2]).text().trim(),
      upperLimit: $(cells[3]).text().trim(),
      validFrom: $(cells[4]).text().trim(),
      validTo: $(cells[5]).text().trim(),
      unit: cells.length > 6 ? $(cells[6]).text().trim() || null : null,
      fuaStatus: cells.length > 7 ? $(cells[7]).text().trim() || null : null,
      remarks: cells.length > 8 ? $(cells[8]).text().trim() || null : null,
    });
  });

  return { entries, planDate };
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'flyteLog EFB/1.0',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[AUP] ${url} → HTTP ${res.status}`);
      return null;
    }
    return res.text();
  } catch (err) {
    console.warn(`[AUP] fetch error ${url}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sync — call from API route
// ---------------------------------------------------------------------------

export async function syncAupFromPansa(): Promise<{ today: number; tomorrow: number }> {
  const { prisma } = await import('@/lib/prisma');

  // Fetch all three sources in parallel
  const [aupHtml, uupHtml, nextHtml] = await Promise.all([
    fetchPage(`${PANSA_BASE}/aup/current`),
    fetchPage(`${PANSA_BASE}/uup/current`), // may return null if no UUP published yet
    fetchPage(`${PANSA_BASE}/aup/next`),
  ]);

  if (!aupHtml) throw new Error('Failed to fetch today AUP from PANSA');
  if (!nextHtml) throw new Error('Failed to fetch tomorrow AUP from PANSA');

  const todayAup = parsePansaHtml(aupHtml);
  const todayUup = uupHtml ? parsePansaHtml(uupHtml) : { entries: [], planDate: null };
  const tomorrowAup = parsePansaHtml(nextHtml);

  // Golden rule: if a designator appears in UUP, ALL its AUP slots are replaced
  const uupDesignators = new Set(todayUup.entries.map(e => e.designator));
  const mergedToday = [...todayAup.entries.filter(e => !uupDesignators.has(e.designator)), ...todayUup.entries];

  // Resolve plan dates — fall back to UTC midnight of today / today+1
  const now = new Date();
  const todayUtc = todayAup.planDate ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUtc = tomorrowAup.planDate ?? new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate() + 1));

  // Today — delete stale records, then insert merged AUP + UUP
  await prisma.airspacePlan.deleteMany({ where: { planDate: todayUtc } });
  if (mergedToday.length > 0) {
    await prisma.airspacePlan.createMany({
      data: mergedToday.map(e => ({ planDate: todayUtc, planType: 'AUP', ...e })),
    });
  }

  // Tomorrow — same pattern
  await prisma.airspacePlan.deleteMany({ where: { planDate: tomorrowUtc } });
  if (tomorrowAup.entries.length > 0) {
    await prisma.airspacePlan.createMany({
      data: tomorrowAup.entries.map(e => ({ planDate: tomorrowUtc, planType: 'AUP', ...e })),
    });
  }

  return { today: mergedToday.length, tomorrow: tomorrowAup.entries.length };
}
