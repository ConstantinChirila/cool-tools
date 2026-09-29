/**
 * UK residential property transaction taxes: Stamp Duty Land Tax (England and
 * Northern Ireland), Land and Buildings Transaction Tax (Scotland) and Land
 * Transaction Tax (Wales). Rates in force for completions from 1 April 2025
 * (SDLT), 5 December 2024 (LBTT ADS) and 11 December 2024 (LTT higher rates).
 */

export type Nation = "england" | "scotland" | "wales";
export type Buyer = "main" | "firstTime" | "additional";

export const NATIONS: Nation[] = ["england", "scotland", "wales"];
export const BUYERS: Buyer[] = ["main", "firstTime", "additional"];

/** One slice of the price: everything above the previous band's `upTo` and up to this one. */
interface Band {
  upTo: number;
  rate: number;
}

type Surcharge =
  /** Added to the rate of every band (SDLT higher rates). */
  | { kind: "perBand"; rate: number }
  /** A flat percentage of the whole price, on top of the normal tax (LBTT ADS). */
  | { kind: "flat"; rate: number }
  /** A separate rate table used instead of the main one (LTT higher rates). */
  | { kind: "table"; bands: Band[] };

interface NationRules {
  label: string;
  tax: string;
  short: string;
  standard: Band[];
  /** First-time buyer rates, lost entirely above `maxPrice`. */
  firstTime?: { bands: Band[]; maxPrice: number };
  additional: Surcharge;
  /** Additional-property rates only apply from this price up. */
  additionalMin: number;
  /** Extra rate on every band for buyers who are not UK resident. */
  nonResident?: number;
}

const INF = Number.POSITIVE_INFINITY;

export const RULES: Record<Nation, NationRules> = {
  england: {
    label: "England & NI",
    tax: "Stamp Duty Land Tax",
    short: "SDLT",
    standard: [
      { upTo: 125_000, rate: 0 },
      { upTo: 250_000, rate: 0.02 },
      { upTo: 925_000, rate: 0.05 },
      { upTo: 1_500_000, rate: 0.1 },
      { upTo: INF, rate: 0.12 },
    ],
    firstTime: {
      bands: [
        { upTo: 300_000, rate: 0 },
        { upTo: 500_000, rate: 0.05 },
      ],
      maxPrice: 500_000,
    },
    additional: { kind: "perBand", rate: 0.05 },
    additionalMin: 40_000,
    nonResident: 0.02,
  },
  scotland: {
    label: "Scotland",
    tax: "Land and Buildings Transaction Tax",
    short: "LBTT",
    standard: [
      { upTo: 145_000, rate: 0 },
      { upTo: 250_000, rate: 0.02 },
      { upTo: 325_000, rate: 0.05 },
      { upTo: 750_000, rate: 0.1 },
      { upTo: INF, rate: 0.12 },
    ],
    firstTime: {
      bands: [
        { upTo: 175_000, rate: 0 },
        { upTo: 250_000, rate: 0.02 },
        { upTo: 325_000, rate: 0.05 },
        { upTo: 750_000, rate: 0.1 },
        { upTo: INF, rate: 0.12 },
      ],
      maxPrice: INF,
    },
    additional: { kind: "flat", rate: 0.08 },
    additionalMin: 40_000,
  },
  wales: {
    label: "Wales",
    tax: "Land Transaction Tax",
    short: "LTT",
    standard: [
      { upTo: 225_000, rate: 0 },
      { upTo: 400_000, rate: 0.06 },
      { upTo: 750_000, rate: 0.075 },
      { upTo: 1_500_000, rate: 0.1 },
      { upTo: INF, rate: 0.12 },
    ],
    additional: {
      kind: "table",
      bands: [
        { upTo: 180_000, rate: 0.05 },
        { upTo: 250_000, rate: 0.085 },
        { upTo: 400_000, rate: 0.1 },
        { upTo: 750_000, rate: 0.125 },
        { upTo: 1_500_000, rate: 0.15 },
        { upTo: INF, rate: 0.17 },
      ],
    },
    additionalMin: 40_000,
  },
};

