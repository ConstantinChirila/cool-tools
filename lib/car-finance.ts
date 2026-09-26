/**
 * Car finance comparison: hire purchase, PCP, a personal loan and a
 * personal lease (PCH) on the same car, over the same term.
 *
 * Rates are APRs, which in the UK are annual effective rates, so the
 * monthly rate is (1 + APR)^(1/12) − 1 rather than APR / 12. Fees are
 * entered separately and are not folded back into the APR.
 */

export type FinanceKind = "pcp" | "hp" | "loan" | "lease";
export type CompareBasis = "net" | "total";
/** What happens when a PCP ends: return the car, or pay the balloon and keep it. */
export type PcpEnd = "handBack" | "keep";

export const FINANCE_KINDS: FinanceKind[] = ["pcp", "hp", "loan", "lease"];

export const FINANCE_INFO: Record<FinanceKind, { label: string; short: string; hint: string }> = {
  pcp: {
    label: "Personal contract purchase",
    short: "PCP",
    hint: "Lower monthly payments that leave a balloon at the end: pay it to keep the car, or hand the car back",
  },
  hp: {
    label: "Hire purchase",
    short: "HP",
    hint: "Pay off the whole car in equal monthly payments; it is yours after the last one",
  },
  loan: {
    label: "Personal loan",
    short: "Loan",
    hint: "Borrow from a bank and buy the car outright, so you own it from day one",
  },
  lease: {
    label: "Personal lease (PCH)",
    short: "Lease",
    hint: "Rent the car for a fixed term: an initial rental up front, then monthly rentals, and it goes back at the end",
  },
};

export interface CarFinanceInput {
  price: number;
  /** Cash deposit plus any part-exchange. Not used by the lease. */
  deposit: number;
  /** Deposit contribution from the dealer or manufacturer, on HP and PCP only. */
  dealerContribution: number;
  termMonths: number;
  /** APR for dealer finance (HP and PCP), in percent. */
  apr: number;
  /** APR for a personal loan, in percent. */
  loanApr: number;
  /** Expected market value at the end of the term, as a % of the price. */
  resalePct: number;
  /** PCP guaranteed minimum future value (the balloon), as a % of the price. */
  gmfvPct: number;
  pcpEnd: PcpEnd;
  /** Dealer finance admin or documentation fee, paid with the first payment (HP and PCP). */
  adminFee: number;
  /** Option to purchase fee, paid at the end to take ownership (HP, and PCP when kept). */
  optionFee: number;
  /** Lease monthly rental, as quoted. */
  leaseMonthly: number;
  /** Lease initial rental as a number of monthly rentals (3, 6, 9, 12). */
  leaseInitial: number;
  /** Lease broker or processing fee. */
  leaseFee: number;
  milesPerYear: number;
  /** Annual mileage allowance on the PCP and the lease. */
  mileageAllowance: number;
  /** Excess mileage charge per mile, in currency units (0.10 for 10p). */
  excessPerMile: number;
}

export interface FinanceResult {
  kind: FinanceKind;
  /** Amount of credit: price less deposit (and any dealer contribution). 0 for the lease. */
  borrowed: number;
  /** Dealer deposit contribution actually used. */
  contribution: number;
  /** Paid at the start: deposit and admin fee, or the lease's initial rental and fee. */
  upfront: number;
  monthly: number;
  /** Regular monthly payments after the upfront amount. */
  payments: number;
  /** PCP only: the balloon, capped at the amount borrowed. */
  balloon: number;
  /** Paid at the end: balloon, option fee or excess mileage. */
  final: number;
  interest: number;
  fees: number;
  excessMileage: number;
  /** PCP only: balloon less the car's value, paid to settle and sell when that beats the excess charge. */
  shortfall: number;
  totalPaid: number;
  /** What you are left with: the car's value if you own it, PCP equity if you hand it back. */
  endValue: number;
  netCost: number;
  owns: boolean;
  /** Money paid out by the end of each month, index 0 being the day you sign. */
  cumulative: number[];
}

export interface FinanceComparison {
  results: Record<FinanceKind, FinanceResult>;
  best: FinanceKind;
  /** The car's value at the end before any extra miles, from the resale %. */
  baseValue: number;
  /** The car's value at the end, after any extra miles. */
  carValue: number;
  /** Value lost to miles over the allowance, priced at the excess charge. */
  mileageLoss: number;
  /** True when the balloon was cut down to the amount borrowed (big deposit, high GMFV). */
  balloonCapped: boolean;
}

/** Longest term the tool will model, whatever the URL asks for. */
export const MAX_TERM_MONTHS = 84;

export function monthlyRate(aprPct: number): number {
  return (1 + aprPct / 100) ** (1 / 12) - 1;
}

/** Level payment over `n` months that repays `principal` and leaves `balloon` owing. */
export function annuityPayment(principal: number, r: number, n: number, balloon = 0): number {
  if (n <= 0) return 0;
  if (r === 0) return (principal - balloon) / n;
  const growth = (1 + r) ** n;
  return ((principal * growth - balloon) * r) / (growth - 1);
}

