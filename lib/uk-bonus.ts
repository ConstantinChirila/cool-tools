/**
 * What a UK bonus is worth after deductions.
 *
 * The bonus is measured as a difference: the year with it against the year
 * without it. Income tax comes from the annual engine, which is right for
 * PAYE's cumulative codes (whatever the bonus-month payslip shows, the year
 * evens out) and picks up the allowance taper and Scottish bands for free.
 *
 * National Insurance and student loans are different: payroll works them out
 * on each pay period alone, never across the year. A bonus lands in one
 * period, so most of it sits above that period's upper earnings limit at 2%
 * rather than 8%, and a loan takes 9% of it even when the salary is under the
 * annual threshold. They are computed here on the bonus period. Company
 * directors are the exception: their NI is assessed annually.
 */

import {
  PERIOD_INFO,
  TAX_YEARS,
  calculateUkSalary,
  periodsPerYear,
  type BandResult,
  type PayPeriod,
  type PensionType,
  type StudentPlan,
  type TaxYear,
  type UkSalaryInput,
  type UkSalaryResult,
} from "./uk-tax";

/** The pay periods a bonus can land in: the subset of PayPeriod that payroll actually runs on. */
export type BonusPayFrequency = Extract<PayPeriod, "month" | "4week" | "week">;

const BONUS_PERIODS = ["month", "4week", "week"] as const satisfies readonly BonusPayFrequency[];
export const BONUS_FREQUENCIES = BONUS_PERIODS.map((value) => ({ value, ...PERIOD_INFO[value] }));

export interface BonusInput {
  taxYear: TaxYear;
  /** Annual salary, before the bonus. */
  salary: number;
  bonus: number;
  /** How often the salary is paid: sets the NI and student loan period the bonus falls in. */
  frequency: BonusPayFrequency;
  scotland: boolean;
  taxCode: string;
  studentPlan: StudentPlan;
  postgradLoan: boolean;
  /** The regular workplace pension, as a percentage of salary. */
  pensionType: PensionType;
  pensionPct: number;
  /** Whether the regular pension percentage is also taken from the bonus. */
  pensionOnBonus: boolean;
  /** Share of the bonus (0-100) given up for an employer pension contribution instead. */
  sacrificePct: number;
  /** Directors' NI is assessed on the whole year, not the pay period. */
  director: boolean;
  /** Over State Pension age: no employee NI. */
  noNi: boolean;
}

export interface BonusResult {
  bonus: number;
  /** Part of the bonus swapped for a pension contribution: never taxed, never paid as cash. */
  sacrificed: number;
  /** Part of the bonus paid through payroll. */
  cashBonus: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  postgradLoan: number;
  /** Regular pension contribution taken from the cash bonus. */
  pension: number;
  /** What reaches the bank account. */
  takeHome: number;
  /** takeHome as a share of the whole bonus. */
  keepRate: number;
  /** What the bonus adds to the pension pot: the sacrificed part plus your own regular contribution. */
  pensionPot: number;
  /** The cash bonus split across the tax bands it falls in (includes allowance lost to the taper). */
  taxBands: BandResult[];
  /** Personal allowance lost because the bonus pushed income over the taper threshold. */
  allowanceLost: number;
  /** Name of the highest tax band the bonus reaches, when the salary alone did not reach it. */
  crossedInto: string | null;
  /** NI on the bonus had it been assessed annually: what an annual calculator would show. */
  annualBasisNi: number;
  /** Employer NI not paid on the sacrificed part; some employers add it to the pension. */
  employerNiSaved: number;
  /** Student plus postgraduate loan repayments triggered by the bonus. */
  loans: number;
  /** Share of the cash bonus lost to income tax, NI and loans. */
  deductionRate: number;
  /** Income at which the personal allowance has tapered away completely. */
  taperEnd: number;
  /** True when the salary alone repays nothing, but the bonus period does. */
  loanTriggeredByBonus: boolean;
  /** How much lower period NI is than the annual-basis figure; 0 for directors. */
  niSavedVsAnnual: number;
  without: UkSalaryResult;
  withBonus: UkSalaryResult;
}