export const BUYER_INFO: Record<Buyer, { label: string; short: string; hint: string }> = {
  main: { label: "Moving home", short: "Main home", hint: "Your only home once you complete" },
  firstTime: { label: "First-time buyer", short: "First-time", hint: "Nobody buying has ever owned a home" },
  additional: { label: "Additional property", short: "Additional", hint: "Second home or buy-to-let, keeping another" },
};

export interface StampDutyInput {
  price: number;
  nation: Nation;
  buyer: Buyer;
  /** Only changes the tax in England and Northern Ireland. */
  nonResident: boolean;
}

export interface BandLine {
  from: number;
  /** Infinity for the top band. */
  to: number;
  /** The band's rate before surcharges. */
  rate: number;
  /** Higher-rates and non-resident surcharges added to this band. */
  surcharge: number;
  /** How much of the price falls in this band. */
  taxable: number;
  tax: number;
}

type ReliefStatus =
  /** First-time buyer rates applied. */
  | "applied"
  /** First-time buyer, but the price is over the cap so normal rates apply. */
  | "overCap"
  /** The nation has no first-time buyer relief. */
  | "unavailable"
  /** Not a first-time buyer. */
  | "notClaimed";

export interface StampDutyResult {
  input: StampDutyInput;
  /** Rounded down to the pound, as every one of the three taxes is. */
  tax: number;
  lines: BandLine[];
  /** Scotland's Additional Dwelling Supplement: a flat % of the whole price. */
  flatSupplement: { rate: number; tax: number } | null;
  relief: ReliefStatus;
  /** Whether additional-property rates were charged (false under the minimum price). */
  higherRates: boolean;
  /** Whether the non-resident surcharge was charged. */
  nonResident: boolean;
  /** The part of the tax that is the non-resident surcharge (before rounding). */
  nonResidentTax: number;
  /** Tax as a share of the price. */
  effectiveRate: number;
  /**
   * Extra tax if the price were £1,000 higher. Worked out by pricing it again
   * rather than from the band rate, so the first-time buyer cap and the
   * additional-property minimum show up as the jumps they are.
   */
  nextThousand: number;
}

const BUMP = 1_000;

export function calculateStampDuty(input: StampDutyInput): StampDutyResult {
  const base = compute(input);
  return { ...base, nextThousand: compute({ ...input, price: base.input.price + BUMP }).tax - base.tax };
}

function compute(input: StampDutyInput): Omit<StampDutyResult, "nextThousand"> {
  const rules = RULES[input.nation];
  const price = Math.max(0, input.price);

  const relief: ReliefStatus =
    input.buyer !== "firstTime"
      ? "notClaimed"
      : !rules.firstTime
        ? "unavailable"
        : price > rules.firstTime.maxPrice
          ? "overCap"
          : "applied";
  const higherRates = input.buyer === "additional" && price >= rules.additionalMin;
  const nonResident = input.nonResident && rules.nonResident !== undefined;

  let bands = relief === "applied" && rules.firstTime ? rules.firstTime.bands : rules.standard;
  let perBand = nonResident ? (rules.nonResident ?? 0) : 0;
  let flat = 0;
  if (higherRates) {
    const s = rules.additional;
    if (s.kind === "perBand") perBand += s.rate;
    else if (s.kind === "flat") flat = s.rate;
    else bands = s.bands;
  }

  const lines: BandLine[] = [];
  let from = 0;
  for (const band of bands) {
    const taxable = Math.max(0, Math.min(price, band.upTo) - from);
    const rate = band.rate + perBand;
    lines.push({ from, to: band.upTo, rate: band.rate, surcharge: perBand, taxable, tax: taxable * rate });
    from = band.upTo;
  }

  const flatTax = price * flat;
  const exact = lines.reduce((sum, l) => sum + l.tax, 0) + flatTax;
  // Guard against 0.1 + 0.2 style dust before rounding down.
  const tax = Math.floor(exact + 1e-6);
  const nonResidentRate = nonResident ? (rules.nonResident ?? 0) : 0;

  return {
    input: { ...input, price },
    tax,
    lines,
    flatSupplement: higherRates && flat > 0 ? { rate: flat, tax: flatTax } : null,
    relief,
    higherRates,
    nonResident,
    nonResidentTax: lines.reduce((sum, l) => sum + l.taxable * nonResidentRate, 0),
    effectiveRate: price > 0 ? tax / price : 0,
  };
}