/**
 * Rough market value after `months`, as a % of the new price: 20% off each
 * year. A rule of thumb for a new car, which the user can override.
 */
export function defaultResalePct(months: number): number {
  return Math.round(100 * 0.8 ** (months / 12));
}

/** Lenders set the GMFV below the expected value; 80% of it is typical of UK quotes. */
export function defaultGmfvPct(months: number): number {
  return Math.round(0.8 * defaultResalePct(months));
}

export function excessMileageCharge(input: CarFinanceInput): number {
  const over = Math.max(0, input.milesPerYear - input.mileageAllowance);
  return over * (termOf(input) / 12) * input.excessPerMile;
}

function termOf(input: CarFinanceInput): number {
  return Math.min(MAX_TERM_MONTHS, Math.max(1, Math.round(input.termMonths)));
}

/**
 * Miles over the allowance cost a PCP or lease driver the excess charge. An
 * owned car pays for them too, in a lower value: priced at the same rate per
 * mile, which is the lender's own price for the extra wear.
 */
export function mileageValueLoss(input: CarFinanceInput): number {
  return Math.min(baseValueAtEnd(input), excessMileageCharge(input));
}

/** Expected market value at the end of the term at normal mileage: the resale % of the price. */
export function baseValueAtEnd(input: CarFinanceInput): number {
  return (input.price * input.resalePct) / 100;
}

/** Expected market value at the end of the term, after any extra miles. */
export function carValueAtEnd(input: CarFinanceInput): number {
  return Math.max(0, baseValueAtEnd(input) - excessMileageCharge(input));
}

function schedule(n: number, upfront: number, monthly: number, final: number, firstMonth = 1): number[] {
  const out = [upfront];
  for (let m = 1; m <= n; m++) {
    const prev = out[m - 1] ?? 0;
    out.push(prev + (m >= firstMonth ? monthly : 0) + (m === n ? final : 0));
  }
  return out;
}

function financeResult(
  kind: FinanceKind,
  parts: Omit<FinanceResult, "kind" | "totalPaid" | "netCost" | "cumulative">,
  n: number,
  firstMonth = 1,
): FinanceResult {
  const totalPaid = parts.upfront + parts.monthly * parts.payments + parts.final;
  return {
    kind,
    ...parts,
    totalPaid,
    netCost: totalPaid - parts.endValue,
    cumulative: schedule(n, parts.upfront, parts.monthly, parts.final, firstMonth),
  };
}

function depositOf(input: CarFinanceInput): number {
  return Math.min(Math.max(0, input.deposit), input.price);
}

/** The dealer contribution, capped at what the deposit leaves to pay. */
function contributionOf(input: CarFinanceInput): number {
  return Math.min(Math.max(0, input.dealerContribution), input.price - depositOf(input));
}

function loanBorrowed(input: CarFinanceInput): number {
  return input.price - depositOf(input);
}

/** HP and PCP: the dealer contribution comes off the amount borrowed. */
function dealerBorrowed(input: CarFinanceInput): number {
  return loanBorrowed(input) - contributionOf(input);
}

export function calculateHp(input: CarFinanceInput): FinanceResult {
  const n = termOf(input);
  const borrowed = dealerBorrowed(input);
  const monthly = annuityPayment(borrowed, monthlyRate(input.apr), n);
  return financeResult(
    "hp",
    {
      borrowed,
      contribution: contributionOf(input),
      upfront: depositOf(input) + input.adminFee,
      monthly,
      payments: n,
      balloon: 0,
      final: input.optionFee,
      interest: monthly * n - borrowed,
      fees: input.adminFee + input.optionFee,
      excessMileage: 0,
      shortfall: 0,
      endValue: carValueAtEnd(input),
      owns: true,
    },
    n,
  );
}

export function calculatePcp(input: CarFinanceInput): FinanceResult {
  const n = termOf(input);
  const borrowed = dealerBorrowed(input);
  const balloon = Math.min((input.price * input.gmfvPct) / 100, borrowed);
  const monthly = annuityPayment(borrowed, monthlyRate(input.apr), n, balloon);
  const interest = monthly * n + balloon - borrowed;
  const carValue = carValueAtEnd(input);
  const keep = input.pcpEnd === "keep";
  // Not keeping it, you take the cheapest way out. Worth more than the
  // balloon: sell or part-exchange and keep the equity (the extra miles are
  // already in the value). Worth less: hand it back and pay any excess
  // mileage, or settle the shortfall and sell if that costs less.
  const gap = balloon - carValue;
  const excess = excessMileageCharge(input);
  const shortfall = !keep && gap > 0 && gap < excess ? gap : 0;
  const excessMileage = !keep && gap > 0 && shortfall === 0 ? excess : 0;
  return financeResult(
    "pcp",
    {
      borrowed,
      contribution: contributionOf(input),
      upfront: depositOf(input) + input.adminFee,
      monthly,
      payments: n,
      balloon,
      final: keep ? balloon + input.optionFee : excessMileage + shortfall,
      interest,
      fees: input.adminFee + (keep ? input.optionFee : 0),
      excessMileage,
      shortfall,
      endValue: keep ? carValue : Math.max(0, -gap),
      owns: keep,
    },
    n,
  );
}

