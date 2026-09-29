import { fail, ok, type Result } from "@/lib/result";
import { clamp } from "@/lib/utils";

/* ------------------------------------------------------------ Spending -- */

export const EXPENSE_KEYS = [
  "housing",
  "bills",
  "food",
  "transport",
  "phone",
  "insurance",
  "debt",
  "subscriptions",
  "fun",
  "other",
] as const;
export type ExpenseKey = (typeof EXPENSE_KEYS)[number];

/** A month's spending on one thing, and whether it would carry on if money got tight. */
export interface Expense {
  amount: number;
  essential: boolean;
}

export type Expenses = Record<ExpenseKey, Expense>;

export const EXPENSE_INFO: Record<ExpenseKey, { label: string; hint?: string }> = {
  housing: { label: "Rent or mortgage" },
  bills: { label: "Energy, water and council tax" },
  food: { label: "Food shopping" },
  transport: { label: "Transport", hint: "Fuel, fares, car costs" },
  phone: { label: "Phone and internet" },
  insurance: { label: "Insurance" },
  debt: { label: "Debt repayments", hint: "Minimum payments on cards and loans" },
  subscriptions: { label: "Subscriptions", hint: "Streaming, gym, apps" },
  fun: { label: "Eating out and fun" },
  other: { label: "Everything else", hint: "Clothes, gifts, pets, childcare" },
};

/** Rough monthly costs for a UK household renting, so the tool opens on a believable picture. */
export const DEFAULT_EXPENSES: Expenses = {
  housing: { amount: 1_000, essential: true },
  bills: { amount: 350, essential: true },
  food: { amount: 400, essential: true },
  transport: { amount: 150, essential: true },
  phone: { amount: 60, essential: true },
  insurance: { amount: 50, essential: true },
  debt: { amount: 0, essential: true },
  subscriptions: { amount: 40, essential: false },
  fun: { amount: 200, essential: false },
  other: { amount: 150, essential: false },
};

export interface SpendingTotals {
  essential: number;
  cuttable: number;
  total: number;
}

export function spendingTotals(expenses: Expenses): SpendingTotals {
  let essential = 0;
  let cuttable = 0;
  for (const key of EXPENSE_KEYS) {
    const { amount, essential: keep } = expenses[key];
    if (keep) essential += amount;
    else cuttable += amount;
  }
  return { essential, cuttable, total: essential + cuttable };
}

/* -------------------------------------------------------------- Income -- */

export const INCOME_KINDS = ["redundancy", "partner", "side", "jsa", "lump", "monthly"] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];

/**
 * Money that still arrives after your pay stops. A one-off sum lands on day
 * one; monthly money lasts `months` (0 = for as long as it takes). New Style
 * JSA's `amount` is its weekly rate and it always stops after six months.
 */
export interface IncomeLine {
  kind: IncomeKind;
  amount: number;
  months: number;
}

export const INCOME_INFO: Record<IncomeKind, { label: string; type: "lump" | "monthly" | "weekly"; code: string }> = {
  redundancy: { label: "Redundancy or notice pay", type: "lump", code: "r" },
  partner: { label: "Partner's contribution", type: "monthly", code: "p" },
  side: { label: "Side income", type: "monthly", code: "s" },
  jsa: { label: "New Style JSA", type: "weekly", code: "j" },
  lump: { label: "Other one-off money", type: "lump", code: "l" },
  monthly: { label: "Other monthly income", type: "monthly", code: "o" },
};

/**
 * New Style Jobseeker's Allowance, 2026/27: up to these weekly amounts for up
 * to 182 days. Savings and a partner's income don't affect it. Source:
 * gov.uk/jobseekers-allowance/what-youll-get (checked 2026-09-29).
 */
export const JSA = {
  under25: 75.65,
  over25: 95.55,
  months: 6,
  taxYear: "2026/27",
} as const;