export function stampDuty(input: StampDutyInput): number {
  return calculateStampDuty(input).tax;
}

/** The tax for every buyer type at the same price, nation and residence. */
export function compareBuyers(input: StampDutyInput): Record<Buyer, number> {
  return {
    main: stampDuty({ ...input, buyer: "main" }),
    firstTime: stampDuty({ ...input, buyer: "firstTime" }),
    additional: stampDuty({ ...input, buyer: "additional" }),
  };
}

export interface Nudge {
  /** The lower price that saves tax. */
  target: number;
  /** How much off the price that is. */
  cut: number;
  /** Stamp duty saved at the lower price. */
  saving: number;
  /** Why the step exists: a rate band, the first-time buyer cap, or the additional-property minimum. */
  reason: "band" | "firstTimeCap" | "additionalMin";
}

/** Only price cuts up to this share of the price are worth suggesting. */
const MAX_NUDGE_SHARE = 0.05;

/**
 * The nearest lower price where the tax steps down: the start of the band the
 * price sits in, or a cliff (the first-time buyer cap, the £40,000 minimum for
 * additional-property rates). Only steps within `MAX_NUDGE_SHARE` of the price
 * count, as anything further is not a realistic negotiation. Null when there is none.
 */
export function nearestSaving(input: StampDutyInput): Nudge | null {
  const rules = RULES[input.nation];
  const { price } = input;
  const candidates: { target: number; reason: Nudge["reason"] }[] = [];

  const result = calculateStampDuty(input);
  for (const line of result.lines) {
    if (line.from > 0 && line.from < price) candidates.push({ target: line.from, reason: "band" });
  }
  if (result.relief === "overCap" && rules.firstTime) {
    candidates.push({ target: rules.firstTime.maxPrice, reason: "firstTimeCap" });
  }
  if (result.higherRates) candidates.push({ target: rules.additionalMin - 1, reason: "additionalMin" });

  let best: Nudge | null = null;
  for (const c of candidates) {
    const saving = result.tax - stampDuty({ ...input, price: c.target });
    const cut = price - c.target;
    if (saving <= 0 || cut > price * MAX_NUDGE_SHARE) continue;
    if (!best || c.target > best.target) best = { target: c.target, cut, saving, reason: c.reason };
  }
  return best;
}

/** Tax at evenly spaced prices from 0 to `maxPrice`, one series per buyer type, for the chart. */
export function taxCurve(
  input: Omit<StampDutyInput, "price" | "buyer">,
  maxPrice: number,
  steps: number,
): { prices: number[] } & Record<Buyer, number[]> {
  const prices: number[] = [];
  const out: Record<Buyer, number[]> = { main: [], firstTime: [], additional: [] };
  for (let i = 0; i <= steps; i++) {
    const price = (maxPrice * i) / steps;
    prices.push(price);
    for (const buyer of BUYERS) out[buyer].push(stampDuty({ ...input, price, buyer }));
  }
  return { prices, ...out };
}

export interface UpfrontCosts {
  deposit: number;
  legal: number;
  survey: number;
  mortgageFees: number;
  other: number;
}

/** Every cost of buying apart from the deposit and the tax. */
export function upfrontFees(costs: UpfrontCosts): number {
  return costs.legal + costs.survey + costs.mortgageFees + costs.other;
}

/** Cash needed on completion day: deposit, the tax and the costs around buying. */
export function cashToBuy(tax: number, costs: UpfrontCosts): number {
  return costs.deposit + tax + upfrontFees(costs);
}

export interface Completion {
  fees: number;
  cash: number;
  /** What's left to borrow; 0 for a cash buyer. */
  mortgage: number;
  /** Mortgage as a share of the price (loan to value). */
  ltv: number;
}

/** The money on completion day for a priced purchase. */
export function completion(result: StampDutyResult, costs: UpfrontCosts): Completion {
  const { price } = result.input;
  const mortgage = Math.max(0, price - costs.deposit);
  return {
    fees: upfrontFees(costs),
    cash: cashToBuy(result.tax, costs),
    mortgage,
    ltv: price > 0 ? mortgage / price : 0,
  };
}
