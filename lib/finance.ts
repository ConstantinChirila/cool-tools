import { clamp } from "@/lib/utils";

/** Longest term either schedule will simulate, whatever the caller asks for. */
const MAX_TERM_YEARS = 100;

export interface AmortizationYear {
  year: number;
  interestPaid: number;
  principalPaid: number;
  balance: number;
}

export interface MortgageResult {
  /** Scheduled payment: interest-only for interest-only mode, annuity payment otherwise. */
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  /** Actual months until the balance reaches 0. Equals the term in months when there is no overpayment, or for interest-only (balance never reaches 0 within the term). */
  monthsToPayoff: number;
  /** Remaining balance once the term/payoff loop ends. Nonzero only for interest-only mortgages. */
  endingBalance: number;
  years: AmortizationYear[];
  /** Remaining balance at the end of each year, starting with year 0 (loan amount). */
  balanceSeries: number[];
  /** Cumulative interest paid at the end of each year, starting with year 0. */
  interestSeries: number[];
}

export interface MortgageOptions {
  /** Pay interest only; the balance never reduces during the term. Default false. */
  interestOnly?: boolean;
  /** Extra amount paid every month on top of the scheduled payment. Ignored when interestOnly is true. Default 0. */
  monthlyOverpayment?: number;
  /** One-off extra amount paid alongside the month 1 payment. Ignored when interestOnly is true. Default 0. */
  lumpSum?: number;
}

export function calculateMortgage(
  principal: number,
  annualRatePct: number,
  termYears: number,
  options: MortgageOptions = {},
): MortgageResult {
  const { interestOnly = false, monthlyOverpayment = 0, lumpSum = 0 } = options;
  // Guard against callers passing unbounded terms (a schedule loop runs per month).
  const months = clamp(Math.round(termYears * 12), 1, MAX_TERM_YEARS * 12);
  const r = annualRatePct / 100 / 12;
  const monthlyPayment = interestOnly
    ? principal * r
    : r === 0
      ? principal / months
      : (principal * r) / (1 - (1 + r) ** -months);

  const years: AmortizationYear[] = [];
  const balanceSeries: number[] = [principal];
  const interestSeries: number[] = [0];

  // Interest-only: the balance never reduces during the term, so the
  // borrower still owes the full principal at the end. Overpayments are
  // ignored in this mode since there is no scheduled principal reduction
  // to apply them against.
  if (interestOnly) {
    let cumulativeInterest = 0;
    let yearInterest = 0;

    for (let m = 1; m <= months; m++) {
      const interest = principal * r;
      cumulativeInterest += interest;
      yearInterest += interest;

      if (m % 12 === 0 || m === months) {
        years.push({
          year: Math.ceil(m / 12),
          interestPaid: yearInterest,
          principalPaid: 0,
          balance: principal,
        });
        balanceSeries.push(principal);
        interestSeries.push(cumulativeInterest);
        yearInterest = 0;
      }
    }

    return {
      monthlyPayment,
      totalPaid: cumulativeInterest,
      totalInterest: cumulativeInterest,
      monthsToPayoff: months,
      endingBalance: principal,
      years,
      balanceSeries,
      interestSeries,
    };
  }

  let balance = principal;
  let cumulativeInterest = 0;
  let yearInterest = 0;
  let yearPrincipal = 0;
  let monthsToPayoff = months;

  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const extra = monthlyOverpayment + (m === 1 ? lumpSum : 0);
    // Cap the principal portion at the remaining balance so the loan
    // never overpays once it is cleared.
    const principalPart = Math.min(monthlyPayment - interest + extra, balance);
    balance = Math.max(balance - principalPart, 0);
    if (Math.abs(balance) < 1e-6) balance = 0;
    cumulativeInterest += interest;
    yearInterest += interest;
    yearPrincipal += principalPart;
    monthsToPayoff = m;

    const payoff = balance <= 0;
    if (m % 12 === 0 || payoff || m === months) {
      years.push({
        year: Math.ceil(m / 12),
        interestPaid: yearInterest,
        principalPaid: yearPrincipal,
        balance,
      });
      balanceSeries.push(balance);
      interestSeries.push(cumulativeInterest);
      yearInterest = 0;
      yearPrincipal = 0;
    }

    if (payoff) break;
  }

  return {
    monthlyPayment,
    totalPaid: cumulativeInterest + (principal - balance),
    totalInterest: cumulativeInterest,
    monthsToPayoff,
    endingBalance: balance,
    years,
    balanceSeries,
    interestSeries,
  };
}