export function calculateLoan(input: CarFinanceInput): FinanceResult {
  const n = termOf(input);
  const borrowed = loanBorrowed(input);
  const monthly = annuityPayment(borrowed, monthlyRate(input.loanApr), n);
  return financeResult(
    "loan",
    {
      borrowed,
      contribution: 0,
      upfront: depositOf(input),
      monthly,
      payments: n,
      balloon: 0,
      final: 0,
      interest: monthly * n - borrowed,
      fees: 0,
      excessMileage: 0,
      shortfall: 0,
      endValue: carValueAtEnd(input),
      owns: true,
    },
    n,
  );
}

/** Lease profile "6+35" on 36 months: six rentals up front, then one a month from month 2. */
export function calculateLease(input: CarFinanceInput): FinanceResult {
  const n = termOf(input);
  const excessMileage = excessMileageCharge(input);
  return financeResult(
    "lease",
    {
      borrowed: 0,
      contribution: 0,
      upfront: input.leaseMonthly * input.leaseInitial + input.leaseFee,
      monthly: input.leaseMonthly,
      payments: n - 1,
      balloon: 0,
      final: excessMileage,
      interest: 0,
      fees: input.leaseFee,
      excessMileage,
      shortfall: 0,
      endValue: 0,
      owns: false,
    },
    n,
    2,
  );
}

export function basisValue(result: FinanceResult, basis: CompareBasis): number {
  return basis === "net" ? result.netCost : result.totalPaid;
}

export function compareFinance(input: CarFinanceInput, basis: CompareBasis): FinanceComparison {
  const results: Record<FinanceKind, FinanceResult> = {
    pcp: calculatePcp(input),
    hp: calculateHp(input),
    loan: calculateLoan(input),
    lease: calculateLease(input),
  };
  const best = FINANCE_KINDS.reduce((a, b) => (basisValue(results[b], basis) < basisValue(results[a], basis) ? b : a));
  return {
    results,
    best,
    baseValue: baseValueAtEnd(input),
    carValue: carValueAtEnd(input),
    mileageLoss: mileageValueLoss(input),
    balloonCapped: (input.price * input.gmfvPct) / 100 > dealerBorrowed(input),
  };
}

type LineKind = "heading" | "cost" | "subtotal" | "total" | "credit" | "note";

export interface Line {
  label: string;
  /** Money paid is positive; money you get back (the car's value) is negative. */
  value: number;
  kind: LineKind;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Row by row: what you pay and when, then what you are left with. */
export function breakdownLines(
  result: FinanceResult,
  input: CarFinanceInput,
  money: (v: number, decimals?: number) => string,
): Line[] {
  const lines: Line[] = [{ label: "Up front", value: 0, kind: "heading" }];
  const push = (label: string, value: number, kind: LineKind = "cost") => {
    if (value > 0) lines.push({ label, value, kind });
  };

  if (result.kind === "lease") {
    push(`Initial rental (${plural(input.leaseInitial, "month")})`, input.leaseMonthly * input.leaseInitial);
    push("Broker or processing fee", input.leaseFee);
  } else {
    push("Deposit or part-exchange", depositOf(input));
    if (result.kind !== "loan") push("Admin fee", input.adminFee);
    push("Dealer deposit contribution, not paid by you", result.contribution, "note");
  }
  lines.push({ label: "Monthly", value: 0, kind: "heading" });
  push(`${plural(result.payments, "payment")} of ${money(result.monthly, 2)}`, result.monthly * result.payments);

  if (result.final > 0) {
    lines.push({ label: "At the end", value: 0, kind: "heading" });
    if (result.kind === "pcp" && input.pcpEnd === "keep") {
      push("Optional final payment (balloon)", result.balloon);
      push("Option to purchase fee", input.optionFee);
    }
    if (result.kind === "hp") push("Option to purchase fee", input.optionFee);
    push("Excess mileage charge", result.excessMileage);
    push("Shortfall to settle the balloon and sell", result.shortfall);
  }

  lines.push({ label: "Total paid", value: result.totalPaid, kind: "subtotal" });
  if (result.interest > 0) lines.push({ label: "of which interest", value: result.interest, kind: "note" });
  if (result.kind === "pcp" && input.pcpEnd === "handBack") {
    const sold = result.endValue > 0 || result.shortfall > 0;
    lines.push({
      label: sold ? "Balloon settled by selling the car" : "Balloon settled by handing the car back",
      value: result.balloon,
      kind: "note",
    });
  }
  if (result.endValue > 0) {
    const loss = mileageValueLoss(input);
    lines.push({
      label: result.owns ? `Car's value after ${plural(termOf(input), "month")}` : "Equity above the balloon",
      value: -result.endValue,
      kind: "credit",
    });
    if (loss > 0) lines.push({ label: "after extra miles took off", value: loss, kind: "note" });
  }
  lines.push({ label: "Real cost", value: result.netCost, kind: "total" });
  return lines;
}