/**
 * NI thresholds for one pay period. HMRC publishes weekly and monthly figures
 * as the annual ones divided and rounded to the pound (£242 / £967 a week,
 * £1,048 / £4,189 a month); longer weekly periods are multiples of the weekly figure.
 */
function niThresholds(taxYear: TaxYear, frequency: BonusPayFrequency) {
  const { primaryThreshold, upperEarningsLimit } = TAX_YEARS[taxYear].ni;
  // Exhaustive on purpose: a new frequency must say which published figures it uses.
  const { divisor, weeks } = ((): { divisor: number; weeks: number } => {
    switch (frequency) {
      case "month":
        return { divisor: 12, weeks: 1 };
      case "4week":
        return { divisor: 52, weeks: 4 };
      case "week":
        return { divisor: 52, weeks: 1 };
    }
  })();
  return {
    primary: Math.round(primaryThreshold / divisor) * weeks,
    upper: Math.round(upperEarningsLimit / divisor) * weeks,
  };
}

function periodNi(pay: number, taxYear: TaxYear, frequency: BonusPayFrequency) {
  const { mainRate, upperRate } = TAX_YEARS[taxYear].ni;
  const { primary, upper } = niThresholds(taxYear, frequency);
  const main = Math.min(Math.max(pay - primary, 0), upper - primary);
  return main * mainRate + Math.max(pay - upper, 0) * upperRate;
}

function salaryInput(input: BonusInput, bonus: number): UkSalaryInput {
  return {
    taxYear: input.taxYear,
    salary: Math.max(input.salary, 0),
    salaryPeriod: "year",
    hoursPerWeek: 37.5,
    daysPerWeek: 5,
    scotland: input.scotland,
    taxCode: input.taxCode,
    noNi: input.noNi,
    blind: false,
    marriage: "none",
    studentPlan: input.studentPlan,
    postgradLoan: input.postgradLoan,
    pensionType: input.pensionType,
    pensionMethod: "percent",
    pensionValue: input.pensionPct,
    pensionOnExtras: input.pensionOnBonus,
    employerPensionPct: 0,
    bonus,
    overtimeHours: 0,
    overtimeMultiplier: 1,
    cashAllowance: 0,
    taxableBenefits: 0,
    childcareVouchers: 0,
    childcarePre2011: false,
    salarySacrifice: 0,
    preTaxDeduction: 0,
    postTaxDeduction: 0,
  };
}

/** Below this, a difference is rounding noise rather than something to tell the user about. */
const NEGLIGIBLE = 1;