interface CompoundYear {
  year: number;
  /** Monthly contribution paid during this year (grows with `contributionIncreasePct`). */
  monthlyContribution: number;
  contributed: number;
  /** Cumulative growth (net of fees) by the end of this year. */
  interestEarned: number;
  /** Growth (net of fees) during this year alone. */
  interestThisYear: number;
  /** Fees charged during this year alone. */
  feesThisYear: number;
  balance: number;
  /** Balance deflated to today's money using `inflationPct`. Equals `balance` when inflation is 0. */
  realBalance: number;
}

export interface CompoundResult {
  finalBalance: number;
  /** `finalBalance` in today's money. */
  realFinalBalance: number;
  totalContributed: number;
  /** Net growth: balance minus money paid in, after fees. */
  totalInterest: number;
  /** Fees charged over the whole term. */
  totalFees: number;
  years: CompoundYear[];
  /** Balance at the end of each year, starting with year 0 (initial deposit). */
  balanceSeries: number[];
  /** Total contributed at the end of each year, starting with year 0. */
  contributedSeries: number[];
  /** Balance in today's money at the end of each year, starting with year 0. */
  realBalanceSeries: number[];
}

export interface CompoundOptions {
  /** Raise the monthly contribution by this % at the start of every year after the first. Default 0. */
  contributionIncreasePct?: number;
  /** Annual charge (platform fee + fund OCF) as a % of the balance, taken monthly. Default 0. */
  annualFeePct?: number;
  /** Assumed inflation, used only to restate balances in today's money. Default 0. */
  inflationPct?: number;
}

export function calculateCompound(
  initial: number,
  monthlyContribution: number,
  annualRatePct: number,
  compoundsPerYear: number,
  termYears: number,
  options: CompoundOptions = {},
): CompoundResult {
  const { contributionIncreasePct = 0, annualFeePct = 0, inflationPct = 0 } = options;
  const rate = annualRatePct / 100;
  const monthlyFee = annualFeePct / 100 / 12;
  const termCapped = clamp(Math.round(termYears), 0, MAX_TERM_YEARS);
  const years: CompoundYear[] = [];
  const balanceSeries: number[] = [initial];
  const contributedSeries: number[] = [initial];
  const realBalanceSeries: number[] = [initial];

  let balance = initial;
  let contributed = initial;
  let fees = 0;
  let contribution = monthlyContribution;

  // Iterate monthly; apply compounding at the configured frequency and the fee every month.
  const monthsPerCompound = 12 / compoundsPerYear;
  const periodRate = rate / compoundsPerYear;

  for (let year = 1; year <= termCapped; year++) {
    if (year > 1) contribution *= 1 + contributionIncreasePct / 100;
    const balanceStartOfYear = balance;
    const contributedStartOfYear = contributed;
    const feesStartOfYear = fees;
    for (let m = 1; m <= 12; m++) {
      balance += contribution;
      contributed += contribution;
      if (m % monthsPerCompound === 0) {
        balance *= 1 + periodRate;
      }
      const fee = balance * monthlyFee;
      balance -= fee;
      fees += fee;
    }
    const realBalance = balance / (1 + inflationPct / 100) ** year;
    years.push({
      year,
      monthlyContribution: contribution,
      contributed,
      interestEarned: balance - contributed,
      interestThisYear:
        balance - balanceStartOfYear - (contributed - contributedStartOfYear),
      feesThisYear: fees - feesStartOfYear,
      balance,
      realBalance,
    });
    balanceSeries.push(balance);
    contributedSeries.push(contributed);
    realBalanceSeries.push(realBalance);
  }

  return {
    finalBalance: balance,
    realFinalBalance: realBalanceSeries[realBalanceSeries.length - 1] ?? initial,
    totalContributed: contributed,
    totalInterest: balance - contributed,
    totalFees: fees,
    years,
    balanceSeries,
    contributedSeries,
    realBalanceSeries,
  };
}
