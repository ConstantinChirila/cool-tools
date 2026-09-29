/**
 * UK inflation between years, pay against prices, and future prices at a
 * steady rate. Historical figures are ONS annual average price indices
 * (lib/inflation-data.ts, refreshed by scripts/update-inflation.mjs); the
 * current year, until December is published, is its latest month.
 */

import { INFLATION_DATA } from "@/lib/inflation-data";
import { clamp } from "@/lib/utils";

export type Measure = "cpi" | "rpi";
export const MEASURES = ["cpi", "rpi"] as const satisfies readonly Measure[];

export const MEASURE_INFO: Record<Measure, { label: string; name: string }> = {
  cpi: { label: "CPI", name: "Consumer Prices Index" },
  rpi: { label: "RPI", name: "Retail Prices Index (long-run series)" },
};

export const LATEST = INFLATION_DATA.latest;
export const LATEST_YEAR: number = LATEST.year;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function firstYear(measure: Measure): number {
  return INFLATION_DATA[measure].first;
}

/** A year pulled into the range the measure covers. */
export function clampYear(measure: Measure, year: number): number {
  return clamp(Math.round(year), firstYear(measure), LATEST_YEAR);
}

function indexAt(measure: Measure, year: number): number {
  const { first, values } = INFLATION_DATA[measure];
  return values[clampYear(measure, year) - first] ?? Number.NaN;
}

/** "2026 (Aug)" for the unfinished current year, otherwise the year. */
export function yearLabel(year: number): string {
  return LATEST.partial && year === LATEST_YEAR ? `${year} (${LATEST.month})` : String(year);
}

/**
 * Where a year's figure sits in time, in years: an annual average is centred
 * on mid-year, the latest month on the middle of that month. Keeps the
 * average annual rate honest when one end is a partial year.
 */
function timePoint(year: number): number {
  if (LATEST.partial && year === LATEST_YEAR) return year + (MONTHS.indexOf(LATEST.month) + 0.5) / 12;
  return year + 0.5;
}

/** Latest 12-month rate as published by the ONS, as a fraction. */
export function latestRate(measure: Measure): number {
  return (measure === "cpi" ? LATEST.cpiRate : LATEST.rpiRate) / 100;
}

interface YearRow {
  year: number;
  index: number;
  /** Inflation that year: annual averages year on year, or the latest 12-month rate for a partial year. Null for the first year. */
  rate: number | null;
  /** The amount, restated in this year's prices. */
  value: number;
}

export interface Conversion {
  amount: number;
  from: number;
  to: number;
  /** The amount in `to` prices. */
  value: number;
  /** How far prices rose from the earlier year to the later one (0.5 = 50%). */
  totalRise: number;
  /** The steady yearly rate that gives the same total rise. */
  averageRate: number;
  /** Every year from the earlier to the later, oldest first. */
  rows: YearRow[];
  /** The year with the highest inflation inside the range, if the range spans more than one year. */
  peak: { year: number; rate: number } | null;
}

export function convert(input: { amount: number; from: number; to: number; measure: Measure }): Conversion {
  const { amount, measure } = input;
  const from = clampYear(measure, input.from);
  const to = clampYear(measure, input.to);
  const base = indexAt(measure, from);
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);

  const rows: YearRow[] = [];
  for (let year = lo; year <= hi; year++) {
    const index = indexAt(measure, year);
    const prev = year > firstYear(measure) ? indexAt(measure, year - 1) : null;
    const partial = LATEST.partial && year === LATEST_YEAR;
    rows.push({
      year,
      index,
      rate: year === lo || prev === null ? null : partial ? latestRate(measure) : index / prev - 1,
      value: (amount * index) / base,
    });
  }

  const totalRise = indexAt(measure, hi) / indexAt(measure, lo) - 1;
  const span = timePoint(hi) - timePoint(lo);
  let peak: Conversion["peak"] = null;
  for (const row of rows) {
    if (row.rate !== null && (peak === null || row.rate > peak.rate)) peak = { year: row.year, rate: row.rate };
  }

  return {
    amount,
    from,
    to,
    value: (amount * indexAt(measure, to)) / base,
    totalRise,
    averageRate: span > 0 ? (1 + totalRise) ** (1 / span) - 1 : 0,
    rows,
    peak,
  };
}

export interface PayCheck {
  /** What the old pay would need to be now just to buy the same. */
  needed: number;
  /** Change in buying power: above 0 is a real-terms rise. */
  realChange: number;
  /** Change in pounds, before inflation. */
  cashChange: number;
  /** Pay now minus the pay needed to keep up. */
  gap: number;
  conversion: Conversion;
}

export function payCheck(input: {
  thenPay: number;
  nowPay: number;
  from: number;
  to: number;
  measure: Measure;
}): PayCheck {
  const conversion = convert({ amount: input.thenPay, from: input.from, to: input.to, measure: input.measure });
  const needed = conversion.value;
  return {
    needed,
    realChange: needed > 0 ? input.nowPay / needed - 1 : 0,
    cashChange: input.thenPay > 0 ? input.nowPay / input.thenPay - 1 : 0,
    gap: input.nowPay - needed,
    conversion,
  };
}

interface ProjectionRow {
  year: number;
  /** What today's amount will cost that many years from now. */
  cost: number;
  /** What today's amount, left as cash, will buy in today's money. */
  buyingPower: number;
}

export interface Projection {
  cost: number;
  buyingPower: number;
  /** Row 0 is today. */
  rows: ProjectionRow[];
}

/** Prices rising at a steady `rate` (a fraction) for `years` years. */
export function project(input: { amount: number; years: number; rate: number }): Projection {
  const years = Math.max(0, Math.round(input.years));
  const rows: ProjectionRow[] = [];
  for (let year = 0; year <= years; year++) {
    const growth = (1 + input.rate) ** year;
    rows.push({ year, cost: input.amount * growth, buyingPower: input.amount / growth });
  }
  const last = rows[rows.length - 1] ?? { cost: input.amount, buyingPower: input.amount };
  return { cost: last.cost, buyingPower: last.buyingPower, rows };
}

/** Average yearly CPI inflation from its first year to the latest figure, as a fraction. */
export function longRunCpiRate(): number {
  return convert({ amount: 1, from: firstYear("cpi"), to: LATEST_YEAR, measure: "cpi" }).averageRate;
}