/**
 * Universal Credit capital rules: savings up to the lower limit are ignored,
 * each £250 (or part) above it takes a set amount a month off, and above the
 * upper limit there is no UC. Source: gov.uk/guidance/universal-credit-money-savings-and-investments.
 */
export const UC_CAPITAL = { lower: 6_000, upper: 16_000, step: 250, perStep: 4.35 } as const;

export const MAX_INCOME_LINES = 8;
const WEEKS_PER_MONTH = 52 / 12;

/** What a line pays in month `m` (1 = the first month without pay). One-off sums count on day one, not here. */
export function monthlyIncome(line: IncomeLine, m: number): number {
  const { type } = INCOME_INFO[line.kind];
  if (type === "lump") return 0;
  const months = type === "weekly" ? JSA.months : line.months;
  if (months > 0 && m > months) return 0;
  return type === "weekly" ? line.amount * WEEKS_PER_MONTH : line.amount;
}

export function lumpSums(income: readonly IncomeLine[]): number {
  return income.reduce((sum, line) => sum + (INCOME_INFO[line.kind].type === "lump" ? line.amount : 0), 0);
}

/** The last month in which any income changes; from the month after, every month is the same. */
function lastChange(income: readonly IncomeLine[]): number {
  return income.reduce((last, line) => {
    const { type } = INCOME_INFO[line.kind];
    if (type === "weekly") return Math.max(last, JSA.months);
    return type === "monthly" ? Math.max(last, line.months) : last;
  }, 0);
}

/** Everything coming in during month `m`, one-off sums aside. */
export const incomeIn = (income: readonly IncomeLine[], m: number) => income.reduce((sum, line) => sum + monthlyIncome(line, m), 0);

/** `r3000_p800_s300m6_j95.55`: kind code, amount, then `m` and a month count for monthly money that stops. */
export function encodeIncome(income: readonly IncomeLine[]): string {
  return income
    .map((line) => {
      const { code, type } = INCOME_INFO[line.kind];
      return `${code}${line.amount}${type === "monthly" && line.months > 0 ? `m${line.months}` : ""}`;
    })
    .join("_");
}

export const MAX_MONTHS_INPUT = 120;

/** The reverse of `encodeIncome`. An empty string is no income. */
export function parseIncome(raw: string): Result<IncomeLine[]> {
  if (raw === "") return ok([]);
  const parts = raw.split("_");
  if (parts.length > MAX_INCOME_LINES) return fail(`At most ${MAX_INCOME_LINES} lines`);
  const lines: IncomeLine[] = [];
  for (const part of parts) {
    const match = /^([a-z])(\d+(?:\.\d+)?)(?:m(\d+))?$/.exec(part);
    const kind = INCOME_KINDS.find((k) => INCOME_INFO[k].code === match?.[1]);
    if (!match || !kind) return fail(`Not an income line: ${part}`);
    lines.push({
      kind,
      amount: clamp(Number(match[2]), 0, 10_000_000),
      months: clamp(Number(match[3] ?? 0), 0, MAX_MONTHS_INPUT),
    });
  }
  return ok(lines);
}

/* -------------------------------------------------------------- Runway -- */

/** Past this, savings are treated as lasting for good. */
export const MAX_RUNWAY_MONTHS = 600;

export interface Runway {
  /** Months until the money runs out, fractional; null if it never does. */
  months: number | null;
  /** Balance at the start and after each month, down to 0, up to `horizon` months. */
  balances: number[];
}

/**
 * Month by month: savings plus one-off sums on day one, then each month's
 * spending less the income still coming in. Spending runs evenly through a
 * month, so the month it runs out in counts as the fraction it covered.
 */