export function calculateBonus(input: BonusInput, baseline?: UkSalaryResult): BonusResult {
  const cfg = TAX_YEARS[input.taxYear];
  const bonus = Math.max(input.bonus, 0);
  const sacrificed = bonus * (Math.min(Math.max(input.sacrificePct, 0), 100) / 100);
  const cashBonus = bonus - sacrificed;

  // The year without the bonus does not depend on the sacrifice, so scenarios can share it.
  const without = baseline ?? calculateUkSalary(salaryInput(input, 0));
  const withBonus = calculateUkSalary(salaryInput(input, cashBonus));

  const incomeTax = withBonus.incomeTax - without.incomeTax;
  const pension = withBonus.pensionDeducted - without.pensionDeducted;

  // The bonus period: one ordinary period's pay plus the whole NI-able bonus.
  const n = periodsPerYear(input.frequency, 0, 0);
  const ordinary = without.niablePay / n;
  const bonusPeriod = ordinary + (withBonus.niablePay - without.niablePay);

  const annualBasisNi = withBonus.nationalInsurance - without.nationalInsurance;
  const nationalInsurance = input.noNi
    ? 0
    : input.director
      ? annualBasisNi
      : periodNi(bonusPeriod, input.taxYear, input.frequency) - periodNi(ordinary, input.taxYear, input.frequency);

  const loan = (annualThreshold: number, rate: number) =>
    (Math.max(bonusPeriod - annualThreshold / n, 0) - Math.max(ordinary - annualThreshold / n, 0)) * rate;
  const studentLoan =
    input.studentPlan === "none" ? 0 : loan(cfg.studentLoan[input.studentPlan], cfg.studentLoanRate);
  const postgradLoan = input.postgradLoan ? loan(cfg.postgradThreshold, cfg.postgradRate) : 0;

  const takeHome = cashBonus - incomeTax - nationalInsurance - studentLoan - postgradLoan - pension;

  const taxBands = withBonus.bands
    .map((band, i) => {
      const before = without.bands[i];
      return {
        name: band.name,
        rate: band.rate,
        amount: band.amount - (before?.amount ?? 0),
        tax: band.tax - (before?.tax ?? 0),
      };
    })
    .filter((band) => Math.abs(band.amount) > 0.005);

  const top = (r: UkSalaryResult) => r.bands.reduce((last, band, i) => (band.amount > 0 ? i : last), -1);
  const crossedInto = top(withBonus) > top(without) ? (withBonus.bands[top(withBonus)]?.name ?? null) : null;

  const loans = studentLoan + postgradLoan;
  // Employer NI only exists above the secondary threshold, so a small salary saves less.
  const employerNi = (pay: number) => Math.max(pay - cfg.ni.secondaryThreshold, 0) * cfg.ni.employerRate;
  const niSavedVsAnnual = input.director || input.noNi ? 0 : annualBasisNi - nationalInsurance;

  return {
    bonus,
    sacrificed,
    cashBonus,
    incomeTax,
    nationalInsurance,
    studentLoan,
    postgradLoan,
    pension,
    takeHome,
    keepRate: bonus > 0 ? takeHome / bonus : 0,
    pensionPot: sacrificed + (withBonus.pensionGross - without.pensionGross),
    taxBands,
    allowanceLost: Math.max(without.allowance - withBonus.allowance, 0),
    crossedInto,
    annualBasisNi,
    employerNiSaved: employerNi(withBonus.niablePay + sacrificed) - employerNi(withBonus.niablePay),
    loans,
    deductionRate: cashBonus > 0 ? (incomeTax + nationalInsurance + loans) / cashBonus : 0,
    taperEnd: cfg.taperThreshold + cfg.personalAllowance * 2,
    loanTriggeredByBonus: input.studentPlan !== "none" && studentLoan > 0 && without.studentLoan === 0,
    niSavedVsAnnual: niSavedVsAnnual > NEGLIGIBLE ? niSavedVsAnnual : 0,
    without,
    withBonus,
  };
}

export interface SacrificeComparison {
  result: BonusResult;
  allCash: BonusResult;
  allPension: BonusResult;
  /** Pension gained per £1 of take-home given up, against taking it all as cash; 0 with no sacrifice. */
  pensionPerPound: number;
}

/** The chosen split beside the two extremes, sharing one no-bonus baseline. */
export function compareSacrifice(input: BonusInput): SacrificeComparison {
  const baseline = calculateUkSalary(salaryInput(input, 0));
  const at = (sacrificePct: number) => calculateBonus({ ...input, sacrificePct }, baseline);
  const result = at(input.sacrificePct);
  const allCash = input.sacrificePct <= 0 ? result : at(0);
  const allPension = input.sacrificePct >= 100 ? result : at(100);
  const cashGivenUp = allCash.takeHome - result.takeHome;
  return {
    result,
    allCash,
    allPension,
    pensionPerPound: cashGivenUp > NEGLIGIBLE ? (result.pensionPot - allCash.pensionPot) / cashGivenUp : 0,
  };
}