export function runway(savings: number, spending: number, income: readonly IncomeLine[], horizon: number): Runway {
  let balance = savings + lumpSums(income);
  const balances = [balance];
  const steady = lastChange(income);
  let months: number | null = null;

  for (let m = 1; m <= MAX_RUNWAY_MONTHS; m++) {
    const net = spending - incomeIn(income, m);
    if (months === null && net > 0 && balance < net) months = m - 1 + balance / net;
    balance = Math.max(balance - net, 0);
    if (m <= horizon) balances.push(balance);
    // Nothing changes after the last income ends, so a balance that isn't falling then never will.
    const settled = months !== null || (m > steady && net <= 0);
    if (settled && m >= horizon) break;
  }
  return { months, balances };
}

/* -------------------------------------------------------------- Target -- */

export interface Target {
  /** Months of essential spending times the essentials. */
  amount: number;
  /** Still to save; 0 once the target is reached. */
  gap: number;
  /** Savings over the target. */
  over: number;
  /** Share of the target saved so far, 0 to 1. */
  progress: number;
  /** Whole months of saving to close the gap; null if nothing is being saved. */
  monthsToGo: number | null;
  /**
   * Savings that would last the same number of months once the listed income
   * is counted: the deepest the balance ever dips over those months.
   */
  withIncome: number;
}

export function target(
  months: number,
  essential: number,
  savings: number,
  monthlySaving: number,
  income: readonly IncomeLine[],
): Target {
  const amount = months * essential;
  const gap = Math.max(amount - savings, 0);
  let spent = 0;
  let deepest = 0;
  for (let m = 1; m <= months; m++) {
    spent += essential - incomeIn(income, m);
    deepest = Math.max(deepest, spent);
  }
  return {
    amount,
    gap,
    over: Math.max(savings - amount, 0),
    progress: amount > 0 ? Math.min(savings / amount, 1) : 1,
    monthsToGo: gap === 0 ? 0 : monthlySaving > 0 ? Math.ceil(gap / monthlySaving) : null,
    withIncome: Math.max(deepest - lumpSums(income), 0),
  };
}

/** Universal Credit taken off a month for savings, or null when savings rule it out. */
export function ucCapitalDeduction(savings: number): number | null {
  const { lower, upper, step, perStep } = UC_CAPITAL;
  if (savings > upper) return null;
  if (savings <= lower) return 0;
  return Math.ceil((savings - lower) / step) * perStep;
}

/* ------------------------------------------------------------- Formats -- */

const DAYS_PER_MONTH = 365.25 / 12;

export interface DurationPart {
  value: number;
  unit: string;
}

/** 3 months 2 weeks, 5 weeks, 4 days, 2 years 1 month: the two biggest units that apply, rounded down. */
export function durationParts(months: number): DurationPart[] {
  const part = (value: number, word: string): DurationPart => ({ value, unit: value === 1 ? word : `${word}s` });
  const days = months * DAYS_PER_MONTH;
  if (days < 7) return [part(Math.floor(days), "day")];
  if (months < 1) return [part(Math.floor(days / 7), "week")];
  if (months < 24) {
    const whole = Math.floor(months);
    const weeks = Math.floor((months - whole) * WEEKS_PER_MONTH);
    return weeks > 0 ? [part(whole, "month"), part(weeks, "week")] : [part(whole, "month")];
  }
  const years = Math.floor(months / 12);
  const rest = Math.floor(months - years * 12);
  return rest > 0 ? [part(years, "year"), part(rest, "month")] : [part(years, "year")];
}

/** "3 months 2 weeks". */
export function formatDuration(months: number): string {
  return durationParts(months)
    .map((p) => `${p.value} ${p.unit}`)
    .join(" ");
}

/** The day the money runs out, counting whole calendar months then the part month in days. */
export function runOutDate(from: Date, months: number): Date {
  const whole = Math.floor(months);
  const date = new Date(from.getFullYear(), from.getMonth() + whole, from.getDate());
  // Months that don't have the start day (31 Jan + 1 month) land on the last day of the month.
  if (date.getDate() !== from.getDate()) date.setDate(0);
  date.setDate(date.getDate() + Math.floor((months - whole) * DAYS_PER_MONTH));
  return date;
}
